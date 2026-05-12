from django.urls import path, include
from rest_framework.routers import DefaultRouter # type: ignore[import-untyped]
from .views import (
    MailAccountViewSet, 
    EmailMessageViewSet, 
    RegisterView,      # ← ваш существующий
    LoginView,         # ← новый
    LogoutView,        # ← новый
    UserView,          # ← новый
)

router = DefaultRouter()
router.register(r'accounts', MailAccountViewSet, basename='mailaccount')
router.register(r'emails', EmailMessageViewSet, basename='email')

urlpatterns = [
    path('api/', include(router.urls)),
    # Auth endpoints
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', LoginView.as_view(), name='login'),      # ← новый
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),  # ← новый
    path('api/auth/user/', UserView.as_view(), name='user'),        # ← новый
]