from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.authorization.domain.roles import Role
from apps.authorization.infrastructure.models import User, UserProfile
from shared.domain.validate import validate_phone


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['first_name', 'last_name', 'patronymic', 'phone', 'date_of_birth']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'is_active', 'date_joined', 'profile']
        read_only_fields = ['id', 'date_joined']


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True, required=False, allow_blank=True, allow_null=True)
    role = serializers.ChoiceField(choices=Role.choices())
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    patronymic = serializers.CharField(max_length=150, required=False, default='')
    phone = serializers.CharField(max_length=30, required=False, default='')
    date_of_birth = serializers.DateField(required=False, default=None)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('User with this email already exists.')
        return value

    def validate_phone(self, value):
        if not value:
            return value
        try:
            return validate_phone(value)
        except ValueError as e:
            raise serializers.ValidationError(str(e)) from e


class UserAdminUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    role = serializers.ChoiceField(choices=Role.choices(), required=False)
    is_active = serializers.BooleanField(required=False)
    password = serializers.CharField(min_length=8, write_only=True, required=False)
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    patronymic = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    def validate_phone(self, value):
        if not value:
            return value
        try:
            return validate_phone(value)
        except ValueError as e:
            raise serializers.ValidationError(str(e)) from e


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        return token
