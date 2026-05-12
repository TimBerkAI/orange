import factory

from apps.authorization.tests.factories import UserFactory
from apps.patients.tests.factories import VisitFactory
from apps.planning.infrastructure.models import Appointment


class AppointmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Appointment

    visit = factory.SubFactory(VisitFactory)
    phone = factory.Faker('phone_number')
    patient_name = factory.Faker('name')
    reason = 'Консультация'
    created_by = factory.SubFactory(UserFactory, admin=True)
