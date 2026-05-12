from abc import ABC, abstractmethod


class AppointmentRepositoryInterface(ABC):
    @abstractmethod
    def get_by_id(self, appointment_id): ...

    @abstractmethod
    def list_all(self, *, date_from=None, date_to=None, doctor_id=None, search=None): ...

    @abstractmethod
    def create(self, *, visit, phone, patient_name, reason, created_by): ...

    @abstractmethod
    def update(self, *, appointment_id, **fields): ...

    @abstractmethod
    def delete(self, appointment_id): ...
