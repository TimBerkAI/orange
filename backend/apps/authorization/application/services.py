from django.db import transaction

from apps.authorization.domain.roles import Role
from apps.authorization.infrastructure.repositories import ProfileRepository, UserRepository


class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.profile_repo = ProfileRepository()

    @transaction.atomic
    def register_user(self, *, email: str, password: str, role: str, profile_data: dict):
        if self.user_repo.exists_by_email(email):
            raise ValueError("User with this email already exists")

        if role not in [r.value for r in Role]:
            raise ValueError(f"Invalid role: {role}")

        is_staff = role == Role.ADMIN
        user = self.user_repo.create(email=email, password=password, role=role, is_staff=is_staff)
        self.profile_repo.create(user=user, **profile_data)
        return user

    def get_user_with_profile(self, user_id):
        user = self.user_repo.get_by_id(user_id)
        if user is None:
            return None
        return user

    def update_profile(self, user_id, **fields):
        return self.profile_repo.update(user_id=user_id, **fields)
