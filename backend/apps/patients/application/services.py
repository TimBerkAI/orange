from django.db import transaction

from apps.authorization.domain.roles import Role
from apps.patients.domain.enums import ToothStatus
from apps.patients.domain.sanitize import sanitize_html
from apps.patients.infrastructure.models import (
    OdontogramEntry,
    PatientTooth,
    Tooth,
    VisitTooth,
)
from apps.patients.infrastructure.repositories import (
    OdontogramRepository,
    PatientRepository,
    SoapNoteRepository,
    VisitRepository,
)


class PatientService:
    def __init__(self):
        self.patient_repo = PatientRepository()

    @transaction.atomic
    def create_patient(self, *, user, allergies='', status='active'):
        if self.patient_repo.exists_by_user_id(user.id):
            raise ValueError('This user already has a patient profile')

        if user.role != Role.PATIENT:
            raise ValueError('User must have patient role')

        patient = self.patient_repo.create(
            user=user,
            allergies=allergies,
            status=status,
        )

        teeth = Tooth.objects.all()
        PatientTooth.objects.bulk_create(
            [
                PatientTooth(patient=patient, tooth=tooth, status=ToothStatus.HEALTHY)
                for tooth in teeth
            ]
        )

        return patient

    def update_patient(self, patient_id, **fields):
        patient = self.patient_repo.get_by_id(patient_id)
        if not patient:
            raise ValueError('Patient not found')
        return self.patient_repo.update(patient_id=patient_id, **fields)

    def delete_patient(self, patient_id):
        patient = self.patient_repo.get_by_id(patient_id)
        if not patient:
            raise ValueError('Patient not found')
        self.patient_repo.delete(patient_id)

    def list_patients(self, *, search=None, doctor_user_id=None):
        return self.patient_repo.list_all(
            search=search,
            doctor_user_id=doctor_user_id,
        )

    def get_patient(self, patient_id):
        return self.patient_repo.get_by_id(patient_id)


class VisitService:
    def __init__(self):
        self.visit_repo = VisitRepository()
        self.odontogram_repo = OdontogramRepository()
        self.soap_repo = SoapNoteRepository()

    @transaction.atomic
    def create_visit(
        self,
        *,
        patient,
        doctor,
        start_at,
        end_at,
        reason,
        tooth_ids=None,
        status='planned',
    ):
        visit = self.visit_repo.create(
            patient=patient,
            doctor=doctor,
            start_at=start_at,
            end_at=end_at,
            reason=reason,
            status=status,
        )

        if tooth_ids:
            teeth = Tooth.objects.filter(pk__in=tooth_ids)
            VisitTooth.objects.bulk_create(
                [VisitTooth(visit=visit, tooth=tooth) for tooth in teeth]
            )

        odontogram = self.odontogram_repo.create_for_visit(visit)
        self._copy_previous_odontogram(visit, odontogram)

        self.soap_repo.create_for_visit(visit)

        return self.visit_repo.get_by_id(visit.id)

    def _copy_previous_odontogram(self, visit, odontogram):
        prev_visit = self.visit_repo.get_previous_visit(
            visit.patient_id,
            visit.id,
        )

        teeth = Tooth.objects.all()

        if prev_visit:
            prev_odontogram = self.odontogram_repo.get_by_visit(prev_visit.id)
            if prev_odontogram:
                prev_entries = {e.tooth_id: e.status for e in prev_odontogram.entries.all()}
                OdontogramEntry.objects.bulk_create(
                    [
                        OdontogramEntry(
                            odontogram=odontogram,
                            tooth=tooth,
                            status=prev_entries.get(tooth.id, ToothStatus.HEALTHY),
                        )
                        for tooth in teeth
                    ]
                )
                return

        OdontogramEntry.objects.bulk_create(
            [
                OdontogramEntry(
                    odontogram=odontogram,
                    tooth=tooth,
                    status=ToothStatus.HEALTHY,
                )
                for tooth in teeth
            ]
        )

    def update_visit(self, visit_id, **fields):
        visit = self.visit_repo.get_by_id(visit_id)
        if not visit:
            raise ValueError('Visit not found')

        tooth_ids = fields.pop('tooth_ids', None)
        if fields:
            visit = self.visit_repo.update(visit_id=visit_id, **fields)

        if tooth_ids is not None:
            VisitTooth.objects.filter(visit_id=visit_id).delete()
            teeth = Tooth.objects.filter(pk__in=tooth_ids)
            VisitTooth.objects.bulk_create(
                [VisitTooth(visit_id=visit_id, tooth=tooth) for tooth in teeth]
            )
            visit = self.visit_repo.get_by_id(visit_id)

        return visit

    def list_visits(self, patient_id):
        return self.visit_repo.list_by_patient(patient_id)

    def get_visit(self, visit_id):
        return self.visit_repo.get_by_id(visit_id)


class OdontogramService:
    def __init__(self):
        self.odontogram_repo = OdontogramRepository()

    def get_odontogram(self, visit_id):
        return self.odontogram_repo.get_by_visit(visit_id)

    def update_entry(self, visit_id, tooth_id, status):
        odontogram = self.odontogram_repo.get_by_visit(visit_id)
        if not odontogram:
            raise ValueError('Odontogram not found')
        return self.odontogram_repo.update_entry(
            odontogram.id,
            tooth_id,
            status,
        )


class SoapNoteService:
    def __init__(self):
        self.soap_repo = SoapNoteRepository()

    def get_soap(self, visit_id):
        return self.soap_repo.get_by_visit(visit_id)

    def update_soap(self, visit_id, **fields):
        soap = self.soap_repo.get_by_visit(visit_id)
        if not soap:
            raise ValueError('SOAP note not found')
        sanitized = {k: sanitize_html(v) for k, v in fields.items()}
        return self.soap_repo.update(visit_id, **sanitized)
