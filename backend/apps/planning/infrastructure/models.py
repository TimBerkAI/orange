from django.conf import settings
from django.db import models


class Appointment(models.Model):
    visit = models.OneToOneField(
        'patients.Visit',
        on_delete=models.CASCADE,
        related_name='appointment',
    )
    phone = models.CharField(max_length=30)
    patient_name = models.CharField(max_length=300)
    reason = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_appointments',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'planning_appointment'
        ordering = ['-visit__start_at']

    def __str__(self):
        return f'{self.patient_name} — {self.phone}'
