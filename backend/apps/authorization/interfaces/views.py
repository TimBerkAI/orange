from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.authorization.application.services import AuthService
from apps.authorization.infrastructure.models import User
from apps.authorization.interfaces.permissions import IsAdmin
from apps.authorization.interfaces.serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        service = AuthService()
        profile_data = {
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'patronymic': data.get('patronymic', ''),
            'phone': data.get('phone', ''),
            'date_of_birth': data.get('date_of_birth'),
        }

        user = service.register_user(
            email=data['email'],
            password=data['password'],
            role=data['role'],
            profile_data=profile_data,
        )

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CustomTokenRefreshView(TokenRefreshView):
    pass


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserProfileSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        service = AuthService()
        service.update_profile(request.user.id, **serializer.validated_data)
        request.user.refresh_from_db()

        return Response(UserSerializer(request.user).data)


class UserSearchView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        search = request.query_params.get("search", "").strip()
        if len(search) < 2:
            return Response([])

        qs = User.objects.select_related("profile").filter(
            Q(email__icontains=search)
            | Q(profile__first_name__icontains=search)
            | Q(profile__last_name__icontains=search)
            | Q(profile__patronymic__icontains=search)
            | Q(profile__phone__icontains=search)
        ).order_by("email")[:20]

        return Response(UserSerializer(qs, many=True).data)
