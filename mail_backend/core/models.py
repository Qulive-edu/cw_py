from django.db import models
from django.contrib.auth.models import User
from cryptography.fernet import Fernet
import base64
import os


def get_fernet_key() -> bytes:
    """
    Получает ключ шифрования из переменной окружения или генерирует новый.
    В продакшене FERNET_KEY должен быть задан в ENV и одинаков для всех инстансов!
    """
    key = os.getenv('FERNET_KEY')
    if not key:
        # Генерируем новый ключ только если переменная не задана
        # В продакшене здесь лучше выбрасывать ошибку, чтобы не потерять доступ к данным
        key = Fernet.generate_key().decode()
        print(f"WARNING: FERNET_KEY not set. Generated new key (save to env!): {key}")
    # Fernet принимает ключ как bytes или str в base64
    return key.encode() if isinstance(key, str) else key


# Инициализируем шифратор один раз при старте приложения
fernet = Fernet(get_fernet_key())


class MailAccount(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mail_accounts')
    email = models.EmailField(unique=True)
    encrypted_password = models.BinaryField()
    imap_host = models.CharField(max_length=255)
    imap_port = models.PositiveIntegerField(default=993)
    smtp_host = models.CharField(max_length=255)
    smtp_port = models.PositiveIntegerField(default=465)
    use_ssl = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    last_sync = models.DateTimeField(null=True, blank=True)

    @property
    def password(self) -> str:
        """Возвращает расшифрованный пароль"""
        if not self.encrypted_password:
            return ""
        return fernet.decrypt(bytes(self.encrypted_password)).decode()

    @password.setter
    def password(self, value: str) -> None:
        """Шифрует и сохраняет пароль"""
        if value:
            self.encrypted_password = fernet.encrypt(value.encode())

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = "Почтовый аккаунт"
        verbose_name_plural = "Почтовые аккаунты"


class EmailMessage(models.Model):
    account = models.ForeignKey(MailAccount, on_delete=models.CASCADE, related_name='emails')
    uid = models.CharField(max_length=100)
    message_id = models.CharField(max_length=255, db_index=True)
    subject = models.CharField(max_length=1024)
    sender = models.CharField(max_length=255)
    recipients = models.JSONField(default=list)
    date = models.DateTimeField()
    body_text = models.TextField(blank=True)
    body_html = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    folder = models.CharField(max_length=100, default='INBOX')
    attachments = models.JSONField(default=list, blank=True)

    class Meta:
        unique_together = ('account', 'uid')
        ordering = ['-date']
        verbose_name = "Письмо"
        verbose_name_plural = "Письма"

    def __str__(self):
        return f"[{self.folder}] {self.subject}"