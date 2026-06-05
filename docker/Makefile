.PHONY: help build build-no-cache run run-dev run-dev-auto stop restart down reset ps logs logs-api logs-frontend logs-admin shell-api shell-db shell-redis health test-backend seed db-reset backup restore clean prune admin-start admin-stop admin-rebuild admin-test

COMPOSE := podman compose

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-22s\033[0m %s\n", $$1, $$2}'

# === Build ===
build: ## Build all images
	$(COMPOSE) build

build-no-cache: ## Build all images without cache
	$(COMPOSE) build --no-cache

# === Run ===
run: ## Start all services in background
	$(COMPOSE) up -d

run-dev: ## Start only postgres + redis
	$(COMPOSE) up -d postgres redis

run-dev-auto: ## Start full dev stack with automatic Admin port selection
	./start-dev.sh

stop: ## Stop containers (keep resources)
	$(COMPOSE) stop

down: ## Stop and remove containers + networks (keep volumes)
	$(COMPOSE) down --remove-orphans

restart: ## Safe restart for podman-compose (down + up)
	$(COMPOSE) down --remove-orphans
	$(COMPOSE) up -d

reset: ## Full reset (containers+networks+volumes), then start
	$(COMPOSE) down -v --remove-orphans
	$(COMPOSE) up -d --build

ps: ## Show services status
	$(COMPOSE) ps

# === Logs ===
logs: ## Follow all logs
	$(COMPOSE) logs -f

logs-api: ## Follow API logs
	$(COMPOSE) logs -f api

logs-frontend: ## Follow Frontend logs
	$(COMPOSE) logs -f frontend

logs-admin: ## Follow Admin logs (static publisher)
	$(COMPOSE) logs -f admin

admin-start: ## Start admin service only
	$(COMPOSE) up -d admin

admin-stop: ## Stop admin service only
	$(COMPOSE) stop admin

admin-rebuild: ## Rebuild admin and restart it
	$(COMPOSE) build admin
	$(COMPOSE) up -d admin

admin-test: ## Test local admin HTTP endpoint
	@PORT=$${ADMIN_DEV_PORT:-4201}; \
	  echo "Admin URL: http://localhost:$$PORT"; \
	  curl -fsI "http://localhost:$$PORT/login" >/dev/null || curl -fsI "http://localhost:$$PORT/" >/dev/null; \
	  echo "Admin endpoint OK"

# === Shell ===
shell-api: ## Open shell in API container
	podman exec -it kurdmap-api sh

shell-db: ## Open psql shell in PostgreSQL container
	podman exec -it kurdmap-postgres psql -U postgres -d kurdmap_dev

shell-redis: ## Open redis-cli in Redis container
	podman exec -it kurdmap-redis redis-cli

# === Health / Verification ===
health: ## Basic health checks for exposed endpoints
	@echo "API:      $$(curl -sf http://localhost:8080/health >/dev/null && echo OK || echo FAIL)"
	@echo "Frontend: $$(curl -sf http://localhost:4000 >/dev/null && echo OK || echo FAIL)"
	@echo "Admin:    $$(podman exec kurdmap-admin sh -c 'test -f /dist/index.html' >/dev/null 2>&1 && echo OK || echo FAIL)"

test-backend: ## Run backend tests
	cd ../src && dotnet test KurdMap.Tests/ --verbosity normal

# === Database ===
seed: ## Seed test data (after API migration)
	$(COMPOSE) exec -T postgres psql -U postgres -d kurdmap_dev < seed-data.sql

db-reset: ## Reset database volume and restart
	$(COMPOSE) down -v --remove-orphans
	$(COMPOSE) up -d --build postgres redis api admin frontend

backup: ## Backup PostgreSQL to ./backups
	@mkdir -p ../backups
	BACKUP_DIR=../backups ./backup.sh

restore: ## Restore PostgreSQL backup (usage: make restore FILE=../backups/file.sql.gz)
	gunzip -c $(FILE) | podman exec -i kurdmap-postgres psql -U postgres -d kurdmap_dev

# === Cleanup ===
clean: ## Remove build artifacts in source projects
	cd ../src && dotnet clean
	rm -rf ../src/kurdmap-admin/dist ../src/kurdmap-frontend/dist

prune: ## Prune unused Podman containers/images/volumes
	podman container prune -f
	podman image prune -af
	podman volume prune -f