from django.db import transaction

from apps.authorization.domain.roles import Role
from apps.authorization.infrastructure.models import User, UserProfile
from apps.doctors.infrastructure.models import Doctor
from apps.patients.application.services import PatientService, VisitService
from apps.patients.infrastructure.repositories import PatientRepository
from apps.planning.domain.validators import validate_appointment_times
from apps.planning.infrastructure.repositories import AppointmentRepository
from shared.domain.sanitize import sanitize_html


class AppointmentService:
    def __init__(self):
        self.appointment_repo = AppointmentRepository()
        self.patient_repo = PatientRepository()
        self.patient_svc = PatientService()
        self.visit_svc = VisitService()

    @transaction.atomic
    def create_appointment(
        self,
        *,
        phone,
        patient_name,
        reason,
        doctor_id,
        start_at,
        end_at,
        created_by,
    ):
        validate_appointment_times(start_at, end_at)
        reason = sanitize_html(reason) if reason else ''

        doctor = Doctor.objects.filter(pk=doctor_id).first()
        if not doctor:
            raise ValueError('Врач не найден')

        if self.appointment_repo.check_doctor_overlap(doctor_id, start_at, end_at):
            raise ValueError('У врача уже есть запись на это время')

        patient = self._resolve_patient(phone, patient_name)

        if self.appointment_repo.check_patient_overlap(
            patient.id, start_at, end_at,
        ):
            raise ValueError('У пациента уже есть запись на это время')

        visit = self.visit_svc.create_visit(
            patient=patient,
            doctor=doctor,
            start_at=start_at,
            end_at=end_at,
            reason=reason,
        )

        appointment = self.appointment_repo.create(
            visit=visit,
            phone=phone,
            patient_name=patient_name,
            reason=reason,
            created_by=created_by,
        )

        return self.appointment_repo.get_by_id(appointment.id)

    def _resolve_patient(self, phone, patient_name):
        profile = UserProfile.objects.filter(phone=phone).first()
        if profile:
            patient = self.patient_repo.get_by_user_id(profile.user_id)
            if patient:
                return patient
            user = profile.user
            if user.role != Role.PATIENT:
                user.role = Role.PATIENT
                user.save(update_fields=['role'])
            return self.patient_svc.create_patient(user=user)

        name_parts = patient_name.strip().split(maxsplit=2)
        last_name = name_parts[0] if len(name_parts) >= 1 else ''
        first_name = name_parts[1] if len(name_parts) >= 2 else ''
        patronymic = name_parts[2] if len(name_parts) >= 3 else ''

        email = f'patient_{phone.replace("+", "").replace(" ", "")}@clinic.local'
        user = User.objects.create_user(
            email=email,
            password=None,
            role=Role.PATIENT,
        )
        UserProfile.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
            patronymic=patronymic,
            phone=phone,
        )

        return self.patient_svc.create_patient(user=user)

    @transaction.atomic
    def update_appointment(self, appointment_id, *, created_by=None, **fields):
        appointment = self.appointment_repo.get_by_id(appointment_id)
        if not appointment:
            raise ValueError('Запись не найдена')

        visit = appointment.visit
        visit_fields = {}
        appt_fields = {}

        start_at = fields.pop('start_at', None)
        end_at = fields.pop('end_at', None)
        doctor_id = fields.pop('doctor_id', None)
        reason = fields.pop('reason', None)

        new_start = start_at or visit.start_at
        new_end = end_at or visit.end_at
        new_doctor_id = doctor_id or visit.doctor_id

        if start_at or end_at:
            validate_appointment_times(new_start, new_end)

        if start_at or end_at or doctor_id:
            if self.appointment_repo.check_doctor_overlap(
                new_doctor_id, new_start, new_end, exclude_visit_id=visit.id,
            ):
                raise ValueError('У врача уже есть запись на это время')

            if self.appointment_repo.check_patient_overlap(
                visit.patient_id, new_start, new_end, exclude_visit_id=visit.id,
            ):
                raise ValueError('У пациента уже есть запись на это время')

        if start_at:
            visit_fields['start_at'] = start_at
        if end_at:
            visit_fields['end_at'] = end_at
        if doctor_id:
            doctor = Doctor.objects.filter(pk=doctor_id).first()
            if not doctor:
                raise ValueError('Врач не найден')
            visit_fields['doctor'] = doctor

        if reason is not None:
            reason = sanitize_html(reason)
            visit_fields['reason'] = reason
            appt_fields['reason'] = reason

        if visit_fields:
            self.visit_svc.update_visit(visit.id, **visit_fields)

        if appt_fields:
            self.appointment_repo.update(appointment_id=appointment_id, **appt_fields)

        return self.appointment_repo.get_by_id(appointment_id)

    @transaction.atomic
    def delete_appointment(self, appointment_id):
        appointment = self.appointment_repo.get_by_id(appointment_id)
        if not appointment:
            raise ValueError('Запись не найдена')
        self.appointment_repo.delete(appointment_id)

    def list_appointments(
        self,
        *,
        date_from=None,
        date_to=None,
        doctor_id=None,
        doctor_user_id=None,
        search=None,
    ):
        if doctor_user_id:
            doctor = Doctor.objects.filter(user_id=doctor_user_id).first()
            if not doctor:
                return self.appointment_repo.list_all().none()
            doctor_id = doctor.id

        return self.appointment_repo.list_all(
            date_from=date_from,
            date_to=date_to,
            doctor_id=doctor_id,
            search=search,
        )

    def get_appointment(self, appointment_id):
        return self.appointment_repo.get_by_id(appointment_id)
