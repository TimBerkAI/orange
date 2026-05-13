from enum import StrEnum


class ToothStatus(StrEnum):
    HEALTHY = 'healthy'
    CARIES = 'caries'
    TREATED = 'treated'
    CROWN = 'crown'
    EXTRACTED = 'extracted'
    IMPLANT = 'implant'
    FILLING = 'filling'

    @classmethod
    def choices(cls):
        return [(s.value, s.label()) for s in cls]

    def label(self):
        return {
            'healthy': 'Здоровый',
            'caries': 'Кариес',
            'treated': 'Пролечен',
            'crown': 'Коронка',
            'extracted': 'Удалён',
            'implant': 'Имплант',
            'filling': 'Пломба',
        }[self.value]


class PatientStatus(StrEnum):
    ACTIVE = 'active'
    ARCHIVED = 'archived'

    @classmethod
    def choices(cls):
        return [(s.value, s.label()) for s in cls]

    def label(self):
        return {
            'active': 'Активный',
            'archived': 'Архивный',
        }[self.value]


class VisitStatus(StrEnum):
    PLANNED = 'planned'
    CONFIRMED = 'confirmed'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'

    @classmethod
    def choices(cls):
        return [(s.value, s.label()) for s in cls]

    def label(self):
        return {
            'planned': 'Запланировано',
            'confirmed': 'Подтверждено',
            'completed': 'Завершено',
            'cancelled': 'Отменено',
        }[self.value]
