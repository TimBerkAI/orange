from django.contrib import admin

from apps.doctors.infrastructure.models import Doctor, Specialization


@admin.register(Specialization)
class SpecializationAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user', 'created_at']
    list_filter = ['specializations']
    search_fields = ['user__email', 'user__profile__first_name', 'user__profile__last_name']
    filter_horizontal = ['specializations']
    raw_id_fields = ['user']
