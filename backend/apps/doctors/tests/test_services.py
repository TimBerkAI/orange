import pytest

from apps.authorization.tests.factories import UserFactory, UserProfileFactory
from apps.doctors.application.services import DoctorService
from apps.doctors.tests.factories import DoctorFactory, SpecializationFactory


@pytest.mark.django_db
class TestDoctorService:
    def test_create_doctor(self):
        user = UserFactory(doctor=True)
        UserProfileFactory(user=user)
        service = DoctorService()

        doctor = service.create_doctor(user=user)

        assert doctor.user == user
        assert doctor.preferred_weekdays == [0, 1, 2, 3, 4, 5, 6]

    def test_create_doctor_with_specializations(self):
        user = UserFactory(doctor=True)
        UserProfileFactory(user=user)
        spec = SpecializationFactory()
        service = DoctorService()

        doctor = service.create_doctor(user=user, specialization_ids=[spec.id])

        assert list(doctor.specializations.values_list('id', flat=True)) == [spec.id]

    def test_create_doctor_for_admin(self):
        user = UserFactory(admin=True)
        service = DoctorService()

        doctor = service.create_doctor(user=user)

        assert doctor.user == user

    def test_duplicate_user_raises(self):
        user = UserFactory(doctor=True)
        DoctorFactory(user=user)
        service = DoctorService()

        with pytest.raises(ValueError, match='already has a doctor profile'):
            service.create_doctor(user=user)

    def test_patient_user_raises(self):
        user = UserFactory(patient=True)
        service = DoctorService()

        with pytest.raises(ValueError, match='doctor or admin role'):
            service.create_doctor(user=user)

    def test_update_doctor(self):
        doctor = DoctorFactory()
        service = DoctorService()

        updated = service.update_doctor(doctor.id, notes='Updated note')

        assert updated.notes == 'Updated note'

    def test_delete_doctor(self):
        doctor = DoctorFactory()
        service = DoctorService()

        service.delete_doctor(doctor.id)

        assert service.get_doctor(doctor.id) is None

    def test_list_doctors_search(self):
        user = UserFactory(doctor=True)
        UserProfileFactory(user=user, last_name='Иванов')
        DoctorFactory(user=user)
        service = DoctorService()

        results = service.list_doctors(search='Иванов')

        assert len(results) >= 1

    def test_get_doctor_by_user(self):
        doctor = DoctorFactory()
        service = DoctorService()

        found = service.get_doctor_by_user(doctor.user.id)

        assert found.id == doctor.id
