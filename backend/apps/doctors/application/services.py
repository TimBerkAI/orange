from django.db import transaction

from apps.authorization.domain.roles import Role
from apps.doctors.infrastructure.repositories import DoctorRepository
from shared.domain.sanitize import sanitize_html


class DoctorService:
    def __init__(self):
        self.doctor_repo = DoctorRepository()

    @transaction.atomic
    def create_doctor(self, *, user, specialization_ids=None, notes='', preferred_weekdays=None):
        if self.doctor_repo.exists_by_user_id(user.id):
            raise ValueError('This user already has a doctor profile')

        if user.role not in (Role.DOCTOR, Role.ADMIN):
            raise ValueError('User must have doctor or admin role')

        return self.doctor_repo.create(
            user=user,
            specialization_ids=specialization_ids,
            notes=sanitize_html(notes),
            preferred_weekdays=preferred_weekdays,
        )

    def update_doctor(self, doctor_id, **fields):
        doctor = self.doctor_repo.get_by_id(doctor_id)
        if not doctor:
            raise ValueError('Doctor not found')
        if 'notes' in fields:
            fields['notes'] = sanitize_html(fields['notes'])
        return self.doctor_repo.update(doctor_id=doctor_id, **fields)

    def delete_doctor(self, doctor_id):
        doctor = self.doctor_repo.get_by_id(doctor_id)
        if not doctor:
            raise ValueError('Doctor not found')
        self.doctor_repo.delete(doctor_id)

    def list_doctors(self, search=None):
        return self.doctor_repo.list_all(search=search)

    def get_doctor(self, doctor_id):
        return self.doctor_repo.get_by_id(doctor_id)

    def get_doctor_by_user(self, user_id):
        return self.doctor_repo.get_by_user_id(user_id)
