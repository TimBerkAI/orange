# AGENTS.md

## Purpose

This file is the root instruction file for coding agents in the dental project. It is intentionally oriented around reusable skills stored in the `skills/` directory.

`AGENTS.md` is plain Markdown and serves as a predictable place for repository-level agent guidance. The `skills/` folder should contain specialized instructions and workflows, which matches the general agent-skills pattern where skills are self-contained instruction packages used when the task matches their description.

## Project scope

This repository contains a dental product with these bounded contexts:

- `doctors`
- `patients`
- `planning`
- `authorization`

The main top-level directories are:

- `backend/`
- `frontend/`
- `container/`
- `skills/`

## Instruction precedence

Agents working in this repository should follow instructions in this order:

1. Direct user request.
2. The closest relevant `AGENTS.md` file.
3. The most relevant skill from `skills/`.
4. Existing repository code and conventions.

The AGENTS.md guidance says nested or nearest `AGENTS.md` files can be used in monorepos, and the closest file takes precedence for a subproject.[1] Skills should be treated as focused execution guides, while this file remains the root coordination document.

## How to use skills

The `skills/` directory is the source of specialized behavior for agents.

### Skill loading rules

- Before implementing a change, identify whether a matching skill exists in `skills/`.
- Prefer using a specific skill over adding duplicated instructions into this file.
- Use this file for cross-project rules and use skills for role-specific execution details.
- If multiple skills apply, combine them carefully without violating project architecture.

### Expected skills

The repository is expected to contain skill documents such as:

- Senior Django backend developer skill.
- Senior UI React frontend developer skill.
- Senior DevOps skill.

These skills should define workflows, constraints, stack rules, and guardrails in a focused way, which is consistent with skill-oriented agent documentation guidance.[6][4]

## Repository structure

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

## Architecture rules

Use Domain-Driven Design across backend and frontend.

### Bounded contexts

- `doctors`: doctor profiles, specialties, schedules, assignments.
- `patients`: patient records, contacts, and dental care context.
- `planning`: appointments, treatment plans, scheduling, plan lifecycle.
- `authorization`: authentication, roles, permissions, access policies.

### Shared rules

- Keep domain boundaries explicit.
- Avoid hidden coupling between unrelated modules.
- Reuse domain language consistently across backend and frontend.
- Keep infrastructure and framework details outside core business rules.

## Backend rules

All backend work happens inside `backend/`.

### Baseline

- Python 3.13.
- Django.
- PostgreSQL.
- Redis.
- Docker Compose.
- `uv`.
- `ruff`.

### Structure

Organize backend apps using DDD layers:

- `domain/`
- `application/`
- `infrastructure/`
- `interfaces/`
- `tests/`

### Testing rules

- Put every backend test inside `<app>/tests`.
- Use AAA: Arrange, Act, Assert.
- Use `pytest`, `pytest-django`, `pytest-xdist`, and `pytest-rerunfailures`.
- Prefer factories and fixtures for setup.

## Frontend rules

All frontend work happens inside `frontend/`.

### Baseline

- React.
- TypeScript.
- Strict linters.
- Reusable and understandable components.
- Minimalistic UI aligned with company style.

### Structure

Organize frontend modules by domain and responsibility:

- `domain/`
- `application/`
- `infrastructure/`
- `ui/`
- `model/`

### UI rules

- Keep components reusable.
- Keep components easy to understand.
- Prefer composition over oversized generic abstractions.
- Keep business logic out of low-level UI primitives.

## DevOps rules

Infrastructure work must remain safe, simple, and maintainable.

### Baseline

- Use maintained, minimal container images.
- Prefer small and fast Dockerfiles.
- Route all web traffic through Nginx.
- Place additional config in `container/`, not inline in Dockerfiles.
- Do not assume CI/CD is available.

### Operational rules

- Prefer documented manual workflows.
- Keep public exposure limited.
- Keep Nginx as the main public entry point.
- Keep infrastructure config readable and versioned.

## Security rules

- Never store secrets in code.
- Keep secrets only in `.env` or runtime environment configuration.
- Commit only `.env.example` with placeholders.
- Avoid outdated and unsafe dependencies.
- Minimize exposed ports, package footprint, and privileges.

## Agent behavior rules

- Start with the relevant project skill from `skills/` when the task is role-specific.
- Do not duplicate large skill content in implementation files.
- Keep changes small and scoped to the correct bounded context.
- Preserve readability over cleverness.
- Do not invent new architecture outside the project rules.

## What this file is not

- It is not a replacement for detailed skills.
- It is not tied to `claude.md` in this repository.
- It is not the place for large step-by-step role playbooks when those belong in `skills/`.

## Recommended skills layout

A practical skills layout is:

```text
skills/
├── senior-django-backend/
│   └── SKILL.md
├── senior-react-frontend/
│   └── SKILL.md
└── senior-devops/
    └── SKILL.md
```

Guidance for agent skills describes a skill as a directory with a skill instruction file and optional supporting resources, with progressive disclosure so the full instructions are loaded when relevant. Open agent-skills guidance also describes skills as folders of instructions, scripts, and resources that agents can discover and use across tools.

## Definition of done

A task is complete only when it:

- Uses the correct bounded context.
- Respects project-level rules from this file.
- Follows the most relevant instruction from `skills/`.
- Keeps secrets out of code.
- Preserves readability and maintainability.
- Fits the no-CI/CD operational model when infrastructure is involved.
