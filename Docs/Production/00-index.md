# Production Security Documentation — Government & Banking Grade

> **Sicherheitsstufe:** Höchste (Government / Financial Institution)  
> **Stack:** Rocky Linux · Podman · Caddy · ASP.NET Core 10 API · Angular 21 · Admin Panel  
> **Ziel:** Vollständige Defense-in-Depth-Strategie von der Infrastruktur bis zur Anwendung

---

## Dokumentenübersicht

| # | Datei | Thema | Schwerpunkt |
|---|-------|-------|-------------|
| 01 | [Security Strategy & Threat Modeling](01-security-strategy-threat-modeling.md) | Sicherheitsstrategie, Bedrohungsmodellierung, STRIDE, Attack Surface Analysis | Planung |
| 02 | [Rocky Linux Server Hardening](02-rocky-linux-server-hardening.md) | OS-Härtung, Kernel, SELinux, CIS Benchmark, OpenSCAP | Infrastruktur |
| 03 | [Network & Firewall Security](03-network-firewall-security.md) | firewalld, nftables, Netzwerksegmentierung, DDoS-Schutz, VPN | Netzwerk |
| 04 | [Container Security with Podman](04-container-security-podman.md) | Rootless Container, Image-Sicherheit, Pod-Isolation, Runtime-Schutz | Container |
| 05 | [Reverse Proxy & TLS with Caddy](05-reverse-proxy-tls-caddy.md) | Caddy-Konfiguration, Auto-HTTPS, Security Headers, Rate Limiting | Edge |
| 06 | [ASP.NET Core 10 API Security](06-aspnet-core-api-security.md) | Middleware-Pipeline, Input Validation, CORS, Rate Limiting, Anti-Tampering | Backend |
| 07 | [Angular 21 & Admin Panel Security](07-angular-admin-panel-security.md) | CSP, XSS-Prävention, Route Guards, Token-Handling, Admin-Härtung | Frontend |
| 08 | [Authentication & Identity Management](08-authentication-identity.md) | OAuth 2.0, OpenID Connect, MFA, Passwordless, Session-Management | Identität |
| 09 | [Cryptography & Data Protection](09-cryptography-data-protection.md) | AES-256, RSA, ECDSA, TLS 1.3, Key Management, Data-at-Rest/in-Transit | Verschlüsselung |
| 10 | [Monitoring, Logging & Incident Response](10-monitoring-logging-incident-response.md) | auditd, SIEM, Prometheus/Grafana, Fail2Ban, AIDE, Incident Playbooks | Überwachung |
| 11 | [Zero Trust Architecture](11-zero-trust-architecture.md) | Micro-Segmentierung, mTLS, Service Mesh, Identity-Aware Proxy | Architektur |
| 12 | [CI/CD Pipeline & Deployment Security](12-cicd-deployment-security.md) | Secure Pipeline, Image Scanning, Secrets Management, Blue/Green Deploy | Deployment |
| 13 | [Backup, Disaster Recovery & Business Continuity](13-backup-disaster-recovery.md) | Encrypted Backups, RPO/RTO, Failover, Geo-Redundanz | Resilienz |
| 14 | [Compliance, Audit & Penetration Testing](14-compliance-audit-pentest.md) | OWASP, PCI-DSS, ISO 27001, DSGVO, Audit-Logging, Pentest-Methodik | Compliance |
| 15 | [Production Security Checklist & Runbooks](15-security-checklist-runbooks.md) | Pre-Deployment Checklist, Härtungs-Runbook, Emergency Procedures | Operations |

---

## Architektur-Übersicht

```
                          ┌─────────────────────────────────┐
                          │        Internet / Clients        │
                          └──────────────┬──────────────────┘
                                         │
                          ┌──────────────▼──────────────────┐
                          │      Caddy (Reverse Proxy)       │
                          │  • Auto-TLS 1.3                  │
                          │  • WAF / Rate Limiting            │
                          │  • Security Headers               │
                          │  • mTLS (Service-to-Service)      │
                          └──────────────┬──────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                     │
          ┌─────────▼─────────┐ ┌───────▼────────┐ ┌────────▼────────┐
          │   Angular 21 SPA   │ │  Admin Panel    │ │  Static Assets   │
          │   (Container)      │ │  (Container)    │ │  (Container)     │
          └────────────────────┘ └────────────────┘ └─────────────────┘
                    │                    │
          ┌─────────▼────────────────────▼──────────┐
          │        ASP.NET Core 10 API               │
          │  • Authentication / Authorization         │
          │  • Input Validation / Anti-Forgery         │
          │  • Rate Limiting / CORS                    │
          │  • Encrypted Communication                 │
          │          (Podman Container)                │
          └──────────────────┬──────────────────────┘
                             │
          ┌──────────────────▼──────────────────────┐
          │         Database (PostgreSQL/MSSQL)       │
          │  • Encrypted at Rest (AES-256)            │
          │  • TLS Connections Only                    │
          │  • Row-Level Security                      │
          │          (Podman Container)                │
          └──────────────────────────────────────────┘
                             │
          ┌──────────────────▼──────────────────────┐
          │         Rocky Linux Host                  │
          │  • SELinux Enforcing                       │
          │  • CIS Hardened                            │
          │  • auditd + AIDE + Fail2Ban                │
          │  • Rootless Podman                         │
          │  • firewalld (Default Drop)                │
          └──────────────────────────────────────────┘
```

---

## Sicherheitsprinzipien

1. **Defense in Depth** — Mehrere unabhängige Sicherheitsschichten
2. **Least Privilege** — Minimale Rechte für jeden Dienst und Benutzer
3. **Zero Trust** — Niemals vertrauen, immer verifizieren
4. **Secure by Default** — Alles blockiert, explizit freigeben
5. **Fail Secure** — Im Fehlerfall sicher blockieren
6. **Separation of Duties** — Aufgabentrennung für kritische Operationen
7. **Audit Everything** — Vollständige, unveränderliche Protokollierung
8. **Assume Breach** — Immer von einem erfolgreichen Angriff ausgehen und entsprechend planen

---

## Schnellstart

```bash
# 1. System aktualisieren
sudo dnf update -y

# 2. SELinux erzwingen
sudo setenforce 1

# 3. Firewall aktivieren (Default Drop)
sudo systemctl enable --now firewalld
sudo firewall-cmd --set-default-zone=drop

# 4. Podman rootless einrichten
podman system migrate
podman info --format '{{.Host.Security.Rootless}}'

# 5. Caddy als Reverse Proxy starten
podman run -d --name caddy -p 443:443 -p 80:80 \
  -v /etc/caddy/Caddyfile:/etc/caddy/Caddyfile:Z \
  docker.io/library/caddy:latest
```

> **Warnung:** Dies ist nur der Schnellstart. Folgen Sie allen 15 Dokumente für eine vollständige Härtung.
