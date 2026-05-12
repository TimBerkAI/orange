from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.authorization.infrastructure.models import User, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = "Profile"


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline]
    list_display = ["email", "role", "is_active", "is_staff", "date_joined"]
    list_filter = ["role", "is_active", "is_staff"]
    search_fields = ["email"]
    ordering = ["-date_joined"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Role", {"fields": ("role",)}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "role"),
            },
        ),
    )
