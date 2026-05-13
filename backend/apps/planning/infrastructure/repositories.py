from django.db.models import Q

from apps.patients.domain.enums import VisitStatus
from apps.patients.infrastructure.models import Visit
from apps.planning.domain.repositories import AppointmentRepositoryInterface
from apps.planning.infrastructure.models import Appointment


class AppointmentRepository(AppointmentRepositoryInterface):
    def _base_qs(self):
        return Appointment.objects.select_related(
            'visit__patient__user__profile',
            'visit__doctor__user__profile',
            'created_by',
        )

    def get_by_id(self, appointment_id):
        return self._base_qs().filter(pk=appointment_id).first()

    def list_all(self, *, date_from=None, date_to=None, doctor_id=None, search=None):
        qs = self._base_qs()
        if date_from:
            qs = qs.filter(visit__start_at__gte=date_from)
        if date_to:
            qs = qs.filter(visit__start_at__lt=date_to)
        if doctor_id:
            qs = qs.filter(visit__doctor_id=doctor_id)
        if search:
            qs = qs.filter(Q(patient_name__icontains=search) | Q(phone__icontains=search))
        return qs

    def create(self, *, visit, phone, patient_name, reason, created_by):
        return Appointment.objects.create(
            visit=visit,
            phone=phone,
            patient_name=patient_name,
            reason=reason,
            created_by=created_by,
        )

    def update(self, *, appointment_id, **fields):
        Appointment.objects.filter(pk=appointment_id).update(**fields)
        return self.get_by_id(appointment_id)

    def delete(self, appointment_id):
        Appointment.objects.filter(pk=appointment_id).delete()

    @staticmethod
    def check_doctor_overlap(doctor_id, start_at, end_at, exclude_visit_id=None):
        qs = Visit.objects.filter(
            doctor_id=doctor_id,
            status__in=[VisitStatus.PLANNED, VisitStatus.CONFIRMED],
            start_at__lt=end_at,
            end_at__gt=start_at,
        )
        if exclude_visit_id:
            qs = qs.exclude(pk=exclude_visit_id)
        return qs.exists()

    @staticmethod
    def check_patient_overlap(patient_id, start_at, end_at, exclude_visit_id=None):
        qs = Visit.objects.filter(
            patient_id=patient_id,
            status__in=[VisitStatus.PLANNED, VisitStatus.CONFIRMED],
            start_at__lt=end_at,
            end_at__gt=start_at,
        )
        if exclude_visit_id:
            qs = qs.exclude(pk=exclude_visit_id)
        return qs.exists()
