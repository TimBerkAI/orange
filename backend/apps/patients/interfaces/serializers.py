from rest_framework import serializers

from apps.authorization.infrastructure.models import User
from apps.patients.domain.enums import PatientStatus, ToothStatus, VisitStatus
from apps.patients.infrastructure.models import (
    OdontogramEntry,
    Patient,
    SoapNote,
    Tooth,
    Visit,
)


class ToothSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tooth
        fields = ['id', 'number', 'name']


class PatientUserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='profile.first_name', default='')
    last_name = serializers.CharField(source='profile.last_name', default='')
    patronymic = serializers.CharField(source='profile.patronymic', default='')
    phone = serializers.CharField(source='profile.phone', default='')
    date_of_birth = serializers.DateField(
        source='profile.date_of_birth',
        default=None,
    )

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'patronymic',
            'phone',
            'date_of_birth',
        ]
        read_only_fields = fields


class DoctorBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    email = serializers.CharField(source='user.email')


class PatientListSerializer(serializers.ModelSerializer):
    user = PatientUserSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id',
            'user',
            'full_name',
            'allergies',
            'status',
            'created_at',
        ]


class PatientDetailSerializer(serializers.ModelSerializer):
    user = PatientUserSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    last_visit = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id',
            'user',
            'full_name',
            'allergies',
            'status',
            'created_at',
            'updated_at',
            'last_visit',
        ]

    def get_last_visit(self, obj):
        visit = obj.visits.order_by('-start_at').first()
        if not visit:
            return None
        return {
            'id': visit.id,
            'start_at': visit.start_at,
            'end_at': visit.end_at,
            'status': visit.status,
        }


class NewPatientUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    patronymic = serializers.CharField(max_length=150, required=False, default='')
    phone = serializers.CharField(max_length=30, required=False, default='')
    date_of_birth = serializers.DateField(required=False, default=None)


class PatientCreateSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=False)
    new_user = NewPatientUserSerializer(required=False)
    allergies = serializers.CharField(required=False, default='', allow_blank=True)
    status = serializers.ChoiceField(
        choices=PatientStatus.choices(),
        default=PatientStatus.ACTIVE,
    )

    def validate(self, attrs):
        has_user_id = 'user_id' in attrs and attrs['user_id'] is not None
        has_new_user = 'new_user' in attrs and attrs['new_user'] is not None
        if not has_user_id and not has_new_user:
            raise serializers.ValidationError(
                'Either user_id or new_user must be provided.'
            )
        if has_user_id and has_new_user:
            raise serializers.ValidationError(
                'Provide either user_id or new_user, not both.'
            )
        return attrs


class PatientUpdateSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=False)
    allergies = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=PatientStatus.choices(),
        required=False,
    )


class VisitToothSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='tooth.id')
    number = serializers.IntegerField(source='tooth.number')
    name = serializers.CharField(source='tooth.name')


class VisitListSerializer(serializers.ModelSerializer):
    doctor = DoctorBriefSerializer(read_only=True)
    teeth = VisitToothSerializer(
        source='visit_teeth',
        many=True,
        read_only=True,
    )

    class Meta:
        model = Visit
        fields = [
            'id',
            'start_at',
            'end_at',
            'doctor',
            'reason',
            'teeth',
            'status',
            'created_at',
        ]


class VisitDetailSerializer(serializers.ModelSerializer):
    doctor = DoctorBriefSerializer(read_only=True)
    teeth = VisitToothSerializer(
        source='visit_teeth',
        many=True,
        read_only=True,
    )
    has_odontogram = serializers.SerializerMethodField()
    has_soap = serializers.SerializerMethodField()

    class Meta:
        model = Visit
        fields = [
            'id',
            'patient_id',
            'start_at',
            'end_at',
            'doctor',
            'reason',
            'teeth',
            'status',
            'has_odontogram',
            'has_soap',
            'created_at',
            'updated_at',
        ]

    def get_has_odontogram(self, obj):
        return hasattr(obj, 'odontogram')

    def get_has_soap(self, obj):
        return hasattr(obj, 'soap_note')


class VisitCreateSerializer(serializers.Serializer):
    doctor_id = serializers.IntegerField()
    start_at = serializers.DateTimeField()
    end_at = serializers.DateTimeField()
    reason = serializers.CharField(required=False, default='', allow_blank=True)
    tooth_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
    )
    status = serializers.ChoiceField(
        choices=VisitStatus.choices(),
        default=VisitStatus.PLANNED,
    )


class VisitUpdateSerializer(serializers.Serializer):
    doctor_id = serializers.IntegerField(required=False)
    start_at = serializers.DateTimeField(required=False)
    end_at = serializers.DateTimeField(required=False)
    reason = serializers.CharField(required=False, allow_blank=True)
    tooth_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
    )
    status = serializers.ChoiceField(
        choices=VisitStatus.choices(),
        required=False,
    )


class OdontogramEntrySerializer(serializers.ModelSerializer):
    tooth = ToothSerializer(read_only=True)

    class Meta:
        model = OdontogramEntry
        fields = ['id', 'tooth', 'status']


class OdontogramSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    visit_id = serializers.IntegerField()
    entries = OdontogramEntrySerializer(many=True, read_only=True)


class OdontogramEntryUpdateSerializer(serializers.Serializer):
    tooth_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=ToothStatus.choices())


class SoapNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoapNote
        fields = [
            'id',
            'visit_id',
            'subjective',
            'objective',
            'assessment',
            'plan',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'visit_id', 'created_at', 'updated_at']
