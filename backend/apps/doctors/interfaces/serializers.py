from rest_framework import serializers

from apps.authorization.infrastructure.models import User
from apps.doctors.domain.weekdays import ALL_WEEKDAYS, Weekday
from apps.doctors.infrastructure.models import Doctor, Specialization


class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']


class DoctorUserSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='profile.first_name', default='')
    last_name = serializers.CharField(source='profile.last_name', default='')
    patronymic = serializers.CharField(source='profile.patronymic', default='')

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'patronymic']
        read_only_fields = fields


class DoctorListSerializer(serializers.ModelSerializer):
    user = DoctorUserSerializer(read_only=True)
    specializations = SpecializationSerializer(many=True, read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id',
            'user',
            'full_name',
            'specializations',
            'preferred_weekdays',
            'created_at',
        ]


class DoctorDetailSerializer(serializers.ModelSerializer):
    user = DoctorUserSerializer(read_only=True)
    specializations = SpecializationSerializer(many=True, read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id',
            'user',
            'full_name',
            'specializations',
            'notes',
            'preferred_weekdays',
            'created_at',
            'updated_at',
        ]


def _validate_weekdays(value):
    valid = {w.value for w in Weekday}
    for day in value:
        if day not in valid:
            raise serializers.ValidationError(f'Invalid weekday: {day}')
    return value


class NewUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    patronymic = serializers.CharField(max_length=150, required=False, default='')
    phone = serializers.CharField(max_length=30, required=False, default='')


class DoctorCreateSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=False)
    new_user = NewUserSerializer(required=False)
    specialization_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )
    notes = serializers.CharField(required=False, default='', allow_blank=True)
    preferred_weekdays = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=ALL_WEEKDAYS,
    )

    def validate_preferred_weekdays(self, value):
        return _validate_weekdays(value)

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


class DoctorUpdateSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=False)
    specialization_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    preferred_weekdays = serializers.ListField(child=serializers.IntegerField(), required=False)

    def validate_preferred_weekdays(self, value):
        return _validate_weekdays(value)


class DoctorSelfUpdateSerializer(serializers.Serializer):
    specialization_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    preferred_weekdays = serializers.ListField(child=serializers.IntegerField(), required=False)

    def validate_preferred_weekdays(self, value):
        return _validate_weekdays(value)
