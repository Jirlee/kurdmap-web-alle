#!/usr/bin/env bash
# ============================================================================
# KurdMap — Register a user (and optionally grant a role) from the server.
# ----------------------------------------------------------------------------
# WHY this script exists:
#   • The public API endpoint /api/auth/register only ever grants the "User"
#     role (by design — you never want public admin signup).
#   • So this script registers through the SAME hardened API path (password is
#     hashed exactly like the app, rate-limit + brute-force rules apply), and
#     then OPTIONALLY elevates the account to Moderator/Admin/SuperAdmin by
#     writing the role link directly in the database.
#
# WHY curl sends "Host: localhost":
#   The API enforces ASP.NET HostFiltering (AllowedHosts=localhost;api;...).
#   A direct call to 127.0.0.1:<port> would otherwise be rejected with HTTP 400.
#
# USAGE (run on the server, from the docker/ folder):
#   ./register-user.sh                         # fully interactive
#   ./register-user.sh user@example.com        # email given, prompts password
#   ./register-user.sh admin@kurdmap.eu Admin  # also grants the Admin role
#
#   Roles: User (default) | Moderator | Admin | SuperAdmin
#
# The password is read with `read -s` and is NEVER passed as an argument, so it
# does not leak into shell history or the process list.
# ============================================================================
set -euo pipefail

# Always operate from the directory that holds this script (and the .env).
cd "$(dirname "$0")"

ENV_FILE="${ENV_FILE:-.env}"
CONTAINER_ENGINE="${CONTAINER_ENGINE:-podman}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-kurdmap-postgres}"

# ── helpers ────────────────────────────────────────────────────────────────
err()  { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; }
ok()   { printf '\033[32m✓ %s\033[0m\n'  "$*"; }
info() { printf '\033[36m• %s\033[0m\n'  "$*"; }

# Read a single KEY=value from .env WITHOUT executing the file (safe).
get_env() { [ -f "$ENV_FILE" ] && grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- || true; }

# ── load minimal config ────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  err "Env file '$ENV_FILE' not found. Run this from the docker/ folder (or set ENV_FILE=…)."
  exit 1
fi

API_PORT="$(get_env API_PORT)";          API_PORT="${API_PORT:-8080}"
POSTGRES_USER="$(get_env POSTGRES_USER)"; POSTGRES_USER="${POSTGRES_USER:-kurdmap_user}"
POSTGRES_DB="$(get_env POSTGRES_DB)";     POSTGRES_DB="${POSTGRES_DB:-kurdmap}"
API_BASE="http://127.0.0.1:${API_PORT}"

# ── gather inputs ──────────────────────────────────────────────────────────
EMAIL="${1:-}"
ROLE="${2:-User}"

if [ -z "$EMAIL" ]; then
  read -rp "Email: " EMAIL
fi
if [ -z "$EMAIL" ]; then err "Email is required."; exit 1; fi

read -rp "Full name [${EMAIL%@*}]: " FULLNAME
FULLNAME="${FULLNAME:-${EMAIL%@*}}"

# Password (hidden, asked twice).
read -rsp "Password: " PASSWORD; echo
read -rsp "Confirm password: " PASSWORD2; echo
if [ "$PASSWORD" != "$PASSWORD2" ]; then err "Passwords do not match."; exit 1; fi

# Mirror the server-side Identity policy so failures are caught early:
# length ≥ 8, at least one digit, one lowercase and one uppercase letter.
if   [ "${#PASSWORD}" -lt 8 ];        then err "Password must be at least 8 characters."; exit 1
elif ! [[ "$PASSWORD" =~ [0-9] ]];    then err "Password must contain a digit.";          exit 1
elif ! [[ "$PASSWORD" =~ [a-z] ]];    then err "Password must contain a lowercase letter."; exit 1
elif ! [[ "$PASSWORD" =~ [A-Z] ]];    then err "Password must contain an uppercase letter."; exit 1
fi

case "$ROLE" in
  User|Moderator|Admin|SuperAdmin) ;;
  *) err "Invalid role '$ROLE'. Use: User | Moderator | Admin | SuperAdmin"; exit 1 ;;
esac

# ── 1) health check ────────────────────────────────────────────────────────
info "Checking API at ${API_BASE} …"
if ! curl -fsS -H 'Host: localhost' "${API_BASE}/health" >/dev/null 2>&1; then
  err "API not reachable / unhealthy at ${API_BASE}/health."
  err "Is the api container running and published on 127.0.0.1:${API_PORT}?"
  exit 1
fi
ok "API healthy."

# ── 2) register through the real API ───────────────────────────────────────
info "Registering ${EMAIL} …"
BODY="$(jq -nc --arg e "$EMAIL" --arg p "$PASSWORD" --arg f "$FULLNAME" \
        '{Email:$e, Password:$p, FullName:$f}' 2>/dev/null)" \
  || BODY="{\"Email\":\"${EMAIL}\",\"Password\":\"${PASSWORD}\",\"FullName\":\"${FULLNAME}\"}"

RESP="$(curl -sS -o /tmp/kurdmap_reg_body.$$ -w '%{http_code}' \
  -H 'Host: localhost' -H 'Content-Type: application/json' \
  -X POST "${API_BASE}/api/auth/register" -d "$BODY")"
REG_BODY="$(cat /tmp/kurdmap_reg_body.$$ 2>/dev/null || true)"; rm -f /tmp/kurdmap_reg_body.$$

if [ "$RESP" = "200" ]; then
  ok "User registered."
elif [ "$RESP" = "400" ] && printf '%s' "$REG_BODY" | grep -qiE 'DuplicateUserName|already taken'; then
  info "User already exists — continuing (role grant only)."
elif [ "$RESP" = "429" ]; then
  err "Rate limited (auth endpoint = 5/min). Wait a minute and retry."
  exit 1
else
  err "Registration failed (HTTP ${RESP}): ${REG_BODY}"
  exit 1
fi

# ── 3) optional role elevation (DB) ────────────────────────────────────────
if [ "$ROLE" != "User" ]; then
  info "Granting role '${ROLE}' to ${EMAIL} …"
  # :'var' lets psql quote the value safely (no SQL injection). Columns are
  # PascalCase and must be double-quoted; tables are lowercase.
  if "$CONTAINER_ENGINE" exec -i "$POSTGRES_CONTAINER" \
        psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q -v ON_ERROR_STOP=1 \
        -v email="$EMAIL" -v role="$ROLE" <<'SQL'
INSERT INTO user_roles ("UserId", "RoleId")
SELECT u."Id", r."Id"
  FROM users u
  JOIN roles r ON r."NormalizedName" = upper(:'role')
 WHERE u."NormalizedEmail" = upper(:'email')
ON CONFLICT DO NOTHING;
SQL
  then
    ok "Role '${ROLE}' granted (or already present)."
  else
    err "Role grant failed. Is the '${POSTGRES_CONTAINER}' container running?"
    exit 1
  fi
fi

# ── 4) verify by logging in ────────────────────────────────────────────────
info "Verifying credentials via /api/auth/login …"
LOGIN_BODY="$(jq -nc --arg e "$EMAIL" --arg p "$PASSWORD" '{Email:$e, Password:$p}' 2>/dev/null)" \
  || LOGIN_BODY="{\"Email\":\"${EMAIL}\",\"Password\":\"${PASSWORD}\"}"

LRESP="$(curl -sS -o /tmp/kurdmap_login_body.$$ -w '%{http_code}' \
  -H 'Host: localhost' -H 'Content-Type: application/json' \
  -X POST "${API_BASE}/api/auth/login" -d "$LOGIN_BODY")"
LOGIN_OUT="$(cat /tmp/kurdmap_login_body.$$ 2>/dev/null || true)"; rm -f /tmp/kurdmap_login_body.$$

if [ "$LRESP" = "200" ]; then
  ROLES="$(printf '%s' "$LOGIN_OUT" | jq -r '.roles // .Roles | join(",")' 2>/dev/null || echo '?')"
  ok "Login OK. Account: ${EMAIL}  |  Roles: ${ROLES:-User}"
else
  err "Login verification returned HTTP ${LRESP}: ${LOGIN_OUT}"
  exit 1
fi

echo
ok "Done."
