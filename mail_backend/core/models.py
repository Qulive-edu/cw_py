from django.db import models
from django.contrib.auth.models import User
from cryptography.fernet import Fernet
import base64
import os

# В продакшене храните FERNET_KEY в secrets manager
FERNET_KEY = base64.urlsafe_b64encode(os.urandom(32)).decode()
fernet = Fernet(FERNET_KEY)

class MailAccount(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mail_accounts') # type: ignore[var-annotated]
    email = models.EmailField(unique=True) # type: ignore[var-annotated]
    encrypted_password = models.BinaryField() # type: ignore[var-annotated]
    imap_host = models.CharField(max_length=255) # type: ignore[var-annotated]
    imap_port = models.PositiveIntegerField(default=993) # type: ignore[var-annotated]
    smtp_host = models.CharField(max_length=255) # type: ignore[var-annotated]
    smtp_port = models.PositiveIntegerField(default=465) # type: ignore[var-annotated]
    use_ssl = models.BooleanField(default=True) # type: ignore[var-annotated]
    is_active = models.BooleanField(default=True) # type: ignore[var-annotated]
    last_sync = models.DateTimeField(null=True, blank=True) # type: ignore[var-annotated]

    @property
    def password(self):
        return fernet.decrypt(bytes(self.encrypted_password)).decode()

    @password.setter
    def password(self, value: str):
        self.encrypted_password = fernet.encrypt(value.encode())

    def __str__(self):
        return self.email

class EmailMessage(models.Model):
    account = models.ForeignKey(MailAccount, on_delete=models.CASCADE, related_name='emails') # type: ignore[var-annotated]
    uid = models.CharField(max_length=100) # type: ignore[var-annotated]
    message_id = models.CharField(max_length=255, db_index=True) # type: ignore[var-annotated]
    subject = models.CharField(max_length=1024) # type: ignore[var-annotated]
    sender = models.CharField(max_length=255) # type: ignore[var-annotated]
    recipients = models.JSONField(default=list) # type: ignore[var-annotated]
    date = models.DateTimeField() # type: ignore[var-annotated]
    body_text = models.TextField(blank=True) # type: ignore[var-annotated]
    body_html = models.TextField(blank=True) # type: ignore[var-annotated]
    is_read = models.BooleanField(default=False) # type: ignore[var-annotated]
    folder = models.CharField(max_length=100, default='INBOX') # type: ignore[var-annotated]
    attachments = models.JSONField(default=list, blank=True)  # type: ignore[var-annotated]

    class Meta:
        unique_together = ('account', 'uid')
        ordering = ['-date']

    def __str__(self):
        return f"[{self.folder}] {self.subject}"