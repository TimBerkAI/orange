# Senior DevOps Skill Guide

## Project context

This guide defines conventions for a senior-level DevOps setup focused on secure, maintainable, and resource-aware delivery. The environment does not use CI/CD because resources are limited, so the system must stay simple, reproducible, and safe to operate manually.

## Core principles

The DevOps approach must prioritize:

- Safe technologies.
- Minimal attack surface.
- Reproducible environments.
- Clear configuration separation.
- Fast builds and lightweight containers.
- Operational simplicity without CI/CD.

## Container image policy

Use modern, maintained, and minimal base images.

### Rules

- Prefer small and actively maintained images.
- Pin image versions explicitly.
- Avoid outdated or end-of-life base images.
- Use slim or minimal variants where practical.
- Remove unnecessary packages and build tools from runtime images.
- Prefer multi-stage builds to keep runtime containers small.

### Goals

- Faster image pulls.
- Faster builds.
- Smaller attack surface.
- Easier patching and review.

### Dockerfile expectations

Dockerfiles must be minimal, readable, and fast.

Recommended practices:

- Use multi-stage builds.
- Copy only required files.
- Leverage layer caching.
- Avoid installing debugging tools in production runtime images.
- Run processes as non-root where possible.
- Keep one clear responsibility per container.

Example direction:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist ./
```

## Nginx policy

All web traffic must go through Nginx.

### Responsibilities of Nginx

- Serve frontend static files.
- Act as reverse proxy for backend services.
- Centralize HTTP routing.
- Terminate TLS when used.
- Apply common security headers.
- Limit direct exposure of internal services.

### Rules

- Do not expose application containers directly to the public web unless explicitly required.
- Route public HTTP and HTTPS traffic through Nginx.
- Keep Nginx configuration explicit and versioned.
- Separate site config, proxy config, and static serving rules clearly.

## Configuration placement

Additional configuration must be placed in the `container/` folder, not embedded directly inside Dockerfiles.

### Rules

- Store Nginx config in `container/nginx/`.
- Store entrypoint scripts in `container/scripts/`.
- Store service-specific config files in dedicated subfolders under `container/`.
- Keep Dockerfiles focused on image assembly, not long inline config generation.
- Avoid large shell heredocs inside Dockerfiles for operational config.

### Suggested structure

```text
container/
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── app.conf
├── scripts/
│   ├── start-backend.sh
│   └── start-worker.sh
└── env/
    └── example.env
```

This keeps infrastructure concerns readable, reviewable, and easier to change independently from image build logic.

## Security baseline

Use only safe and maintained technologies.

### Required practices

- Prefer maintained software versions.
- Remove deprecated or obsolete dependencies.
- Disable unnecessary ports and services.
- Use non-root users where practical.
- Keep secrets outside source code.
- Limit container privileges.
- Use read-only filesystems where feasible.
- Keep dependency sets small.
- Patch base images regularly.

### Threat posture

The system should explicitly defend against common and long-known attack patterns.

Examples of areas to protect against:

- Exposed admin panels.
- Weak default credentials.
- Unrestricted container privileges.
- Publicly reachable internal services.
- Unvalidated proxy headers.
- Directory listing and unsafe static serving.
- Outdated packages with known vulnerabilities.

The phrase “deprecated hacker attacks” should be interpreted as protection against old, well-known, preventable attack vectors by refusing insecure defaults and outdated software.

## Secrets handling

Secrets must never be stored in source code or hardcoded in Dockerfiles.

Rules:

- Use `.env` files or environment injection at runtime.
- Commit only `.env.example`.
- Never commit production secrets.
- Pass secrets to containers through environment configuration.
- Do not bake credentials into container images.

## No CI/CD approach

This setup intentionally avoids CI/CD because resources are limited.

### Operating model

- Keep deployment steps documented and repeatable.
- Use simple manual release procedures.
- Prefer `docker compose`-based workflows.
- Keep commands short and deterministic.
- Reduce moving parts instead of compensating with automation.

### What this means in practice

- Strong local reproducibility matters more.
- Linting, testing, and image builds should run manually before release.
- Release checklists should be simple and explicit.
- Environment parity between local and server should be preserved as much as possible.

## Docker Compose expectations

Use Docker Compose for service orchestration where appropriate.

Typical services:

- `nginx`
- `frontend`
- `backend`
- `db`
- `redis`
- `worker` if background jobs are needed

Principles:

- Use internal networks.
- Expose only Nginx to public ports.
- Keep service names predictable.
- Mount configuration from `container/` where needed.

## Example repository layout

```text
project/
├── container/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── conf.d/
│   │       └── app.conf
│   ├── scripts/
│   └── env/
├── frontend/
├── backend/
├── docker-compose.yml
├── .env
└── .env.example
```

## Operational rules

- Keep infrastructure understandable for manual operations.
- Prefer explicit configuration over hidden magic.
- Audit exposed ports regularly.
- Rebuild images when base image updates are available.
- Keep Nginx as the only public web entry point.
- Keep additional config in `container/`, not generated inline in Dockerfiles.
- Avoid unnecessary services when no operational value exists.

## Delivery standard

A senior DevOps engineer in this project is expected to:

- Use new, minimal, and safe container images.
- Write fast and compact Dockerfiles.
- Route all web traffic through Nginx.
- Keep extra configuration in the `container/` folder.
- Prefer maintained and secure technologies.
- Reduce exposure to old and preventable attack vectors.
- Operate effectively without CI/CD by using simple, reproducible manual workflows.
