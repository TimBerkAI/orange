from django.contrib import admin

from apps.patients.infrastructure.models import (
    Odontogram,
    Patient,
    PatientTooth,
    SoapNote,
    Tooth,
    Visit,
    VisitTooth,
)


@admin.register(Tooth)
class ToothAdmin(admin.ModelAdmin):
    list_display = ['number', 'name']
    ordering = ['number']


class PatientToothInline(admin.TabularInline):
    model = PatientTooth
    extra = 0
    readonly_fields = ['tooth']


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user', 'status', 'created_at']
    list_filter = ['status']
    search_fields = [
        'user__email',
        'user__profile__first_name',
        'user__profile__last_name',
    ]
    raw_id_fields = ['user']
    inlines = [PatientToothInline]


class VisitToothInline(admin.TabularInline):
    model = VisitTooth
    extra = 0


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'scheduled_at', 'status']
    list_filter = ['status']
    raw_id_fields = ['patient', 'doctor']
    inlines = [VisitToothInline]


@admin.register(Odontogram)
class OdontogramAdmin(admin.ModelAdmin):
    list_display = ['visit', 'created_at']
    raw_id_fields = ['visit']


@admin.register(SoapNote)
class SoapNoteAdmin(admin.ModelAdmin):
    list_display = ['visit', 'created_at']
    raw_id_fields = ['visit']
