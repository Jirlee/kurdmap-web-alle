#!/usr/bin/env bash
# KurdMap — PostgreSQL Backup Script
# Usage:  ./docker/backup.sh
# Cron:   0 3 * * * /opt/kurdmap/docker/backup.sh >> /var/log/kurdmap-backup.log 2>&1
set -euo pipefail

# ── Configuration ───────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/opt/kurdmap/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
CONTAINER_NAME="${CONTAINER_NAME:-kurdmap-postgres}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/kurdmap_${TIMESTAMP}.sql.gz"

# Source .env if available
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "${SCRIPT_DIR}/.env" ]]; then
  # shellcheck source=/dev/null
  source "${SCRIPT_DIR}/.env"
fi

DB_NAME="${POSTGRES_DB:-kurdmap}"
DB_USER="${POSTGRES_USER:-postgres}"

# ── Pre-flight checks ──────────────────────────────────────
mkdir -p "${BACKUP_DIR}"

RUNTIME="podman"
if ! command -v podman &>/dev/null; then
  RUNTIME="docker"
fi

if ! ${RUNTIME} ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[ERROR] Container '${CONTAINER_NAME}' is not running" >&2
  exit 1
fi

# ── Backup ──────────────────────────────────────────────────
echo "[$(date --iso-8601=seconds)] Starting backup → ${BACKUP_FILE}"

${RUNTIME} exec "${CONTAINER_NAME}" \
  pg_dump -U "${DB_USER}" -d "${DB_NAME}" --no-owner --clean --if-exists \
  | gzip > "${BACKUP_FILE}"

FILESIZE=$(stat --format='%s' "${BACKUP_FILE}")
if [[ "${FILESIZE}" -lt 100 ]]; then
  echo "[ERROR] Backup file suspiciously small (${FILESIZE} bytes)" >&2
  rm -f "${BACKUP_FILE}"
  exit 1
fi

echo "[$(date --iso-8601=seconds)] Backup complete ($(numfmt --to=iec "${FILESIZE}"))"

# ── Prune old backups ──────────────────────────────────────
DELETED=$(find "${BACKUP_DIR}" -name 'kurdmap_*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete -print | wc -l)
if [[ "${DELETED}" -gt 0 ]]; then
  echo "[$(date --iso-8601=seconds)] Pruned ${DELETED} backup(s) older than ${RETENTION_DAYS} days"
fi
