import factory
from django.utils import timezone

from apps.authorization.tests.factories import UserFactory
from apps.doctors.tests.factories import DoctorFactory
from apps.patients.domain.enums import PatientStatus, ToothStatus, VisitStatus
from apps.patients.infrastructure.models import (
    Odontogram,
    OdontogramEntry,
    Patient,
    PatientTooth,
    SoapNote,
    Tooth,
    Visit,
    VisitTooth,
)


class ToothFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tooth
        django_get_or_create = ('number',)

    number = factory.Sequence(lambda n: 11 + n)
    name = factory.LazyAttribute(lambda o: f'Tooth {o.number}')


class PatientFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Patient

    user = factory.SubFactory(UserFactory, patient=True)
    allergies = ''
    status = PatientStatus.ACTIVE


class PatientToothFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PatientTooth

    patient = factory.SubFactory(PatientFactory)
    tooth = factory.SubFactory(ToothFactory)
    status = ToothStatus.HEALTHY


class VisitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Visit

    patient = factory.SubFactory(PatientFactory)
    doctor = factory.SubFactory(DoctorFactory)
    start_at = factory.LazyFunction(timezone.now)
    end_at = factory.LazyFunction(lambda: timezone.now() + timezone.timedelta(minutes=30))
    reason = 'Консультация'
    status = VisitStatus.PLANNED


class VisitToothFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = VisitTooth

    visit = factory.SubFactory(VisitFactory)
    tooth = factory.SubFactory(ToothFactory)


class OdontogramFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Odontogram

    visit = factory.SubFactory(VisitFactory)


class OdontogramEntryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OdontogramEntry

    odontogram = factory.SubFactory(OdontogramFactory)
    tooth = factory.SubFactory(ToothFactory)
    status = ToothStatus.HEALTHY


class SoapNoteFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SoapNote

    visit = factory.SubFactory(VisitFactory)
    subjective = ''
    objective = ''
    assessment = ''
    plan = ''
