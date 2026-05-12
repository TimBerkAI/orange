import pytest

from apps.authorization.application.services import AuthService
from apps.authorization.domain.roles import Role
from apps.authorization.infrastructure.models import User, UserProfile


@pytest.mark.django_db
class TestRegisterUserCommand:
    def setup_method(self):
        self.service = AuthService()

    def test_register_creates_user_and_profile(self):
        user = self.service.register_user(
            email='test@example.com',
            password='securepass1',
            role=Role.PATIENT,
            profile_data={
                'first_name': 'Ivan',
                'last_name': 'Ivanov',
                'patronymic': 'Ivanovich',
                'phone': '+79991234567',
            },
        )

        assert user.pk is not None
        assert user.email == 'test@example.com'
        assert user.role == Role.PATIENT
        assert user.check_password('securepass1')

        profile = UserProfile.objects.get(user=user)
        assert profile.first_name == 'Ivan'
        assert profile.last_name == 'Ivanov'
        assert profile.patronymic == 'Ivanovich'

    def test_register_admin_sets_is_staff(self):
        user = self.service.register_user(
            email='admin@example.com',
            password='securepass1',
            role=Role.ADMIN,
            profile_data={'first_name': 'Admin', 'last_name': 'Adminov'},
        )

        assert user.is_staff is True
        assert user.role == Role.ADMIN

    def test_register_duplicate_email_raises(self):
        self.service.register_user(
            email='dup@example.com',
            password='securepass1',
            role=Role.PATIENT,
            profile_data={'first_name': 'A', 'last_name': 'B'},
        )

        with pytest.raises(ValueError, match='already exists'):
            self.service.register_user(
                email='dup@example.com',
                password='securepass1',
                role=Role.DOCTOR,
                profile_data={'first_name': 'C', 'last_name': 'D'},
            )

    def test_register_invalid_role_raises(self):
        with pytest.raises(ValueError, match='Invalid role'):
            self.service.register_user(
                email='bad@example.com',
                password='securepass1',
                role='invalid_role',
                profile_data={'first_name': 'A', 'last_name': 'B'},
            )

    def test_register_transaction_rollback_on_profile_failure(self):
        from django.db.utils import IntegrityError

        initial_count = User.objects.count()

        with pytest.raises(IntegrityError):
            self.service.register_user(
                email='rollback@example.com',
                password='securepass1',
                role=Role.PATIENT,
                profile_data={'first_name': None, 'last_name': None},
            )

        assert User.objects.count() == initial_count


@pytest.mark.django_db
class TestUpdateProfile:
    def setup_method(self):
        self.service = AuthService()

    def test_update_profile_fields(self):
        user = self.service.register_user(
            email='update@example.com',
            password='securepass1',
            role=Role.PATIENT,
            profile_data={'first_name': 'Old', 'last_name': 'Name'},
        )

        profile = self.service.update_profile(user.id, first_name='New', phone='+71112223344')

        assert profile.first_name == 'New'
        assert profile.phone == '+71112223344'
        assert profile.last_name == 'Name'
