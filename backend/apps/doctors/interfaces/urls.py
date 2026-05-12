from django.urls import path

from apps.doctors.interfaces.views import (
    DoctorDetailView,
    DoctorListCreateView,
    DoctorMeView,
    SpecializationListView,
)

app_name = 'doctors'

urlpatterns = [
    path('specializations/', SpecializationListView.as_view(), name='specialization-list'),
    path('', DoctorListCreateView.as_view(), name='doctor-list-create'),
    path('me/', DoctorMeView.as_view(), name='doctor-me'),
    path('<int:doctor_id>/', DoctorDetailView.as_view(), name='doctor-detail'),
]
