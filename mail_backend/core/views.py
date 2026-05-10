from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import MailAccount, EmailMessage
from .serializers import MailAccountSerializer, EmailMessageSerializer
from .tasks import sync_account_task, send_email_task

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