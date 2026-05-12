# UI React Frontend Developer Skill Guide

## Project context

This guide defines conventions for a senior-level React frontend project for a dental company. The frontend codebase works from the `frontend/` directory and is organized with Domain-Driven Design (DDD) around the core business domains: `doctors`, `patients`, and `planning`, with `authorization` as a supporting domain.

## Working directory

All frontend commands are executed from the `frontend/` directory.

Example:

```bash
cd frontend
```

## Core principles

The frontend must be:

- Minimalistic.
- Understandable.
- Consistent with company style.
- Easy to maintain.
- Easy to extend.
- Focused on reusable components.

The UI should prefer clarity over decoration. Every screen must make primary actions obvious, reduce visual noise, and preserve predictable behavior across the application.

## Technology direction

Recommended baseline:

- React with TypeScript.
- Strict linting and formatting.
- Environment-based configuration through `.env`.
- Component-driven UI architecture.
- Clear domain boundaries aligned with backend business contexts.

## Repository layout

Recommended high-level structure:

```text
frontend/
├── package.json
├── .env
├── .env.example
├── src/
│   ├── app/
│   │   ├── providers/
│   │   ├── router/
│   │   ├── layouts/
│   │   └── styles/
│   ├── shared/
│   │   ├── ui/
│   │   ├── lib/
│   │   ├── api/
│   │   ├── config/
│   │   ├── hooks/
│   │   ├── constants/
│   │   └── types/
│   ├── domains/
│   │   ├── doctors/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   ├── ui/
│   │   │   └── model/
│   │   ├── patients/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   ├── ui/
│   │   │   └── model/
│   │   ├── planning/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   ├── ui/
│   │   │   └── model/
│   │   └── authorization/
│   │       ├── domain/
│   │       ├── application/
│   │       ├── infrastructure/
│   │       ├── ui/
│   │       └── model/
│   └── pages/
│       ├── doctors/
│       ├── patients/
│       ├── planning/
│       └── auth/
└── public/
```

## DDD organization

Each frontend domain should be structured by responsibility.

### Domain

Contains business meaning and ubiquitous language:

- Entity types.
- Domain rules.
- Business-oriented constants.
- Status mappings and invariants.
- Pure helper functions that represent domain behavior.

The domain layer should stay independent from React rendering details.

### Application

Contains use-case orchestration for the frontend:

- Page-level and feature-level workflows.
- Commands and queries to backend APIs.
- State transitions for business actions.
- Form submission flows.
- Permission-aware interaction rules.

This layer coordinates what the user can do in the UI, such as creating a treatment plan or assigning a doctor to a schedule.

### Infrastructure

Contains technical integrations:

- HTTP clients.
- API adapters.
- Token storage strategy.
- Query client configuration.
- Browser-specific integrations.

Infrastructure should be replaceable without changing domain language.

### UI

Contains rendering concerns:

- Reusable UI components.
- Feature widgets.
- Forms.
- Tables.
- Modals.
- Page sections.

UI components should receive clear props and avoid hiding business logic inside presentation code.

### Model

Contains frontend state models where needed:

- Form models.
- View models.
- Local selectors.
- Derived state helpers.

Keep model code explicit and easy to reason about.

## Domain boundaries

### Core domains

- `doctors`: doctor profiles, specialties, schedules, assignment views.
- `patients`: patient cards, profile views, dental record-related screens.
- `planning`: appointments, treatment plans, scheduling flows, calendar-related UI.

### Supporting domain

- `authorization`: sign-in, session handling, role-aware navigation, permissions.

### Cross-domain rule

Cross-domain dependencies must be intentional and small. Shared UI elements should live in `shared/ui`, while business-specific components must remain in their own domain.

## Reusable components

All components must be reusable and easy to understand.

### Component rules

- Build small components with one clear responsibility.
- Prefer composition over large configurable mega-components.
- Keep prop names predictable and business-oriented.
- Avoid deeply nested component trees when a simpler split is possible.
- Separate container logic from presentational UI where it improves readability.
- Keep components close to the domain they belong to unless they are truly generic.

### Shared UI examples

Good candidates for `shared/ui`:

- Buttons.
- Inputs.
- Selects.
- Modals.
- Tables.
- Page headers.
- Status badges.
- Empty states.
- Loaders.
- Confirm dialogs.

Business-specific widgets such as `DoctorScheduleGrid` or `TreatmentPlanTimeline` should stay in their domain modules.

## UI and design rules

The interface must be minimalistic and understandable.

### Visual standards

- Use restrained spacing, color, and typography.
- Emphasize hierarchy through layout, not decoration.
- Use company brand tokens for colors, typography, and spacing.
- Keep interactive patterns consistent across pages.
- Avoid unnecessary animations, gradients, and visual overload.
- Prefer readable forms, clear tables, and predictable navigation.

### UX standards

- Primary actions must be obvious.
- Destructive actions must be explicit and guarded.
- Empty, loading, and error states must always be designed.
- Forms must show validation clearly.
- Accessibility and keyboard navigation must be considered from the start.

## Strict linters

Strict linting is mandatory.

Recommended baseline:

- TypeScript strict mode enabled.
- ESLint with strict rules.
- Prettier only if needed, but avoid conflicts with the linter setup.
- Import ordering and unused import detection.
- Rules against `any`, dead code, and implicit unsafe patterns where practical.

Example expectations:

- No unused variables.
- No implicit `any`.
- No uncontrolled dependency cycles.
- No silent ignored promises.
- No ad hoc styling approaches that bypass the design system.

Example `tsconfig` expectations:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true
  }
}
```

## Secrets management

Secrets must never be stored in frontend source code.

Rules:

- Keep secrets only in `.env`.
- Commit `.env.example`, never real `.env` values.
- Access configuration through environment variables.
- Never hardcode tokens, API keys, or private endpoints in source files.
- Public frontend configuration should still be treated carefully and documented explicitly.

Example `.env.example`:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Dental Frontend
```

## Styling and company style

The UI must follow company style through a shared design language.

Recommended approach:

- Centralize design tokens.
- Define semantic colors such as primary, secondary, danger, border, background, and text.
- Use shared spacing, radius, and typography scales.
- Wrap common patterns in reusable components instead of repeating raw markup.

This keeps the product visually consistent and reduces accidental design drift between domains.

## Architecture rules

- Keep business logic out of low-level UI components.
- Keep page files thin and focused on composition.
- Use domain folders for domain behavior, not just for grouping screens.
- Do not mix authorization logic into unrelated UI components.
- Avoid giant global stores when local/domain state is enough.
- Prefer explicit interfaces and typed contracts for API communication.
- Reuse patterns, not copy-pasted implementations.

## Suggested feature examples

Examples of frontend features in this dental system:

- Doctor list and doctor profile view.
- Patient directory and patient details screen.
- Treatment planning board.
- Appointment calendar and rescheduling flow.
- Role-based navigation and protected routes.
- Authorization screens for sign-in and access control.

## Delivery standard

A senior UI React frontend developer in this project is expected to:

- Work from the `frontend/` directory.
- Maintain strict linting and type safety.
- Build minimalistic and understandable interfaces.
- Follow company style consistently.
- Keep secrets only in `.env`.
- Structure code by DDD around dental business domains.
- Create reusable, readable, and maintainable components.
- Favor clear architecture over short-term convenience.
