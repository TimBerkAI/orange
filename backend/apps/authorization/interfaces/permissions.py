from rest_framework.permissions import BasePermission

from apps.authorization.domain.roles import Role


class RoleBasePermission(BasePermission):
    required_role: str | None = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if self.required_role is None:
            return True
        return request.user.role == self.required_role


class IsAdmin(RoleBasePermission):
    required_role = Role.ADMIN


class IsDoctor(RoleBasePermission):
    required_role = Role.DOCTOR


class IsPatient(RoleBasePermission):
    required_role = Role.PATIENT


class IsAdminOrDoctor(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in (Role.ADMIN, Role.DOCTOR)
