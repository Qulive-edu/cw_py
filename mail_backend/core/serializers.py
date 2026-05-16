# mail_backend/core/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import MailAccount, EmailMessage


class RegisterSerializer(serializers.ModelSerializer):
    """Сериализатор для регистрации нового пользователя"""
    password = serializers.CharField(write_only=True, min_length=8, max_length=128)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Пароли не совпадают"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для отображения данных пользователя"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class MailAccountSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = MailAccount
        fields = ['id', 'email', 'password', 'imap_host', 'imap_port', 
                  'smtp_host', 'smtp_port', 'use_ssl', 'is_active']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        # Шифрование пароля происходит через setter в модели
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Если пароль передан — обновляем его (шифруем)
        if 'password' in validated_data and validated_data['password']:
            instance.password = validated_data.pop('password')
        return super().update(instance, validated_data)


class EmailMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailMessage
        fields = '__all__'
        read_only_fields = ['id', 'account', 'uid', 'message_id', 'date']