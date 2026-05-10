from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MailAccountViewSet, EmailMessageViewSet, RegisterView  # ← импортируйте RegisterView

router = DefaultRouter()
router.register(r'accounts', MailAccountViewSet, basename='mailaccount')
router.register(r'emails', EmailMessageViewSet, basename='email')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth/register/', RegisterView.as_view(), name='register'),  # ← новый эндпоинт
]