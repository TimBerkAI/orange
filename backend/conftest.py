import pytest
from rest_framework.test import APIClient

from apps.authorization.infrastructure.tokens import CustomRefreshToken
from apps.authorization.tests.factories import UserFactory, UserProfileFactory


@pytest.fixture
def api_client():
    return APIClient()


def make_authenticated_client(user):
    client = APIClient()
    token = CustomRefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
    return client


@pytest.fixture
def admin_user(db):
    user = UserFactory(admin=True)
    UserProfileFactory(user=user)
    return user


@pytest.fixture
def doctor_user(db):
    user = UserFactory(doctor=True)
    UserProfileFactory(user=user)
    return user


@pytest.fixture
def patient_user(db):
    user = UserFactory(patient=True)
    UserProfileFactory(user=user)
    return user


@pytest.fixture
def admin_client(admin_user):
    return make_authenticated_client(admin_user)


@pytest.fixture
def doctor_client(doctor_user):
    return make_authenticated_client(doctor_user)


@pytest.fixture
def patient_client(patient_user):
    return make_authenticated_client(patient_user)
