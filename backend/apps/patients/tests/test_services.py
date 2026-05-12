import pytest

from apps.authorization.tests.factories import UserFactory, UserProfileFactory
from apps.patients.application.services import (
    OdontogramService,
    PatientService,
    SoapNoteService,
    VisitService,
)
from apps.patients.domain.enums import ToothStatus
from apps.patients.domain.sanitize import sanitize_html
from apps.patients.infrastructure.models import PatientTooth


@pytest.mark.django_db
class TestPatientService:
    def test_create_patient_generates_teeth(self, teeth):
        user = UserFactory(patient=True)
        UserProfileFactory(user=user)
        service = PatientService()

        patient = service.create_patient(user=user)

        assert PatientTooth.objects.filter(patient=patient).count() == 32

    def test_create_patient_all_healthy(self, patient):
        statuses = set(
            PatientTooth.objects.filter(patient=patient).values_list(
                'status',
                flat=True,
            )
        )
        assert statuses == {ToothStatus.HEALTHY}

    def test_duplicate_patient_rejected(self, patient):
        service = PatientService()
        with pytest.raises(ValueError, match='already has'):
            service.create_patient(user=patient.user)

    def test_wrong_role_rejected(self, teeth):
        user = UserFactory(doctor=True)
        service = PatientService()
        with pytest.raises(ValueError, match='patient role'):
            service.create_patient(user=user)


@pytest.mark.django_db
class TestVisitService:
    def test_create_visit_creates_odontogram(self, visit):
        assert hasattr(visit, 'odontogram')
        assert visit.odontogram.entries.count() == 32

    def test_create_visit_creates_soap(self, visit):
        assert hasattr(visit, 'soap_note')

    def test_create_visit_with_teeth(self, visit):
        assert visit.visit_teeth.count() == 2

    def test_odontogram_copies_previous_state(
        self,
        patient,
        doctor_with_user,
        teeth,
    ):
        doctor, _ = doctor_with_user
        service = VisitService()
        odonto_svc = OdontogramService()

        first_visit = service.create_visit(
            patient=patient,
            doctor=doctor,
            scheduled_at='2026-06-02T10:00:00Z',
            reason='First',
        )
        odonto_svc.update_entry(
            first_visit.id,
            teeth[0].id,
            ToothStatus.CARIES,
        )

        second_visit = service.create_visit(
            patient=patient,
            doctor=doctor,
            scheduled_at='2026-06-03T10:00:00Z',
            reason='Second',
        )

        second_odontogram = odonto_svc.get_odontogram(second_visit.id)
        entry_map = {e.tooth_id: e.status for e in second_odontogram.entries.all()}
        assert entry_map[teeth[0].id] == ToothStatus.CARIES

    def test_update_visit(self, visit):
        service = VisitService()
        updated = service.update_visit(visit.id, reason='Updated reason')
        assert updated.reason == 'Updated reason'


@pytest.mark.django_db
class TestOdontogramService:
    def test_update_entry_syncs_patient_tooth(self, visit, teeth):
        service = OdontogramService()
        service.update_entry(visit.id, teeth[0].id, ToothStatus.CROWN)

        pt = PatientTooth.objects.get(
            patient=visit.patient,
            tooth=teeth[0],
        )
        assert pt.status == ToothStatus.CROWN


@pytest.mark.django_db
class TestSoapNoteService:
    def test_update_soap_sanitizes(self, visit):
        service = SoapNoteService()
        service.update_soap(
            visit.id,
            subjective='<p>Hello</p><script>alert("xss")</script>',
        )
        soap = service.get_soap(visit.id)
        assert '<script>' not in soap.subjective
        assert '<p>' in soap.subjective


class TestSanitizeHtml:
    def test_strips_script_tags(self):
        assert sanitize_html('<script>alert(1)</script>') == ''

    def test_keeps_safe_tags(self):
        assert sanitize_html('<b>bold</b>') == '<b>bold</b>'

    def test_strips_attributes(self):
        result = sanitize_html('<p style="color:red">text</p>')
        assert 'style' not in result
        assert '<p>text</p>' == result

    def test_strips_event_handlers(self):
        result = sanitize_html('<div onmouseover="alert(1)">x</div>')
        assert 'onmouseover' not in result

    def test_empty_string(self):
        assert sanitize_html('') == ''
