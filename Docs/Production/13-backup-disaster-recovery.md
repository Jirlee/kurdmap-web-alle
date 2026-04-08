# Backup, Disaster Recovery & Business Continuity

> **Ziel:** RPO < 1h, RTO < 4h — Government/Banking-Grade Recovery  
> **Stack:** PostgreSQL, Podman, GPG, LUKS, rsync, systemd  
> **Schwerpunkt:** Verschlüsselte Backups, Automatisierung, Failover

---

## Inhaltsverzeichnis

- [1. Backup & DR Architecture](#1-backup--dr-architecture)
- [2. PostgreSQL Backup](#2-postgresql-backup)
- [3. Application Data Backup](#3-application-data-backup)
- [4. Container & Configuration Backup](#4-container--configuration-backup)
- [5. Backup Encryption](#5-backup-encryption)
- [6. Backup Verification](#6-backup-verification)
- [7. Disaster Recovery Plan](#7-disaster-recovery-plan)
- [8. Recovery Procedures](#8-recovery-procedures)
- [9. Business Continuity](#9-business-continuity)
- [10. Backup Schedule & Retention](#10-backup-schedule--retention)

---

## 1. Backup & DR Architecture

### 1.1 Backup-Strategie (3-2-1 Regel)

```
3-2-1 Backup Regel:
  3 Kopien der Daten
  │
  ├── Kopie 1: Produktionsdaten (Primär)
  │   └── PostgreSQL auf verschlüsseltem LUKS Volume
  │
  ├── Kopie 2: Lokales Backup (Sekundär)
  │   └── Tägliches Backup auf separater Festplatte
  │   └── Verschlüsselt mit GPG
  │
  └── Kopie 3: Offsite Backup (Tertiär)
      └── Wöchentliches Backup über rsync/sftp
      └── Verschlüsselt + Signiert
      
2 verschiedene Medien:
  └── SSD (Produktion) + HDD (Backup) + Remote Storage

1 Offsite:
  └── Geographisch getrennt (anderer Standort/DC)
```

### 1.2 RPO/RTO Matrix

```
Komponente       │ RPO          │ RTO          │ Backup-Typ
─────────────────┼──────────────┼──────────────┼──────────────────
PostgreSQL       │ 1 Stunde     │ 2 Stunden    │ pg_dump + WAL
Application Data │ 24 Stunden   │ 4 Stunden    │ File Backup
Configurations   │ 0 (Version)  │ 1 Stunde     │ Git + Backup
Container Images │ 0 (Registry) │ 30 Minuten   │ Local Registry
Secrets/Keys     │ 0            │ 1 Stunde     │ Verschlüsselt
Logs/Audit       │ 24 Stunden   │ 4 Stunden    │ File Rotation
```

---

## 2. PostgreSQL Backup

### 2.1 Automatisches Backup Script

```bash
#!/bin/bash
# backup-postgres.sh — PostgreSQL Secure Backup

set -euo pipefail

# Konfiguration
DB_CONTAINER="postgres"
DB_NAME="myapp"
DB_USER="backup_user"
BACKUP_DIR="/backup/postgres"
RETENTION_DAILY=30
RETENTION_WEEKLY=12
RETENTION_MONTHLY=12
DATE=$(date +%Y%m%d-%H%M%S)
DAY_OF_WEEK=$(date +%u)
DAY_OF_MONTH=$(date +%d)
GPG_RECIPIENT="backup@example.com"
LOG="/var/log/backup/postgres-backup.log"

mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly}
mkdir -p "$(dirname $LOG)"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG"; }

log "=== PostgreSQL Backup Start ==="

# 1. Full Dump (Custom Format, komprimiert)
DUMP_FILE="$BACKUP_DIR/daily/${DB_NAME}-${DATE}.dump"
log "Creating dump: $DUMP_FILE"

podman exec "$DB_CONTAINER" pg_dump \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -F custom \
  -Z 9 \
  --no-password \
  > "$DUMP_FILE"

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
log "Dump created: $DUMP_SIZE"

# 2. GPG Verschlüsselung
log "Encrypting backup..."
gpg --encrypt --sign \
  --recipient "$GPG_RECIPIENT" \
  --trust-model always \
  --output "${DUMP_FILE}.gpg" \
  "$DUMP_FILE"

# Original löschen (nur verschlüsselte Version behalten)
shred -u "$DUMP_FILE"
log "Encrypted backup: ${DUMP_FILE}.gpg"

# 3. Checksum
sha256sum "${DUMP_FILE}.gpg" > "${DUMP_FILE}.gpg.sha256"

# 4. Wöchentliches Backup (Sonntag)
if [ "$DAY_OF_WEEK" -eq 7 ]; then
    cp "${DUMP_FILE}.gpg" "$BACKUP_DIR/weekly/"
    cp "${DUMP_FILE}.gpg.sha256" "$BACKUP_DIR/weekly/"
    log "Weekly backup created"
fi

# 5. Monatliches Backup (1. des Monats)
if [ "$DAY_OF_MONTH" -eq "01" ]; then
    cp "${DUMP_FILE}.gpg" "$BACKUP_DIR/monthly/"
    cp "${DUMP_FILE}.gpg.sha256" "$BACKUP_DIR/monthly/"
    log "Monthly backup created"
fi

# 6. Retention (alte Backups löschen)
log "Applying retention policy..."
find "$BACKUP_DIR/daily" -name "*.gpg" -mtime +${RETENTION_DAILY} -delete
find "$BACKUP_DIR/daily" -name "*.sha256" -mtime +${RETENTION_DAILY} -delete
find "$BACKUP_DIR/weekly" -name "*.gpg" -mtime +$((RETENTION_WEEKLY * 7)) -delete
find "$BACKUP_DIR/monthly" -name "*.gpg" -mtime +$((RETENTION_MONTHLY * 30)) -delete

log "Retention applied"

# 7. Backup-Größe kontrollieren
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Total backup size: $TOTAL_SIZE"

log "=== PostgreSQL Backup Complete ==="
```

### 2.2 WAL Archiving (Point-in-Time Recovery)

```ini
# postgresql.conf — WAL Archiving
wal_level = replica
archive_mode = on
archive_command = 'gzip < %p > /backup/postgres/wal/%f.gz'
archive_timeout = 3600  # Mindestens stündlich archivieren
```

```bash
# WAL Archive Backup Script
#!/bin/bash
# backup-wal.sh

WAL_DIR="/backup/postgres/wal"
ARCHIVE_DIR="/backup/postgres/wal-archive"
DATE=$(date +%Y%m%d)

# WAL Dateien des Tages archivieren
mkdir -p "${ARCHIVE_DIR}/${DATE}"
find "$WAL_DIR" -name "*.gz" -mtime 0 -exec mv {} "${ARCHIVE_DIR}/${DATE}/" \;

# Alte WAL Archives löschen (30 Tage)
find "$ARCHIVE_DIR" -type d -mtime +30 -exec rm -rf {} +
```

### 2.3 systemd Timer

```ini
# /etc/systemd/user/backup-postgres.service
[Unit]
Description=PostgreSQL Backup
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup-postgres.sh
StandardOutput=journal
StandardError=journal

# /etc/systemd/user/backup-postgres.timer
[Unit]
Description=Daily PostgreSQL Backup

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
```

```bash
systemctl --user enable --now backup-postgres.timer
```

---

## 3. Application Data Backup

### 3.1 Application Files Backup

```bash
#!/bin/bash
# backup-app-data.sh — Application Data Backup

set -euo pipefail

BACKUP_DIR="/backup/app-data"
DATE=$(date +%Y%m%d-%H%M%S)
GPG_RECIPIENT="backup@example.com"
LOG="/var/log/backup/app-backup.log"

mkdir -p "$BACKUP_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"; }

log "=== App Data Backup Start ==="

# 1. Uploads & User Files
if [ -d "/data/uploads" ]; then
    tar czf "/tmp/uploads-${DATE}.tar.gz" -C /data uploads/
    gpg --encrypt --recipient "$GPG_RECIPIENT" \
        --output "$BACKUP_DIR/uploads-${DATE}.tar.gz.gpg" \
        "/tmp/uploads-${DATE}.tar.gz"
    shred -u "/tmp/uploads-${DATE}.tar.gz"
    log "Uploads backed up"
fi

# 2. Konfigurationsdateien
tar czf "/tmp/configs-${DATE}.tar.gz" \
    /etc/myapp/ \
    /etc/caddy/Caddyfile \
    /etc/containers/policy.json \
    /etc/firewalld/ \
    /etc/fail2ban/jail.d/ \
    /etc/audit/rules.d/ \
    2>/dev/null || true

gpg --encrypt --recipient "$GPG_RECIPIENT" \
    --output "$BACKUP_DIR/configs-${DATE}.tar.gz.gpg" \
    "/tmp/configs-${DATE}.tar.gz"
shred -u "/tmp/configs-${DATE}.tar.gz"
log "Configs backed up"

# 3. TLS Certificates (ohne private Keys — die sind separat)
tar czf "/tmp/certs-${DATE}.tar.gz" \
    /etc/myapp/pki/ca/ca.pem \
    /etc/myapp/pki/server/*.pem \
    /etc/myapp/pki/client/*.pem \
    2>/dev/null || true

gpg --encrypt --recipient "$GPG_RECIPIENT" \
    --output "$BACKUP_DIR/certs-${DATE}.tar.gz.gpg" \
    "/tmp/certs-${DATE}.tar.gz"
shred -u "/tmp/certs-${DATE}.tar.gz"
log "Certificates backed up"

# 4. Secrets/Keys (extra sicher)
tar czf "/tmp/secrets-${DATE}.tar.gz" \
    /etc/myapp/keys/ \
    2>/dev/null || true

# Doppelt verschlüsselt (GPG + separate Passphrase)
gpg --symmetric --cipher-algo AES256 \
    --output "/tmp/secrets-${DATE}.tar.gz.sym" \
    "/tmp/secrets-${DATE}.tar.gz"
shred -u "/tmp/secrets-${DATE}.tar.gz"

gpg --encrypt --recipient "$GPG_RECIPIENT" \
    --output "$BACKUP_DIR/secrets-${DATE}.tar.gz.gpg" \
    "/tmp/secrets-${DATE}.tar.gz.sym"
shred -u "/tmp/secrets-${DATE}.tar.gz.sym"
log "Secrets backed up (double encrypted)"

# 5. Retention
find "$BACKUP_DIR" -name "*.gpg" -mtime +90 -delete
log "Retention applied"

log "=== App Data Backup Complete ==="
```

---

## 4. Container & Configuration Backup

### 4.1 Container Image Backup

```bash
#!/bin/bash
# backup-containers.sh — Container Images sichern

set -euo pipefail

BACKUP_DIR="/backup/containers"
DATE=$(date +%Y%m%d)

mkdir -p "$BACKUP_DIR"

# Alle eigenen Images exportieren
for image in $(podman images --format '{{.Repository}}:{{.Tag}}' | grep "myapp"); do
    FILENAME=$(echo "$image" | tr '/:' '-')
    echo "Exporting $image..."
    podman save "$image" | gzip > "$BACKUP_DIR/${FILENAME}-${DATE}.tar.gz"
done

# Pod-Definitionen sichern
for pod in $(podman pod ls --format '{{.Name}}' 2>/dev/null); do
    podman generate kube "$pod" > "$BACKUP_DIR/pod-${pod}-${DATE}.yml"
done

# systemd Service-Files sichern
cp -r ~/.config/systemd/user/ "$BACKUP_DIR/systemd-${DATE}/" 2>/dev/null || true

# Retention (90 Tage)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +90 -delete
find "$BACKUP_DIR" -name "*.yml" -mtime +90 -delete
```

---

## 5. Backup Encryption

### 5.1 GPG Key Management für Backups

```bash
# Backup GPG Key erstellen
gpg --full-generate-key
# RSA 4096, keine Ablaufzeit, backup@example.com

# Public Key exportieren (für Backup-Server)
gpg --export --armor backup@example.com > /etc/myapp/keys/backup-gpg-pub.asc

# Private Key sicher speichern (OFFLINE!)
gpg --export-secret-keys --armor backup@example.com > /secure-offline/backup-gpg-private.asc

# Key-Backup auf USB-Stick (verschlüsselt)
gpg --export-secret-keys backup@example.com | \
  gpg --symmetric --cipher-algo AES256 > /media/usb/backup-key.gpg
```

### 5.2 Backup Entschlüsselung

```bash
# Einzelnes Backup entschlüsseln
gpg --decrypt myapp-20250101-020000.dump.gpg > myapp-restored.dump

# Doppelt verschlüsselte Secrets
gpg --decrypt secrets-20250101.tar.gz.gpg > secrets.tar.gz.sym
gpg --decrypt secrets.tar.gz.sym > secrets.tar.gz
tar xzf secrets.tar.gz
shred -u secrets.tar.gz secrets.tar.gz.sym
```

---

## 6. Backup Verification

### 6.1 Automatische Backup-Tests

```bash
#!/bin/bash
# verify-backups.sh — Wöchentliche Backup-Verifizierung

set -euo pipefail

LOG="/var/log/backup/verify.log"
ERRORS=0

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG"; }

log "=== Backup Verification Start ==="

# 1. Neuestes Backup finden
LATEST_DB=$(ls -t /backup/postgres/daily/*.gpg 2>/dev/null | head -1)
if [ -z "$LATEST_DB" ]; then
    log "FAIL: No database backup found!"
    ERRORS=$((ERRORS + 1))
else
    # Alter prüfen (< 25 Stunden)
    AGE_HOURS=$(( ($(date +%s) - $(stat -c %Y "$LATEST_DB")) / 3600 ))
    if [ "$AGE_HOURS" -gt 25 ]; then
        log "FAIL: Latest backup is ${AGE_HOURS}h old (max: 25h)"
        ERRORS=$((ERRORS + 1))
    else
        log "OK: Latest backup is ${AGE_HOURS}h old"
    fi
    
    # Checksum verifizieren
    if [ -f "${LATEST_DB}.sha256" ]; then
        if sha256sum -c "${LATEST_DB}.sha256" 2>/dev/null; then
            log "OK: Checksum valid"
        else
            log "FAIL: Checksum mismatch!"
            ERRORS=$((ERRORS + 1))
        fi
    fi
    
    # GPG Entschlüsselung testen
    if gpg --decrypt "$LATEST_DB" > /tmp/verify-restore.dump 2>/dev/null; then
        log "OK: GPG decryption successful"
        
        # Restore testen (in temporärer DB)
        podman exec postgres createdb -U postgres verify_test 2>/dev/null || true
        if podman exec -i postgres pg_restore -U postgres -d verify_test < /tmp/verify-restore.dump 2>/dev/null; then
            log "OK: Database restore successful"
            
            # Daten-Integrität prüfen
            ROW_COUNT=$(podman exec postgres psql -U postgres -d verify_test -t -c "SELECT count(*) FROM users;" 2>/dev/null | tr -d ' ')
            log "OK: Verified $ROW_COUNT users in restored database"
        else
            log "FAIL: Database restore failed!"
            ERRORS=$((ERRORS + 1))
        fi
        
        # Cleanup
        podman exec postgres dropdb -U postgres verify_test 2>/dev/null || true
        shred -u /tmp/verify-restore.dump
    else
        log "FAIL: GPG decryption failed!"
        ERRORS=$((ERRORS + 1))
    fi
fi

# 2. Backup-Größe Trend
CURRENT_SIZE=$(du -sb /backup/ | cut -f1)
log "Total backup size: $(du -sh /backup/ | cut -f1)"

# 3. Zusammenfassung
if [ "$ERRORS" -gt 0 ]; then
    log "=== VERIFICATION FAILED: $ERRORS errors ==="
    echo "Backup verification failed: $ERRORS errors" | \
      mail -s "ALERT: Backup Verification Failed" admin@example.com
    exit 1
else
    log "=== VERIFICATION PASSED ==="
fi
```

---

## 7. Disaster Recovery Plan

### 7.1 DR Szenarien

```yaml
Szenario 1 — Container-Ausfall:
  Impact: Einzelner Service nicht verfügbar
  RTO: 5 Minuten
  Aktion: Automatischer Restart via systemd
  Fallback: Rollback zum vorherigen Image

Szenario 2 — Datenbank-Korruption:
  Impact: Datenverlust/Inkonsistenz
  RTO: 2 Stunden
  Aktion: Point-in-Time Recovery aus WAL + Backup
  RPO: 1 Stunde (WAL Archiving)

Szenario 3 — Server-Ausfall (Hardware):
  Impact: Kompletter Service-Ausfall
  RTO: 4 Stunden
  Aktion: Neuen Server aufsetzen + Backups einspielen
  RPO: 24 Stunden (tägliches Backup)

Szenario 4 — Security Breach:
  Impact: Kompromittierung
  RTO: 2 Stunden (Clean Deployment)
  Aktion: Forensik → Clean Install → Restore → Key Rotation
  RPO: Abhängig von Breach-Zeitpunkt

Szenario 5 — Ransomware:
  Impact: Verschlüsselung aller Daten
  RTO: 4 Stunden
  Aktion: Offsite Backup → Restore → Forensik
  Schutz: Offsite Backups, LUKS, Read-Only Container
```

### 7.2 DR Kontaktliste

```yaml
Eskalationsstufen:
  Level 1 (Service-Ausfall, < 15 Min):
    - On-Call Engineer notifications
    - Automatische Alerts (Grafana)
    
  Level 2 (Ausfall > 15 Min):
    - Team Lead benachrichtigen
    - Statuspage aktualisieren
    
  Level 3 (Datenverlust / Breach):
    - CTO + Security Team
    - Legal (DSGVO-Meldung innerhalb 72h)
    
  Level 4 (Komplettausfall):
    - Management + alle Teams
    - Externe Kommunikation
```

---

## 8. Recovery Procedures

### 8.1 PostgreSQL Restore

```bash
#!/bin/bash
# restore-postgres.sh — Database Recovery

set -euo pipefail

BACKUP_FILE="$1"  # GPG-verschlüsselte Backup-Datei

echo "=== PostgreSQL Restore ==="
echo "WARNING: This will REPLACE the current database!"
read -p "Continue? (type 'RESTORE' to confirm): " CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
    echo "Aborted."
    exit 1
fi

# 1. Entschlüsseln
echo "Decrypting backup..."
TEMP_DUMP="/tmp/restore-$(date +%s).dump"
gpg --decrypt "$BACKUP_FILE" > "$TEMP_DUMP"

# 2. Aktuelle DB sichern (Notfall-Backup)
echo "Creating emergency backup of current database..."
podman exec postgres pg_dump -U postgres -d myapp -F custom \
  > "/backup/emergency/pre-restore-$(date +%Y%m%d-%H%M%S).dump"

# 3. Anwendung stoppen
echo "Stopping application..."
podman stop myapp-api 2>/dev/null || true

# 4. Datenbank löschen und neu erstellen
echo "Recreating database..."
podman exec postgres dropdb -U postgres myapp 2>/dev/null || true
podman exec postgres createdb -U postgres myapp

# 5. Restore
echo "Restoring from backup..."
podman exec -i postgres pg_restore \
  -U postgres \
  -d myapp \
  --no-owner \
  --no-acl \
  --verbose \
  < "$TEMP_DUMP"

# 6. Berechtigungen setzen
echo "Setting permissions..."
podman exec postgres psql -U postgres -d myapp -c "
  GRANT CONNECT ON DATABASE myapp TO app_user;
  GRANT USAGE ON SCHEMA public TO app_user;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
"

# 7. Anwendung starten
echo "Starting application..."
podman start myapp-api

# 8. Cleanup
shred -u "$TEMP_DUMP"

echo "=== Restore complete ==="
```

### 8.2 Full System Recovery

```bash
#!/bin/bash
# full-system-recovery.sh — Komplette Systemwiederherstellung

set -euo pipefail

echo "=== Full System Recovery ==="
echo "This script restores the complete application stack."

# 1. System vorbereiten
echo "Step 1: System preparation..."
dnf update -y
dnf install -y podman podman-compose gpg

# 2. GPG Keys importieren
echo "Step 2: Importing GPG keys..."
gpg --import /media/usb/backup-gpg-private.asc

# 3. Konfiguration wiederherstellen
echo "Step 3: Restoring configuration..."
LATEST_CONFIG=$(ls -t /backup/app-data/configs-*.gpg | head -1)
gpg --decrypt "$LATEST_CONFIG" | tar xzf - -C /

# 4. Secrets wiederherstellen
echo "Step 4: Restoring secrets..."
LATEST_SECRETS=$(ls -t /backup/app-data/secrets-*.gpg | head -1)
gpg --decrypt "$LATEST_SECRETS" > /tmp/secrets.tar.gz.sym
gpg --decrypt /tmp/secrets.tar.gz.sym | tar xzf - -C /
shred -u /tmp/secrets.tar.gz.sym

# 5. Container Images laden
echo "Step 5: Loading container images..."
for image_file in /backup/containers/myapp-*.tar.gz; do
    podman load < "$image_file"
done

# 6. Netzwerke erstellen
echo "Step 6: Creating networks..."
podman network create --subnet 10.89.1.0/24 dmz-network 2>/dev/null || true
podman network create --subnet 10.89.2.0/24 --internal app-network 2>/dev/null || true
podman network create --subnet 10.89.3.0/24 --internal data-network 2>/dev/null || true

# 7. Datenbank starten & wiederherstellen
echo "Step 7: Starting database..."
podman run -d --name postgres \
  --network data-network \
  -v pg_data:/var/lib/postgresql/data \
  postgres:17-alpine

sleep 10  # Warten auf Startup

echo "Step 8: Restoring database..."
LATEST_DB=$(ls -t /backup/postgres/daily/*.gpg | head -1)
./restore-postgres.sh "$LATEST_DB"

# 8. Alle Services starten
echo "Step 9: Starting all services..."
podman run -d --name redis --network data-network redis:7-alpine
podman run -d --name api --network app-network --network data-network \
  --secret db-password --secret jwt-key myapp-api:latest
podman run -d --name web --network dmz-network myapp-web:latest
podman run -d --name caddy --network dmz-network --network app-network \
  -p 443:443 caddy:latest

# 9. Health Checks
echo "Step 10: Verifying health..."
sleep 30
for container in postgres redis api web caddy; do
    STATUS=$(podman inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "missing")
    echo "  $container: $STATUS"
done

echo "=== Full System Recovery Complete ==="
echo "IMPORTANT: Verify all services and run smoke tests!"
```

---

## 9. Business Continuity

### 9.1 Offsite Backup Sync

```bash
#!/bin/bash
# offsite-sync.sh — Backup zu Offsite-Standort

set -euo pipefail

REMOTE_HOST="backup@offsite.example.com"
REMOTE_DIR="/backup/myapp"
SSH_KEY="/etc/myapp/keys/offsite-ssh-key"

# Nur verschlüsselte Backups synchronisieren
rsync -avz --progress \
  -e "ssh -i $SSH_KEY -p 2222" \
  --include='*.gpg' \
  --include='*.sha256' \
  --exclude='*' \
  /backup/ \
  "${REMOTE_HOST}:${REMOTE_DIR}/"

echo "Offsite sync complete: $(date)"
```

### 9.2 Automatische Failover-Prüfung

```bash
#!/bin/bash
# health-monitor.sh — Service Health mit Auto-Recovery

check_and_recover() {
    local container="$1"
    local max_restarts=3
    
    if ! podman healthcheck run "$container" 2>/dev/null; then
        local restart_count
        restart_count=$(podman inspect --format='{{.RestartCount}}' "$container" 2>/dev/null || echo 0)
        
        if [ "$restart_count" -lt "$max_restarts" ]; then
            logger -p local0.warning "Auto-restarting unhealthy container: $container"
            podman restart "$container"
        else
            logger -p local0.err "Container $container exceeded max restarts — manual intervention required"
            echo "CRITICAL: Container $container failed" | \
              mail -s "CRITICAL: Service Failure" admin@example.com
        fi
    fi
}

for container in caddy api web postgres redis; do
    check_and_recover "$container"
done
```

---

## 10. Backup Schedule & Retention

### 10.1 Zeitplan

```yaml
Stündlich:
  - PostgreSQL WAL Archivierung
  
Täglich (02:00 Uhr):
  - PostgreSQL Full Dump (verschlüsselt)
  - Application Data Backup
  - Container Log Rotation
  
Wöchentlich (Sonntag 03:00):
  - Wöchentliches Backup (Kopie des Täglichen)
  - Container Image Export
  - Offsite Sync
  - Backup Verification Test
  
Monatlich (1. des Monats):
  - Monatliches Backup (Long-Term)
  - DR Test (optional)
  - Backup Key Rotation Check
  
Jährlich:
  - Full DR Drill
  - Backup-Strategie Review
  - Offsite-Standort Prüfung
```

### 10.2 Retention Policy

```yaml
Tägliche Backups:   30 Tage
Wöchentliche:       12 Wochen (3 Monate)
Monatliche:         12 Monate
WAL Archives:       30 Tage
Container Images:   90 Tage
Audit Logs:         730 Tage (2 Jahre)
Security Logs:      730 Tage (2 Jahre, Compliance)
```

### 10.3 Backup-Checkliste

```yaml
Verschlüsselung:
  ✅ GPG für alle Backups
  ✅ Doppelt verschlüsselt für Secrets
  ✅ Backup-Key sicher offline gespeichert

Automatisierung:
  ✅ systemd Timer für alle Backup-Jobs
  ✅ Automatische Retention
  ✅ Offsite Sync (wöchentlich)

Verifizierung:
  ✅ Wöchentliche Restore-Tests
  ✅ Checksum-Validierung
  ✅ Alert bei fehlenden/alten Backups

Recovery:
  ✅ Dokumentierte Recovery-Prozeduren
  ✅ Full System Recovery getestet
  ✅ RPO/RTO validiert
  ✅ DR Drill mindestens jährlich
```

---

## Weiterführende Dokumente

| Nächstes Dokument | Thema |
|-------------------|-------|
| [09 — Cryptography](09-cryptography-data-protection.md) | GPG & Encryption Keys |
| [12 — CI/CD](12-cicd-deployment-security.md) | Deployment & Rollback |
| [14 — Compliance](14-compliance-audit-pentest.md) | Backup Compliance |
