"""
Data migration: seed initial data

Creates:
- 8 specializations (Терапевт, Хирург, Ортодонт, Пародонтолог, Эндодонтист, Ортопед, Имплантолог, Детский стоматолог)
- 1 admin user (admin@clinic.local / admin1234)
- 2 doctor users with doctor profiles
- 3 patient users with patient profiles and 3 visits each (mix of past/future, various statuses)

All data is skipped if the email already exists so the migration is safe to re-run.
"""

from django.db import migrations
import datetime


def seed_data(apps, schema_editor):
    User = apps.get_model('authorization', 'User')
    UserProfile = apps.get_model('authorization', 'UserProfile')
    Specialization = apps.get_model('doctors', 'Specialization')
    Doctor = apps.get_model('doctors', 'Doctor')
    Patient = apps.get_model('patients', 'Patient')
    Visit = apps.get_model('patients', 'Visit')
    Odontogram = apps.get_model('patients', 'Odontogram')
    SoapNote = apps.get_model('patients', 'SoapNote')

    # ── specializations ──────────────────────────────────────────────────────
    spec_names = [
        'Терапевт',
        'Хирург',
        'Ортодонт',
        'Пародонтолог',
        'Эндодонтист',
        'Ортопед',
        'Имплантолог',
        'Детский стоматолог',
    ]
    specs = {}
    for name in spec_names:
        s, _ = Specialization.objects.get_or_create(name=name, defaults={'description': ''})
        specs[name] = s

    # ── admin user ────────────────────────────────────────────────────────────
    if not User.objects.filter(email='admin@clinic.local').exists():
        admin = User.objects.create_superuser(
            email='admin@clinic.local',
            password='admin1234',
        )
        admin.role = 'admin'
        admin.is_staff = True
        admin.save()
        UserProfile.objects.create(
            user=admin,
            first_name='Администратор',
            last_name='Системы',
            patronymic='',
            phone='+7 (000) 000-00-00',
        )

    # ── doctor 1 ──────────────────────────────────────────────────────────────
    doctor1_user = None
    if not User.objects.filter(email='doctor.ivanov@clinic.local').exists():
        doctor1_user = User(email='doctor.ivanov@clinic.local', role='doctor', is_staff=False)
        doctor1_user.set_password('doctor1234')
        doctor1_user.save()
        UserProfile.objects.create(
            user=doctor1_user,
            first_name='Иван',
            last_name='Иванов',
            patronymic='Иванович',
            phone='+7 (900) 111-11-11',
        )
        d1 = Doctor.objects.create(
            user=doctor1_user,
            preferred_weekdays=[0, 1, 2, 3, 4],
        )
        d1.specializations.set([specs['Терапевт'], specs['Эндодонтист']])
    else:
        doctor1_user = User.objects.get(email='doctor.ivanov@clinic.local')

    try:
        doctor1 = Doctor.objects.get(user=doctor1_user)
    except Doctor.DoesNotExist:
        doctor1 = None

    # ── doctor 2 ──────────────────────────────────────────────────────────────
    doctor2_user = None
    if not User.objects.filter(email='doctor.petrova@clinic.local').exists():
        doctor2_user = User(email='doctor.petrova@clinic.local', role='doctor', is_staff=False)
        doctor2_user.set_password('doctor1234')
        doctor2_user.save()
        UserProfile.objects.create(
            user=doctor2_user,
            first_name='Мария',
            last_name='Петрова',
            patronymic='Сергеевна',
            phone='+7 (900) 222-22-22',
        )
        d2 = Doctor.objects.create(
            user=doctor2_user,
            preferred_weekdays=[1, 2, 3, 4, 5],
        )
        d2.specializations.set([specs['Хирург'], specs['Имплантолог']])
    else:
        doctor2_user = User.objects.get(email='doctor.petrova@clinic.local')

    try:
        doctor2 = Doctor.objects.get(user=doctor2_user)
    except Doctor.DoesNotExist:
        doctor2 = None

    if not doctor1 or not doctor2:
        return

    # ── helper: create patient ────────────────────────────────────────────────
    def make_patient(email, password, first, last, patronymic, phone, dob, allergies=''):
        if User.objects.filter(email=email).exists():
            u = User.objects.get(email=email)
            try:
                return Patient.objects.get(user=u)
            except Patient.DoesNotExist:
                return None
        u = User(email=email, role='patient', is_staff=False)
        u.set_password(password)
        u.save()
        UserProfile.objects.create(
            user=u,
            first_name=first,
            last_name=last,
            patronymic=patronymic,
            phone=phone,
            date_of_birth=dob,
        )
        p = Patient.objects.create(user=u, allergies=allergies, status='active')
        return p

    now = datetime.datetime.now(datetime.timezone.utc)

    def dt(days_offset, hour=10, minute=0):
        base = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        return base + datetime.timedelta(days=days_offset)

    def make_visit(patient, doctor, start, end, reason, status):
        v = Visit.objects.create(
            patient=patient,
            doctor=doctor,
            start_at=start,
            end_at=end,
            reason=reason,
            status=status,
        )
        Odontogram.objects.create(visit=v)
        SoapNote.objects.create(visit=v, subjective='', objective='', assessment='', plan='')
        return v

    # ── patient 1 ─────────────────────────────────────────────────────────────
    p1 = make_patient(
        'patient.sidorov@example.com', 'patient1234',
        'Алексей', 'Сидоров', 'Петрович',
        '+7 (900) 333-33-33', datetime.date(1985, 6, 15),
        allergies='Пенициллин',
    )
    if p1 and not p1.visits.exists():
        make_visit(p1, doctor1, dt(-30, 9, 0), dt(-30, 9, 30), 'Первичный осмотр', 'completed')
        make_visit(p1, doctor1, dt(-14, 10, 0), dt(-14, 10, 45), 'Лечение кариеса зуба 16', 'completed')
        make_visit(p1, doctor2, dt(7, 11, 0), dt(7, 12, 0), 'Консультация по имплантации', 'planned')

    # ── patient 2 ─────────────────────────────────────────────────────────────
    p2 = make_patient(
        'patient.kozlova@example.com', 'patient1234',
        'Наталья', 'Козлова', 'Андреевна',
        '+7 (900) 444-44-44', datetime.date(1992, 3, 22),
    )
    if p2 and not p2.visits.exists():
        make_visit(p2, doctor2, dt(-60, 14, 0), dt(-60, 14, 30), 'Удаление зуба мудрости', 'completed')
        make_visit(p2, doctor1, dt(-7, 9, 30), dt(-7, 10, 0), 'Профессиональная чистка', 'completed')
        make_visit(p2, doctor1, dt(3, 10, 0), dt(3, 10, 30), 'Повторный осмотр', 'confirmed')

    # ── patient 3 ─────────────────────────────────────────────────────────────
    p3 = make_patient(
        'patient.morozov@example.com', 'patient1234',
        'Дмитрий', 'Морозов', 'Владимирович',
        '+7 (900) 555-55-55', datetime.date(1978, 11, 8),
        allergies='Лидокаин',
    )
    if p3 and not p3.visits.exists():
        make_visit(p3, doctor1, dt(-45, 10, 0), dt(-45, 11, 0), 'Эндодонтическое лечение зуба 36', 'completed')
        make_visit(p3, doctor2, dt(-10, 15, 0), dt(-10, 16, 0), 'Хирургическая санация', 'completed')
        make_visit(p3, doctor1, dt(14, 9, 0), dt(14, 9, 45), 'Контрольный визит', 'planned')


class Migration(migrations.Migration):

    dependencies = [
        ('doctors', '0001_initial'),
        ('patients', '0003_visit_start_at_end_at'),
        ('authorization', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_data, migrations.RunPython.noop),
    ]
