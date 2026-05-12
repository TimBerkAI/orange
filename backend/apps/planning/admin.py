from django.contrib import admin

from apps.planning.infrastructure.models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient_name', 'phone', 'visit', 'created_at')
    search_fields = ('patient_name', 'phone')
    raw_id_fields = ('visit', 'created_by')
