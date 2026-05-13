from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authorization.application.services import AuthService
from apps.authorization.domain.roles import Role
from apps.authorization.infrastructure.models import User
from apps.authorization.interfaces.permissions import IsAdmin, IsAdminOrDoctor
from apps.doctors.application.services import DoctorService
from apps.doctors.infrastructure.repositories import SpecializationRepository
from apps.doctors.interfaces.serializers import (
    DoctorCreateSerializer,
    DoctorDetailSerializer,
    DoctorListSerializer,
    DoctorSelfUpdateSerializer,
    DoctorUpdateSerializer,
    SpecializationSerializer,
)


class SpecializationListView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request):
        repo = SpecializationRepository()
        specs = repo.get_all()
        return Response(SpecializationSerializer(specs, many=True).data)

    def post(self, request):
        if request.user.role != Role.ADMIN:
            return Response(
                {'detail': 'Only administrators can manage specializations.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = SpecializationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        specialization = serializer.save()
        return Response(
            SpecializationSerializer(specialization).data, status=status.HTTP_201_CREATED
        )


class SpecializationDetailView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, specialization_id):
        from apps.doctors.infrastructure.models import Specialization

        spec = Specialization.objects.filter(pk=specialization_id).first()
        if not spec:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = SpecializationSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for attr, value in serializer.validated_data.items():
            setattr(spec, attr, value)
        spec.save()
        return Response(SpecializationSerializer(spec).data)

    def delete(self, request, specialization_id):
        repo = SpecializationRepository()
        deleted = repo.delete(specialization_id)
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DoctorListCreateView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request):
        service = DoctorService()
        search = request.query_params.get('search')
        doctors = service.list_doctors(search=search)

        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 50)), 200)
        total = doctors.count()
        start = (page - 1) * page_size
        page_qs = doctors[start : start + page_size]

        return Response(
            {
                'count': total,
                'page': page,
                'page_size': page_size,
                'results': DoctorListSerializer(page_qs, many=True).data,
            }
        )

    @transaction.atomic
    def post(self, request):
        if request.user.role != Role.ADMIN:
            return Response(
                {'detail': 'Only administrators can create doctor profiles.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = DoctorCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        new_user_data = data.get('new_user')
        if new_user_data:
            auth_svc = AuthService()
            try:
                user = auth_svc.register_user(
                    email=new_user_data['email'],
                    password=None,
                    role=Role.DOCTOR,
                    profile_data={
                        'first_name': new_user_data['first_name'],
                        'last_name': new_user_data['last_name'],
                        'patronymic': new_user_data.get('patronymic', ''),
                        'phone': new_user_data.get('phone', ''),
                        'date_of_birth': None,
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

        service = DoctorService()
        try:
            doctor = service.create_doctor(
                user=user,
                specialization_ids=data.get('specialization_ids'),
                notes=data.get('notes', ''),
                preferred_weekdays=data.get('preferred_weekdays'),
            )
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            DoctorDetailSerializer(doctor).data,
            status=status.HTTP_201_CREATED,
        )


class DoctorDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, doctor_id):
        service = DoctorService()
        doctor = service.get_doctor(doctor_id)
        if not doctor:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(DoctorDetailSerializer(doctor).data)

    def patch(self, request, doctor_id):
        service = DoctorService()
        doctor = service.get_doctor(doctor_id)
        if not doctor:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = DoctorUpdateSerializer(data=request.data, partial=True)
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
            if user.role not in (Role.DOCTOR, Role.ADMIN):
                return Response(
                    {'detail': 'User must have doctor or admin role.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            data['user'] = user

        try:
            doctor = service.update_doctor(doctor_id, **data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(DoctorDetailSerializer(doctor).data)

    def delete(self, request, doctor_id):
        service = DoctorService()
        try:
            service.delete_doctor(doctor_id)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class DoctorMeView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request):
        service = DoctorService()
        doctor = service.get_doctor_by_user(request.user.id)
        if not doctor:
            return Response(
                {'detail': 'You do not have a doctor profile.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(DoctorDetailSerializer(doctor).data)

    def patch(self, request):
        service = DoctorService()
        doctor = service.get_doctor_by_user(request.user.id)
        if not doctor:
            return Response(
                {'detail': 'You do not have a doctor profile.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = DoctorSelfUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            doctor = service.update_doctor(doctor.id, **serializer.validated_data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(DoctorDetailSerializer(doctor).data)
