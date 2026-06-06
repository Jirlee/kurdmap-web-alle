# KurdMap — Deployment Guide (Podman)

This guide describes how to build, run, seed, and operate the full KurdMap stack
with **Podman** + **podman-compose**. All compose files live in the [`docker/`](docker/)
directory and **every command must be run from inside `docker/`**.

```bash
cd docker
```

---

## 1. Architecture

| Service    | Container          | Image                      | Internal port | Host port (dev)        |
| ---------- | ------------------ | -------------------------- | ------------- | ---------------------- |
| PostgreSQL | `kurdmap-postgres` | `postgres:17-alpine`       | 5432          | `55432`                |
| Redis      | `kurdmap-redis`    | `redis:7-alpine`           | 6379          | `56379`                |
| API (.NET) | `kurdmap-api`      | `kurdmap-api:local`        | 8080          | `127.0.0.1:8080`       |
| Frontend   | `kurdmap-frontend` | `kurdmap-frontend:local`   | 4000          | `127.0.0.1:4000`       |
| Admin SPA  | `kurdmap-admin`    | `kurdmap-admin:local`      | static volume | `127.0.0.1:4201` (dev) |

**Network isolation (two zones):**

- `frontend-net` — exposed services (API, Frontend, Admin).
- `backend-net` — `internal: true`, no internet access. PostgreSQL and Redis are
  completely isolated and reachable **only** from the API.

The Admin panel is a static SPA: its build artifacts are published to the
`admin-static` named volume and served by an external web server (Caddy on the
host in production, a lightweight static server in dev).

---

## 2. Prerequisites

```bash
podman --version          # >= 4.x
podman compose version    # podman-compose plugin
```

- Rocky Linux / RHEL / Debian host with rootless Podman recommended.
- Open host ports only via the reverse proxy (Caddy). API/Frontend/Admin bind to
  `127.0.0.1` by design — never expose them directly to the internet.

---

## 3. Configuration (`.env`)

Copy the template and fill in **strong, unique** secrets:

```bash
cp .env.example .env
```

Generate secrets:

```bash
# JWT secret
openssl rand -base64 48
# Postgres / Redis passwords
openssl rand -base64 24
```

Key variables (see [`docker/.env.example`](docker/.env.example) for the full list):

| Variable               | Purpose                                   | Notes                                         |
| ---------------------- | ----------------------------------------- | --------------------------------------------- |
| `ENVIRONMENT`          | `Development` / `Production`              | Controls `ASPNETCORE_ENVIRONMENT`             |
| `POSTGRES_DB`          | Database name                             | Default `kurdmap_dev`                         |
| `POSTGRES_USER`        | DB user                                   | Default `postgres`                            |
| `POSTGRES_PASSWORD`    | DB password                              | **Required** — strong value                   |
| `REDIS_PASSWORD`       | Redis password                            | **Required**                                  |
| `JWT_SECRET`           | JWT signing key                           | **Required** — `openssl rand -base64 48`      |
| `JWT_ISSUER` / `JWT_AUDIENCE` | Token issuer/audience              | e.g. `https://gs6xapi.kurdmap.eu`                 |
| `Cors__AllowedOrigins__0/1` | Allowed front-end origins            | Frontend + Admin URLs                         |
| `SEED_ADMIN_EMAIL`     | First admin email                         | Seeded only on an **empty** user table        |
| `SEED_ADMIN_PASSWORD`  | First admin password                      | Must satisfy Identity policy (see note below) |

> **Password policy:** the seed admin password must contain an uppercase letter,
> a lowercase letter, a digit, and a non-alphanumeric character (length ≥ 6).
> Example used in development: `Admin123!@#`. **Change it for production.**

---

## 4. First-time deployment

```bash
cd docker

# 1. Build all images
podman compose build

# 2. Start the full stack (Postgres + Redis + API + Admin + Frontend)
podman compose up -d

# 3. Wait for health, then verify
podman compose ps
make health        # API / Frontend / Admin health checks
```

On startup the API automatically:

1. Applies all EF Core migrations (creates tables).
2. Seeds the roles (`User`, `Admin`, `SuperAdmin`).
3. Seeds the default admin **only if the user table is empty**, using
   `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`.

---

## 5. Seed sample data (categories already seeded by the API)

Categories and cities are inserted by the application seeders. To load **sample
businesses** (for demos / staging) run the bundled SQL **after** the API has
migrated the database:

```bash
cd docker
make seed
# equivalent to:
# podman compose exec -T postgres psql -U postgres -d kurdmap_dev < seed-data.sql
```

> The business search endpoint caches results in Redis for 5 minutes. After
> seeding, either wait for the TTL or flush the relevant keys so new data appears
> immediately:
>
> ```bash
> PW=$(grep -E '^REDIS_PASSWORD=' .env | cut -d= -f2-)
> podman exec kurdmap-redis redis-cli -a "$PW" --no-auth-warning \
>   --scan --pattern 'KurdMap:search:*' | \
>   xargs -r -I{} podman exec kurdmap-redis redis-cli -a "$PW" --no-auth-warning DEL "{}"
> ```

---

## 6. Smoke tests

```bash
# API health
curl -s http://localhost:8080/health        # -> 200

# Register a new user
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Test@123456","confirmPassword":"Test@123456"}'

# Login (admin)
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@kurdmap.de","password":"Admin123!@#"}'

# Data endpoints
curl -s http://localhost:8080/api/v1/categories | head -c 200
curl -s 'http://localhost:8080/api/v1/businesses/search?page=1&pageSize=5' | head -c 200
curl -s http://localhost:8080/api/v1/cities | head -c 200
```

Front-end checks:

- Frontend: <http://localhost:4000>
- Admin: <http://localhost:4201> (dev)

---

## 7. Updating a service

Rebuild and recreate a single service (e.g. after a code change):

```bash
cd docker
podman compose build api        # or frontend / admin
podman compose up -d api
```

If podman-compose reports a **name/port conflict** on recreate, force-replace the
container:

```bash
podman rm -f --depend kurdmap-api
podman compose up -d
```

---

## 8. Common operations (Makefile)

Run from `docker/`:

| Command            | Action                                            |
| ------------------ | ------------------------------------------------- |
| `make build`       | Build all images                                  |
| `make run`         | Start all services (detached)                     |
| `make ps`          | Show service status                               |
| `make logs-api`    | Follow API logs                                   |
| `make health`      | Health-check API / Frontend / Admin               |
| `make seed`        | Load sample business data                         |
| `make shell-db`    | Open `psql` in the Postgres container             |
| `make shell-redis` | Open `redis-cli`                                  |
| `make backup`      | Backup PostgreSQL to `./backups`                  |
| `make restore FILE=...` | Restore a backup                             |
| `make restart`     | Safe restart (`down` + `up`)                      |
| `make reset`       | Full reset incl. volumes, then rebuild + start    |

---

## 9. Production notes

- Use `docker-compose.prod.yml` and registry images instead of local builds:

  ```bash
  podman compose -f docker-compose.yml -f docker-compose.prod.yml up -d
  ```

- Terminate TLS at **Caddy** (host reverse proxy). Only Caddy is internet-facing;
  API/Frontend/Admin stay bound to `127.0.0.1`.
- Set `ENVIRONMENT=Production` and provide production `Cors__AllowedOrigins__*`,
  `JWT_*`, and database/redis secrets.
- Rotate `JWT_SECRET`, DB and Redis passwords; never commit `.env`.
- Schedule `make backup` (cron / systemd timer) and test `make restore`.

---

## 10. Troubleshooting

| Symptom                                   | Cause / Fix                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `businesses/search` returns `totalCount:0` after seeding | Stale Redis cache — flush `KurdMap:search:*` (see §5) or wait 5 min.        |
| Admin login `401 Invalid credentials`     | Wrong `SEED_ADMIN_PASSWORD`, or admin seeded earlier with a different one.  |
| Admin not seeded on fresh deploy          | Seed runs only when the user table is empty; check API logs for policy errors. |
| Name/port conflict on `up -d`             | `podman rm -f --depend <container>` then `podman compose up -d`.            |
| SIGTERM→SIGKILL warning on `stop`         | Non-blocking; containers stopped normally.                                  |
| DB connection refused at API startup      | API waits for Postgres/Redis health; check `make logs-api`.                 |
