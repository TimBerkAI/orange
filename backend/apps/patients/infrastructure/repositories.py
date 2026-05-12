from django.db.models import Q

from apps.patients.domain.repositories import (
    OdontogramRepositoryInterface,
    PatientRepositoryInterface,
    SoapNoteRepositoryInterface,
    ToothRepositoryInterface,
    VisitRepositoryInterface,
)
from apps.patients.infrastructure.models import (
    Odontogram,
    OdontogramEntry,
    Patient,
    PatientTooth,
    SoapNote,
    Tooth,
    Visit,
)


class ToothRepository(ToothRepositoryInterface):
    def get_all(self):
        return Tooth.objects.all()

    def get_by_ids(self, ids):
        return Tooth.objects.filter(pk__in=ids)


class PatientRepository(PatientRepositoryInterface):
    def _base_qs(self):
        return Patient.objects.select_related('user__profile')

    def get_by_id(self, patient_id):
        return self._base_qs().filter(pk=patient_id).first()

    def get_by_user_id(self, user_id):
        return self._base_qs().filter(user_id=user_id).first()

    def list_all(self, *, search=None, doctor_user_id=None):
        qs = self._base_qs()
        if doctor_user_id is not None:
            qs = qs.filter(visits__doctor__user_id=doctor_user_id).distinct()
        if search:
            qs = qs.filter(
                Q(user__email__icontains=search)
                | Q(user__profile__first_name__icontains=search)
                | Q(user__profile__last_name__icontains=search)
                | Q(user__profile__patronymic__icontains=search)
                | Q(user__profile__phone__icontains=search)
            )
        return qs

    def create(self, *, user, allergies='', status='active'):
        return Patient.objects.create(
            user=user,
            allergies=allergies,
            status=status,
        )

    def update(self, *, patient_id, **fields):
        Patient.objects.filter(pk=patient_id).update(**fields)
        return self.get_by_id(patient_id)

    def delete(self, patient_id):
        Patient.objects.filter(pk=patient_id).delete()

    def exists_by_user_id(self, user_id) -> bool:
        return Patient.objects.filter(user_id=user_id).exists()


class VisitRepository(VisitRepositoryInterface):
    def _base_qs(self):
        return Visit.objects.select_related(
            'patient__user__profile',
            'doctor__user__profile',
        ).prefetch_related('visit_teeth__tooth')

    def get_by_id(self, visit_id):
        return self._base_qs().filter(pk=visit_id).first()

    def list_by_patient(self, patient_id):
        return self._base_qs().filter(patient_id=patient_id)

    def create(self, *, patient, doctor, start_at, end_at, reason, status='planned'):
        return Visit.objects.create(
            patient=patient,
            doctor=doctor,
            start_at=start_at,
            end_at=end_at,
            reason=reason,
            status=status,
        )

    def update(self, *, visit_id, **fields):
        Visit.objects.filter(pk=visit_id).update(**fields)
        return self.get_by_id(visit_id)

    def get_previous_visit(self, patient_id, before_visit_id):
        current = Visit.objects.filter(pk=before_visit_id).values('start_at').first()
        if not current:
            return None
        return (
            Visit.objects.filter(
                patient_id=patient_id,
                start_at__lt=current['start_at'],
            )
            .order_by('-start_at')
            .first()
        )


class OdontogramRepository(OdontogramRepositoryInterface):
    def get_by_visit(self, visit_id):
        return (
            Odontogram.objects.prefetch_related('entries__tooth').filter(visit_id=visit_id).first()
        )

    def create_for_visit(self, visit):
        odontogram = Odontogram.objects.create(visit=visit)
        return odontogram

    def update_entry(self, odontogram_id, tooth_id, status):
        entry, _ = OdontogramEntry.objects.get_or_create(
            odontogram_id=odontogram_id,
            tooth_id=tooth_id,
            defaults={'status': status},
        )
        if entry.status != status:
            entry.status = status
            entry.save(update_fields=['status'])

        PatientTooth.objects.filter(
            patient=Odontogram.objects.get(pk=odontogram_id).visit.patient,
            tooth_id=tooth_id,
        ).update(status=status)

        return entry


class SoapNoteRepository(SoapNoteRepositoryInterface):
    def get_by_visit(self, visit_id):
        return SoapNote.objects.filter(visit_id=visit_id).first()

    def create_for_visit(self, visit):
        return SoapNote.objects.create(visit=visit)

    def update(self, visit_id, **fields):
        SoapNote.objects.filter(visit_id=visit_id).update(**fields)
        return self.get_by_visit(visit_id)
