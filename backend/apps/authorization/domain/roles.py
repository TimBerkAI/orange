from enum import StrEnum


class Role(StrEnum):
    ADMIN = 'admin'
    DOCTOR = 'doctor'
    PATIENT = 'patient'

    @classmethod
    def choices(cls):
        return [(role.value, role.name.capitalize()) for role in cls]
