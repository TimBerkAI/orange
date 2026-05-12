"""
# Create Appointment model

1. New Tables
   - `planning_appointment`
     - `id` (bigint, primary key)
     - `visit` (OneToOne FK to patients.Visit) — linked clinical record
     - `phone` (varchar 30) — patient phone recorded at booking
     - `patient_name` (varchar 300) — patient name recorded at booking
     - `reason` (text) — visit reason
     - `created_by` (FK to auth_user, nullable) — admin who booked
     - `created_at`, `updated_at` (timestamps)
2. Ordering by visit start_at descending
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('patients', '0003_visit_start_at_end_at'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Appointment',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                ('phone', models.CharField(max_length=30)),
                ('patient_name', models.CharField(max_length=300)),
                ('reason', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'visit',
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='appointment',
                        to='patients.visit',
                    ),
                ),
                (
                    'created_by',
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='created_appointments',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'db_table': 'planning_appointment',
                'ordering': ['-visit__start_at'],
            },
        ),
    ]
