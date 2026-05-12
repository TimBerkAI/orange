import pytest
from django.urls import reverse
from rest_framework import status

from apps.authorization.tests.factories import UserFactory, UserProfileFactory
from apps.doctors.domain.weekdays import ALL_WEEKDAYS
from apps.doctors.tests.factories import SpecializationFactory


@pytest.mark.django_db
class TestSpecializationList:
    url = reverse('doctors:specialization-list')

    def test_admin_can_list(self, admin_client, specialization_list):
        response = admin_client.get(self.url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

    def test_doctor_can_list(self, doctor_client, specialization_list):
        response = doctor_client.get(self.url)

        assert response.status_code == status.HTTP_200_OK

    def test_patient_forbidden(self, patient_client):
        response = patient_client.get(self.url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated(self, api_client):
        response = api_client.get(self.url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestDoctorList:
    url = reverse('doctors:doctor-list-create')

    def test_admin_list(self, admin_client, doctor):
        response = admin_client.get(self.url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert 'full_name' in response.data[0]

    def test_doctor_list(self, doctor_client, doctor):
        response = doctor_client.get(self.url)

        assert response.status_code == status.HTTP_200_OK

    def test_search_by_name(self, admin_client, doctor):
        profile = doctor.user.profile
        response = admin_client.get(self.url, {'search': profile.last_name[:3]})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_patient_forbidden(self, patient_client):
        response = patient_client.get(self.url)

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestDoctorCreate:
    url = reverse('doctors:doctor-list-create')

    def test_admin_creates_doctor(self, admin_client):
        user = UserFactory(doctor=True)
        UserProfileFactory(user=user)
        spec = SpecializationFactory()

        response = admin_client.post(
            self.url,
            {
                'user_id': user.id,
                'specialization_ids': [spec.id],
                'notes': 'Good doctor',
                'preferred_weekdays': [0, 1, 2, 3, 4],
            },
            format='json',
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['notes'] == 'Good doctor'
        assert len(response.data['specializations']) == 1
        assert response.data['preferred_weekdays'] == [0, 1, 2, 3, 4]

    def test_admin_creates_doctor_defaults(self, admin_client):
        user = UserFactory(doctor=True)
        UserProfileFactory(user=user)

        response = admin_client.post(
            self.url,
            {'user_id': user.id},
            format='json',
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['preferred_weekdays'] == list(ALL_WEEKDAYS)

    def test_admin_creates_doctor_for_admin_user(self, admin_client):
        user = UserFactory(admin=True)
        UserProfileFactory(user=user)

        response = admin_client.post(
            self.url,
            {'user_id': user.id},
            format='json',
        )

        assert response.status_code == status.HTTP_201_CREATED

    def test_duplicate_user_rejected(self, admin_client, doctor):
        response = admin_client.post(
            self.url,
            {'user_id': doctor.user.id},
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_patient_user_rejected(self, admin_client):
        user = UserFactory(patient=True)

        response = admin_client.post(
            self.url,
            {'user_id': user.id},
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_doctor_cannot_create(self, doctor_client):
        user = UserFactory(doctor=True)

        response = doctor_client.post(
            self.url,
            {'user_id': user.id},
            format='json',
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_nonexistent_user(self, admin_client):
        response = admin_client.post(
            self.url,
            {'user_id': 99999},
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestDoctorDetail:
    def _url(self, doctor_id):
        return reverse('doctors:doctor-detail', kwargs={'doctor_id': doctor_id})

    def test_admin_get(self, admin_client, doctor):
        response = admin_client.get(self._url(doctor.id))

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == doctor.id
        assert 'notes' in response.data

    def test_admin_patch(self, admin_client, doctor):
        spec = SpecializationFactory()

        response = admin_client.patch(
            self._url(doctor.id),
            {'notes': 'Updated', 'specialization_ids': [spec.id]},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['notes'] == 'Updated'
        assert len(response.data['specializations']) == 1

    def test_admin_change_user(self, admin_client, doctor):
        new_user = UserFactory(doctor=True)
        UserProfileFactory(user=new_user)

        response = admin_client.patch(
            self._url(doctor.id),
            {'user_id': new_user.id},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK

    def test_admin_delete(self, admin_client, doctor):
        response = admin_client.delete(self._url(doctor.id))

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_doctor_forbidden(self, doctor_client, doctor):
        response = doctor_client.get(self._url(doctor.id))

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_not_found(self, admin_client):
        response = admin_client.get(self._url(99999))

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestDoctorMe:
    url = reverse('doctors:doctor-me')

    def test_doctor_get_own(self, doctor_client, doctor):
        response = doctor_client.get(self.url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == doctor.id

    def test_doctor_patch_own(self, doctor_client, doctor):
        spec = SpecializationFactory()

        response = doctor_client.patch(
            self.url,
            {
                'notes': 'My note',
                'specialization_ids': [spec.id],
                'preferred_weekdays': [0, 1, 2],
            },
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data['notes'] == 'My note'
        assert response.data['preferred_weekdays'] == [0, 1, 2]

    def test_admin_with_doctor_profile(self, admin_doctor_client, admin_doctor):
        doctor_obj, _ = admin_doctor

        response = admin_doctor_client.get(self.url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == doctor_obj.id

    def test_doctor_without_profile(self, doctor_client):
        response = doctor_client.get(self.url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_patient_forbidden(self, patient_client):
        response = patient_client.get(self.url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated(self, api_client):
        response = api_client.get(self.url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_invalid_weekday(self, doctor_client, doctor):
        response = doctor_client.patch(
            self.url,
            {'preferred_weekdays': [0, 1, 99]},
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
