import pytest

from apps.authorization.domain.roles import Role
from apps.authorization.interfaces.permissions import (
    IsAdmin,
    IsAdminOrDoctor,
    IsDoctor,
    IsPatient,
)


class _FakeRequest:
    def __init__(self, user=None):
        self.user = user


@pytest.mark.django_db
class TestRolePermissions:
    def test_admin_permission_allows_admin(self, admin_user):
        perm = IsAdmin()
        request = _FakeRequest(user=admin_user)

        assert perm.has_permission(request, None) is True

    def test_admin_permission_denies_doctor(self, doctor_user):
        perm = IsAdmin()
        request = _FakeRequest(user=doctor_user)

        assert perm.has_permission(request, None) is False

    def test_admin_permission_denies_patient(self, patient_user):
        perm = IsAdmin()
        request = _FakeRequest(user=patient_user)

        assert perm.has_permission(request, None) is False

    def test_doctor_permission_allows_doctor(self, doctor_user):
        perm = IsDoctor()
        request = _FakeRequest(user=doctor_user)

        assert perm.has_permission(request, None) is True

    def test_doctor_permission_denies_admin(self, admin_user):
        perm = IsDoctor()
        request = _FakeRequest(user=admin_user)

        assert perm.has_permission(request, None) is False

    def test_patient_permission_allows_patient(self, patient_user):
        perm = IsPatient()
        request = _FakeRequest(user=patient_user)

        assert perm.has_permission(request, None) is True

    def test_patient_permission_denies_doctor(self, doctor_user):
        perm = IsPatient()
        request = _FakeRequest(user=doctor_user)

        assert perm.has_permission(request, None) is False

    def test_admin_or_doctor_allows_admin(self, admin_user):
        perm = IsAdminOrDoctor()
        request = _FakeRequest(user=admin_user)

        assert perm.has_permission(request, None) is True

    def test_admin_or_doctor_allows_doctor(self, doctor_user):
        perm = IsAdminOrDoctor()
        request = _FakeRequest(user=doctor_user)

        assert perm.has_permission(request, None) is True

    def test_admin_or_doctor_denies_patient(self, patient_user):
        perm = IsAdminOrDoctor()
        request = _FakeRequest(user=patient_user)

        assert perm.has_permission(request, None) is False

    def test_unauthenticated_denied(self):
        from django.contrib.auth.models import AnonymousUser

        perm = IsAdmin()
        request = _FakeRequest(user=AnonymousUser())

        assert perm.has_permission(request, None) is False

    def test_no_user_denied(self):
        perm = IsAdmin()
        request = _FakeRequest(user=None)

        assert perm.has_permission(request, None) is False


@pytest.mark.django_db
class TestJwtContainsRole:
    def test_jwt_token_contains_role(self, patient_user):
        from apps.authorization.infrastructure.tokens import CustomRefreshToken

        token = CustomRefreshToken.for_user(patient_user)
        access = token.access_token

        assert access['role'] == Role.PATIENT
        assert access['email'] == patient_user.email

    def test_jwt_admin_role(self, admin_user):
        from apps.authorization.infrastructure.tokens import CustomRefreshToken

        token = CustomRefreshToken.for_user(admin_user)
        access = token.access_token

        assert access['role'] == Role.ADMIN
