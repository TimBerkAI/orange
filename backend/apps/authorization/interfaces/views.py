from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.authorization.application.services import AuthService
from apps.authorization.domain.roles import Role
from apps.authorization.infrastructure.models import User, UserProfile
from apps.authorization.interfaces.permissions import IsAdmin
from apps.authorization.interfaces.serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserAdminUpdateSerializer,
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

        qs = User.objects.select_related("profile").order_by("email")
        if search and len(search) >= 2:
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(profile__first_name__icontains=search)
                | Q(profile__last_name__icontains=search)
                | Q(profile__patronymic__icontains=search)
                | Q(profile__phone__icontains=search)
            )
        elif search:
            return Response([])

        return Response(UserSerializer(qs[:50], many=True).data)

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
        try:
            user = service.register_user(
                email=data['email'],
                password=data.get('password') or None,
                role=data['role'],
                profile_data=profile_data,
            )
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, user_id):
        user = User.objects.select_related("profile").filter(pk=user_id).first()
        if not user:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(user).data)

    def patch(self, request, user_id):
        user = User.objects.select_related("profile").filter(pk=user_id).first()
        if not user:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = UserAdminUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        email = data.pop('email', None)
        role = data.pop('role', None)
        is_active = data.pop('is_active', None)
        password = data.pop('password', None)

        if email and email != user.email:
            if User.objects.filter(email=email).exclude(pk=user_id).exists():
                return Response(
                    {'detail': 'Пользователь с таким email уже существует.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.email = email

        if role is not None:
            user.role = role
            user.is_staff = role == Role.ADMIN

        if is_active is not None:
            user.is_active = is_active

        if password:
            user.set_password(password)

        user.save()

        profile_fields = {k: v for k, v in data.items() if k in (
            'first_name', 'last_name', 'patronymic', 'phone', 'date_of_birth'
        )}
        if profile_fields:
            UserProfile.objects.filter(user=user).update(**profile_fields)

        user.refresh_from_db()
        return Response(UserSerializer(user).data)

    def delete(self, request, user_id):
        user = User.objects.filter(pk=user_id).first()
        if not user:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if user == request.user:
            return Response(
                {'detail': 'Нельзя удалить собственный аккаунт.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
