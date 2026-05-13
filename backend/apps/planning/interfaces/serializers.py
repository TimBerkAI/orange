from rest_framework import serializers

from apps.planning.infrastructure.models import Appointment


class AppointmentDoctorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    email = serializers.CharField(source='user.email')


class AppointmentPatientSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()


class AppointmentListSerializer(serializers.ModelSerializer):
    doctor = serializers.SerializerMethodField()
    patient = serializers.SerializerMethodField()
    start_at = serializers.DateTimeField(source='visit.start_at')
    end_at = serializers.DateTimeField(source='visit.end_at')
    visit_id = serializers.IntegerField(source='visit.id')
    visit_status = serializers.CharField(source='visit.status')

    class Meta:
        model = Appointment
        fields = [
            'id',
            'phone',
            'patient_name',
            'reason',
            'doctor',
            'patient',
            'start_at',
            'end_at',
            'visit_id',
            'visit_status',
            'created_at',
        ]

    def get_doctor(self, obj):
        doctor = obj.visit.doctor
        return AppointmentDoctorSerializer(doctor).data

    def get_patient(self, obj):
        patient = obj.visit.patient
        return AppointmentPatientSerializer(patient).data


class AppointmentDetailSerializer(AppointmentListSerializer):
    created_by_email = serializers.SerializerMethodField()

    class Meta(AppointmentListSerializer.Meta):
        fields = [
            *AppointmentListSerializer.Meta.fields,
            'created_by_email',
            'updated_at',
        ]

    def get_created_by_email(self, obj):
        if obj.created_by:
            return obj.created_by.email
        return None


class AppointmentCreateSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=30)
    patient_name = serializers.CharField(max_length=300)
    reason = serializers.CharField(required=False, default='', allow_blank=True)
    doctor_id = serializers.IntegerField()
    start_at = serializers.DateTimeField()
    end_at = serializers.DateTimeField()


class AppointmentUpdateSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)
    doctor_id = serializers.IntegerField(required=False)
    start_at = serializers.DateTimeField(required=False)
    end_at = serializers.DateTimeField(required=False)
    status = serializers.ChoiceField(
        choices=['planned', 'confirmed', 'completed', 'cancelled'],
        required=False,
    )
