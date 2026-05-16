# mail_backend/core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import (
    MailAccountViewSet, 
    EmailMessageViewSet,
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView
)

router = DefaultRouter()
router.register(r'accounts', MailAccountViewSet, basename='mailaccount')
router.register(r'emails', EmailMessageViewSet, basename='email')

# Все эндпоинты с префиксом /api/ для согласованности с nginx и фронтендом
urlpatterns = [
    # ===== AUTH ENDPOINTS =====
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
    path('api/auth/user/', CurrentUserView.as_view(), name='current-user'),
    path('api/auth/token/', obtain_auth_token, name='token-auth'),
    
    # ===== API ROUTES FROM DRF ROUTER =====
    # Router автоматически создаст:
    # /api/accounts/, /api/accounts/{id}/, /api/accounts/{id}/sync/
    # /api/emails/, /api/emails/{id}/, /api/emails/send/, и т.д.
    path('api/', include(router.urls)),
]