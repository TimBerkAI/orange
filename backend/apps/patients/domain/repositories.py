from abc import ABC, abstractmethod


class ToothRepositoryInterface(ABC):
    @abstractmethod
    def get_all(self): ...

    @abstractmethod
    def get_by_ids(self, ids): ...


class PatientRepositoryInterface(ABC):
    @abstractmethod
    def get_by_id(self, patient_id): ...

    @abstractmethod
    def get_by_user_id(self, user_id): ...

    @abstractmethod
    def list_all(self, *, search=None, doctor_user_id=None): ...

    @abstractmethod
    def create(self, *, user, allergies='', status='active'): ...

    @abstractmethod
    def update(self, *, patient_id, **fields): ...

    @abstractmethod
    def delete(self, patient_id): ...

    @abstractmethod
    def exists_by_user_id(self, user_id) -> bool: ...


class VisitRepositoryInterface(ABC):
    @abstractmethod
    def get_by_id(self, visit_id): ...

    @abstractmethod
    def list_by_patient(self, patient_id): ...

    @abstractmethod
    def create(self, *, patient, doctor, scheduled_at, reason, status='planned'): ...

    @abstractmethod
    def update(self, *, visit_id, **fields): ...

    @abstractmethod
    def get_previous_visit(self, patient_id, before_visit_id): ...


class OdontogramRepositoryInterface(ABC):
    @abstractmethod
    def get_by_visit(self, visit_id): ...

    @abstractmethod
    def create_for_visit(self, visit): ...

    @abstractmethod
    def update_entry(self, odontogram_id, tooth_id, status): ...


class SoapNoteRepositoryInterface(ABC):
    @abstractmethod
    def get_by_visit(self, visit_id): ...

    @abstractmethod
    def create_for_visit(self, visit): ...

    @abstractmethod
    def update(self, visit_id, **fields): ...
