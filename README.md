# Dental Platform

Monorepo for a dental company platform with domain-driven backend, minimalistic React frontend, and simple DevOps setup for teams working without CI/CD.

## Project structure

```text
.
├── AGENTS.md
├── backend/
├── frontend/
├── container/
├── skills/
├── docker-compose.yml
├── .env
└── .env.example
```

## Domains

The product is organized around these bounded contexts:

- `doctors`
- `patients`
- `planning`
- `authorization`

## Stack

### Backend

- Python 3.13
- Django
- PostgreSQL
- Redis
- pytest + pytest-django + pytest-xdist + pytest-rerunfailures
- uv
- ruff

### Frontend

- React
- TypeScript
- Strict linters
- Reusable UI components
- Minimalistic company-style interface

### Infrastructure

- Docker Compose
- Nginx as the only public web entry point
- Additional operational config in `container/`

## Repository conventions

- `backend/` contains the Django backend.
- `frontend/` contains the React frontend.
- `container/` contains Nginx config, scripts, and container-related assets.
- `skills/` contains role-specific agent instructions.
- `AGENTS.md` contains cross-project rules for coding agents.

## Backend architecture

Backend code should follow DDD and keep business logic inside the proper domain layers.

Suggested app structure:

```text
backend/apps/<domain>/
├── domain/
├── application/
├── infrastructure/
├── interfaces/
└── tests/
```

Rules:

- Work from the `backend/` directory.
- Put every test inside `<app>/tests`.
- Use AAA: Arrange, Act, Assert.
- Use factories and fixtures.
- Keep framework code out of core business logic.

## Frontend architecture

Frontend code should follow DDD-inspired domain boundaries and keep UI simple and reusable.

Suggested module structure:

```text
frontend/src/domains/<domain>/
├── domain/
├── application/
├── infrastructure/
├── ui/
└── model/
```

Rules:

- Work from the `frontend/` directory.
- Keep components reusable and easy to understand.
- Use strict linting and strict TypeScript settings.
- Keep the interface minimalistic and aligned with company style.

## DevOps conventions

- Use maintained and minimal container images.
- Keep Dockerfiles small and fast.
- Route all web traffic through Nginx.
- Put additional service configuration in `container/`, not inline in Dockerfiles.
- Do not assume CI/CD is available.

## Environment variables

Secrets must never be stored in source code.

Rules:

- Keep real secrets only in `.env`.
- Commit `.env.example` with placeholders only.
- Never hardcode tokens, passwords, secret keys, or DSNs.

## Local development

### 1. Prepare environment

Create `.env` from `.env.example` and fill in local values.

### 2. Start services

```bash
docker compose up --build
```

### 3. Backend commands

```bash
cd backend
uv sync
uv run ruff check .
uv run ruff format .
uv run pytest
```

### 4. Frontend commands

Adjust commands to the chosen frontend package manager.

Example:

```bash
cd frontend
npm install
npm run lint
npm run dev
```

## Testing

### Backend

Use:

- `pytest`
- `pytest-django`
- `pytest-xdist`
- `pytest-rerunfailures`
- factories
- fixtures

### Frontend

Use strict linting and add unit or integration tests according to the selected frontend toolchain.

## Skills for agents

The `skills/` directory contains specialized instructions for role-based work, such as:

- senior Django backend developer
- senior React frontend developer
- senior DevOps engineer

Agents should use `AGENTS.md` for project-wide rules and `skills/` for specialized implementation guidance.

## Delivery principles

- Keep architecture explicit.
- Prefer readable solutions over clever shortcuts.
- Keep secrets out of code.
- Preserve domain boundaries.
- Make manual local operation easy for a small team.
