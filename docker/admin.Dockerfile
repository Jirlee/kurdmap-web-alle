# KurdMap Admin Panel (Angular 21 SPA)
#
# This Dockerfile provides two runtimes from the same build output:
# - dev-runtime: serves admin via local HTTP (for local QA/testing)
# - prod-runtime: static artifact publisher only (for host Caddy serving)
#
# Build examples:
#   Dev:  podman build -f docker/admin.Dockerfile --target dev-runtime -t kurdmap-admin:dev .
#   Prod: podman build -f docker/admin.Dockerfile --target prod-runtime -t kurdmap-admin:prod .

# ── Stage 1: Build ────────────────────────────────────────
FROM docker.io/library/node:22-alpine AS build
WORKDIR /app

COPY src/kurdmap-admin/package.json src/kurdmap-admin/package-lock.json ./
RUN npm ci --ignore-scripts

COPY src/kurdmap-admin/ .
RUN npx ng build --configuration production

# ── Stage 2a: Dev runtime (local HTTP server) ─────────────
FROM docker.io/library/alpine:3.20 AS dev-runtime

RUN apk add --no-cache python3

RUN addgroup -S admin && adduser -S admin -G admin

COPY --from=build /app/dist/kurdmap-admin/browser /dist/
COPY docker/admin-dev-server.py /usr/local/bin/admin-dev-server.py

RUN chown -R admin:admin /dist

USER admin
WORKDIR /dist

EXPOSE 8081

# Run a SPA-aware server that falls back to index.html for route paths.
CMD ["python3", "/usr/local/bin/admin-dev-server.py"]

# ── Stage 2b: Production runtime (no web server) ──────────
FROM docker.io/library/alpine:3.20 AS prod-runtime

RUN addgroup -S admin && adduser -S admin -G admin

# Build artifacts baked into the image (read-only source of truth)
COPY --from=build /app/dist/kurdmap-admin/browser /artifacts/

# Mount point for the named volume that an external server reads from
RUN mkdir -p /dist && chown -R admin:admin /artifacts /dist

USER admin
WORKDIR /dist

# On start: publish the latest build to the shared volume, then idle.
# The container exposes no ports and runs no server.
CMD ["sh", "-c", "cp -a /artifacts/. /dist/ && echo 'KurdMap admin static assets published to /dist (serve externally).' && exec tail -f /dev/null"]
