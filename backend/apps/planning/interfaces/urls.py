from django.urls import path

from apps.planning.interfaces.views import (
    AppointmentDetailView,
    AppointmentListCreateView,
    DashboardStatsView,
)

app_name = 'planning'

urlpatterns = [
    path(
        'appointments/',
        AppointmentListCreateView.as_view(),
        name='appointment-list-create',
    ),
    path(
        'appointments/<int:appointment_id>/',
        AppointmentDetailView.as_view(),
        name='appointment-detail',
    ),
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
