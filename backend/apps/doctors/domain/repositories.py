from abc import ABC, abstractmethod


class DoctorRepositoryInterface(ABC):
    @abstractmethod
    def get_by_id(self, doctor_id): ...

    @abstractmethod
    def get_by_user_id(self, user_id): ...

    @abstractmethod
    def list_all(self, search=None): ...

    @abstractmethod
    def create(self, *, user, specialization_ids=None, notes='', preferred_weekdays=None): ...

    @abstractmethod
    def update(self, *, doctor_id, **fields): ...

    @abstractmethod
    def delete(self, doctor_id): ...

    @abstractmethod
    def exists_by_user_id(self, user_id) -> bool: ...


class SpecializationRepositoryInterface(ABC):
    @abstractmethod
    def get_all(self): ...

    @abstractmethod
    def get_by_ids(self, ids): ...

    @abstractmethod
    def delete(self, specialization_id) -> bool: ...
