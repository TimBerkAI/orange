import pytest

from apps.authorization.tests.factories import UserFactory, UserProfileFactory
from apps.doctors.tests.factories import DoctorFactory
from apps.patients.application.services import PatientService
from apps.patients.infrastructure.models import Tooth
from apps.planning.application.services import AppointmentService


@pytest.fixture
def teeth(db):
    from apps.patients.domain.teeth import TOOTH_DATA

    created = []
    for number, name in TOOTH_DATA:
        t, _ = Tooth.objects.get_or_create(number=number, defaults={'name': name})
        created.append(t)
    return created


@pytest.fixture
def doctor_with_user(db):
    user = UserFactory(doctor=True)
    UserProfileFactory(user=user)
    doctor = DoctorFactory(user=user)
    return doctor, user


@pytest.fixture
def patient(db, teeth):
    user = UserFactory(patient=True)
    UserProfileFactory(user=user)
    service = PatientService()
    return service.create_patient(user=user)


@pytest.fixture
def admin_user_for_planning(db):
    user = UserFactory(admin=True)
    UserProfileFactory(user=user)
    return user


@pytest.fixture
def appointment(db, teeth, doctor_with_user, admin_user_for_planning):
    doctor, _ = doctor_with_user
    service = AppointmentService()
    return service.create_appointment(
        phone='+79001234567',
        patient_name='Иванов Иван Иванович',
        reason='Консультация',
        doctor_id=doctor.id,
        start_at='2026-07-01T10:00:00Z',
        end_at='2026-07-01T10:30:00Z',
        created_by=admin_user_for_planning,
    )
