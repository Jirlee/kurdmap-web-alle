# CI/CD Pipeline & Deployment Security

> **Ziel:** Sichere Build- und Deployment-Pipeline für Government/Banking  
> **Stack:** Git, Podman, Bash Scripts, Trivy, Cosign  
> **Schwerpunkt:** Supply Chain Security, Image Scanning, Secure Deployment

---

## Inhaltsverzeichnis

- [1. CI/CD Security Architecture](#1-cicd-security-architecture)
- [2. Git Repository Security](#2-git-repository-security)
- [3. Build Pipeline Security](#3-build-pipeline-security)
- [4. Container Image Security](#4-container-image-security)
- [5. Image Signing & Verification](#5-image-signing--verification)
- [6. Secrets in CI/CD](#6-secrets-in-cicd)
- [7. Deployment Strategies](#7-deployment-strategies)
- [8. Blue-Green Deployment](#8-blue-green-deployment)
- [9. Rollback Procedures](#9-rollback-procedures)
- [10. Pipeline Hardening Checklist](#10-pipeline-hardening-checklist)

---

## 1. CI/CD Security Architecture

### 1.1 Secure Pipeline Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   Code   │───▸│  Build   │───▸│  Test    │───▸│  Scan    │───▸│  Deploy  │
│  Commit  │    │  Stage   │    │  Stage   │    │  Stage   │    │  Stage   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │               │
     ▼               ▼               ▼               ▼               ▼
 ┌────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
 │GPG Sign│    │Dependency│    │Unit Tests│    │Trivy Scan│    │Blue-Green│
 │Pre-push│    │Audit     │    │Integ Test│    │SAST/DAST │    │Rollback  │
 │Hooks   │    │SBOM Gen  │    │Sec Tests │    │Cosign    │    │Health    │
 └────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 1.2 Security Gates

```yaml
Gate 1 — Code Quality:
  - Keine Secrets in Code (git-secrets)
  - Signed Commits (GPG)
  - Pre-commit Hooks aktiv
  - Code Review abgeschlossen

Gate 2 — Build Integrity:
  - Dependencies audited (npm audit, dotnet audit)
  - SBOM generiert
  - Reproducible Build

Gate 3 — Test Coverage:
  - Unit Tests bestanden
  - Integration Tests bestanden
  - Security Tests bestanden (OWASP ZAP)
  - Coverage ≥ 80%

Gate 4 — Security Scan:
  - Trivy: 0 Critical, 0 High
  - SAST: Keine kritischen Findings
  - Image signiert (Cosign)
  - SBOM attestiert

Gate 5 — Deployment:
  - Health Check bestanden
  - Smoke Tests bestanden
  - Rollback getestet
  - Monitoring aktiv
```

---

## 2. Git Repository Security

### 2.1 Pre-commit Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit — Secret Detection

echo "Running pre-commit security checks..."

# 1. Secret Detection
SECRETS_FOUND=0
PATTERNS=(
    'password\s*=\s*["\x27][^"\x27]+'
    'secret\s*=\s*["\x27][^"\x27]+'
    'api[_-]?key\s*=\s*["\x27][^"\x27]+'
    'token\s*=\s*["\x27][^"\x27]+'
    'BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY'
    'AKIA[0-9A-Z]{16}'
    'connectionstring\s*=.*password'
)

for pattern in "${PATTERNS[@]}"; do
    if git diff --cached --diff-filter=ACM | grep -iPq "$pattern"; then
        echo "ERROR: Potential secret found matching pattern: $pattern"
        SECRETS_FOUND=1
    fi
done

if [ $SECRETS_FOUND -eq 1 ]; then
    echo "COMMIT BLOCKED: Remove secrets before committing!"
    exit 1
fi

# 2. Keine großen Binärdateien
MAX_SIZE=5242880  # 5MB
for file in $(git diff --cached --name-only --diff-filter=ACM); do
    filesize=$(wc -c < "$file" 2>/dev/null || echo 0)
    if [ "$filesize" -gt "$MAX_SIZE" ]; then
        echo "ERROR: File $file is too large ($(( filesize / 1024 / 1024 ))MB)"
        exit 1
    fi
done

echo "Pre-commit checks passed."
```

### 2.2 GPG Signed Commits

```bash
# GPG Key erstellen
gpg --full-generate-key
# Wähle: RSA (sign only), 4096 bit

# Git konfigurieren
git config --global user.signingkey <KEY-ID>
git config --global commit.gpgsign true
git config --global tag.gpgsign true

# Signierte Commits erzwingen (Server-seitig)
# .gitattributes
*.cs merge=ours
*.ts merge=ours
```

### 2.3 .gitignore Security

```gitignore
# Secrets — NIEMALS committen
*.pem
*.key
*.pfx
*.p12
*.env
*.env.*
!.env.example
appsettings.Development.json
appsettings.Production.json
secrets/
.secrets/

# Build Outputs
bin/
obj/
dist/
node_modules/
.angular/

# IDE
.idea/
.vs/
*.suo
*.user

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/
```

---

## 3. Build Pipeline Security

### 3.1 Secure Build Script (.NET)

```bash
#!/bin/bash
# build-api.sh — Secure Build Pipeline for ASP.NET Core

set -euo pipefail

APP_NAME="myapp-api"
VERSION="${1:-$(date +%Y%m%d-%H%M%S)}"
REGISTRY="localhost"
IMAGE="${REGISTRY}/${APP_NAME}:${VERSION}"

echo "=== Building ${IMAGE} ==="

# 1. Dependency Audit
echo "Step 1: Dependency Audit..."
dotnet restore
dotnet list package --vulnerable --include-transitive 2>&1 | tee /tmp/audit.txt
if grep -q "Critical\|High" /tmp/audit.txt; then
    echo "FAIL: Critical/High vulnerabilities found!"
    exit 1
fi

# 2. Build
echo "Step 2: Building..."
dotnet build --configuration Release --no-restore

# 3. Tests
echo "Step 3: Running tests..."
dotnet test --configuration Release --no-build \
  --logger "trx;LogFileName=test-results.trx" \
  --collect:"XPlat Code Coverage"

# 4. Container Image bauen
echo "Step 4: Building container image..."
podman build \
  --tag "${IMAGE}" \
  --tag "${REGISTRY}/${APP_NAME}:latest" \
  --no-cache \
  --squash-all \
  --label "org.opencontainers.image.created=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --label "org.opencontainers.image.version=${VERSION}" \
  --label "org.opencontainers.image.source=internal" \
  -f Containerfile .

# 5. Image Scan
echo "Step 5: Scanning image..."
trivy image --severity HIGH,CRITICAL --exit-code 1 "${IMAGE}"

# 6. Image signieren
echo "Step 6: Signing image..."
cosign sign --key /etc/myapp/keys/cosign.key "${IMAGE}"

# 7. SBOM generieren
echo "Step 7: Generating SBOM..."
trivy image --format cyclonedx --output "sbom-${VERSION}.json" "${IMAGE}"
cosign attest --key /etc/myapp/keys/cosign.key \
  --predicate "sbom-${VERSION}.json" --type cyclonedx "${IMAGE}"

echo "=== Build complete: ${IMAGE} ==="
```

### 3.2 Secure Build Script (Angular)

```bash
#!/bin/bash
# build-web.sh — Secure Angular Build

set -euo pipefail

APP_NAME="myapp-web"
VERSION="${1:-$(date +%Y%m%d-%H%M%S)}"
REGISTRY="localhost"
IMAGE="${REGISTRY}/${APP_NAME}:${VERSION}"

echo "=== Building ${IMAGE} ==="

# 1. Dependency Audit
echo "Step 1: npm audit..."
npm ci --ignore-scripts
npm audit --audit-level=high
if [ $? -ne 0 ]; then
    echo "FAIL: npm audit found high/critical issues!"
    exit 1
fi

# 2. Security Checks
echo "Step 2: Security pre-checks..."
# Keine console.log
CONSOLE_COUNT=$(grep -r "console\.\(log\|debug\)" src/ --include="*.ts" -l | grep -v spec | wc -l)
if [ "$CONSOLE_COUNT" -gt 0 ]; then
    echo "WARNING: console statements found in $CONSOLE_COUNT files"
fi

# Keine bypassSecurity
BYPASS_COUNT=$(grep -r "bypassSecurityTrust" src/ --include="*.ts" -c 2>/dev/null || echo 0)
if [ "$BYPASS_COUNT" -gt 0 ]; then
    echo "WARNING: $BYPASS_COUNT security bypass calls found — review required!"
fi

# 3. Build (AOT, Production)
echo "Step 3: Production build..."
npx ng build --configuration=production

# 4. Verify no source maps
if find dist/ -name "*.map" | grep -q .; then
    echo "FAIL: Source maps found in production build!"
    exit 1
fi

# 5. Container Image
echo "Step 4: Building container..."
podman build \
  --tag "${IMAGE}" \
  --tag "${REGISTRY}/${APP_NAME}:latest" \
  --squash-all \
  -f Containerfile .

# 6. Image Scan
echo "Step 5: Scanning..."
trivy image --severity HIGH,CRITICAL --exit-code 1 "${IMAGE}"

# 7. Sign
echo "Step 6: Signing..."
cosign sign --key /etc/myapp/keys/cosign.key "${IMAGE}"

echo "=== Build complete: ${IMAGE} ==="
```

### 3.3 Secure Containerfile (API)

```dockerfile
# === Stage 1: Build ===
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

# Dependencies zuerst (Cache)
COPY *.csproj .
RUN dotnet restore --runtime linux-musl-x64

# Source Code
COPY . .
RUN dotnet publish -c Release -o /app/publish \
    --runtime linux-musl-x64 \
    --self-contained true \
    -p:PublishTrimmed=true \
    -p:PublishSingleFile=true \
    -p:DebugType=none \
    -p:DebugSymbols=false

# === Stage 2: Runtime ===
FROM mcr.microsoft.com/dotnet/runtime-deps:10.0-alpine AS runtime

# Non-root User
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/false -D appuser

# Minimale Packages
RUN apk add --no-cache ca-certificates tzdata && \
    rm -rf /var/cache/apk/*

# Kein Package Manager im Runtime Image
RUN apk del apk-tools

WORKDIR /app
COPY --from=build --chown=appuser:appgroup /app/publish .

# Security: Read-only, keine Shell
RUN chmod -R 555 /app && \
    rm -f /bin/sh /bin/ash /bin/bash 2>/dev/null || true

USER appuser:appgroup

# Health Check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=30s \
    CMD ["/app/MyApp.Api", "--health-check"]

EXPOSE 5000

ENTRYPOINT ["/app/MyApp.Api"]
```

### 3.4 Secure Containerfile (Angular)

```dockerfile
# === Stage 1: Build ===
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npx ng build --configuration=production

# Verify no source maps
RUN test -z "$(find dist/ -name '*.map')" || (echo "Source maps found!" && exit 1)

# === Stage 2: Runtime (Distroless Caddy) ===
FROM caddy:2-alpine AS runtime

RUN addgroup -g 1001 webgroup && \
    adduser -u 1001 -G webgroup -s /bin/false -D webuser

# Static Files
COPY --from=build --chown=webuser:webgroup /app/dist/my-app/browser /srv

# Caddy Config für SPA
COPY Caddyfile.static /etc/caddy/Caddyfile

USER webuser:webgroup

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD ["wget", "--spider", "-q", "http://localhost:8080/"]
```

---

## 4. Container Image Security

### 4.1 Trivy Scanning

```bash
#!/bin/bash
# scan-images.sh — Alle Images scannen

IMAGES=(
    "myapp-api:latest"
    "myapp-web:latest"
    "caddy:2-alpine"
    "postgres:17-alpine"
    "redis:7-alpine"
)

RESULTS_DIR="/var/log/security/scans"
mkdir -p "$RESULTS_DIR"

EXIT_CODE=0

for image in "${IMAGES[@]}"; do
    echo "Scanning $image..."
    
    trivy image \
        --severity HIGH,CRITICAL \
        --format json \
        --output "$RESULTS_DIR/$(echo "$image" | tr '/:' '-').json" \
        "$image"
    
    # Critical = sofortiges Blocken
    CRITICAL=$(trivy image --severity CRITICAL --quiet "$image" 2>/dev/null | grep -c "CRITICAL" || echo 0)
    
    if [ "$CRITICAL" -gt 0 ]; then
        echo "CRITICAL: $image has $CRITICAL critical vulnerabilities!"
        EXIT_CODE=1
    fi
done

exit $EXIT_CODE
```

### 4.2 Image Policy (Trusted Registries)

```json
{
    "default": [{ "type": "reject" }],
    "transports": {
        "docker": {
            "localhost": [{ "type": "signedBy", "keyType": "GPGKeys", "keyPath": "/etc/pki/rpm-gpg/cosign-pub.key" }],
            "docker.io/library": [{ "type": "insecureAcceptAnything" }],
            "mcr.microsoft.com": [{ "type": "insecureAcceptAnything" }]
        },
        "containers-storage": {
            "": [{ "type": "insecureAcceptAnything" }]
        }
    }
}
```

---

## 5. Image Signing & Verification

### 5.1 Cosign Setup

```bash
# Cosign Key Pair generieren
cosign generate-key-pair
# Erzeugt: cosign.key (private) + cosign.pub (public)

# Image signieren
cosign sign --key cosign.key localhost/myapp-api:latest

# Signatur verifizieren
cosign verify --key cosign.pub localhost/myapp-api:latest

# SBOM als Attestation anhängen
trivy image --format cyclonedx -o sbom.json localhost/myapp-api:latest
cosign attest --key cosign.key --predicate sbom.json --type cyclonedx \
  localhost/myapp-api:latest

# Attestation verifizieren
cosign verify-attestation --key cosign.pub --type cyclonedx \
  localhost/myapp-api:latest
```

### 5.2 Deployment Verification

```bash
#!/bin/bash
# verify-before-deploy.sh — Signatur prüfen vor Deployment

set -euo pipefail

IMAGE="$1"
COSIGN_PUB="/etc/myapp/keys/cosign.pub"

echo "Verifying image: $IMAGE"

# 1. Signatur prüfen
if ! cosign verify --key "$COSIGN_PUB" "$IMAGE" 2>/dev/null; then
    echo "FAIL: Image signature verification failed!"
    exit 1
fi
echo "✓ Signature valid"

# 2. SBOM Attestation prüfen
if ! cosign verify-attestation --key "$COSIGN_PUB" --type cyclonedx "$IMAGE" 2>/dev/null; then
    echo "WARNING: No SBOM attestation found"
fi

# 3. Frischer Vulnerability Scan
CRITICAL=$(trivy image --severity CRITICAL --quiet "$IMAGE" 2>/dev/null | grep -c "CRITICAL" || echo 0)
if [ "$CRITICAL" -gt 0 ]; then
    echo "FAIL: Image has $CRITICAL critical vulnerabilities!"
    exit 1
fi
echo "✓ No critical vulnerabilities"

echo "=== Image $IMAGE verified — safe to deploy ==="
```

---

## 6. Secrets in CI/CD

### 6.1 Podman Secrets Management

```bash
# Secrets aus verschlüsselter Datei laden
# (Datei mit GPG verschlüsselt, nur Build-User kann entschlüsseln)

# Secret erstellen
echo -n "super-secret-db-password" | podman secret create db-password -
echo -n "jwt-signing-key-content" | podman secret create jwt-key -

# Secrets im Container verfügbar machen
podman run -d \
  --secret db-password,target=/run/secrets/db-password \
  --secret jwt-key,target=/run/secrets/jwt-key.pem \
  myapp-api:latest

# Secrets Listen
podman secret ls

# Secret inspizieren (NICHT den Inhalt!)
podman secret inspect db-password
```

### 6.2 Environment-Datei (verschlüsselt)

```bash
# .env.production.gpg — GPG-verschlüsselt
# Entschlüsselung nur durch Deployment-User

# Verschlüsseln
gpg --encrypt --recipient deploy@example.com .env.production
rm .env.production

# Entschlüsseln (beim Deploy)
gpg --decrypt .env.production.gpg > /tmp/.env.production
podman run --env-file /tmp/.env.production myapp-api:latest
shred -u /tmp/.env.production  # Sicher löschen
```

---

## 7. Deployment Strategies

### 7.1 Deployment Script

```bash
#!/bin/bash
# deploy.sh — Sichere Deployment-Pipeline

set -euo pipefail

VERSION="$1"
APP="$2"  # api | web
IMAGE="localhost/myapp-${APP}:${VERSION}"

echo "=== Deploying ${IMAGE} ==="

# 1. Image verifizieren
./verify-before-deploy.sh "$IMAGE"

# 2. Pre-Deployment Backup
echo "Creating pre-deployment backup..."
BACKUP_TAG="pre-deploy-$(date +%Y%m%d-%H%M%S)"
if podman container exists "myapp-${APP}"; then
    podman commit "myapp-${APP}" "localhost/myapp-${APP}-backup:${BACKUP_TAG}"
fi

# 3. Health Check des aktuellen Containers
if podman container exists "myapp-${APP}"; then
    echo "Current container health: $(podman healthcheck run "myapp-${APP}" 2>&1 || echo 'N/A')"
fi

# 4. Deploy (Blue-Green)
./blue-green-deploy.sh "$IMAGE" "$APP"

# 5. Post-Deployment Health Check
echo "Waiting for health check..."
for i in $(seq 1 30); do
    if podman healthcheck run "myapp-${APP}" 2>/dev/null; then
        echo "✓ Health check passed after ${i}s"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "FAIL: Health check timeout — rolling back!"
        ./rollback.sh "$APP" "$BACKUP_TAG"
        exit 1
    fi
    sleep 1
done

# 6. Smoke Tests
echo "Running smoke tests..."
./smoke-test.sh "$APP"

echo "=== Deployment successful: ${IMAGE} ==="
```

---

## 8. Blue-Green Deployment

### 8.1 Blue-Green Script

```bash
#!/bin/bash
# blue-green-deploy.sh

set -euo pipefail

IMAGE="$1"
APP="$2"
BLUE="myapp-${APP}-blue"
GREEN="myapp-${APP}-green"

# Welcher ist aktiv?
ACTIVE=$(podman inspect --format='{{.Config.Labels.deployment}}' "${BLUE}" 2>/dev/null || echo "none")

if [ "$ACTIVE" = "active" ]; then
    NEW_CONTAINER="$GREEN"
    OLD_CONTAINER="$BLUE"
else
    NEW_CONTAINER="$BLUE"
    OLD_CONTAINER="$GREEN"
fi

echo "Active: $OLD_CONTAINER → Deploying to: $NEW_CONTAINER"

# 1. Neuen Container starten
podman stop "$NEW_CONTAINER" 2>/dev/null || true
podman rm "$NEW_CONTAINER" 2>/dev/null || true

podman run -d \
  --name "$NEW_CONTAINER" \
  --network app-network \
  --secret db-password,target=/run/secrets/db-password \
  --secret jwt-key,target=/run/secrets/jwt-key.pem \
  --label deployment=standby \
  --health-cmd='curl -sf http://localhost:5000/health || exit 1' \
  --health-interval=10s \
  --health-timeout=5s \
  --health-retries=3 \
  --health-start-period=30s \
  "$IMAGE"

# 2. Warten auf Health
echo "Waiting for new container health..."
for i in $(seq 1 60); do
    STATUS=$(podman healthcheck run "$NEW_CONTAINER" 2>/dev/null && echo "healthy" || echo "unhealthy")
    if [ "$STATUS" = "healthy" ]; then
        echo "New container healthy after ${i}s"
        break
    fi
    if [ "$i" -eq 60 ]; then
        echo "FAIL: New container not healthy — aborting"
        podman stop "$NEW_CONTAINER"
        podman rm "$NEW_CONTAINER"
        exit 1
    fi
    sleep 1
done

# 3. Traffic umschalten (Caddy Upstream ändern)
# Caddy API Admin Endpoint nutzen
CADDY_ADMIN="http://localhost:2019"
NEW_IP=$(podman inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$NEW_CONTAINER")

# 4. Labels aktualisieren
podman container rename "$NEW_CONTAINER" "myapp-${APP}" 2>/dev/null || true

# 5. Alten Container stoppen (nach Grace Period)
sleep 10  # Laufende Requests abschließen lassen
if podman container exists "$OLD_CONTAINER"; then
    podman stop --time 30 "$OLD_CONTAINER"
    # Nicht sofort löschen — für Rollback aufbewahren
fi

echo "Blue-Green deployment complete"
```

---

## 9. Rollback Procedures

### 9.1 Rollback Script

```bash
#!/bin/bash
# rollback.sh — Schnelles Rollback

set -euo pipefail

APP="$1"
BACKUP_TAG="${2:-}"

echo "=== ROLLBACK: ${APP} ==="

# 1. Aktiven Container stoppen
podman stop "myapp-${APP}" 2>/dev/null || true

# 2. Rollback zum Backup
if [ -n "$BACKUP_TAG" ]; then
    # Zum spezifischen Backup
    podman run -d \
      --name "myapp-${APP}" \
      --replace \
      --network app-network \
      --secret db-password,target=/run/secrets/db-password \
      --secret jwt-key,target=/run/secrets/jwt-key.pem \
      "localhost/myapp-${APP}-backup:${BACKUP_TAG}"
else
    # Zur vorherigen Version (latest-1)
    PREV_IMAGE=$(podman images --format '{{.Repository}}:{{.Tag}}' | \
      grep "myapp-${APP}" | grep -v latest | grep -v backup | head -2 | tail -1)
    
    if [ -z "$PREV_IMAGE" ]; then
        echo "FAIL: No previous image found for rollback!"
        exit 1
    fi
    
    podman run -d \
      --name "myapp-${APP}" \
      --replace \
      --network app-network \
      --secret db-password,target=/run/secrets/db-password \
      --secret jwt-key,target=/run/secrets/jwt-key.pem \
      "$PREV_IMAGE"
fi

# 3. Health Check
for i in $(seq 1 30); do
    if podman healthcheck run "myapp-${APP}" 2>/dev/null; then
        echo "✓ Rollback health check passed"
        break
    fi
    sleep 1
done

echo "=== Rollback complete ==="
```

---

## 10. Pipeline Hardening Checklist

```yaml
Repository Security:
  ✅ GPG-signierte Commits
  ✅ Pre-commit Hooks (Secret Detection)
  ✅ Branch Protection (Review Required)
  ✅ .gitignore für Secrets/Keys
  ✅ Keine Secrets in Git History

Build Security:
  ✅ Dependency Audit (npm audit, dotnet audit)
  ✅ SBOM Generation (CycloneDX)
  ✅ Multi-stage Containerfiles
  ✅ Non-root Container User
  ✅ No package manager in runtime
  ✅ No source maps in production
  ✅ Reproducible Builds

Image Security:
  ✅ Trivy Scan (0 Critical, 0 High)
  ✅ Cosign Signing
  ✅ SBOM Attestation
  ✅ Trusted Registry Only
  ✅ Image Policy Enforcement
  ✅ Minimal Base Images (Alpine/Distroless)

Deployment Security:
  ✅ Image Verification vor Deploy
  ✅ Blue-Green Deployment
  ✅ Health Checks
  ✅ Smoke Tests
  ✅ Automatic Rollback
  ✅ Secrets via Podman Secrets (nicht ENV)
  ✅ Post-Deployment Monitoring

Operations:
  ✅ Container Auto-Update (mit Verification)
  ✅ Regular Dependency Updates
  ✅ Image Cleanup (alte Images löschen)
  ✅ Audit Log für Deployments
```

---

## Weiterführende Dokumente

| Nächstes Dokument | Thema |
|-------------------|-------|
| [04 — Container Security](04-container-security-podman.md) | Podman Hardening |
| [09 — Cryptography](09-cryptography-data-protection.md) | Image Signing Keys |
| [13 — Backup & DR](13-backup-disaster-recovery.md) | Rollback & Recovery |
