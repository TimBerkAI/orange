# Django Backend Developer Skill Guide

## Project context

This guide defines conventions for a senior-level Django backend project for a dental company. The codebase works from the `backend/` directory and uses Domain-Driven Design (DDD) to organize the system around the core business domains: `doctors`, `patients`, and `planning`, with `authorization` as a supporting domain.

## Technology stack

- Python 3.13.
- Django as the backend framework.
- PostgreSQL as the primary database.
- Redis for caching, background coordination, or lightweight async support.
- Docker Compose for local development orchestration.
- `uv` for dependency management and task execution.
- `ruff` for linting and formatting.

## Working directory

All backend commands are executed from the `backend/` directory.

Example:

```bash
cd backend
```

## Repository layout

Recommended high-level structure:

```text
backend/
├── pyproject.toml
├── uv.lock
├── .env
├── .env.example
├── docker-compose.yml
├── manage.py
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── apps/
│   ├── doctors/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── interfaces/
│   │   └── tests/
│   ├── patients/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── interfaces/
│   │   └── tests/
│   ├── planning/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── interfaces/
│   │   └── tests/
│   └── authorization/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       ├── interfaces/
│       └── tests/
└── shared/
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── testing/
```

## DDD organization

Each app should be organized by DDD layers.

### Domain

Contains pure business logic:

- Entities.
- Value objects.
- Domain services.
- Domain rules and invariants.
- Repository contracts (interfaces only).
- Domain events where needed.

The domain layer must not depend on Django ORM, HTTP, Redis, or other infrastructure details.

### Application

Coordinates use cases:

- Commands and queries.
- Application services.
- Transaction boundaries.
- DTOs for internal use.
- Orchestration across repositories and domain services.

This layer implements business scenarios such as creating a patient, assigning a doctor, or building a treatment plan.

### Infrastructure

Contains technical implementations:

- Django ORM models.
- Repository implementations.
- Redis integration.
- External services.
- Celery or background-job integration if introduced later.
- Persistence adapters.

Infrastructure depends on domain/application, never the other way around.

### Interfaces

Contains delivery mechanisms:

- Django REST Framework views or Django views.
- Serializers / request-response schemas.
- URL routing.
- Permission adapters.
- API contracts.

Interfaces should stay thin and delegate business work to the application layer.

## Domain boundaries

### Core domains

- `doctors`: doctor profiles, specialties, availability, assignments.
- `patients`: patient records, contacts, medical context relevant to dentistry.
- `planning`: appointments, treatment planning, scheduling, plan lifecycle.

### Supporting domain

- `authorization`: authentication, roles, permissions, access policies.

### Cross-domain rule

Cross-domain interaction should happen through explicit application services, well-defined contracts, or domain/application events, not through tightly coupled direct imports between unrelated infrastructure modules.

## Testing standards

Testing is mandatory for all business-critical behavior.

### Tools

Use:

- `pytest`
- `pytest-django`
- `pytest-xdist`
- `pytest-rerunfailures`
- factories
- fixtures

### Test placement

Every test must be placed inside `<app>/tests`.

Examples:

- `apps/doctors/tests/`
- `apps/patients/tests/`
- `apps/planning/tests/`
- `apps/authorization/tests/`

Suggested substructure:

```text
apps/doctors/tests/
├── factories.py
├── conftest.py
├── test_commands.py
├── test_queries.py
├── test_api.py
└── test_repositories.py
```

### Test style

All tests should follow AAA:

1. Arrange.
2. Act.
3. Assert.

Example:

```python
def test_create_patient_creates_record(patient_service, patient_payload):
    # Arrange
    initial_count = patient_service.count()

    # Act
    patient = patient_service.create(patient_payload)

    # Assert
    assert patient.id is not None
    assert patient_service.count() == initial_count + 1
```

### Testing principles

- Prefer fast deterministic tests.
- Test business behavior, not framework internals.
- Use factories for test data creation.
- Use fixtures for reusable setup and dependency wiring.
- Keep unit, integration, and API tests clearly separated.
- Parallelize test execution with `pytest-xdist` where safe.
- Use reruns only for known flaky integration boundaries, not to hide poor test quality.

### Pytest example configuration

```toml
[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "config.settings.test"
python_files = ["test_*.py", "*_tests.py"]
addopts = "-ra -q --strict-markers --disable-warnings -n auto --reruns 1"
testpaths = [
  "apps"
]
```

## Code quality

### Dependency management

Use `uv` for:

- Creating and syncing environments.
- Installing dependencies.
- Locking dependencies.
- Running project tools.

Examples:

```bash
cd backend
uv sync
uv run pytest
uv run ruff check .
uv run ruff format .
```

### Linting and formatting

Use `ruff` as the single fast tool for linting and formatting.

Recommended commands:

```bash
uv run ruff check .
uv run ruff format .
```

Recommended `pyproject.toml` fragment:

```toml
[tool.ruff]
line-length = 100
target-version = "py313"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "DJ", "PT"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
```

## Secrets management

Secrets must never be stored in source code.

Rules:

- Keep secrets only in `.env`.
- Commit `.env.example`, never real `.env` values.
- Read configuration through environment variables.
- Do not hardcode tokens, passwords, DSNs, or secret keys.

Example `.env.example`:

```dotenv
DEBUG=True
SECRET_KEY=change-me
POSTGRES_DB=dental
POSTGRES_USER=dental
POSTGRES_PASSWORD=change-me
POSTGRES_HOST=db
POSTGRES_PORT=5432
REDIS_URL=redis://redis:6379/0
```

## Local infrastructure

Use Docker Compose to run local dependencies.

Example services:

- `app`
- `db` for PostgreSQL
- `redis`

Example command:

```bash
cd backend
docker compose up --build
```

## Architecture rules

- Keep business rules in domain/application layers, not in views or ORM models.
- Keep Django models as infrastructure persistence representations when following strict DDD.
- Avoid fat views and god services.
- Make use cases explicit and named around business actions.
- Prefer repository interfaces in the domain and concrete implementations in infrastructure.
- Isolate authorization concerns from doctor/patient/planning logic unless a rule truly belongs to the core domain.
- Shared code goes to `shared/` only when it is genuinely reusable and not just prematurely generalized.

## Suggested use cases

Examples of business use cases in this dental system:

- Register a patient.
- Create a doctor profile.
- Assign a specialty to a doctor.
- Create an appointment plan.
- Reschedule a visit.
- Attach treatment steps to a planning aggregate.
- Authorize staff actions by role and permission.

## Delivery standard

A senior Django backend developer in this project is expected to:

- Design clear bounded contexts.
- Preserve domain invariants.
- Keep interfaces thin.
- Write maintainable tests with AAA.
- Use `uv` and `ruff` consistently.
- Protect secrets through `.env`.
- Deliver reproducible local environments with Docker Compose.
- Build for correctness first, then optimize with measured evidence.
