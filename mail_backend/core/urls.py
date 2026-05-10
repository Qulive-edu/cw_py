from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MailAccountViewSet, EmailMessageViewSet

router = DefaultRouter()
router.register(r'accounts', MailAccountViewSet, basename='mailaccount')
router.register(r'emails', EmailMessageViewSet, basename='email')

urlpatterns = [
    path('api/', include(router.urls)),
]