from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from apps.authorization.domain.roles import Role
from apps.authorization.infrastructure.managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices(), default=Role.PATIENT)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "auth_user"

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    first_name = models.CharField(max_length=150, default="")
    last_name = models.CharField(max_length=150, default="")
    patronymic = models.CharField(max_length=150, blank=True, default="")
    phone = models.CharField(max_length=30, blank=True, default="")
    date_of_birth = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "auth_user_profile"

    def __str__(self):
        return f"{self.last_name} {self.first_name}"
