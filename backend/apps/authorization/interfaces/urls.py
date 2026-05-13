from django.urls import path

from apps.authorization.interfaces.views import (
    CustomTokenRefreshView,
    LoginView,
    MeView,
    RegisterView,
    UserDetailView,
    UserSearchView,
)

app_name = 'authorization'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token-refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('users/', UserSearchView.as_view(), name='user-list'),
    path('users/<int:user_id>/', UserDetailView.as_view(), name='user-detail'),
]
