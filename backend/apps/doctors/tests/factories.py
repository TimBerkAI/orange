import factory

from apps.authorization.tests.factories import UserFactory
from apps.doctors.domain.weekdays import ALL_WEEKDAYS
from apps.doctors.infrastructure.models import Doctor, Specialization


class SpecializationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Specialization

    name = factory.Sequence(lambda n: f'Specialization {n}')
    description = ''


class DoctorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Doctor

    user = factory.SubFactory(UserFactory, doctor=True)
    notes = ''
    preferred_weekdays = factory.LazyFunction(lambda: list(ALL_WEEKDAYS))

    @factory.post_generation
    def specializations(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            self.specializations.set(extracted)
