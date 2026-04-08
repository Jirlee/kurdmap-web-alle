# Production Security Checklist & Runbooks

> **Ziel:** Kompakte Go/No-Go Checkliste und Notfall-Runbooks  
> **Anwendung:** Pre-Deployment, regelmäßige Prüfung, Notfall  
> **Format:** Actionable Checklisten mit Befehlen

---

## Inhaltsverzeichnis

- [1. Pre-Deployment Checklist](#1-pre-deployment-checklist)
- [2. Server Hardening Checklist](#2-server-hardening-checklist)
- [3. Application Security Checklist](#3-application-security-checklist)
- [4. Container Security Checklist](#4-container-security-checklist)
- [5. Network Security Checklist](#5-network-security-checklist)
- [6. Monitoring Checklist](#6-monitoring-checklist)
- [7. Runbook: Server Initial Setup](#7-runbook-server-initial-setup)
- [8. Runbook: Emergency Security Response](#8-runbook-emergency-security-response)
- [9. Runbook: Key & Certificate Rotation](#9-runbook-key--certificate-rotation)
- [10. Quick Reference Commands](#10-quick-reference-commands)

---

## 1. Pre-Deployment Checklist

### Go/No-Go Entscheidung

```
═══════════════════════════════════════════════════
         PRE-DEPLOYMENT SECURITY CHECKLIST
═══════════════════════════════════════════════════

Code & Build:
  [ ] Alle Tests bestanden (Unit, Integration, Security)
  [ ] Code Review abgeschlossen
  [ ] Keine Secrets in Code/Config (git-secrets geprüft)
  [ ] Source Maps deaktiviert (Angular)
  [ ] npm audit / dotnet audit — 0 High/Critical
  [ ] SBOM generiert

Container Image:
  [ ] Trivy Scan: 0 Critical, 0 High
  [ ] Image signiert (Cosign)
  [ ] Non-root User im Container
  [ ] Minimales Base Image (Alpine/Distroless)
  [ ] Kein Package Manager im Runtime Image
  [ ] Health Check konfiguriert

Server:
  [ ] OS Patches aktuell (dnf update)
  [ ] SELinux: Enforcing
  [ ] Firewall: Aktiv, nur benötigte Ports
  [ ] SSH: Key-only, kein Root-Login
  [ ] Fail2Ban: Aktiv
  [ ] auditd: Aktiv, Rules geladen
  [ ] AIDE: Baseline aktuell

Application:
  [ ] TLS 1.3 für alle Verbindungen
  [ ] Security Headers gesetzt (CSP, HSTS, X-Frame)
  [ ] JWT: Asymmetrisch (RS512), ≤ 15 Min Lebensdauer
  [ ] MFA aktiviert für Admin-Accounts
  [ ] Rate Limiting aktiv
  [ ] CORS korrekt konfiguriert
  [ ] Error Handling: Keine Details in Production

Data:
  [ ] Encryption at Rest (LUKS, pgcrypto)
  [ ] Backups funktionsfähig (Restore getestet)
  [ ] Backup-Verschlüsselung (GPG)
  [ ] Secrets via Podman Secrets (nicht ENV)

Monitoring:
  [ ] Logging aktiv (Serilog + auditd)
  [ ] Prometheus/Grafana Dashboards
  [ ] Alert Rules konfiguriert
  [ ] Incident Response Playbooks bereit

═══════════════════════════════════════════════════
  ERGEBNIS: [ ] GO   [ ] NO-GO
  Datum: ____________  Unterschrift: ____________
═══════════════════════════════════════════════════
```

---

## 2. Server Hardening Checklist

```
Referenz: 02-rocky-linux-server-hardening.md

OS & Kernel:
  [ ] Rocky Linux aktuell: dnf update
  [ ] Automatische Updates: dnf-automatic
  [ ] Unnötige Services deaktiviert
  [ ] GRUB Passwort gesetzt
  [ ] UMASK 077
  [ ] Kernel Hardening (sysctl):
      [ ] net.ipv4.ip_forward = 1 (nur für Podman)
      [ ] net.ipv4.conf.all.rp_filter = 1
      [ ] net.ipv4.conf.all.accept_redirects = 0
      [ ] net.ipv4.conf.all.send_redirects = 0
      [ ] kernel.randomize_va_space = 2
      [ ] kernel.kptr_restrict = 2
      [ ] fs.protected_hardlinks = 1
      [ ] fs.protected_symlinks = 1

Benutzer & Auth:
  [ ] Root-Login deaktiviert
  [ ] SSH Key-Only (ED25519)
  [ ] SSH Port geändert (z.B. 2222)
  [ ] faillock: 5 Versuche / 15 Min Sperre
  [ ] Passwort-Policy: ≥ 14 Zeichen
  [ ] sudo Logging aktiv
  [ ] Keine unnötigen Benutzer

SELinux:
  [ ] Mode: Enforcing
  [ ] Booleans korrekt gesetzt
  [ ] Container-Policies aktiv

Audit & Monitoring:
  [ ] auditd aktiv mit Regeln
  [ ] -e 2 (immutable rules)
  [ ] AIDE initialisiert
  [ ] Fail2Ban aktiv

Prüfbefehle:
  getenforce                          # SELinux Status
  systemctl status auditd             # Audit Daemon
  systemctl status fail2ban           # Fail2Ban
  sshd -T | grep -E 'permit|password|port'  # SSH Config
  aide --check                        # File Integrity
```

---

## 3. Application Security Checklist

```
Referenz: 06-aspnet-core-api-security.md, 07-angular-admin-panel-security.md

ASP.NET Core API:
  [ ] HTTPS erzwungen (UseHttpsRedirection)
  [ ] HSTS aktiv (MaxAge ≥ 1 Jahr)
  [ ] Security Headers Middleware
  [ ] JWT Bearer — RS512, ClockSkew ≤ 30s
  [ ] Token aus HttpOnly Cookie (nicht Header)
  [ ] Algorithm Enforcement (kein "none", kein HS256)
  [ ] FluentValidation für alle DTOs
  [ ] Parameterized Queries (EF Core)
  [ ] CORS: Nur erlaubte Origins
  [ ] Rate Limiting: Global + per-Endpoint
  [ ] Anti-Forgery Tokens
  [ ] File Upload: Type-Whitelist, Size-Limit, Magic Bytes
  [ ] Global Exception Handler (keine Details)
  [ ] Swagger deaktiviert in Production

Angular:
  [ ] Production Build (AOT, Optimization)
  [ ] Source Maps deaktiviert
  [ ] Subresource Integrity (SRI) aktiv
  [ ] Kein localStorage für Tokens
  [ ] CSRF Token in Interceptor
  [ ] Route Guards für geschützte Bereiche
  [ ] Kein bypassSecurityTrust* mit User-Input
  [ ] DOMPurify für HTML-Rendering
  [ ] Session Timeout (15 Min Inaktivität)
  [ ] npm audit: 0 High/Critical
```

---

## 4. Container Security Checklist

```
Referenz: 04-container-security-podman.md

Container Runtime:
  [ ] Rootless Podman (kein Root!)
  [ ] subuid/subgid konfiguriert
  [ ] Trusted Registry Policy (/etc/containers/policy.json)

Images:
  [ ] Multi-stage Build
  [ ] Minimales Base Image (Alpine)
  [ ] Non-root USER im Containerfile
  [ ] Kein Package Manager im Runtime
  [ ] Trivy Scan bestanden
  [ ] Cosign signiert

Runtime Security:
  [ ] --cap-drop=ALL
  [ ] --read-only (Read-Only Filesystem)
  [ ] --security-opt=no-new-privileges:true
  [ ] --memory / --cpus Limits
  [ ] Health Check konfiguriert
  [ ] Keine privilegierten Container

Netzwerk:
  [ ] Isolierte Netzwerke (DMZ, App, Data)
  [ ] Container können NICHT ins Internet
  [ ] Nur erlaubte Ports zwischen Containern

Prüfbefehle:
  podman ps --format 'table {{.Names}}\t{{.Status}}'
  podman inspect <container> | jq '.[0].HostConfig.CapDrop'
  podman inspect <container> | jq '.[0].Config.User'
  trivy image myapp-api:latest
  cosign verify --key cosign.pub myapp-api:latest
```

---

## 5. Network Security Checklist

```
Referenz: 03-network-firewall-security.md, 11-zero-trust-architecture.md

Firewall:
  [ ] firewalld aktiv
  [ ] Default Zone: drop
  [ ] Nur Port 443 (HTTPS) öffentlich
  [ ] SSH nur auf Management-Interface
  [ ] IPSet-basiertes Country-Blocking (optional)

Netzwerk-Segmentation:
  [ ] DMZ: Caddy + Web (Frontend)
  [ ] App: API
  [ ] Data: PostgreSQL + Redis
  [ ] Monitor: Prometheus + Grafana
  [ ] Kein Zugriff zwischen nicht-verbundenen Zonen

TLS:
  [ ] TLS 1.3 für alle externen Verbindungen
  [ ] mTLS zwischen internen Services
  [ ] Crypto Policy: FUTURE oder höher
  [ ] Zertifikate nicht abgelaufen

DNS:
  [ ] DNS-over-TLS konfiguriert
  [ ] CAA Records gesetzt
  [ ] SPF + DMARC (für Email)

Prüfbefehle:
  firewall-cmd --list-all-zones
  openssl s_client -connect localhost:443 </dev/null 2>/dev/null | grep Protocol
  update-crypto-policies --show
  nmap -sS -p- localhost  # Offene Ports
```

---

## 6. Monitoring Checklist

```
Referenz: 10-monitoring-logging-incident-response.md

Logging:
  [ ] Serilog: JSON-Format, File + Console
  [ ] Security Events in separatem Log
  [ ] Sensitive Data Masking aktiv
  [ ] Log Rotation: 365 Tage (Security: 730 Tage)
  [ ] auditd: Regeln geladen, -e 2

Monitoring:
  [ ] Prometheus: Alle Services als Target
  [ ] Grafana: Security Dashboard aktiv
  [ ] Alert Rules konfiguriert:
      [ ] Brute Force Detection
      [ ] High Error Rate (> 5%)
      [ ] Rate Limit Spikes
      [ ] Container Restart
      [ ] Disk Space Low
      [ ] Certificate Expiry (< 14 Tage)

Intrusion Detection:
  [ ] AIDE: Baseline erstellt, Daily Check
  [ ] Suricata: IDS Rules aktiv (optional)
  [ ] Fail2Ban: Jails aktiv (SSH, API, Caddy)

Incident Response:
  [ ] Playbooks dokumentiert und getestet
  [ ] Kontaktliste aktuell
  [ ] Eskalationsstufen definiert
```

---

## 7. Runbook: Server Initial Setup

```bash
#!/bin/bash
# RUNBOOK: Initial Server Setup (Rocky Linux)
# Dauer: ca. 30-45 Minuten

set -euo pipefail
echo "=== Server Initial Setup ==="

# 1. System Update
dnf update -y
dnf install -y podman podman-compose gpg aide audit fail2ban \
  firewalld openscap-scanner scap-security-guide

# 2. Firewall
systemctl enable --now firewalld
firewall-cmd --set-default-zone=drop
firewall-cmd --zone=public --add-port=443/tcp --permanent
firewall-cmd --zone=public --add-port=2222/tcp --permanent
firewall-cmd --reload

# 3. SSH Hardening
cat > /etc/ssh/sshd_config.d/99-hardening.conf << 'EOF'
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey
MaxAuthTries 3
X11Forwarding no
AllowAgentForwarding no
PermitEmptyPasswords no
ClientAliveInterval 300
ClientAliveCountMax 2
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
HostKeyAlgorithms ssh-ed25519
EOF
systemctl restart sshd

# 4. SELinux
sed -i 's/SELINUX=.*/SELINUX=enforcing/' /etc/selinux/config
# Reboot erforderlich wenn noch nicht Enforcing

# 5. Fail2Ban
cat > /etc/fail2ban/jail.d/sshd.conf << 'EOF'
[sshd]
enabled = true
port = 2222
filter = sshd[mode=aggressive]
maxretry = 3
findtime = 600
bantime = 86400
EOF
systemctl enable --now fail2ban

# 6. auditd
systemctl enable --now auditd
# Audit Rules per Datei laden (siehe Doc 02/10)

# 7. AIDE
aide --init
mv /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz

# 8. Kernel Hardening
cat > /etc/sysctl.d/99-security.conf << 'EOF'
kernel.randomize_va_space = 2
kernel.kptr_restrict = 2
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.tcp_syncookies = 1
net.ipv6.conf.all.disable_ipv6 = 1
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
net.ipv4.ip_forward = 1
EOF
sysctl --system

# 9. Podman Setup (Rootless)
useradd -m -s /bin/bash appuser
loginctl enable-linger appuser
su - appuser -c 'podman network create --subnet 10.89.1.0/24 dmz-network'
su - appuser -c 'podman network create --subnet 10.89.2.0/24 --internal app-network'
su - appuser -c 'podman network create --subnet 10.89.3.0/24 --internal data-network'

# 10. Crypto Policy
update-crypto-policies --set FUTURE

echo "=== Initial Setup Complete ==="
echo "NEXT: Configure applications, TLS certs, deploy containers"
```

---

## 8. Runbook: Emergency Security Response

```bash
#!/bin/bash
# RUNBOOK: Emergency Security Response
# Verwenden bei: Breach-Verdacht, aktiver Angriff, Kompromittierung

echo "╔═══════════════════════════════════════════╗"
echo "║     EMERGENCY SECURITY RESPONSE           ║"
echo "║     $(date)                               ║"
echo "╚═══════════════════════════════════════════╝"

# === PHASE 1: SOFORT (0-5 Minuten) ===

echo "=== PHASE 1: Containment ==="

# 1.1 Angreifer-IP blockieren (wenn bekannt)
read -p "Angreifer IP (leer für Überspringen): " ATTACKER_IP
if [ -n "$ATTACKER_IP" ]; then
    firewall-cmd --add-rich-rule="rule family=ipv4 source address=$ATTACKER_IP drop" --permanent
    firewall-cmd --reload
    echo "IP $ATTACKER_IP blockiert"
fi

# 1.2 Betroffenen Service isolieren (optional)
read -p "Container isolieren? (Name oder leer): " CONTAINER
if [ -n "$CONTAINER" ]; then
    podman network disconnect dmz-network "$CONTAINER" 2>/dev/null
    echo "Container $CONTAINER vom Netzwerk getrennt"
fi

# 1.3 Alle Admin-Passwörter sofort ändern
echo "TODO: Admin-Passwörter ändern!"

# === PHASE 2: Beweissicherung (5-15 Minuten) ===

echo "=== PHASE 2: Evidence Collection ==="

EVIDENCE_DIR="/tmp/evidence-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$EVIDENCE_DIR"

# 2.1 System-Snapshot
echo "Collecting system state..."
date > "$EVIDENCE_DIR/timestamp.txt"
who > "$EVIDENCE_DIR/who.txt"
w > "$EVIDENCE_DIR/w.txt"
last -50 > "$EVIDENCE_DIR/last.txt"
ss -tulnp > "$EVIDENCE_DIR/network-connections.txt"
ps auxf > "$EVIDENCE_DIR/processes.txt"
ip addr > "$EVIDENCE_DIR/ip-addr.txt"
firewall-cmd --list-all > "$EVIDENCE_DIR/firewall.txt"

# 2.2 Logs sichern
cp /var/log/audit/audit.log "$EVIDENCE_DIR/"
cp /var/log/secure "$EVIDENCE_DIR/"
cp -r /var/log/myapp/ "$EVIDENCE_DIR/app-logs/" 2>/dev/null || true
journalctl --since "1 hour ago" > "$EVIDENCE_DIR/journal-1h.txt"

# 2.3 Container-Status
podman ps -a > "$EVIDENCE_DIR/containers.txt"
for c in $(podman ps --format '{{.Names}}'); do
    podman logs "$c" > "$EVIDENCE_DIR/container-$c.log" 2>&1
    podman inspect "$c" > "$EVIDENCE_DIR/container-$c-inspect.json" 2>/dev/null
done

# 2.4 AIDE Check
aide --check > "$EVIDENCE_DIR/aide-check.txt" 2>&1 || true

echo "Evidence collected in: $EVIDENCE_DIR"

# === PHASE 3: Analyse (15-60 Minuten) ===

echo "=== PHASE 3: Analysis ==="
echo "Manual steps:"
echo "  1. Review logs in $EVIDENCE_DIR"
echo "  2. Identify attack vector"
echo "  3. Determine scope of compromise"
echo "  4. Check: ausearch -ts recent -m USER_LOGIN"
echo "  5. Check: grep 'AUTH_FAILURE\|SUSPICIOUS' /var/log/myapp/security-*.log"

# === PHASE 4: Recovery ===

echo "=== PHASE 4: Recovery (nach Analyse) ==="
echo "Manual steps:"
echo "  1. Vulnerability patchen"
echo "  2. Alle Secrets rotieren: ./key-rotation.sh"
echo "  3. Alle Sessions invalidieren"
echo "  4. Saubere Container deployen"
echo "  5. AIDE Baseline erneuern: aide --init"
echo "  6. Monitoring intensivieren"

# === PHASE 5: Reporting ===

echo "=== PHASE 5: Reporting ==="
echo "  1. Incident Report erstellen"
echo "  2. DSGVO: Datenschutzbehörde informieren (innerhalb 72h)"
echo "  3. Management informieren"
echo "  4. Betroffene Nutzer benachrichtigen"
echo "  5. Post-Incident Review planen"
```

---

## 9. Runbook: Key & Certificate Rotation

```bash
#!/bin/bash
# RUNBOOK: Key & Certificate Rotation
# Frequenz: Vierteljährlich oder nach Breach

set -euo pipefail

DATE=$(date +%Y%m%d)
KEY_DIR="/etc/myapp/keys"
BACKUP_DIR="$KEY_DIR/archived/$DATE"
mkdir -p "$BACKUP_DIR"

echo "=== Key Rotation Runbook ==="

# 1. Aktuelle Keys sichern
echo "Step 1: Backing up current keys..."
cp "$KEY_DIR"/*.pem "$BACKUP_DIR/" 2>/dev/null || true
echo "Backup: $BACKUP_DIR"

# 2. JWT Keys
echo "Step 2: Rotating JWT keys..."
openssl genrsa -out "$KEY_DIR/jwt-private-key.pem" 4096
openssl rsa -in "$KEY_DIR/jwt-private-key.pem" -pubout -out "$KEY_DIR/jwt-public-key.pem"
chmod 600 "$KEY_DIR/jwt-private-key.pem"
chmod 644 "$KEY_DIR/jwt-public-key.pem"

# 3. Signing Keys
echo "Step 3: Rotating signing keys..."
openssl ecparam -genkey -name secp384r1 | openssl ec -out "$KEY_DIR/signing-key.pem" 2>/dev/null
openssl ec -in "$KEY_DIR/signing-key.pem" -pubout -out "$KEY_DIR/signing-key-pub.pem" 2>/dev/null
chmod 600 "$KEY_DIR/signing-key.pem"

# 4. Data Protection Certificate
echo "Step 4: Rotating Data Protection cert..."
openssl req -x509 -newkey rsa:4096 -sha512 -days 365 -nodes \
  -keyout "$KEY_DIR/dp-key.pem" -out "$KEY_DIR/dp-cert.pem" \
  -subj "/CN=DataProtection/O=MyApp" 2>/dev/null
openssl pkcs12 -export -out "$KEY_DIR/dp-cert.pfx" \
  -inkey "$KEY_DIR/dp-key.pem" -in "$KEY_DIR/dp-cert.pem" \
  -passout pass:""

# 5. Podman Secrets aktualisieren
echo "Step 5: Updating Podman secrets..."
podman secret rm jwt-private-key 2>/dev/null || true
podman secret create jwt-private-key "$KEY_DIR/jwt-private-key.pem"
podman secret rm signing-key 2>/dev/null || true
podman secret create signing-key "$KEY_DIR/signing-key.pem"

# 6. Container neu starten
echo "Step 6: Restarting containers..."
podman restart myapp-api

# 7. Verify
echo "Step 7: Verifying..."
sleep 5
if podman healthcheck run myapp-api 2>/dev/null; then
    echo "✓ API healthy after key rotation"
else
    echo "✗ API unhealthy — rolling back!"
    cp "$BACKUP_DIR"/*.pem "$KEY_DIR/"
    podman restart myapp-api
    exit 1
fi

# 8. Alte Keys nach 180 Tagen löschen
find "$KEY_DIR/archived" -type d -mtime +180 -exec rm -rf {} + 2>/dev/null || true

echo "=== Key Rotation Complete ==="
echo "IMPORTANT: Alle aktiven Sessions werden beim nächsten Token-Refresh erneuert"
```

---

## 10. Quick Reference Commands

### System Status

```bash
# Gesamtstatus
getenforce                              # SELinux
systemctl status firewalld              # Firewall
systemctl status auditd                 # Audit
systemctl status fail2ban               # Fail2Ban
podman ps                               # Container

# Security Logs
journalctl -u sshd --since "1 hour ago"           # SSH
ausearch -m USER_LOGIN --success no -ts today      # Failed Logins
fail2ban-client status                              # Banned IPs
grep "SUSPICIOUS\|AUTH_FAILURE" /var/log/myapp/security-*.log | tail -20

# Offene Ports
ss -tulnp
firewall-cmd --list-all
```

### Container Management

```bash
# Container Status
podman ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
podman stats --no-stream

# Health Checks
for c in $(podman ps --format '{{.Names}}'); do
    echo -n "$c: "; podman healthcheck run "$c" 2>&1 || echo "no healthcheck"
done

# Logs
podman logs --tail 50 myapp-api
podman logs --since "1 hour" caddy

# Restart
podman restart myapp-api
podman restart caddy
```

### Backup & Recovery

```bash
# Backup Status
ls -la /backup/postgres/daily/ | tail -5
ls -la /backup/app-data/ | tail -5

# Manuelles Backup
/usr/local/bin/backup-postgres.sh
/usr/local/bin/backup-app-data.sh

# Restore (PostgreSQL)
/usr/local/bin/restore-postgres.sh /backup/postgres/daily/latest.gpg
```

### Notfall

```bash
# IP sofort blockieren
firewall-cmd --add-rich-rule='rule family=ipv4 source address=<IP> drop' --permanent
firewall-cmd --reload

# Alle Sessions invalidieren (Redis flush)
podman exec redis redis-cli FLUSHDB

# Container isolieren
podman network disconnect dmz-network <container>

# Service stoppen
podman stop <container>

# Alle Keys rotieren
/usr/local/bin/key-rotation.sh

# Full Emergency Response
/usr/local/bin/emergency-response.sh
```

---

## Dokumenten-Übersicht

| Nr. | Dokument | Hauptthema |
|-----|----------|------------|
| 00 | [Index](00-index.md) | Master-Index & Architektur |
| 01 | [Security Strategy](01-security-strategy-threat-modeling.md) | STRIDE, Threat Modeling |
| 02 | [Rocky Linux](02-rocky-linux-server-hardening.md) | OS Hardening |
| 03 | [Network & Firewall](03-network-firewall-security.md) | firewalld, nftables, VPN |
| 04 | [Container Security](04-container-security-podman.md) | Podman, Rootless |
| 05 | [Caddy & TLS](05-reverse-proxy-tls-caddy.md) | Reverse Proxy, Headers |
| 06 | [API Security](06-aspnet-core-api-security.md) | ASP.NET Core 10 |
| 07 | [Angular Security](07-angular-admin-panel-security.md) | Angular 21, Admin Panel |
| 08 | [Authentication](08-authentication-identity.md) | MFA, FIDO2, JWT |
| 09 | [Cryptography](09-cryptography-data-protection.md) | Encryption, Key Mgmt |
| 10 | [Monitoring](10-monitoring-logging-incident-response.md) | Logging, SIEM, IR |
| 11 | [Zero Trust](11-zero-trust-architecture.md) | mTLS, Micro-Segmentation |
| 12 | [CI/CD](12-cicd-deployment-security.md) | Pipeline, Image Signing |
| 13 | [Backup & DR](13-backup-disaster-recovery.md) | Backup, Recovery |
| 14 | [Compliance](14-compliance-audit-pentest.md) | OWASP, ISO, DSGVO |
| 15 | [Checkliste](15-security-checklist-runbooks.md) | Dieses Dokument |
