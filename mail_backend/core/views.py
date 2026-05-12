from rest_framework import viewsets, status, generics # type: ignore[import-untyped]
from rest_framework.decorators import action # type: ignore[import-untyped]
from rest_framework.response import Response # type: ignore[import-untyped]
from rest_framework.permissions import IsAuthenticated, AllowAny # type: ignore[import-untyped]
from django.contrib.auth import authenticate, login, logout  # ← важно!
from django.contrib.auth.models import User  # type: ignore[var-annotated]
from .models import MailAccount, EmailMessage
from .serializers import MailAccountSerializer, EmailMessageSerializer, RegisterSerializer
from .tasks import sync_account_task, send_email_task

class LoginView(generics.GenericAPIView):
    """Вход по сессии (username + password)"""
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {"detail": "Укажите username и password"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(request, username=username, password=password)
        
        if user is None:
            return Response(
                {"detail": "Неверное имя пользователя или пароль"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        login(request, user)  # ← создаёт сессию!
        
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email
        }, status=status.HTTP_200_OK)


class LogoutView(generics.GenericAPIView):
    """Выход из системы"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        logout(request)  # ← удаляет сессию!
        return Response({"detail": "Выход выполнен"}, status=status.HTTP_200_OK)


class UserView(generics.RetrieveAPIView):
    """Получить данные текущего пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.none()  # не используется, но требуется DRF
    
    def get_object(self):
        return self.request.user  # ← возвращаем текущего юзера
    
    def get_serializer_class(self):
        # Простой сериализатор "на лету"
        from rest_framework import serializers
        class UserSerializer(serializers.ModelSerializer):
            class Meta:
                model = User
                fields = ['id', 'username', 'email']
        return UserSerializer

class RegisterView(generics.CreateAPIView):
    """Регистрация нового пользователя"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]  # ← доступно без авторизации
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Опционально: автоматически авторизовать пользователя после регистрации
        # from rest_framework.authtoken.models import Token
        # token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "message": "Регистрация успешна"
        }, status=status.HTTP_201_CREATED)

class MailAccountViewSet(viewsets.ModelViewSet):
    serializer_class = MailAccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MailAccount.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        account = serializer.instance
        sync_account_task.delay(account.id)  # первичная синхронизация

    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        sync_account_task.delay(pk)
        return Response({"status": "sync started"})

class EmailMessageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EmailMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = EmailMessage.objects.filter(account__user=self.request.user)
        folder = self.request.query_params.get('folder')
        if folder:
            qs = qs.filter(folder=folder)
        return qs

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        msg = self.get_object()
        msg.is_read = True
        msg.save(update_fields=["is_read"])
        return Response({"status": "marked"})

    @action(detail=False, methods=['post'])
    def send(self, request):
        account_id = request.data.get('account_id')
        to = request.data.get('to')
        subject = request.data.get('subject')
        body = request.data.get('body')
        html = request.data.get('html')
        attachments = request.data.get('attachments', [])  # пути к файлам на сервере

        if not all([account_id, to, subject, body]):
            return Response({"error": "Missing fields"}, status=400)

        send_email_task.delay(account_id, to, subject, body, html, attachments)
        return Response({"status": "email queued"})