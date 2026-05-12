import factory

from apps.authorization.domain.roles import Role
from apps.authorization.infrastructure.models import User, UserProfile


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    role = Role.PATIENT
    is_active = True
    is_staff = False

    class Params:
        admin = factory.Trait(role=Role.ADMIN, is_staff=True)
        doctor = factory.Trait(role=Role.DOCTOR)
        patient = factory.Trait(role=Role.PATIENT)

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        pwd = extracted or "testpass123"
        self.set_password(pwd)
        if create:
            self.save()

    @factory.post_generation
    def with_profile(self, create, extracted, **kwargs):
        if not create or not extracted:
            return
        UserProfileFactory(user=self, **kwargs)


class UserProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UserProfile

    user = factory.SubFactory(UserFactory)
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    patronymic = ""
    phone = factory.Faker("phone_number")
    date_of_birth = factory.Faker("date_of_birth", minimum_age=18, maximum_age=80)
