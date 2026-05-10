from rest_framework import serializers
from .models import MailAccount, EmailMessage

class MailAccountSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = MailAccount
        fields = ['id', 'email', 'password', 'imap_host', 'imap_port', 'smtp_host', 'smtp_port', 'use_ssl', 'is_active']

class EmailMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailMessage
        fields = '__all__'