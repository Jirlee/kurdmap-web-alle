# KurdMap Frontend (Angular SSR) — Multi-stage build
# Build: podman build -f docker/frontend.Dockerfile -t kurdmap-frontend .
FROM docker.io/library/node:22-alpine AS build
WORKDIR /app

# Copy package files first for layer caching
COPY src/kurdmap-frontend/package.json src/kurdmap-frontend/package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY src/kurdmap-frontend/ .
RUN npx ng build --configuration production

# Runtime — Node for SSR
FROM docker.io/library/node:22-alpine AS runtime
WORKDIR /app

RUN adduser -D -g '' appuser

# Copy built output
COPY --from=build /app/dist/kurdmap-frontend/ ./dist/kurdmap-frontend/

# Install only production dependencies for the SSR server
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

USER appuser

ENV PORT=4000
ENV NODE_ENV=production
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/ || exit 1

CMD ["node", "dist/kurdmap-frontend/server/server.mjs"]
