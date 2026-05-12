from django.conf import settings
from django.db import models

from apps.patients.domain.enums import PatientStatus, ToothStatus, VisitStatus


class Tooth(models.Model):
    number = models.IntegerField(unique=True)
    name = models.CharField(max_length=200)

    class Meta:
        db_table = 'patients_tooth'
        ordering = ['number']

    def __str__(self):
        return f'{self.number} — {self.name}'

    @property
    def is_upper(self):
        return self.number < 30

    @property
    def is_right(self):
        tens = self.number // 10
        return tens in (1, 4)


class Patient(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='patient_profile',
    )
    allergies = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=PatientStatus.choices(),
        default=PatientStatus.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patients_patient'
        ordering = ['-created_at']

    def __str__(self):
        return self.full_name

    @property
    def full_name(self):
        profile = getattr(self.user, 'profile', None)
        if not profile:
            return self.user.email
        parts = [profile.last_name, profile.first_name, profile.patronymic]
        return ' '.join(p for p in parts if p) or self.user.email


class PatientTooth(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='teeth',
    )
    tooth = models.ForeignKey(Tooth, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20,
        choices=ToothStatus.choices(),
        default=ToothStatus.HEALTHY,
    )

    class Meta:
        db_table = 'patients_patient_tooth'
        unique_together = [('patient', 'tooth')]
        ordering = ['tooth__number']

    def __str__(self):
        return f'{self.patient} — {self.tooth.number}: {self.status}'


class Visit(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='visits',
    )
    doctor = models.ForeignKey(
        'doctors.Doctor',
        on_delete=models.CASCADE,
        related_name='visits',
    )
    scheduled_at = models.DateTimeField()
    reason = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=VisitStatus.choices(),
        default=VisitStatus.PLANNED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patients_visit'
        ordering = ['-scheduled_at']

    def __str__(self):
        return f'{self.patient} @ {self.scheduled_at:%Y-%m-%d %H:%M}'


class VisitTooth(models.Model):
    visit = models.ForeignKey(
        Visit,
        on_delete=models.CASCADE,
        related_name='visit_teeth',
    )
    tooth = models.ForeignKey(Tooth, on_delete=models.CASCADE)

    class Meta:
        db_table = 'patients_visit_tooth'
        unique_together = [('visit', 'tooth')]
        ordering = ['tooth__number']

    def __str__(self):
        return f'Visit {self.visit_id} — tooth {self.tooth.number}'


class Odontogram(models.Model):
    visit = models.OneToOneField(
        Visit,
        on_delete=models.CASCADE,
        related_name='odontogram',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patients_odontogram'

    def __str__(self):
        return f'Odontogram for visit {self.visit_id}'


class OdontogramEntry(models.Model):
    odontogram = models.ForeignKey(
        Odontogram,
        on_delete=models.CASCADE,
        related_name='entries',
    )
    tooth = models.ForeignKey(Tooth, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20,
        choices=ToothStatus.choices(),
        default=ToothStatus.HEALTHY,
    )

    class Meta:
        db_table = 'patients_odontogram_entry'
        unique_together = [('odontogram', 'tooth')]
        ordering = ['tooth__number']

    def __str__(self):
        return f'{self.tooth.number}: {self.status}'


class SoapNote(models.Model):
    visit = models.OneToOneField(
        Visit,
        on_delete=models.CASCADE,
        related_name='soap_note',
    )
    subjective = models.TextField(blank=True, default='')
    objective = models.TextField(blank=True, default='')
    assessment = models.TextField(blank=True, default='')
    plan = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patients_soap_note'

    def __str__(self):
        return f'SOAP note for visit {self.visit_id}'
