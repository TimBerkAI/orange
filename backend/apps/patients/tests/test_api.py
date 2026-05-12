import pytest
from django.urls import reverse
from rest_framework import status

from apps.authorization.tests.factories import UserFactory, UserProfileFactory
from apps.doctors.tests.factories import DoctorFactory
from apps.patients.domain.enums import ToothStatus
from conftest import make_authenticated_client


@pytest.mark.django_db
class TestToothList:
    url = reverse('patients:tooth-list')

    def test_admin_can_list(self, admin_client, teeth):
        response = admin_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 32

    def test_patient_forbidden(self, patient_client, teeth):
        response = patient_client.get(self.url)
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestPatientList:
    url = reverse('patients:patient-list-create')

    def test_admin_can_list(self, admin_client, patient):
        response = admin_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert 'full_name' in response.data[0]

    def test_doctor_sees_only_own_patients(
        self,
        doctor_with_user,
        patient,
        teeth,
    ):
        doctor, doctor_user = doctor_with_user
        client = make_authenticated_client(doctor_user)

        response = client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_doctor_sees_patient_after_visit(self, visit, doctor_with_user):
        _, doctor_user = doctor_with_user
        client = make_authenticated_client(doctor_user)

        response = client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_search(self, admin_client, patient):
        profile = patient.user.profile
        response = admin_client.get(self.url, {'search': profile.last_name[:3]})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_patient_forbidden(self, patient_client):
        response = patient_client.get(self.url)
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestPatientCreate:
    url = reverse('patients:patient-list-create')

    def test_admin_creates(self, admin_client, teeth):
        user = UserFactory(patient=True)
        UserProfileFactory(user=user)

        response = admin_client.post(
            self.url,
            {'user_id': user.id, 'allergies': 'Пенициллин'},
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['allergies'] == 'Пенициллин'

    def test_doctor_cannot_create(self, doctor_client, teeth):
        user = UserFactory(patient=True)

        response = doctor_client.post(
            self.url,
            {'user_id': user.id},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_duplicate_rejected(self, admin_client, patient):
        response = admin_client.post(
            self.url,
            {'user_id': patient.user.id},
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPatientDetail:
    def _url(self, pid):
        return reverse('patients:patient-detail', kwargs={'patient_id': pid})

    def test_admin_get(self, admin_client, patient):
        response = admin_client.get(self._url(patient.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == patient.id

    def test_admin_patch(self, admin_client, patient):
        response = admin_client.patch(
            self._url(patient.id),
            {'allergies': 'Лидокаин'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['allergies'] == 'Лидокаин'

    def test_admin_delete(self, admin_client, patient):
        response = admin_client.delete(self._url(patient.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_doctor_can_read_own_patient(self, visit, doctor_with_user):
        _, doctor_user = doctor_with_user
        client = make_authenticated_client(doctor_user)

        response = client.get(
            self._url(visit.patient_id),
        )
        assert response.status_code == status.HTTP_200_OK

    def test_doctor_cannot_read_other_patient(self, patient):
        other_doctor_user = UserFactory(doctor=True)
        UserProfileFactory(user=other_doctor_user)
        client = make_authenticated_client(other_doctor_user)

        response = client.get(self._url(patient.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_not_found(self, admin_client):
        response = admin_client.get(self._url(99999))
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestVisitListCreate:
    def _url(self, pid):
        return reverse(
            'patients:visit-list-create',
            kwargs={'patient_id': pid},
        )

    def test_admin_creates_visit(
        self,
        admin_client,
        patient,
        doctor_with_user,
        teeth,
    ):
        doctor, _ = doctor_with_user
        response = admin_client.post(
            self._url(patient.id),
            {
                'doctor_id': doctor.id,
                'scheduled_at': '2026-07-01T10:00:00Z',
                'reason': 'Осмотр',
                'tooth_ids': [teeth[0].id],
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['has_odontogram'] is True
        assert response.data['has_soap'] is True

    def test_doctor_creates_own_visit(
        self,
        patient,
        doctor_with_user,
        teeth,
    ):
        doctor, doctor_user = doctor_with_user
        client = make_authenticated_client(doctor_user)

        response = client.post(
            self._url(patient.id),
            {
                'doctor_id': doctor.id,
                'scheduled_at': '2026-07-01T10:00:00Z',
                'reason': 'Осмотр',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_doctor_cannot_create_for_other(
        self,
        patient,
        doctor_with_user,
        teeth,
    ):
        other_doctor_user = UserFactory(doctor=True)
        UserProfileFactory(user=other_doctor_user)
        other_doctor = DoctorFactory(user=other_doctor_user)
        _, first_doctor_user = doctor_with_user
        client = make_authenticated_client(first_doctor_user)

        response = client.post(
            self._url(patient.id),
            {
                'doctor_id': other_doctor.id,
                'scheduled_at': '2026-07-01T10:00:00Z',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_visits(self, admin_client, visit):
        response = admin_client.get(self._url(visit.patient_id))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1


@pytest.mark.django_db
class TestVisitDetail:
    def _url(self, vid):
        return reverse('patients:visit-detail', kwargs={'visit_id': vid})

    def test_admin_get(self, admin_client, visit):
        response = admin_client.get(self._url(visit.id))
        assert response.status_code == status.HTTP_200_OK

    def test_admin_patch(self, admin_client, visit):
        response = admin_client.patch(
            self._url(visit.id),
            {'reason': 'Лечение'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['reason'] == 'Лечение'

    def test_doctor_can_view_own(self, visit, doctor_with_user):
        _, doctor_user = doctor_with_user
        client = make_authenticated_client(doctor_user)

        response = client.get(self._url(visit.id))
        assert response.status_code == status.HTTP_200_OK

    def test_doctor_cannot_view_others(self, visit):
        other_user = UserFactory(doctor=True)
        UserProfileFactory(user=other_user)
        client = make_authenticated_client(other_user)

        response = client.get(self._url(visit.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestOdontogram:
    def _url(self, vid):
        return reverse('patients:odontogram', kwargs={'visit_id': vid})

    def test_get_odontogram(self, admin_client, visit):
        response = admin_client.get(self._url(visit.id))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['entries']) == 32

    def test_update_entry(self, admin_client, visit, teeth):
        response = admin_client.patch(
            self._url(visit.id),
            {'tooth_id': teeth[0].id, 'status': ToothStatus.CARIES},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestSoapNote:
    def _url(self, vid):
        return reverse('patients:soap-note', kwargs={'visit_id': vid})

    def test_get_soap(self, admin_client, visit):
        response = admin_client.get(self._url(visit.id))
        assert response.status_code == status.HTTP_200_OK
        assert 'subjective' in response.data

    def test_update_soap(self, admin_client, visit):
        response = admin_client.patch(
            self._url(visit.id),
            {'subjective': '<p>Patient complains</p>'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert '<p>' in response.data['subjective']

    def test_soap_strips_scripts(self, admin_client, visit):
        response = admin_client.patch(
            self._url(visit.id),
            {'objective': '<script>alert(1)</script><b>ok</b>'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert '<script>' not in response.data['objective']
        assert '<b>ok</b>' in response.data['objective']
