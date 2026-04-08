# Security Strategy & Threat Modeling

> **Ziel:** Systematische Sicherheitsstrategie für Government/Banking-Anwendungen  
> **Scope:** ASP.NET Core 10 API · Angular 21 · Admin Panel · Rocky Linux · Podman · Caddy  
> **Sicherheitsstufe:** Höchste — Resistenz gegen APT-Gruppen und organisierte Angriffe

---

## Inhaltsverzeichnis

- [1. Security Strategy Framework](#1-security-strategy-framework)
- [2. Threat Modeling mit STRIDE](#2-threat-modeling-mit-stride)
- [3. Attack Surface Analysis](#3-attack-surface-analysis)
- [4. Risk Assessment Matrix](#4-risk-assessment-matrix)
- [5. Defense-in-Depth-Architektur](#5-defense-in-depth-architektur)
- [6. Security Requirements Engineering](#6-security-requirements-engineering)
- [7. Threat Intelligence & Attack Vectors](#7-threat-intelligence--attack-vectors)
- [8. Security Governance & Policies](#8-security-governance--policies)
- [9. Security Development Lifecycle (SDL)](#9-security-development-lifecycle-sdl)

---

## 1. Security Strategy Framework

### 1.1 Sicherheitsziele (CIA-Triad erweitert)

```
          ┌──────────────────────────┐
          │     Confidentiality       │
          │  Vertraulichkeit der      │
          │  Daten und Kommunikation  │
          └────────────┬─────────────┘
                       │
     ┌─────────────────┼─────────────────┐
     │                 │                  │
┌────▼──────┐    ┌─────▼──────┐    ┌─────▼──────┐
│ Integrity  │    │Availability│    │Authenticity │
│ Daten-     │    │ Verfüg-    │    │ Echtheit    │
│ integrität │    │ barkeit    │    │ & Herkunft  │
└────────────┘    └────────────┘    └─────────────┘
     │                 │                  │
     └─────────────────┼─────────────────┘
                       │
          ┌────────────▼─────────────┐
          │   Non-Repudiation         │
          │   Nichtabstreitbarkeit    │
          │   aller Aktionen          │
          └──────────────────────────┘
```

### 1.2 Sicherheitsprinzipien für Government/Banking

| Prinzip | Beschreibung | Umsetzung |
|---------|-------------|-----------|
| **Defense in Depth** | Mehrere unabhängige Sicherheitsschichten | Firewall → WAF → API Gateway → App → DB |
| **Least Privilege** | Minimale notwendige Rechte | Rootless Container, RBAC, Scoped Tokens |
| **Zero Trust** | Niemals vertrauen, immer verifizieren | mTLS, Token-Validation auf jeder Schicht |
| **Secure by Default** | Standardmäßig alles blockiert | firewalld Drop-Policy, CSP, CORS strict |
| **Fail Secure** | Bei Fehler sicher blockieren | Deny-by-Default, Circuit Breaker |
| **Separation of Duties** | Aufgabentrennung | Admin ≠ Developer, Read ≠ Write Paths |
| **Complete Mediation** | Jeder Zugriff wird geprüft | Authorization Middleware auf jedem Endpoint |
| **Open Design** | Sicherheit nicht durch Geheimhaltung | Bekannte Algorithmen, keine Security by Obscurity |
| **Economy of Mechanism** | Einfache Sicherheitsmechanismen | Weniger Code = Weniger Angriffsfläche |
| **Psychological Acceptability** | Sicherheit nicht zu umständlich | SSO, Passwordless, Progressive Authentication |

### 1.3 Security Maturity Model

```
Level 5 ─ Optimizing    ┃ Continuous security improvement, automated threat hunting
Level 4 ─ Managed       ┃ Metrics-driven security, proactive threat detection  
Level 3 ─ Defined       ┃ Documented processes, regular pentests, incident response
Level 2 ─ Repeatable    ┃ Basic security controls, vulnerability scanning
Level 1 ─ Initial       ┃ Ad-hoc security, reactive approach
━━━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                          Ziel: Level 4-5 für Government/Banking
```

---

## 2. Threat Modeling mit STRIDE

### 2.1 STRIDE-Kategorien

| Kategorie | Bedrohung | Sicherheitsziel | Beispiel in unserem Stack |
|-----------|-----------|-----------------|--------------------------|
| **S** — Spoofing | Identitätstäuschung | Authentication | Gestohlene JWT-Tokens, Session Hijacking |
| **T** — Tampering | Datenmanipulation | Integrity | SQL Injection, API Parameter Manipulation |
| **R** — Repudiation | Aktionsleugnung | Non-Repudiation | Fehlende Audit-Logs, Log-Manipulation |
| **I** — Information Disclosure | Informationsleck | Confidentiality | Stack Traces in API-Responses, IDOR |
| **D** — Denial of Service | Dienstverweigerung | Availability | DDoS, Resource Exhaustion, ReDoS |
| **E** — Elevation of Privilege | Rechteausweitung | Authorization | Broken Access Control, Container Escape |

### 2.2 Threat Model für unseren Stack

#### 2.2.1 Data Flow Diagram (DFD)

```
┌──────────┐     HTTPS      ┌──────────┐     HTTP/2     ┌──────────────────┐
│  Browser  │ ─────────────→ │  Caddy    │ ────────────→ │ ASP.NET Core API  │
│  Angular  │ ←───────────── │  Reverse  │ ←──────────── │  (Container)      │
│  21 SPA   │                │  Proxy    │               │                    │
└──────────┘                └──────────┘               └────────┬───────────┘
     │                           │                              │
     │                      ┌────▼────┐                   ┌─────▼──────┐
     │                      │ Static   │                   │ PostgreSQL  │
     │                      │ Files    │                   │ (Container) │
     │                      └─────────┘                   └────────────┘
     │
┌────▼─────┐
│  Admin    │
│  Panel    │
│  (Angular)│
└──────────┘
```

#### 2.2.2 STRIDE-Analyse pro Komponente

**Angular 21 SPA (Öffentlich)**

| Bedrohung | Angriff | Risiko | Gegenmaßnahme |
|-----------|---------|--------|----------------|
| Spoofing | XSS → Token-Diebstahl | Kritisch | CSP strict, HttpOnly Cookies, DOM Sanitization |
| Tampering | DOM Manipulation, LocalStorage Tampering | Hoch | Integrity Checks, Server-Side Validation |
| Info Disclosure | Source Map Leaks, Console Logging | Mittel | Disable Source Maps in Prod, Strip Console |
| DoS | Client-Side Resource Exhaustion | Niedrig | Virtual Scrolling, Lazy Loading |
| Elevation | Route Guard Bypass | Hoch | Server-Side Authorization für JEDEN Request |

**Caddy Reverse Proxy**

| Bedrohung | Angriff | Risiko | Gegenmaßnahme |
|-----------|---------|--------|----------------|
| Spoofing | SSL Stripping, Fake Certificates | Kritisch | HSTS, Certificate Pinning, Auto-HTTPS |
| Tampering | Header Injection, Request Smuggling | Hoch | Request Normalization, Header Sanitization |
| Info Disclosure | Server Banner, Error Pages | Mittel | Custom Error Pages, Header Removal |
| DoS | Slowloris, SYN Flood, Amplification | Kritisch | Rate Limiting, Connection Limits, Timeouts |

**ASP.NET Core 10 API**

| Bedrohung | Angriff | Risiko | Gegenmaßnahme |
|-----------|---------|--------|----------------|
| Spoofing | Token Forgery, Credential Stuffing | Kritisch | Asymmetric JWT, MFA, Account Lockout |
| Tampering | SQL/NoSQL Injection, Mass Assignment | Kritisch | Parameterized Queries, DTOs, Validation |
| Repudiation | Audit Log Bypass | Hoch | Immutable Audit Trail, Log Signing |
| Info Disclosure | Verbose Errors, IDOR, Path Traversal | Hoch | Exception Handling Middleware, UUID statt Auto-ID |
| DoS | API Abuse, Large Payloads, ReDoS | Hoch | Rate Limiting, Request Size Limits, Regex Audit |
| Elevation | Broken Auth/AuthZ, Insecure Deserialization | Kritisch | RBAC + ABAC, Policy-Based Auth, Type-Safe Deserialization |

**PostgreSQL Database**

| Bedrohung | Angriff | Risiko | Gegenmaßnahme |
|-----------|---------|--------|----------------|
| Spoofing | Connection Spoofing | Hoch | Client Certificate Authentication, TLS |
| Tampering | Data Corruption, Unauthorized Updates | Kritisch | Row-Level Security, Audit Triggers |
| Info Disclosure | Data Breach, Backup Theft | Kritisch | TDE, Column-Level Encryption, Encrypted Backups |
| DoS | Connection Pool Exhaustion | Hoch | Connection Limits, Pgbouncer |
| Elevation | SQL Injection → DB Admin | Kritisch | Parameterized Queries, Restricted DB User |

**Podman Container Runtime**

| Bedrohung | Angriff | Risiko | Gegenmaßnahme |
|-----------|---------|--------|----------------|
| Spoofing | Malicious Base Image | Hoch | Image Signing, Trusted Registries Only |
| Tampering | Container Layer Manipulation | Hoch | Read-Only Filesystem, Image Digest Pinning |
| Elevation | Container Escape | Kritisch | Rootless, User Namespaces, SELinux, Seccomp |

**Rocky Linux Host**

| Bedrohung | Angriff | Risiko | Gegenmaßnahme |
|-----------|---------|--------|----------------|
| Spoofing | SSH Brute Force, Key Stealing | Kritisch | Key-Only Auth, Fail2Ban, Port Knocking |
| Tampering | Rootkit, Kernel Exploit | Kritisch | SELinux, AIDE, Secure Boot, Kernel Hardening |
| Elevation | Privilege Escalation | Kritisch | Minimal sudo, No SUID, Kernel Lockdown |

### 2.3 Attack Trees

```
Root Goal: Zugriff auf Banking-Daten erlangen
├── 1. Über das Netzwerk eindringen
│   ├── 1.1 DDoS → Service-Ausfall → Recovery-Schwachstelle ausnutzen
│   ├── 1.2 SSL/TLS-Downgrade → MitM → Daten abfangen
│   └── 1.3 DNS-Hijacking → Phishing → Credentials stehlen
├── 2. Über die Anwendung eindringen
│   ├── 2.1 SQL Injection → Datenbankzugriff
│   ├── 2.2 XSS → Admin-Session stehlen → Rechteausweitung
│   ├── 2.3 IDOR → Fremde Kundendaten abrufen
│   ├── 2.4 API Parameter Tampering → Geschäftslogik umgehen
│   └── 2.5 File Upload → RCE → Shell → Lateral Movement
├── 3. Über Authentifizierung eindringen
│   ├── 3.1 Credential Stuffing → Account Takeover
│   ├── 3.2 JWT Token Forgery → Fake Admin Session
│   └── 3.3 OAuth Misconfiguration → Token Theft
├── 4. Über die Infrastruktur eindringen
│   ├── 4.1 Container Escape → Host Access
│   ├── 4.2 SSH Key Compromise → Server Access
│   └── 4.3 Supply Chain Attack → Malicious Dependency
└── 5. Social Engineering
    ├── 5.1 Phishing → Admin Credentials
    └── 5.2 Insider Threat → Direct Data Access
```

---

## 3. Attack Surface Analysis

### 3.1 Externe Angriffsfläche

```
┌────────────────────────────────────────────────────────────────┐
│                    EXTERNE ANGRIFFSFLÄCHE                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Port 443 (HTTPS)                                              │
│  ├── Angular SPA                                               │
│  │   ├── JavaScript Bundle (Client-Side Logik)                 │
│  │   ├── API-Aufrufe (REST/GraphQL)                            │
│  │   └── WebSocket-Verbindungen (SignalR)                      │
│  ├── Admin Panel                                               │
│  │   ├── Login-Seite                                           │
│  │   └── Admin-API-Endpunkte                                   │
│  └── API Endpoints                                             │
│      ├── Öffentliche Endpunkte (Auth, Health)                  │
│      ├── Authentifizierte Endpunkte (CRUD)                     │
│      └── Admin-Endpunkte (Management)                          │
│                                                                │
│  Port 80 (HTTP → 301 Redirect)                                 │
│                                                                │
│  DNS Records                                                   │
│  SSL/TLS Zertifikate                                          │
│  Email (SPF, DKIM, DMARC)                                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 Interne Angriffsfläche

```
┌────────────────────────────────────────────────────────────────┐
│                    INTERNE ANGRIFFSFLÄCHE                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Container-zu-Container Kommunikation                          │
│  ├── API → Database (PostgreSQL Port 5432)                     │
│  ├── API → Cache (Redis Port 6379)                             │
│  └── API → Message Queue (Optional)                            │
│                                                                │
│  Host-Dienste                                                  │
│  ├── SSH (Port 22 oder Custom)                                 │
│  ├── Podman Socket (Unix Socket)                               │
│  └── Systemd Services                                          │
│                                                                │
│  Dateisystem                                                   │
│  ├── Container Volumes                                         │
│  ├── Konfigurationsdateien                                     │
│  ├── Zertifikate und Schlüssel                                 │
│  └── Log-Dateien                                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 Attack Surface Minimierung

```yaml
Strategie:
  Netzwerk:
    - Nur Port 443 extern erreichbar
    - Port 80 nur für HTTPS-Redirect
    - SSH nur über VPN/Jump-Server
    - Alle internen Ports nur über localhost/Container-Netzwerk
    
  Anwendung:
    - Keine unnötigen API-Endpunkte
    - GraphQL Introspection deaktiviert in Production
    - Swagger/OpenAPI nur in Development
    - Source Maps nicht deployen
    - Debug-Endpunkte entfernen
    
  Infrastruktur:
    - Minimale OS-Installation
    - Nur notwendige Pakete installieren
    - Unnötige Kernel-Module deaktivieren
    - Nur notwendige Container-Ports exponieren
    
  Daten:
    - Column-Level Encryption für sensitive Daten
    - Data Masking in Nicht-Produktionsumgebungen
    - Keine sensitive Daten in Logs
    - Automatische Datenlöschung (DSGVO)
```

---

## 4. Risk Assessment Matrix

### 4.1 Risikobewertung

```
           │ Unbedeutend │  Gering  │  Moderat  │  Erheblich  │ Katastrophal │
           │     (1)     │   (2)    │    (3)    │     (4)     │     (5)      │
━━━━━━━━━━━┿━━━━━━━━━━━━━┿━━━━━━━━━━┿━━━━━━━━━━━┿━━━━━━━━━━━━━┿━━━━━━━━━━━━━━┥
Sehr hoch  │             │          │   HOCH    │  KRITISCH   │  KRITISCH    │
   (5)     │   MITTEL    │  MITTEL  │           │             │              │
───────────┼─────────────┼──────────┼───────────┼─────────────┼──────────────┤
Hoch       │             │          │           │  KRITISCH   │  KRITISCH    │
   (4)     │   NIEDRIG   │  MITTEL  │   HOCH    │             │              │
───────────┼─────────────┼──────────┼───────────┼─────────────┼──────────────┤
Mittel     │             │          │           │             │  KRITISCH    │
   (3)     │   NIEDRIG   │ NIEDRIG  │  MITTEL   │    HOCH     │              │
───────────┼─────────────┼──────────┼───────────┼─────────────┼──────────────┤
Niedrig    │             │          │           │             │              │
   (2)     │   NIEDRIG   │ NIEDRIG  │ NIEDRIG   │   MITTEL    │    HOCH      │
───────────┼─────────────┼──────────┼───────────┼─────────────┼──────────────┤
Sehr niedrig│             │          │           │             │              │
   (1)     │   NIEDRIG   │ NIEDRIG  │ NIEDRIG   │  NIEDRIG    │   MITTEL     │
━━━━━━━━━━━┷━━━━━━━━━━━━━┷━━━━━━━━━━┷━━━━━━━━━━━┷━━━━━━━━━━━━━┷━━━━━━━━━━━━━━┘
       Wahrscheinlichkeit ▲                            Auswirkung ►
```

### 4.2 Top-Risiken für Government/Banking App

| # | Risiko | Wahrscheinlichkeit | Auswirkung | Bewertung | Gegenmaßnahme |
|---|--------|-------------------|------------|-----------|----------------|
| 1 | SQL Injection → Datenleck | Hoch (4) | Katastrophal (5) | **KRITISCH** | Parameterized Queries, ORM, WAF |
| 2 | Broken Authentication → Account Takeover | Hoch (4) | Katastrophal (5) | **KRITISCH** | MFA, Rate Limiting, Session Management |
| 3 | Container Escape → Host Compromise | Niedrig (2) | Katastrophal (5) | **HOCH** | Rootless, SELinux, Seccomp, User NS |
| 4 | XSS → Admin Session Theft | Mittel (3) | Erheblich (4) | **HOCH** | CSP, DOM Sanitization, HttpOnly Cookies |
| 5 | DDoS → Service Outage | Sehr hoch (5) | Erheblich (4) | **KRITISCH** | Rate Limiting, CDN, Auto-Scaling |
| 6 | Supply Chain Attack | Mittel (3) | Katastrophal (5) | **KRITISCH** | SCA, Lock Files, Image Signing |
| 7 | Insider Threat → Data Exfiltration | Niedrig (2) | Katastrophal (5) | **HOCH** | RBAC, Audit Logging, DLP |
| 8 | API Mass Assignment | Hoch (4) | Erheblich (4) | **KRITISCH** | DTOs, Whitelist Binding |
| 9 | IDOR → Unauthorized Data Access | Hoch (4) | Erheblich (4) | **KRITISCH** | UUID, Owner Checks, Policy Auth |
| 10 | Deserialization Attack | Mittel (3) | Katastrophal (5) | **KRITISCH** | Type-Safe Deserialization, Whitelist |

---

## 5. Defense-in-Depth-Architektur

### 5.1 Schichtenmodell

```
Schicht 7 ─ Daten          │ Encryption at Rest, Column Encryption
                            │ Data Classification, Masking, Tokenization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Schicht 6 ─ Anwendung       │ Input Validation, Output Encoding
                            │ Authentication, Authorization, CSRF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Schicht 5 ─ Container       │ Rootless, Read-Only FS, Seccomp
                            │ Image Scanning, Resource Limits
━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Schicht 4 ─ Host            │ SELinux, AIDE, auditd, CIS Hardening
                            │ Kernel Hardening, Minimal Services
━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Schicht 3 ─ Netzwerk        │ firewalld, nftables, Micro-Segmentation
                            │ IDS/IPS, VPN, DDoS Protection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Schicht 2 ─ Edge            │ Caddy TLS 1.3, HSTS, Security Headers
                            │ Rate Limiting, WAF, Geo-Blocking
━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Schicht 1 ─ Perimeter       │ DNS Security, DDoS Mitigation
                            │ IP Reputation, Bot Detection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Schicht 0 ─ Physisch        │ Datacenter Security, Hardware Tamper
                            │ HSM, Secure Boot, TPM
```

### 5.2 Sicherheitskontrollen pro Schicht

```csharp
// Beispiel: Mehrschichtige Validierung eines Banking-API-Requests

// Schicht 2 — Caddy: Rate Limiting, TLS-Terminierung
// → Request kommt nur durch, wenn Rate Limit nicht überschritten

// Schicht 6 — ASP.NET Middleware Pipeline:
app.UseMiddleware<RequestSizeLimitMiddleware>();     // Max Request Size
app.UseMiddleware<CorrelationIdMiddleware>();         // Request Tracking
app.UseMiddleware<SecurityHeadersMiddleware>();       // Security Headers
app.UseAuthentication();                              // Token Validation
app.UseAuthorization();                               // RBAC + ABAC
app.UseMiddleware<AuditLoggingMiddleware>();          // Audit Trail
app.UseMiddleware<InputSanitizationMiddleware>();     // Input Cleaning

// Controller-Ebene:
[Authorize(Policy = "BankingAdmin")]
[ValidateAntiForgeryToken]
[RateLimit(Policy = "strict")]
public async Task<IActionResult> TransferFunds(
    [FromBody] TransferRequest request)
{
    // Modell-Validierung (Data Annotations + FluentValidation)
    // Business-Regel-Validierung
    // Parameterized Database Query
    // Audit Log Entry
    // Encrypted Response
}
```

---

## 6. Security Requirements Engineering

### 6.1 Funktionale Sicherheitsanforderungen

```yaml
Authentication:
  - FR-AUTH-001: Multi-Factor Authentication (MFA) für alle Admin-Benutzer
  - FR-AUTH-002: Passwordless Login via FIDO2/WebAuthn
  - FR-AUTH-003: Account Lockout nach 5 Fehlversuchen (15 Minuten)
  - FR-AUTH-004: Session-Timeout nach 15 Minuten Inaktivität
  - FR-AUTH-005: Erzwungener Passwort-Wechsel alle 90 Tage
  - FR-AUTH-006: Passwort-Komplexität: min. 14 Zeichen, 4 Zeichenklassen

Authorization:
  - FR-AUTHZ-001: Role-Based Access Control (RBAC)
  - FR-AUTHZ-002: Attribute-Based Access Control (ABAC) für sensitive Endpunkte
  - FR-AUTHZ-003: Resource-Owner-Validierung für alle Datenzugriffe
  - FR-AUTHZ-004: Separation of Duties für kritische Operationen
  - FR-AUTHZ-005: Time-Based Access Restrictions für Wartungsfenster

Data Protection:
  - FR-DATA-001: AES-256 Encryption at Rest für alle sensitiven Daten
  - FR-DATA-002: TLS 1.3 für alle Datenübertragungen
  - FR-DATA-003: Data Masking in Logs und Nicht-Produktionsumgebungen
  - FR-DATA-004: Automatische Datenlöschung gemäß DSGVO
  - FR-DATA-005: Column-Level Encryption für PII-Daten

Audit:
  - FR-AUDIT-001: Unveränderliche Audit-Logs für alle Datenzugriffe
  - FR-AUDIT-002: Log-Retention von mindestens 7 Jahren (Banking)
  - FR-AUDIT-003: Real-Time Alerting bei verdächtigen Aktivitäten
  - FR-AUDIT-004: Tamper-Evident Logging (Hash-Chain)
```

### 6.2 Nicht-Funktionale Sicherheitsanforderungen

```yaml
Performance:
  - NFR-SEC-001: Security-Middleware darf max. 5ms Latenz hinzufügen
  - NFR-SEC-002: Rate Limiting muss 100k req/s verarbeiten können
  - NFR-SEC-003: Audit Logging darf nicht blockieren (async)

Availability:
  - NFR-SEC-004: 99.99% Verfügbarkeit (max. 52 Minuten Downtime/Jahr)
  - NFR-SEC-005: DDoS-Resistenz bis 10 Gbps
  - NFR-SEC-006: Automatisches Failover < 30 Sekunden

Compliance:
  - NFR-SEC-007: OWASP Top 10 vollständig adressiert
  - NFR-SEC-008: PCI-DSS Level 1 Compliance
  - NFR-SEC-009: ISO 27001 konform
  - NFR-SEC-010: DSGVO/GDPR vollständig umgesetzt
```

---

## 7. Threat Intelligence & Attack Vectors

### 7.1 Bekannte Angriffsgruppen und ihre Methoden

| Angreifertyp | Ressourcen | Typische Angriffe | Gegenmaßnahmen |
|-------------|-----------|-------------------|-----------------|
| **Script Kiddies** | Niedrig | Automatisierte Scanner, Exploit Kits | WAF, Rate Limiting, Patching |
| **Hacktivists** | Mittel | DDoS, Defacement, Data Leaks | DDoS Protection, Integrity Monitoring |
| **Cybercrime Groups** | Hoch | Ransomware, Credential Stuffing, BEC | MFA, Backup Strategy, Email Security |
| **APT Groups** | Sehr hoch | Zero-Days, Supply Chain, Persistence | Defense in Depth, Threat Hunting, EDR |
| **Nation-State Actors** | Maximal | Advanced Persistent Threats, SIGINT | Zero Trust, Hardware Security, Air Gap |
| **Insider Threats** | Variabel | Data Exfiltration, Sabotage | RBAC, DLP, Behavioral Analytics |

### 7.2 OWASP Top 10 (2021) Mapping

| # | Risiko | Unsere Gegenmaßnahmen | Dokument |
|---|--------|----------------------|----------|
| A01 | Broken Access Control | RBAC + ABAC, Resource-Owner Checks, CORS | [06](06-aspnet-core-api-security.md), [08](08-authentication-identity.md) |
| A02 | Cryptographic Failures | TLS 1.3, AES-256, Key Rotation | [09](09-cryptography-data-protection.md) |
| A03 | Injection | Parameterized Queries, Input Validation, CSP | [06](06-aspnet-core-api-security.md) |
| A04 | Insecure Design | Threat Modeling, Secure SDLC | Dieses Dokument |
| A05 | Security Misconfiguration | CIS Benchmark, OpenSCAP, Hardening | [02](02-rocky-linux-server-hardening.md) |
| A06 | Vulnerable Components | SCA, Dependabot, Image Scanning | [12](12-cicd-deployment-security.md) |
| A07 | Authentication Failures | MFA, Rate Limiting, Secure Session | [08](08-authentication-identity.md) |
| A08 | Software/Data Integrity | SRI, Signed Images, SBOM | [12](12-cicd-deployment-security.md) |
| A09 | Security Logging Failures | auditd, SIEM, Tamper-Evident Logs | [10](10-monitoring-logging-incident-response.md) |
| A10 | SSRF | URL Validation, Network Segmentation | [06](06-aspnet-core-api-security.md) |

### 7.3 MITRE ATT&CK Mapping (relevante Techniken)

```yaml
Initial Access:
  T1190: Exploit Public-Facing Application → WAF, Input Validation, Patching
  T1078: Valid Accounts → MFA, Credential Monitoring, Account Lockout
  T1199: Trusted Relationship → Vendor Risk Assessment, Zero Trust

Execution:
  T1059: Command and Scripting Interpreter → SELinux, Seccomp, No Shell in Container
  T1203: Exploitation for Client Execution → CSP, SRI, Browser Security

Persistence:
  T1136: Create Account → Audit Log, Alerting on User Creation
  T1078: Valid Accounts → Session Monitoring, Token Rotation

Privilege Escalation:
  T1068: Exploitation for Privilege Escalation → Kernel Hardening, Rootless Container
  T1548: Abuse Elevation Control → No SUID, Restricted sudo

Defense Evasion:
  T1070: Indicator Removal → Immutable Logs, Remote Log Storage
  T1562: Impair Defenses → Integrity Monitoring (AIDE), SELinux Enforcing

Credential Access:
  T1110: Brute Force → Fail2Ban, Account Lockout, Rate Limiting
  T1552: Unsecured Credentials → Secrets Manager, No Plaintext Secrets

Lateral Movement:
  T1021: Remote Services → Network Segmentation, mTLS
  T1563: Remote Service Session Hijacking → Session Binding, Token Rotation

Collection:
  T1005: Data from Local System → Encryption at Rest, DLP
  T1530: Data from Cloud Storage → Access Controls, Encryption

Exfiltration:
  T1041: Exfiltration Over C2 Channel → Egress Filtering, DLP
  T1567: Exfiltration Over Web Service → Network Monitoring, Anomaly Detection
```

---

## 8. Security Governance & Policies

### 8.1 Security Policy Framework

```
┌────────────────────────────────────────────────────────┐
│              Security Policy Framework                  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Level 1: Security Policy (Strategisch)                │
│  ├── Informationssicherheitspolitik                    │
│  ├── Acceptable Use Policy                             │
│  └── Risk Management Policy                            │
│                                                        │
│  Level 2: Standards & Procedures (Taktisch)            │
│  ├── Password Policy                                   │
│  ├── Encryption Standard                               │
│  ├── Access Control Standard                           │
│  ├── Incident Response Procedure                       │
│  └── Change Management Procedure                       │
│                                                        │
│  Level 3: Guidelines & Baselines (Operational)         │
│  ├── Server Hardening Baseline                         │
│  ├── Container Security Guidelines                     │
│  ├── Secure Coding Guidelines                          │
│  ├── API Security Guidelines                           │
│  └── Deployment Security Checklist                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 8.2 Rollen und Verantwortlichkeiten (RACI)

| Aufgabe | CISO | Security Engineer | Developer | DevOps | Auditor |
|---------|------|------------------|-----------|--------|---------|
| Security Strategy | **A/R** | C | I | I | C |
| Threat Modeling | A | **R** | **R** | C | I |
| Secure Coding | A | C | **R** | I | I |
| Penetration Testing | A | **R** | C | C | **R** |
| Incident Response | **A** | **R** | C | **R** | I |
| Compliance Audit | A | C | I | I | **R** |
| Server Hardening | A | C | I | **R** | I |
| Security Monitoring | A | **R** | I | **R** | C |

*R = Responsible, A = Accountable, C = Consulted, I = Informed*

---

## 9. Security Development Lifecycle (SDL)

### 9.1 Secure SDLC Phasen

```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Require │ → │ Design  │ → │  Impl   │ → │  Test   │ → │ Deploy  │ → │ Operate │
│  ments  │   │         │   │         │   │         │   │         │   │         │
├─────────┤   ├─────────┤   ├─────────┤   ├─────────┤   ├─────────┤   ├─────────┤
│Security │   │Threat   │   │Secure   │   │SAST     │   │Security │   │Monitor  │
│Require- │   │Modeling │   │Coding   │   │DAST     │   │Config   │   │Incident │
│ments    │   │Design   │   │Code     │   │SCA      │   │Image    │   │Response │
│Risk     │   │Review   │   │Review   │   │Pentest  │   │Scan     │   │Threat   │
│Analysis │   │Attack   │   │Linting  │   │Fuzz     │   │Secrets  │   │Hunting  │
│         │   │Surface  │   │         │   │Testing  │   │Check    │   │Patching │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

### 9.2 Security Gates (Quality Gates)

```yaml
Gate 1 — Requirements Review:
  - [ ] Alle Security Requirements dokumentiert
  - [ ] Datenklassifizierung abgeschlossen
  - [ ] Compliance-Anforderungen identifiziert

Gate 2 — Design Review:
  - [ ] Threat Model erstellt und reviewed
  - [ ] Attack Surface minimiert
  - [ ] Security Architecture genehmigt

Gate 3 — Implementation Review:
  - [ ] Code Review durch Security Engineer
  - [ ] SAST-Scan ohne kritische Findings
  - [ ] Keine bekannten Schwachstellen in Dependencies

Gate 4 — Test Sign-Off:
  - [ ] DAST-Scan abgeschlossen
  - [ ] Penetration Test bestanden
  - [ ] Security Regression Tests grün

Gate 5 — Deployment Approval:
  - [ ] Production Security Checklist abgehakt
  - [ ] Container Image Scan sauber
  - [ ] Secrets nicht im Code/Repository
  - [ ] Rollback-Plan dokumentiert

Gate 6 — Operational Readiness:
  - [ ] Monitoring eingerichtet
  - [ ] Alerting konfiguriert
  - [ ] Incident Response Plan aktuell
  - [ ] Backup und Recovery getestet
```

### 9.3 Secure Coding Standards

```yaml
ASP.NET Core 10:
  - Immer Parameterized Queries/ORM verwenden
  - Immer DTOs für Input/Output (nie Entity direkt exponieren)
  - Immer [Authorize] auf Controller/Action-Ebene
  - Immer Anti-Forgery Tokens für State-Changing Operations
  - Nie sensitive Daten in URLs (Query Parameters)
  - Nie Exception Details in Production Responses
  - Nie eigene Kryptographie implementieren

Angular 21:
  - Immer Angular DomSanitizer verwenden
  - Immer HttpOnly/Secure Cookies für Tokens
  - Immer CSP mit Nonce oder Hash
  - Nie innerHTML mit User-Input
  - Nie eval() oder Function() Constructor
  - Nie sensitive Daten in LocalStorage
  - Nie Source Maps in Production

Infrastructure:
  - Immer Infrastructure as Code (IaC)
  - Immer Secrets über Secrets Manager
  - Immer Container Images von vertrauenswürdigen Registries
  - Nie Credentials in Umgebungsvariablen (Secrets Manager)
  - Nie root-Benutzer in Containern
  - Nie --privileged Flag für Container
```

---

## Weiterführende Dokumente

| Nächstes Dokument | Thema |
|-------------------|-------|
| [02 — Rocky Linux Server Hardening](02-rocky-linux-server-hardening.md) | OS-Härtung als Fundament |
| [03 — Network & Firewall Security](03-network-firewall-security.md) | Netzwerksicherheit |
| [06 — ASP.NET Core 10 API Security](06-aspnet-core-api-security.md) | API-Sicherheit |
| [14 — Compliance & Audit](14-compliance-audit-pentest.md) | Compliance-Anforderungen |
