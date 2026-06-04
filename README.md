# `docker/` — Deployment artifacts

All Podman/Docker build and runtime support files live here. Compose files stay at the repo root (Docker convention) so `podman compose` can find them automatically.

| File | Purpose | Used in |
|------|---------|---------|
| `api.Dockerfile` | Multi-stage build for the .NET 10 API. Base: `mcr.microsoft.com/dotnet/sdk:10.0` → `aspnet:10.0`. Installs `libkrb5-3` for Npgsql GSSAPI. | dev build (`docker-compose.override.yml`), CI image push |
| `admin.Dockerfile` | Multi-stage build for Angular 21 admin SPA. Built with `node:22-alpine`, served by `nginx:alpine` as non-root. | dev build, CI image push |
| `frontend.Dockerfile` | Multi-stage build for Angular SSR public site. Runtime is `node:22-alpine` running `server.mjs`. | dev build, CI image push |
| `admin-nginx.conf` | Nginx server block for the admin SPA: gzip, long-cache static assets, `/api/` proxy to backend, SPA fallback, security headers. | baked into `admin` image |
| `Caddyfile` | Host-level reverse proxy snippet imported by the production server's main `/etc/caddy/Caddyfile` via `import /opt/kurdmap/docker/Caddyfile*`. Provides Auto-TLS for `kurdmap.de`, `admin.kurdmap.de`, `api.kurdmap.de`. **Not used in local dev.** | production server only |
| `backup.sh` | `pg_dump | gzip` with retention pruning. Detects `podman` or `docker` automatically. | manual or cron on production |
| `seed-data.sql` | Idempotent (`ON CONFLICT DO NOTHING`) test fixtures: businesses, menu items, services, ads, reviews, favorites. Run **after** the API has applied EF Core migrations. | `make seed`, dev only |

## Conventions

- **Build context** is always the repo root (`.`), so Dockerfiles reference `src/…` paths.
- **Compose files** at repo root: `docker-compose.yml` (base), `docker-compose.override.yml` (dev, auto-loaded), `docker-compose.prod.yml` (prod, explicit).
- **Image names**: `kurdmap-api`, `kurdmap-admin`, `kurdmap-frontend`. In production they are pulled from `ghcr.io/<GHCR_USERNAME>/kurdmap-*:latest`.
- **No source code on the production server** — only the files in this folder plus the compose files and `.env`.

See [../RUN.md](../RUN.md) for runtime commands and [../Docs/Roadmaps/04-server-deployment-guide.md](../Docs/Roadmaps/04-server-deployment-guide.md) for the full server runbook.
