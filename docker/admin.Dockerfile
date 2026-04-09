# KurdMap Admin Panel (Angular 21 SPA) — Multi-stage build
# Build: podman build -f docker/admin.Dockerfile -t kurdmap-admin .
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files first for layer caching
COPY src/kurdmap-admin/package.json src/kurdmap-admin/package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY src/kurdmap-admin/ .
RUN npx ng build --configuration production

# Runtime — Nginx for SPA serving
FROM nginx:alpine AS runtime

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config
COPY docker/admin-nginx.conf /etc/nginx/conf.d/default.conf

# Copy built output
COPY --from=build /app/dist/kurdmap-admin/browser /usr/share/nginx/html

# Run as non-root (Docs/Security/16)
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx && \
    touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid

# Pre-create nginx cache subdirs (avoids mkdir failures at runtime)
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx

USER nginx

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
