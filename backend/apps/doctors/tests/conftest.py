import pytest

from apps.authorization.tests.factories import UserFactory, UserProfileFactory
from apps.doctors.tests.factories import DoctorFactory, SpecializationFactory
from conftest import make_authenticated_client


@pytest.fixture
def specialization(db):
    return SpecializationFactory(name='Терапевт')


@pytest.fixture
def specialization_list(db):
    return [
        SpecializationFactory(name='Терапевт'),
        SpecializationFactory(name='Хирург'),
        SpecializationFactory(name='Ортодонт'),
    ]


@pytest.fixture
def doctor(db, doctor_user):
    return DoctorFactory(user=doctor_user)


@pytest.fixture
def admin_doctor(db):
    user = UserFactory(admin=True)
    UserProfileFactory(user=user)
    doctor = DoctorFactory(user=user)
    return doctor, user


@pytest.fixture
def admin_doctor_client(admin_doctor):
    _, user = admin_doctor
    return make_authenticated_client(user)
