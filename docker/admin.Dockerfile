# KurdMap Admin Panel (Angular 21 SPA)
#
# Both runtimes serve the same compiled SPA through a small, hardened
# SPA-aware HTTP server (docker/admin-server.py) on port 8080:
# - dev-runtime:  local QA/testing
# - prod-runtime: served behind the host Caddy reverse proxy (like the frontend)
#
# The server emits `X-Robots-Tag: noindex` on every response and a
# disallow-all robots.txt, so the admin panel is never indexed by search
# engines and is reachable only by its direct URL.
#
# Build examples:
#   Dev:  podman build -f docker/admin.Dockerfile --target dev-runtime -t kurdmap-admin:dev .
#   Prod: podman build -f docker/admin.Dockerfile --target prod-runtime -t kurdmap-admin:prod .

# ── Stage 1: Build ────────────────────────────────────────
FROM docker.io/library/node:26-alpine AS build
WORKDIR /app

COPY src/kurdmap-admin/package.json src/kurdmap-admin/package-lock.json ./
RUN npm ci --ignore-scripts

COPY src/kurdmap-admin/ .
RUN npx ng build --configuration production

# ── Stage 2a: Dev runtime (local SPA server) ──────────────
FROM docker.io/library/alpine:3.20 AS dev-runtime

RUN apk add --no-cache python3 \
    && addgroup -S admin && adduser -S admin -G admin

COPY --from=build /app/dist/kurdmap-admin/browser /dist/
COPY docker/admin-server.py /usr/local/bin/admin-server.py

RUN chown -R admin:admin /dist

USER admin
WORKDIR /dist

ENV PORT=8080
EXPOSE 8080

# SPA-aware server: falls back to index.html for client-side routes.
CMD ["python3", "/usr/local/bin/admin-server.py"]

# ── Stage 2b: Production runtime (hardened SPA server) ────
# Serves the SPA on a loopback port for the host Caddy reverse proxy.
# Runs as a non-root user, needs no writable filesystem (read_only-safe),
# and never lets the admin panel be indexed by search engines.
FROM docker.io/library/alpine:3.20 AS prod-runtime

RUN apk add --no-cache python3 \
    && addgroup -S admin && adduser -S admin -G admin

COPY --from=build /app/dist/kurdmap-admin/browser /dist/
COPY docker/admin-server.py /usr/local/bin/admin-server.py

RUN chown -R admin:admin /dist

USER admin
WORKDIR /dist

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["python3", "/usr/local/bin/admin-server.py"]
