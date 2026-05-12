from django.urls import path

from apps.doctors.interfaces.views import (
    DoctorDetailView,
    DoctorListCreateView,
    DoctorMeView,
    SpecializationDetailView,
    SpecializationListView,
)

app_name = 'doctors'

urlpatterns = [
    path('specializations/', SpecializationListView.as_view(), name='specialization-list'),
    path(
        'specializations/<int:specialization_id>/',
        SpecializationDetailView.as_view(),
        name='specialization-detail',
    ),
    path('', DoctorListCreateView.as_view(), name='doctor-list-create'),
    path('me/', DoctorMeView.as_view(), name='doctor-me'),
    path('<int:doctor_id>/', DoctorDetailView.as_view(), name='doctor-detail'),
]
