import pytest
from django.urls import reverse
from rest_framework import status

from apps.authorization.domain.roles import Role
from apps.authorization.infrastructure.models import User


@pytest.mark.django_db
class TestRegister:
    url = reverse("authorization:register")

    def test_register_patient(self, api_client):
        payload = {
            "email": "new@example.com",
            "password": "securepass1",
            "role": Role.PATIENT,
            "first_name": "Ivan",
            "last_name": "Ivanov",
        }

        response = api_client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == "new@example.com"
        assert response.data["role"] == Role.PATIENT
        assert response.data["profile"]["first_name"] == "Ivan"
        assert response.data["profile"]["last_name"] == "Ivanov"

    def test_register_doctor(self, api_client):
        payload = {
            "email": "doctor@example.com",
            "password": "securepass1",
            "role": Role.DOCTOR,
            "first_name": "Petr",
            "last_name": "Petrov",
        }

        response = api_client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["role"] == Role.DOCTOR

    def test_register_admin(self, api_client):
        payload = {
            "email": "admin@example.com",
            "password": "securepass1",
            "role": Role.ADMIN,
            "first_name": "Admin",
            "last_name": "Adminov",
        }

        response = api_client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["role"] == Role.ADMIN
        user = User.objects.get(email="admin@example.com")
        assert user.is_staff is True

    def test_register_duplicate_email(self, api_client, patient_user):
        payload = {
            "email": patient_user.email,
            "password": "securepass1",
            "role": Role.PATIENT,
            "first_name": "Test",
            "last_name": "Test",
        }

        response = api_client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_missing_required_fields(self, api_client):
        payload = {"email": "test@example.com"}

        response = api_client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_short_password(self, api_client):
        payload = {
            "email": "test@example.com",
            "password": "short",
            "role": Role.PATIENT,
            "first_name": "Test",
            "last_name": "Test",
        }

        response = api_client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogin:
    url = reverse("authorization:login")

    def test_login_success(self, api_client, patient_user):
        payload = {"email": patient_user.email, "password": "testpass123"}

        response = api_client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_wrong_password(self, api_client, patient_user):
        payload = {"email": patient_user.email, "password": "wrongpassword"}

        response = api_client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client):
        payload = {"email": "noone@example.com", "password": "testpass123"}

        response = api_client.post(self.url, payload, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestTokenRefresh:
    url = reverse("authorization:token-refresh")

    def test_refresh_success(self, api_client, patient_user):
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(patient_user)

        response = api_client.post(self.url, {"refresh": str(refresh)}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data

    def test_refresh_invalid_token(self, api_client):
        response = api_client.post(self.url, {"refresh": "invalidtoken"}, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestMe:
    url = reverse("authorization:me")

    def test_get_me_authenticated(self, patient_client, patient_user):
        response = patient_client.get(self.url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == patient_user.email
        assert response.data["role"] == Role.PATIENT
        assert "profile" in response.data

    def test_get_me_unauthenticated(self, api_client):
        response = api_client.get(self.url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_patch_me_update_profile(self, patient_client):
        response = patient_client.patch(
            self.url,
            {"first_name": "Updated", "phone": "+79991234567"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["profile"]["first_name"] == "Updated"
        assert response.data["profile"]["phone"] == "+79991234567"

    def test_patch_me_partial_update(self, patient_client):
        response = patient_client.patch(
            self.url,
            {"patronymic": "Ivanovich"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["profile"]["patronymic"] == "Ivanovich"

    def test_patch_me_unauthenticated(self, api_client):
        response = api_client.patch(
            self.url,
            {"first_name": "Hacker"},
            format="json",
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
