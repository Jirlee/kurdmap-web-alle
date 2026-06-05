#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

DEFAULT_PORT="${ADMIN_DEV_PORT:-4201}"
CANDIDATE_PORTS=(
  "$DEFAULT_PORT"
  4202
  4203
  4204
  4205
  4210
)

is_port_free() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ! ss -tln | awk '{print $4}' | grep -Eq "[:.]${port}$"
  else
    ! netstat -tln 2>/dev/null | awk '{print $4}' | grep -Eq "[:.]${port}$"
  fi
}

SELECTED_PORT=""
for p in "${CANDIDATE_PORTS[@]}"; do
  if is_port_free "$p"; then
    SELECTED_PORT="$p"
    break
  fi
done

if [[ -z "$SELECTED_PORT" ]]; then
  echo "[ERROR] No free Admin dev port found in candidates: ${CANDIDATE_PORTS[*]}" >&2
  exit 1
fi

export ADMIN_DEV_PORT="$SELECTED_PORT"
export ADMIN_URL="http://localhost:${SELECTED_PORT}"

echo "[INFO] Using ADMIN_DEV_PORT=${ADMIN_DEV_PORT}"
echo "[INFO] Starting stack..."
podman compose up -d --build

echo "[INFO] Waiting for admin endpoint..."
for _ in {1..40}; do
  if curl -fsS "http://localhost:${ADMIN_DEV_PORT}/" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo
echo "KurdMap Dev URLs"
echo "  API:      http://localhost:${API_PORT:-8080}"
echo "  Frontend: http://localhost:4000"
echo "  Admin:    http://localhost:${ADMIN_DEV_PORT}"
