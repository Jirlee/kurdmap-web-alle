.PHONY: help build run test stop clean scan shell-api shell-db logs

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# === Build ===
build: ## Build all Docker images
	docker compose build

build-api: ## Build API only
	cd src && dotnet build KurdMap.API/KurdMap.API.csproj -c Release

build-admin: ## Build admin panel
	cd src/kurdmap-admin && npm run build

build-frontend: ## Build frontend
	cd src/kurdmap-frontend && npm run build

# === Run ===
run: ## Start all services
	docker compose up -d

run-dev: ## Start only DB + Redis for local development
	docker compose up -d postgres redis

stop: ## Stop all services
	docker compose down

restart: ## Restart all services
	docker compose down && docker compose up -d

# === Test ===
test: test-backend test-admin ## Run all tests

test-backend: ## Run .NET tests
	cd src && dotnet test KurdMap.Tests/ --verbosity normal

test-admin: ## Run Angular admin tests (Vitest)
	cd src/kurdmap-admin && npx ng test

test-e2e: ## Run Playwright E2E tests
	cd src/kurdmap-admin && npm run e2e

test-coverage: ## Run backend tests with coverage
	cd src && dotnet test KurdMap.Tests/ --collect:"XPlat Code Coverage"

# === Lint ===
lint: lint-admin ## Run all linters

lint-admin: ## Lint admin panel
	cd src/kurdmap-admin && npx ng lint

# === Security ===
scan: ## Scan Docker images with Trivy
	@echo "Scanning API image..."
	trivy image kurdmap-api:latest --severity HIGH,CRITICAL
	@echo "Scanning Admin image..."
	trivy image kurdmap-admin:latest --severity HIGH,CRITICAL
	@echo "Scanning Frontend image..."
	trivy image kurdmap-frontend:latest --severity HIGH,CRITICAL

scan-deps: ## Scan .NET dependencies
	cd src && dotnet list package --vulnerable --include-transitive

# === Shell ===
shell-api: ## Open shell in API container
	docker compose exec api sh

shell-db: ## Open psql in PostgreSQL container
	docker compose exec postgres psql -U postgres -d kurdmap

shell-redis: ## Open redis-cli
	docker compose exec redis redis-cli

# === Database ===
migrate: ## Run EF Core migrations (via API startup)
	docker compose restart api
	@echo "API will apply pending migrations on startup."

seed: ## Seed test data into PostgreSQL (run AFTER containers are up)
	@echo "Waiting for API to apply migrations..."
	@sleep 5
	docker compose exec -T postgres psql -U postgres -d kurdmap_dev < docker/seed-data.sql
	@echo "✅ Test data seeded successfully."

db-reset: ## Reset database: drop volume, rebuild, restart, seed
	docker compose down -v
	docker compose up -d --build
	@echo "Waiting for API to start and run migrations..."
	@sleep 15
	docker compose exec -T postgres psql -U postgres -d kurdmap_dev < docker/seed-data.sql
	@echo "✅ Database reset and seeded successfully."

backup: ## Backup PostgreSQL database
	docker compose exec -T postgres pg_dump -U postgres kurdmap | gzip > backups/kurdmap_$$(date +%Y%m%d_%H%M%S).sql.gz

restore: ## Restore PostgreSQL from latest backup (usage: make restore FILE=backup.sql.gz)
	gunzip -c $(FILE) | docker compose exec -T postgres psql -U postgres kurdmap

# === Logs ===
logs: ## Follow all logs
	docker compose logs -f

logs-api: ## Follow API logs
	docker compose logs -f api

# === Clean ===
clean: ## Remove containers, volumes, and build artifacts
	docker compose down -v
	cd src && dotnet clean
	rm -rf src/kurdmap-admin/dist src/kurdmap-frontend/dist

# === Health ===
health: ## Check health of all services
	@echo "API:      $$(curl -sf http://localhost:8080/health && echo OK || echo FAIL)"
	@echo "Admin:    $$(curl -sf http://localhost:8081 > /dev/null && echo OK || echo FAIL)"
	@echo "Frontend: $$(curl -sf http://localhost:4000 > /dev/null && echo OK || echo FAIL)"
