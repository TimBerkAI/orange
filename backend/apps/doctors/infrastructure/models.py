from django.conf import settings
from django.db import models

from apps.doctors.domain.weekdays import ALL_WEEKDAYS


class Specialization(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'doctors_specialization'
        ordering = ['name']

    def __str__(self):
        return self.name


class Doctor(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='doctor_profile',
    )
    specializations = models.ManyToManyField(
        Specialization,
        blank=True,
        related_name='doctors',
    )
    notes = models.TextField(blank=True, default='')
    preferred_weekdays = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctors_doctor'
        ordering = ['-created_at']

    def __str__(self):
        return self.full_name

    def save(self, *args, **kwargs):
        if not self.preferred_weekdays:
            self.preferred_weekdays = ALL_WEEKDAYS
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        profile = getattr(self.user, 'profile', None)
        if not profile:
            return self.user.email
        parts = [profile.last_name, profile.first_name, profile.patronymic]
        return ' '.join(p for p in parts if p) or self.user.email
