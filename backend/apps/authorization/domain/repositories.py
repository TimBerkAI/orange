from abc import ABC, abstractmethod


class UserRepositoryInterface(ABC):
    @abstractmethod
    def get_by_id(self, user_id): ...

    @abstractmethod
    def get_by_email(self, email: str): ...

    @abstractmethod
    def create(self, *, email: str, password: str, role: str, is_staff: bool = False): ...

    @abstractmethod
    def exists_by_email(self, email: str) -> bool: ...


class ProfileRepositoryInterface(ABC):
    @abstractmethod
    def get_by_user_id(self, user_id): ...

    @abstractmethod
    def create(self, *, user, first_name: str, last_name: str, **kwargs): ...

    @abstractmethod
    def update(self, *, user_id, **fields): ...
