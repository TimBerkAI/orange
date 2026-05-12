from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.authorization.domain.roles import Role
from apps.authorization.infrastructure.models import User, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["first_name", "last_name", "patronymic", "phone", "date_of_birth"]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "role", "is_active", "date_joined", "profile"]
        read_only_fields = ["id", "email", "role", "is_active", "date_joined"]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    role = serializers.ChoiceField(choices=Role.choices())
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    patronymic = serializers.CharField(max_length=150, required=False, default="")
    phone = serializers.CharField(max_length=30, required=False, default="")
    date_of_birth = serializers.DateField(required=False, default=None)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        return token
