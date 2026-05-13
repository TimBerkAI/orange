import datetime

from django.db import transaction
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authorization.application.services import AuthService
from apps.authorization.domain.roles import Role
from apps.authorization.infrastructure.models import User
from apps.authorization.interfaces.permissions import IsAdminOrDoctor
from apps.doctors.infrastructure.models import Doctor
from apps.patients.application.services import (
    OdontogramService,
    PatientService,
    SoapNoteService,
    VisitService,
)
from apps.patients.infrastructure.models import Tooth
from apps.patients.interfaces.serializers import (
    OdontogramEntryUpdateSerializer,
    OdontogramSerializer,
    PatientCreateSerializer,
    PatientDetailSerializer,
    PatientListSerializer,
    PatientUpdateSerializer,
    SoapNoteSerializer,
    ToothSerializer,
    VisitCreateSerializer,
    VisitDetailSerializer,
    VisitListSerializer,
    VisitUpdateSerializer,
)


class ToothListView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request):
        teeth = Tooth.objects.all()
        return Response(ToothSerializer(teeth, many=True).data)


class PatientListCreateView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request):
        service = PatientService()
        search = request.query_params.get('search')

        doctor_user_id = None
        if request.user.role == Role.DOCTOR:
            doctor_user_id = request.user.id

        patients = service.list_patients(
            search=search,
            doctor_user_id=doctor_user_id,
        )

        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 50)), 200)
        total = patients.count()
        start = (page - 1) * page_size
        page_qs = patients[start : start + page_size]

        return Response(
            {
                'count': total,
                'page': page,
                'page_size': page_size,
                'results': PatientListSerializer(page_qs, many=True).data,
            }
        )

    @transaction.atomic
    def post(self, request):
        if request.user.role != Role.ADMIN:
            return Response(
                {'detail': 'Only administrators can create patients.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = PatientCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        new_user_data = data.get('new_user')
        if new_user_data:
            auth_svc = AuthService()
            try:
                user = auth_svc.register_user(
                    email=new_user_data['email'],
                    password=None,
                    role=Role.PATIENT,
                    profile_data={
                        'first_name': new_user_data['first_name'],
                        'last_name': new_user_data['last_name'],
                        'patronymic': new_user_data.get('patronymic', ''),
                        'phone': new_user_data.get('phone', ''),
                        'date_of_birth': new_user_data.get('date_of_birth'),
                    },
                )
            except ValueError as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            user = User.objects.filter(pk=data['user_id']).first()
            if not user:
                return Response(
                    {'detail': 'User not found.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        service = PatientService()
        try:
            patient = service.create_patient(
                user=user,
                allergies=data.get('allergies', ''),
                status=data.get('status', 'active'),
            )
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            PatientDetailSerializer(patient).data,
            status=status.HTTP_201_CREATED,
        )


class PatientDetailView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, patient_id):
        service = PatientService()
        patient = service.get_patient(patient_id)
        if not patient:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if not self._can_access(request.user, patient):
            return Response(status=status.HTTP_403_FORBIDDEN)

        return Response(PatientDetailSerializer(patient).data)

    def patch(self, request, patient_id):
        if request.user.role != Role.ADMIN:
            return Response(
                {'detail': 'Only administrators can update patients.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        service = PatientService()
        patient = service.get_patient(patient_id)
        if not patient:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = PatientUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user_id = data.pop('user_id', None)
        if user_id is not None:
            user = User.objects.filter(pk=user_id).first()
            if not user:
                return Response(
                    {'detail': 'User not found.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            data['user'] = user

        try:
            patient = service.update_patient(patient_id, **data)
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(PatientDetailSerializer(patient).data)

    def delete(self, request, patient_id):
        if request.user.role != Role.ADMIN:
            return Response(status=status.HTTP_403_FORBIDDEN)

        service = PatientService()
        try:
            service.delete_patient(patient_id)
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _can_access(self, user, patient):
        if user.role == Role.ADMIN:
            return True
        return patient.visits.filter(doctor__user=user).exists()


class VisitListCreateView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, patient_id):
        service = VisitService()
        visits = service.list_visits(patient_id)

        if request.user.role == Role.DOCTOR:
            visits = visits.filter(doctor__user=request.user)

        visits = visits.order_by('-start_at')

        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 20)), 100)
        total = visits.count()
        start = (page - 1) * page_size
        page_qs = visits[start : start + page_size]

        return Response(
            {
                'count': total,
                'page': page,
                'page_size': page_size,
                'results': VisitListSerializer(page_qs, many=True).data,
            }
        )

    def post(self, request, patient_id):
        serializer = VisitCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        patient_svc = PatientService()
        patient = patient_svc.get_patient(patient_id)
        if not patient:
            return Response(
                {'detail': 'Patient not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        doctor = Doctor.objects.filter(pk=data['doctor_id']).first()
        if not doctor:
            return Response(
                {'detail': 'Doctor not found.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.user.role == Role.DOCTOR:
            if doctor.user_id != request.user.id:
                return Response(
                    {'detail': 'Doctors can only create visits for themselves.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        service = VisitService()
        visit = service.create_visit(
            patient=patient,
            doctor=doctor,
            start_at=data['start_at'],
            end_at=data['end_at'],
            reason=data.get('reason', ''),
            tooth_ids=data.get('tooth_ids'),
            status=data.get('status', 'planned'),
        )

        return Response(
            VisitDetailSerializer(visit).data,
            status=status.HTTP_201_CREATED,
        )


class VisitDetailView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, visit_id):
        service = VisitService()
        visit = service.get_visit(visit_id)
        if not visit:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if not self._can_access(request.user, visit):
            return Response(status=status.HTTP_403_FORBIDDEN)

        return Response(VisitDetailSerializer(visit).data)

    def patch(self, request, visit_id):
        service = VisitService()
        visit = service.get_visit(visit_id)
        if not visit:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if not self._can_access(request.user, visit):
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = VisitUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        doctor_id = data.pop('doctor_id', None)
        if doctor_id is not None:
            if request.user.role != Role.ADMIN:
                return Response(
                    {'detail': 'Only admins can change the doctor.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            doctor = Doctor.objects.filter(pk=doctor_id).first()
            if not doctor:
                return Response(
                    {'detail': 'Doctor not found.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            data['doctor'] = doctor

        try:
            visit = service.update_visit(visit_id, **data)
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(VisitDetailSerializer(visit).data)

    def delete(self, request, visit_id):
        if request.user.role != Role.ADMIN:
            return Response(
                {'detail': 'Only administrators can delete visits.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        service = VisitService()
        visit = service.get_visit(visit_id)
        if not visit:
            return Response(status=status.HTTP_404_NOT_FOUND)

        visit.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _can_access(self, user, visit):
        if user.role == Role.ADMIN:
            return True
        return visit.doctor.user_id == user.id


class VisitStatsView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request):
        period = request.query_params.get('period', 'week')
        today = timezone.now().date()

        if period == 'month':
            date_from = today - datetime.timedelta(days=29)
        else:
            date_from = today - datetime.timedelta(days=6)

        from apps.patients.infrastructure.models import Visit as VisitModel

        qs = VisitModel.objects.filter(start_at__date__gte=date_from, start_at__date__lte=today)

        if request.user.role == Role.DOCTOR:
            doctor = Doctor.objects.filter(user_id=request.user.id).first()
            if doctor:
                qs = qs.filter(doctor=doctor)
            else:
                qs = qs.none()

        rows = (
            qs.annotate(date=TruncDate('start_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        date_map = {row['date'].isoformat(): row['count'] for row in rows}

        result = []
        cursor = date_from
        while cursor <= today:
            result.append(
                {'date': cursor.isoformat(), 'count': date_map.get(cursor.isoformat(), 0)}
            )
            cursor += datetime.timedelta(days=1)

        return Response(result)


class OdontogramView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, visit_id):
        visit = VisitService().get_visit(visit_id)
        if not visit:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not self._can_access(request.user, visit):
            return Response(status=status.HTTP_403_FORBIDDEN)

        service = OdontogramService()
        odontogram = service.get_odontogram(visit_id)
        if not odontogram:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(OdontogramSerializer(odontogram).data)

    def patch(self, request, visit_id):
        visit = VisitService().get_visit(visit_id)
        if not visit:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not self._can_access(request.user, visit):
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = OdontogramEntryUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = OdontogramService()
        try:
            service.update_entry(
                visit_id,
                serializer.validated_data['tooth_id'],
                serializer.validated_data['status'],
            )
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        odontogram = service.get_odontogram(visit_id)
        return Response(OdontogramSerializer(odontogram).data)

    def _can_access(self, user, visit):
        if user.role == Role.ADMIN:
            return True
        return visit.doctor.user_id == user.id


class SoapNoteView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, visit_id):
        visit = VisitService().get_visit(visit_id)
        if not visit:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not self._can_access(request.user, visit):
            return Response(status=status.HTTP_403_FORBIDDEN)

        service = SoapNoteService()
        soap = service.get_soap(visit_id)
        if not soap:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(SoapNoteSerializer(soap).data)

    def patch(self, request, visit_id):
        visit = VisitService().get_visit(visit_id)
        if not visit:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not self._can_access(request.user, visit):
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = SoapNoteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        allowed = {'subjective', 'objective', 'assessment', 'plan'}
        fields = {k: v for k, v in serializer.validated_data.items() if k in allowed}

        if not fields:
            return Response(
                {'detail': 'No valid fields to update.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = SoapNoteService()
        try:
            soap = service.update_soap(visit_id, **fields)
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(SoapNoteSerializer(soap).data)

    def _can_access(self, user, visit):
        if user.role == Role.ADMIN:
            return True
        return visit.doctor.user_id == user.id
