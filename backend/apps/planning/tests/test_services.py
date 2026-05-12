import pytest

from apps.authorization.infrastructure.models import UserProfile
from apps.patients.infrastructure.models import Patient, PatientTooth
from apps.planning.application.services import AppointmentService


@pytest.mark.django_db
class TestCreateAppointment:
    def test_creates_full_chain(self, appointment):
        assert appointment.visit is not None
        assert appointment.visit.patient is not None
        assert hasattr(appointment.visit, 'odontogram')
        assert hasattr(appointment.visit, 'soap_note')
        assert appointment.phone == '+79001234567'
        assert appointment.patient_name == 'Иванов Иван Иванович'

    def test_creates_user_and_patient(self, appointment):
        patient = appointment.visit.patient
        assert patient is not None
        assert PatientTooth.objects.filter(patient=patient).count() == 32

    def test_parses_name_into_profile(self, appointment):
        profile = appointment.visit.patient.user.profile
        assert profile.last_name == 'Иванов'
        assert profile.first_name == 'Иван'
        assert profile.patronymic == 'Иванович'
        assert profile.phone == '+79001234567'

    def test_reuses_existing_patient_by_phone(
        self, teeth, doctor_with_user, patient, admin_user_for_planning,
    ):
        phone = patient.user.profile.phone
        doctor, _ = doctor_with_user
        service = AppointmentService()

        appt = service.create_appointment(
            phone=phone,
            patient_name='Другое имя',
            reason='Повтор',
            doctor_id=doctor.id,
            start_at='2026-08-01T10:00:00Z',
            end_at='2026-08-01T10:30:00Z',
            created_by=admin_user_for_planning,
        )

        assert appt.visit.patient_id == patient.id

    def test_creates_patient_for_existing_user_without_profile(
        self, teeth, doctor_with_user, admin_user_for_planning,
    ):
        doctor, _ = doctor_with_user
        service = AppointmentService()

        appt1 = service.create_appointment(
            phone='+79999999999',
            patient_name='Петров Пётр',
            reason='Первый приём',
            doctor_id=doctor.id,
            start_at='2026-09-01T10:00:00Z',
            end_at='2026-09-01T10:30:00Z',
            created_by=admin_user_for_planning,
        )
        assert Patient.objects.filter(
            user=appt1.visit.patient.user,
        ).exists()


@pytest.mark.django_db
class TestOverlapValidation:
    def test_doctor_overlap_rejected(
        self, appointment, teeth, doctor_with_user, admin_user_for_planning,
    ):
        doctor, _ = doctor_with_user
        service = AppointmentService()

        with pytest.raises(ValueError, match='врача'):
            service.create_appointment(
                phone='+79002222222',
                patient_name='Сидоров Сидор',
                reason='Перекрытие',
                doctor_id=doctor.id,
                start_at='2026-07-01T10:15:00Z',
                end_at='2026-07-01T10:45:00Z',
                created_by=admin_user_for_planning,
            )

    def test_patient_overlap_rejected(
        self, appointment, teeth, admin_user_for_planning,
    ):
        from apps.doctors.tests.factories import DoctorFactory
        from apps.authorization.tests.factories import UserFactory, UserProfileFactory

        other_user = UserFactory(doctor=True)
        UserProfileFactory(user=other_user)
        other_doctor = DoctorFactory(user=other_user)
        service = AppointmentService()

        with pytest.raises(ValueError, match='пациента'):
            service.create_appointment(
                phone='+79001234567',
                patient_name='Иванов Иван Иванович',
                reason='Другой врач',
                doctor_id=other_doctor.id,
                start_at='2026-07-01T10:15:00Z',
                end_at='2026-07-01T10:45:00Z',
                created_by=admin_user_for_planning,
            )

    def test_no_overlap_adjacent_times(
        self, appointment, teeth, doctor_with_user, admin_user_for_planning,
    ):
        doctor, _ = doctor_with_user
        service = AppointmentService()

        appt = service.create_appointment(
            phone='+79003333333',
            patient_name='Козлов Козёл',
            reason='Сразу после',
            doctor_id=doctor.id,
            start_at='2026-07-01T10:30:00Z',
            end_at='2026-07-01T11:00:00Z',
            created_by=admin_user_for_planning,
        )
        assert appt is not None


@pytest.mark.django_db
class TestDurationValidation:
    def test_too_short_rejected(
        self, teeth, doctor_with_user, admin_user_for_planning,
    ):
        doctor, _ = doctor_with_user
        service = AppointmentService()

        with pytest.raises(ValueError, match='5 минут'):
            service.create_appointment(
                phone='+79004444444',
                patient_name='Коротков Короткий',
                reason='Слишком быстро',
                doctor_id=doctor.id,
                start_at='2026-07-02T10:00:00Z',
                end_at='2026-07-02T10:03:00Z',
                created_by=admin_user_for_planning,
            )

    def test_too_long_rejected(
        self, teeth, doctor_with_user, admin_user_for_planning,
    ):
        doctor, _ = doctor_with_user
        service = AppointmentService()

        with pytest.raises(ValueError, match='10 часов'):
            service.create_appointment(
                phone='+79005555555',
                patient_name='Долгов Долгий',
                reason='Слишком долго',
                doctor_id=doctor.id,
                start_at='2026-07-02T08:00:00Z',
                end_at='2026-07-02T19:00:00Z',
                created_by=admin_user_for_planning,
            )

    def test_end_before_start_rejected(
        self, teeth, doctor_with_user, admin_user_for_planning,
    ):
        doctor, _ = doctor_with_user
        service = AppointmentService()

        with pytest.raises(ValueError, match='позже'):
            service.create_appointment(
                phone='+79006666666',
                patient_name='Обратный Иван',
                reason='Ошибка',
                doctor_id=doctor.id,
                start_at='2026-07-02T12:00:00Z',
                end_at='2026-07-02T11:00:00Z',
                created_by=admin_user_for_planning,
            )


@pytest.mark.django_db
class TestUpdateAppointment:
    def test_update_reason(self, appointment):
        service = AppointmentService()
        updated = service.update_appointment(appointment.id, reason='Новая причина')
        assert updated.reason == 'Новая причина'

    def test_update_time_revalidates_overlap(
        self, appointment, teeth, doctor_with_user, admin_user_for_planning,
    ):
        doctor, _ = doctor_with_user
        service = AppointmentService()

        second = service.create_appointment(
            phone='+79007777777',
            patient_name='Второй Пациент',
            reason='Второй',
            doctor_id=doctor.id,
            start_at='2026-07-01T11:00:00Z',
            end_at='2026-07-01T11:30:00Z',
            created_by=admin_user_for_planning,
        )

        with pytest.raises(ValueError, match='врача'):
            service.update_appointment(
                second.id,
                start_at=appointment.visit.start_at,
                end_at=appointment.visit.end_at,
            )


@pytest.mark.django_db
class TestDeleteAppointment:
    def test_delete(self, appointment):
        service = AppointmentService()
        service.delete_appointment(appointment.id)

        assert service.get_appointment(appointment.id) is None

    def test_delete_nonexistent(self):
        service = AppointmentService()
        with pytest.raises(ValueError, match='не найдена'):
            service.delete_appointment(99999)
