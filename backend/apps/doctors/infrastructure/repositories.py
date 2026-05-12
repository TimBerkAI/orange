from django.db.models import Q

from apps.doctors.domain.repositories import (
    DoctorRepositoryInterface,
    SpecializationRepositoryInterface,
)
from apps.doctors.infrastructure.models import Doctor, Specialization


class DoctorRepository(DoctorRepositoryInterface):
    def get_by_id(self, doctor_id):
        return (
            Doctor.objects.select_related('user__profile')
            .prefetch_related('specializations')
            .filter(pk=doctor_id)
            .first()
        )

    def get_by_user_id(self, user_id):
        return (
            Doctor.objects.select_related('user__profile')
            .prefetch_related('specializations')
            .filter(user_id=user_id)
            .first()
        )

    def list_all(self, search=None):
        qs = Doctor.objects.select_related('user__profile').prefetch_related('specializations')
        if search:
            qs = qs.filter(
                Q(user__email__icontains=search)
                | Q(user__profile__first_name__icontains=search)
                | Q(user__profile__last_name__icontains=search)
                | Q(user__profile__patronymic__icontains=search)
            )
        return qs

    def create(self, *, user, specialization_ids=None, notes='', preferred_weekdays=None):
        doctor = Doctor.objects.create(
            user=user,
            notes=notes,
            preferred_weekdays=preferred_weekdays or [],
        )
        if specialization_ids:
            doctor.specializations.set(specialization_ids)
        return doctor

    def update(self, *, doctor_id, **fields):
        specialization_ids = fields.pop('specialization_ids', None)
        if fields:
            Doctor.objects.filter(pk=doctor_id).update(**fields)
        doctor = self.get_by_id(doctor_id)
        if specialization_ids is not None and doctor:
            doctor.specializations.set(specialization_ids)
        return doctor

    def delete(self, doctor_id):
        Doctor.objects.filter(pk=doctor_id).delete()

    def exists_by_user_id(self, user_id) -> bool:
        return Doctor.objects.filter(user_id=user_id).exists()


class SpecializationRepository(SpecializationRepositoryInterface):
    def get_all(self):
        return Specialization.objects.all()

    def get_by_ids(self, ids):
        return Specialization.objects.filter(pk__in=ids)

    def delete(self, specialization_id) -> bool:
        count, _ = Specialization.objects.filter(pk=specialization_id).delete()
        return count > 0
