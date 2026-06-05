# RUN Guide (Podman)

All commands are executed from `docker/` unless stated otherwise.

## 1) First-time Setup

```bash
cd docker
cp .env.example .env
```

Generate strong secrets:

```bash
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -base64 32)|" .env
sed -i "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=$(openssl rand -base64 32)|" .env
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -base64 48)|" .env
```

Default host ports are conflict-safe:

- Postgres host port: `55432`
- Redis host port: `56379`
- API host port: `8080`
- Frontend host port: `4000`

## 2) Build / Start / Stop

```bash
podman compose build
podman compose up -d
podman compose ps
podman compose logs -f
podman compose down --remove-orphans
```

Safe restart (recommended with podman-compose):

```bash
podman compose down --remove-orphans
podman compose up -d
```

From scratch (clean simulation):

```bash
podman compose down -v --remove-orphans
podman compose build --no-cache
podman compose up -d
```

## 3) Health Checks

```bash
curl -fsS http://localhost:8080/health
curl -fsI http://localhost:4000/
podman exec kurdmap-admin sh -c 'test -f /dist/index.html && echo admin-static-ok'
```

## 4) Logs (all services)

```bash
podman logs kurdmap-postgres --tail=100
podman logs kurdmap-redis --tail=100
podman logs kurdmap-api --tail=100
podman logs kurdmap-frontend --tail=100
podman logs kurdmap-admin --tail=100
```

## 5) Endpoint Verification

```bash
# API
curl -fsS http://localhost:8080/health

# Frontend SSR
curl -fsI http://localhost:4000/

# Admin artifacts (served externally)
podman exec kurdmap-admin ls /dist | head
```

## 6) Backup / Restore

```bash
mkdir -p ../backups
BACKUP_DIR=../backups ./backup.sh

# Restore example
gunzip -c ../backups/<file>.sql.gz | podman exec -i kurdmap-postgres psql -U postgres -d kurdmap_dev
```

## 7) Recovery Playbook

```bash
# 1) Stop and remove stack
podman compose down --remove-orphans

# 2) Start stack again
podman compose up -d

# 3) Validate
podman compose ps
curl -fsS http://localhost:8080/health
curl -fsI http://localhost:4000/
```

## 8) Common Issues

Port already in use:

- change `POSTGRES_PORT` / `REDIS_PORT` / `API_PORT` in `docker/.env`
- then run `podman compose down --remove-orphans && podman compose up -d`

Created/stuck containers:

```bash
podman compose down --remove-orphans
podman rm -f kurdmap-api kurdmap-admin kurdmap-frontend kurdmap-postgres kurdmap-redis 2>/dev/null || true
podman compose up -d
```

Disk pressure:

```bash
podman image prune -af
podman container prune -f
podman volume prune -f
```

## 9) Admin Serving Model (No nginx)

- Admin image only builds and publishes static files to volume `admin-static`.
- No internal Admin HTTP server exists inside the container.
- In production, host Caddy serves static files from host path mapped to this volume.
