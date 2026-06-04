# KurdMap — Quickstart (Podman)

Practical commands to run, inspect, and stop the stack from your terminal.
For server / CI / TLS details, see [Docs/Roadmaps/04-server-deployment-guide.md](Docs/Roadmaps/04-server-deployment-guide.md).

---

## 1. Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Podman | ≥ 4.x | `podman --version` |
| podman-compose **or** `podman compose` | any | `podman compose version` |
| openssl | any | `openssl version` |
| Free disk | ≥ 8 GB | `df -h /` |

Optional for local builds: `dotnet 10 SDK`, `node 22`, `npm`.

> **All compose commands run from the [docker/](docker/) folder.**

---

## 2. First-time setup

```bash
cd docker

# 1. Create .env from the template (one-time)
cp .env.example .env

# 2. Generate strong secrets
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -base64 32)|" .env
sed -i "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=$(openssl rand -base64 32)|" .env
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -base64 48)|"            .env

# 3. Local development defaults
sed -i "s|^ENVIRONMENT=.*|ENVIRONMENT=Development|" .env
sed -i "s|^POSTGRES_DB=.*|POSTGRES_DB=kurdmap_dev|" .env
sed -i "s|^POSTGRES_USER=.*|POSTGRES_USER=postgres|" .env
```

> `.env` is gitignored. Never commit it.

---

## 3. Start

All commands below assume `cd docker` first.

### A) Database + Redis only (fastest — for local API dev)
```bash
podman compose up -d postgres redis
```

### B) Full stack (builds API + Admin + Frontend on first run — needs ~6 GB free disk)
```bash
podman compose up -d --build
```

### C) Production-like (uses GHCR images, security hardening)
```bash
podman compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build
```

Verify:
```bash
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected ports (dev):

| Service  | URL                          |
|----------|------------------------------|
| API      | http://localhost:8080/health |
| Admin    | http://localhost:8081        |
| Frontend | http://localhost:4000        |
| Postgres | localhost:5432               |
| Redis    | localhost:6379               |

---

## 4. Logs

```bash
podman compose logs -f                 # all services, follow
podman compose logs -f api             # one service
podman compose logs --tail=100 api     # last 100 lines
podman logs kurdmap-api                # by container name
```

---

## 5. Restart / Stop

```bash
podman compose restart api              # restart one service
podman compose restart                  # restart all
podman compose down                     # stop + remove containers (keeps volumes)
podman compose down -v                  # stop + DELETE volumes (wipes DB!)
```

---

## 6. Database

```bash
# Open psql shell
podman exec -it kurdmap-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# Seed test data (after API has applied migrations)
podman exec -i kurdmap-postgres psql -U postgres -d kurdmap_dev < docker/seed-data.sql

# Backup
./docker/backup.sh                      # writes to ./backups or $BACKUP_DIR

# Reset database (DESTRUCTIVE)
podman compose down -v && podman compose up -d
```

Source the env first if a command needs `$POSTGRES_USER` / `$REDIS_PASSWORD`:
```bash
set -a && . ./.env && set +a
```

---

## 7. Troubleshooting

| Symptom | Try |
|--------|-----|
| `no space left on device` during pull | `podman image prune -af && podman volume prune -f` |
| Container marked `unhealthy` | `podman inspect <name> --format '{{json .State.Health}}' \| jq` |
| Port already in use | Edit `API_PORT` / `POSTGRES_PORT` / `REDIS_PORT` in `.env` |
| `.env` not picked up | Run from repo root; check `.env` exists and has no `\r` (`dos2unix .env`) |
| API can't reach DB | Verify both on `backend-net`: `podman network inspect kurdmap-web-alle_backend-net` |
| Redis auth fails | Confirm `REDIS_PASSWORD` matches in `.env` and connection string |
| Build cache stale | `podman compose build --no-cache <service>` |
| Permission denied on volumes (rootless) | `podman unshare chown -R 999:999 ~/.local/share/containers/storage/volumes/...` |
| Reset everything | `podman compose down -v && podman system prune -af` |

Inspect a container:
```bash
podman exec -it kurdmap-api sh
podman compose ps
podman stats --no-stream
```

---

## 8. Important environment variables

Defined in `.env` (see `.env.example` for the full list).

| Variable | Required | Purpose |
|----------|----------|---------|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | ✅ | Database credentials |
| `REDIS_PASSWORD` | ✅ | Redis auth (used by `--requirepass`) |
| `JWT_SECRET` | ✅ | API signing key — **min 48 chars**, `openssl rand -base64 48` |
| `JWT_ISSUER` / `JWT_AUDIENCE` | ✅ | JWT validation |
| `ENVIRONMENT` | ✅ | `Development` or `Production` (sets `ASPNETCORE_ENVIRONMENT`) |
| `FRONTEND_URL` / `ADMIN_URL` | ✅ | CORS allow-list |
| `API_PORT` / `POSTGRES_PORT` / `REDIS_PORT` | optional | Override host-side ports if conflicting |
| `GHCR_USERNAME` | prod only | Used by `docker-compose.prod.yml` to pull `ghcr.io/<user>/kurdmap-*` |
| `API_DOMAIN` | prod only | Adds to `AllowedHosts` for ASP.NET Core |

---

## 9. Make targets (shortcuts)

```bash
make help            # list all targets
make run             # podman compose up -d
make run-dev         # postgres + redis only
make stop            # down
make logs            # follow all logs
make logs-api        # follow API only
make health          # curl health endpoints
make seed            # load docker/seed-data.sql
make db-reset        # wipe + rebuild + seed
make backup          # pg_dump → backups/
make clean           # down -v + remove build artifacts
```

---

## 10. File map (deployment artifacts)

```
docker/                       ← run all `podman compose` commands from here
├── .env.example              ← template; copy to .env (gitignored)
├── docker-compose.yml        ← base stack (5 services + 2 networks)
├── docker-compose.override.yml ............ dev: build contexts + 0.0.0.0 (auto-loaded)
├── docker-compose.prod.yml   ← prod: GHCR images + 8 security layers
├── Makefile                  ← shortcuts (run from docker/)
├── api.Dockerfile            ← .NET 10 multi-stage
├── admin.Dockerfile          ← Angular 21 SPA + nginx
├── frontend.Dockerfile       ← Angular SSR (Node)
├── admin-nginx.conf          ← nginx config for admin SPA
├── Caddyfile                 ← host-side reverse proxy (production only)
├── backup.sh                 ← pg_dump + gzip + retention
└── seed-data.sql             ← test fixtures

.dockerignore                 ← at repo root (build context root)
hooks/pre-commit              ← secret scanner (install: see file header)
```
