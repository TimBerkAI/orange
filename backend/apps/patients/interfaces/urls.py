from django.urls import path

from apps.patients.interfaces.views import (
    OdontogramView,
    PatientDetailView,
    PatientListCreateView,
    SoapNoteView,
    ToothListView,
    VisitDetailView,
    VisitListCreateView,
)

app_name = 'patients'

urlpatterns = [
    path('teeth/', ToothListView.as_view(), name='tooth-list'),
    path('', PatientListCreateView.as_view(), name='patient-list-create'),
    path('<int:patient_id>/', PatientDetailView.as_view(), name='patient-detail'),
    path(
        '<int:patient_id>/visits/',
        VisitListCreateView.as_view(),
        name='visit-list-create',
    ),
    path('visits/<int:visit_id>/', VisitDetailView.as_view(), name='visit-detail'),
    path(
        'visits/<int:visit_id>/odontogram/',
        OdontogramView.as_view(),
        name='odontogram',
    ),
    path(
        'visits/<int:visit_id>/soap/',
        SoapNoteView.as_view(),
        name='soap-note',
    ),
]
