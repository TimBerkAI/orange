from apps.authorization.domain.repositories import (
    ProfileRepositoryInterface,
    UserRepositoryInterface,
)
from apps.authorization.infrastructure.models import User, UserProfile


class UserRepository(UserRepositoryInterface):
    def get_by_id(self, user_id):
        return User.objects.filter(pk=user_id).first()

    def get_by_email(self, email: str):
        return User.objects.filter(email=email).first()

    def create(self, *, email: str, password: str, role: str, is_staff: bool = False):
        return User.objects.create_user(
            email=email, password=password, role=role, is_staff=is_staff
        )

    def exists_by_email(self, email: str) -> bool:
        return User.objects.filter(email=email).exists()


class ProfileRepository(ProfileRepositoryInterface):
    def get_by_user_id(self, user_id):
        return UserProfile.objects.filter(user_id=user_id).first()

    def create(self, *, user, first_name: str, last_name: str, **kwargs):
        return UserProfile.objects.create(
            user=user, first_name=first_name, last_name=last_name, **kwargs
        )

    def update(self, *, user_id, **fields):
        UserProfile.objects.filter(user_id=user_id).update(**fields)
        return UserProfile.objects.filter(user_id=user_id).first()
