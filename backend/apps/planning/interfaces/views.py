import datetime

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authorization.domain.roles import Role
from apps.authorization.interfaces.permissions import IsAdminOrDoctor
from apps.doctors.infrastructure.models import Doctor
from apps.planning.application.services import AppointmentService
from apps.planning.interfaces.serializers import (
    AppointmentCreateSerializer,
    AppointmentDetailSerializer,
    AppointmentListSerializer,
    AppointmentUpdateSerializer,
)


class AppointmentListCreateView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request):
        service = AppointmentService()

        doctor_user_id = None
        doctor_id = request.query_params.get('doctor_id')
        if request.user.role == Role.DOCTOR:
            doctor_user_id = request.user.id
        elif doctor_id:
            doctor_id = int(doctor_id)

        appointments = service.list_appointments(
            date_from=request.query_params.get('date_from'),
            date_to=request.query_params.get('date_to'),
            doctor_id=doctor_id if not doctor_user_id else None,
            doctor_user_id=doctor_user_id,
            search=request.query_params.get('search'),
        )
        return Response(
            AppointmentListSerializer(appointments, many=True).data,
        )

    def post(self, request):
        if request.user.role != Role.ADMIN:
            return Response(
                {'detail': 'Только администратор может создавать записи.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AppointmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        service = AppointmentService()
        try:
            appointment = service.create_appointment(
                phone=data['phone'],
                patient_name=data['patient_name'],
                reason=data.get('reason', ''),
                doctor_id=data['doctor_id'],
                start_at=data['start_at'],
                end_at=data['end_at'],
                created_by=request.user,
            )
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            AppointmentDetailSerializer(appointment).data,
            status=status.HTTP_201_CREATED,
        )


class AppointmentDetailView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, appointment_id):
        service = AppointmentService()
        appointment = service.get_appointment(appointment_id)
        if not appointment:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if not self._can_access(request.user, appointment):
            return Response(status=status.HTTP_403_FORBIDDEN)

        return Response(AppointmentDetailSerializer(appointment).data)

    def patch(self, request, appointment_id):
        if request.user.role != Role.ADMIN:
            return Response(
                {'detail': 'Только администратор может изменять записи.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        service = AppointmentService()
        appointment = service.get_appointment(appointment_id)
        if not appointment:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = AppointmentUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            appointment = service.update_appointment(
                appointment_id,
                **serializer.validated_data,
            )
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(AppointmentDetailSerializer(appointment).data)

    def delete(self, request, appointment_id):
        if request.user.role != Role.ADMIN:
            return Response(status=status.HTTP_403_FORBIDDEN)

        service = AppointmentService()
        try:
            service.delete_appointment(appointment_id)
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _can_access(self, user, appointment):
        if user.role == Role.ADMIN:
            return True
        return appointment.visit.doctor.user_id == user.id


class DashboardStatsView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request):
        now = timezone.now()
        today = now.date()
        tomorrow = today + datetime.timedelta(days=1)

        from apps.patients.infrastructure.models import Visit

        qs = Visit.objects.all()
        if request.user.role == Role.DOCTOR:
            doctor = Doctor.objects.filter(user_id=request.user.id).first()
            if doctor:
                qs = qs.filter(doctor=doctor)
            else:
                qs = qs.none()

        today_confirmed = qs.filter(
            start_at__date=today,
            status='confirmed',
        ).count()

        tomorrow_pending = qs.filter(
            start_at__date=tomorrow,
            status='planned',
        ).count()

        return Response(
            {
                'today_confirmed': today_confirmed,
                'tomorrow_pending': tomorrow_pending,
            }
        )
