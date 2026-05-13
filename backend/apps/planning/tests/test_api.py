import pytest
from django.urls import reverse
from rest_framework import status

from apps.authorization.tests.factories import UserFactory, UserProfileFactory
from apps.doctors.tests.factories import DoctorFactory
from conftest import make_authenticated_client


@pytest.mark.django_db
class TestAppointmentListCreate:
    url = reverse('planning:appointment-list-create')

    def test_admin_creates(
        self,
        admin_client,
        teeth,
        doctor_with_user,
    ):
        doctor, _ = doctor_with_user
        response = admin_client.post(
            self.url,
            {
                'phone': '+79001111111',
                'patient_name': 'Тестов Тест',
                'reason': 'Осмотр',
                'doctor_id': doctor.id,
                'start_at': '2026-08-01T10:00:00Z',
                'end_at': '2026-08-01T10:30:00Z',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['phone'] == '+79001111111'
        assert response.data['visit_id'] is not None
        assert response.data['doctor']['id'] == doctor.id

    def test_doctor_cannot_create(
        self,
        doctor_with_user,
        teeth,
    ):
        doctor, doctor_user = doctor_with_user
        client = make_authenticated_client(doctor_user)
        response = client.post(
            self.url,
            {
                'phone': '+79002222222',
                'patient_name': 'Тест',
                'doctor_id': doctor.id,
                'start_at': '2026-08-01T10:00:00Z',
                'end_at': '2026-08-01T10:30:00Z',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_lists_all(self, admin_client, appointment):
        response = admin_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_doctor_sees_only_own(self, appointment, doctor_with_user):
        _, doctor_user = doctor_with_user
        client = make_authenticated_client(doctor_user)

        response = client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

        other_user = UserFactory(doctor=True)
        UserProfileFactory(user=other_user)
        DoctorFactory(user=other_user)
        other_client = make_authenticated_client(other_user)

        response = other_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_filter_by_date(self, admin_client, appointment):
        response = admin_client.get(
            self.url,
            {'date_from': '2026-07-01T00:00:00Z', 'date_to': '2026-07-02T00:00:00Z'},
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

        response = admin_client.get(
            self.url,
            {'date_from': '2026-08-01T00:00:00Z', 'date_to': '2026-08-02T00:00:00Z'},
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_filter_by_doctor_id(self, admin_client, appointment, doctor_with_user):
        doctor, _ = doctor_with_user
        response = admin_client.get(self.url, {'doctor_id': doctor.id})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

        response = admin_client.get(self.url, {'doctor_id': 99999})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_search(self, admin_client, appointment):
        response = admin_client.get(self.url, {'search': 'Иванов'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

        response = admin_client.get(self.url, {'search': '+79001234567'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_overlap_returns_400(
        self,
        admin_client,
        appointment,
        teeth,
        doctor_with_user,
    ):
        doctor, _ = doctor_with_user
        response = admin_client.post(
            self.url,
            {
                'phone': '+79009999999',
                'patient_name': 'Перекрытие Тест',
                'doctor_id': doctor.id,
                'start_at': '2026-07-01T10:10:00Z',
                'end_at': '2026-07-01T10:40:00Z',
            },
            format='json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'врача' in response.data['detail']

    def test_patient_forbidden(self, patient_client, teeth):
        response = patient_client.get(self.url)
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestAppointmentDetail:
    def _url(self, aid):
        return reverse(
            'planning:appointment-detail',
            kwargs={'appointment_id': aid},
        )

    def test_admin_get(self, admin_client, appointment):
        response = admin_client.get(self._url(appointment.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == appointment.id

    def test_admin_patch(self, admin_client, appointment):
        response = admin_client.patch(
            self._url(appointment.id),
            {'reason': 'Обновлённая причина'},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data['reason'] == 'Обновлённая причина'

    def test_admin_delete(self, admin_client, appointment):
        response = admin_client.delete(self._url(appointment.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_doctor_can_view_own(self, appointment, doctor_with_user):
        _, doctor_user = doctor_with_user
        client = make_authenticated_client(doctor_user)

        response = client.get(self._url(appointment.id))
        assert response.status_code == status.HTTP_200_OK

    def test_doctor_cannot_view_others(self, appointment):
        other_user = UserFactory(doctor=True)
        UserProfileFactory(user=other_user)
        DoctorFactory(user=other_user)
        client = make_authenticated_client(other_user)

        response = client.get(self._url(appointment.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_doctor_cannot_update(self, appointment, doctor_with_user):
        _, doctor_user = doctor_with_user
        client = make_authenticated_client(doctor_user)

        response = client.patch(
            self._url(appointment.id),
            {'reason': 'Нельзя'},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_doctor_cannot_delete(self, appointment, doctor_with_user):
        _, doctor_user = doctor_with_user
        client = make_authenticated_client(doctor_user)

        response = client.delete(self._url(appointment.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_not_found(self, admin_client):
        response = admin_client.get(self._url(99999))
        assert response.status_code == status.HTTP_404_NOT_FOUND
