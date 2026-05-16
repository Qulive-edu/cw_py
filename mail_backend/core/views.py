# mail_backend/core/views.py
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from .models import MailAccount, EmailMessage
from .serializers import (
    MailAccountSerializer, 
    EmailMessageSerializer, 
    RegisterSerializer,
    UserSerializer
)
from .tasks import sync_account_task, send_email_task
from django.core.cache import cache


class RegisterView(generics.CreateAPIView):
    """Регистрация нового пользователя"""
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Создаём токен для автоматического входа после регистрации
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    """Вход в систему (создаёт токен)"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(request, username=username, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Создаём/получаем токен
        token, _ = Token.objects.get_or_create(user=user)
        
        # Для session auth (опционально)
        login(request, user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        })


class LogoutView(generics.GenericAPIView):
    """Выход из системы"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Удаляем токен
        try:
            request.user.auth_token.delete()
        except:
            pass  # Токена может не быть
        # Завершаем сессию
        logout(request)
        return Response({'status': 'logged out'})


class CurrentUserView(generics.RetrieveAPIView):
    """Получение данных текущего пользователя"""
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user


class MailAccountViewSet(viewsets.ModelViewSet):
    """ViewSet для управления почтовыми аккаунтами"""
    serializer_class = MailAccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MailAccount.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        account = serializer.save(user=self.request.user)
        sync_account_task.delay(account.id)
        cache.delete(f"accounts:{self.request.user.id}")

    def perform_update(self, serializer):
        cache.delete(f"accounts:{self.request.user.id}")
        serializer.save()

    def perform_destroy(self, instance):
        cache.delete(f"accounts:{self.request.user.id}")
        cache.delete_pattern(f"emails:{self.request.user.id}:*")
        instance.delete()

    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """Ручной запуск синхронизации аккаунта"""
        account = self.get_object()
        if account.user != request.user:
            return Response({"error": "Access denied"}, status=403)
        
        sync_account_task.delay(pk)
        cache.delete_pattern(f"emails:{request.user.id}:*")
        return Response({"status": "sync started", "account_id": pk})
    
    @action(detail=True, methods=['post'])
    def sync_folder(self, request, pk=None):
        """Синхронизация конкретной папки"""
        folder = request.data.get('folder', 'INBOX')
        sync_account_task.delay(pk, folder=folder)
        return Response({"status": f"sync started for folder: {folder}"})


class EmailMessageViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для чтения писем (только GET)"""
    serializer_class = EmailMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = EmailMessage.objects.filter(account__user=self.request.user)
        folder = self.request.query_params.get('folder')
        if folder:
            qs = qs.filter(folder=folder)
        return qs.select_related('account').order_by('-date')

    def list(self, request, *args, **kwargs):
        """Кэширование списка писем"""
        folder = request.query_params.get('folder', 'INBOX')
        page = request.query_params.get('page', '1')
        cache_key = f"emails:{request.user.id}:{folder}:page{page}"
        
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        response = super().list(request, *args, **kwargs)
        
        if response.status_code == 200:
            cache.set(cache_key, response.data, timeout=300)
        
        return response

    def retrieve(self, request, *args, **kwargs):
        """Инвалидация кэша при просмотре письма"""
        response = super().retrieve(request, *args, **kwargs)
        cache.delete_pattern(f"emails:{request.user.id}:*")
        return response

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Отметить письмо как прочитанное"""
        msg = self.get_object()
        if msg.account.user != request.user:
            return Response({"error": "Access denied"}, status=403)
        
        msg.is_read = True
        msg.save(update_fields=["is_read"])
        cache.delete_pattern(f"emails:{request.user.id}:*")
        return Response({"status": "marked", "email_id": pk})

    @action(detail=False, methods=['post'])
    def send(self, request):
        """Отправить новое письмо через Celery"""
        account_id = request.data.get('account_id')
        to = request.data.get('to')
        subject = request.data.get('subject')
        body = request.data.get('body')
        html = request.data.get('html')
        attachments = request.data.get('attachments', [])

        if not all([account_id, to, subject, body]):
            return Response(
                {"error": "Missing required fields: account_id, to, subject, body"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            account = MailAccount.objects.get(id=account_id, user=request.user)
            if not account.is_active:
                return Response({"error": "Account is not active"}, status=400)
        except MailAccount.DoesNotExist:
            return Response({"error": "Account not found"}, status=404)

        send_email_task.delay(
            account_id=account_id,
            to=to,
            subject=subject,
            body=body,
            html=html,
            attachments=attachments
        )
        
        return Response({"status": "email queued"}, status=status.HTTP_202_ACCEPTED)