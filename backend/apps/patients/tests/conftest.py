import pytest

from apps.authorization.tests.factories import UserFactory, UserProfileFactory
from apps.doctors.tests.factories import DoctorFactory
from apps.patients.application.services import PatientService, VisitService
from apps.patients.infrastructure.models import Tooth


@pytest.fixture
def teeth(db):
    from apps.patients.domain.teeth import TOOTH_DATA

    created = []
    for number, name in TOOTH_DATA:
        t, _ = Tooth.objects.get_or_create(number=number, defaults={'name': name})
        created.append(t)
    return created


@pytest.fixture
def patient(db, teeth):
    user = UserFactory(patient=True)
    UserProfileFactory(user=user)
    service = PatientService()
    return service.create_patient(user=user)


@pytest.fixture
def doctor_with_user(db):
    user = UserFactory(doctor=True)
    UserProfileFactory(user=user)
    doctor = DoctorFactory(user=user)
    return doctor, user


@pytest.fixture
def visit(db, patient, doctor_with_user, teeth):
    doctor, _ = doctor_with_user
    service = VisitService()
    return service.create_visit(
        patient=patient,
        doctor=doctor,
        scheduled_at='2026-06-01T10:00:00Z',
        reason='Консультация',
        tooth_ids=[teeth[0].id, teeth[1].id],
    )
