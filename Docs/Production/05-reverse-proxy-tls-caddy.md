# Reverse Proxy & TLS with Caddy

> **Ziel:** Government-Grade Edge Security mit automatischem TLS  
> **Rolle:** Einziger öffentlich erreichbarer Dienst — alle Requests fließen durch Caddy  
> **Stack:** Caddy 2.x · Podman Container · ASP.NET Core 10 Backend · Angular 21 Frontend

---

## Inhaltsverzeichnis

- [1. Warum Caddy für Production](#1-warum-caddy-für-production)
- [2. Caddy Installation & Container Setup](#2-caddy-installation--container-setup)
- [3. Production Caddyfile](#3-production-caddyfile)
- [4. TLS & Certificate Management](#4-tls--certificate-management)
- [5. Security Headers](#5-security-headers)
- [6. Rate Limiting & DDoS Protection](#6-rate-limiting--ddos-protection)
- [7. WAF-ähnliche Schutzmaßnahmen](#7-waf-ähnliche-schutzmaßnahmen)
- [8. Reverse Proxy für ASP.NET Core](#8-reverse-proxy-für-aspnet-core)
- [9. Static File Serving (Angular)](#9-static-file-serving-angular)
- [10. Logging & Monitoring](#10-logging--monitoring)
- [11. High Availability & Performance](#11-high-availability--performance)

---

## 1. Warum Caddy für Production

### 1.1 Caddy Security-Vorteile

| Feature | Caddy | Nginx | Apache |
|---------|-------|-------|--------|
| **Auto-HTTPS** | Automatisch (Let's Encrypt/ZeroSSL) | Manuell | Manuell |
| **TLS 1.3** | Default | Konfiguration nötig | Konfiguration nötig |
| **Memory-Safe** | Go (keine Buffer Overflows) | C (anfällig) | C (anfällig) |
| **Config Reload** | Zero-Downtime API | Signal-basiert | Graceful Restart |
| **OCSP Stapling** | Automatisch | Manuell | Manuell |
| **HTTP/3 (QUIC)** | Nativ | Experimentell | Nein |
| **Komplexität** | Minimal | Moderat | Hoch |

### 1.2 Architektur-Rolle

```
Internet → [Caddy] → [ASP.NET Core API]
                   → [Angular SPA Static Files]
                   → [Admin Panel Static Files]

Caddy ist der EINZIGE öffentlich erreichbare Dienst.
Alles andere läuft in internen Container-Netzwerken.
```

---

## 2. Caddy Installation & Container Setup

### 2.1 Caddy Container (Production)

```bash
# Caddy Image mit Custom Modules (optional)
# Für Standard-Caddy:
podman pull docker.io/library/caddy:2-alpine

# Caddy-Verzeichnisse erstellen
sudo mkdir -p /opt/caddy/{config,data,logs,sites}
sudo chown -R 1001:1001 /opt/caddy

# Caddy Container starten
podman run -d \
    --name caddy \
    --network external-net \
    --network internal-net \
    -p 80:80 \
    -p 443:443 \
    -p 443:443/udp \
    \
    # Sicherheit
    --read-only \
    --cap-drop ALL \
    --cap-add NET_BIND_SERVICE \
    --security-opt no-new-privileges \
    --user 1001:1001 \
    --memory 256m \
    --cpus 0.5 \
    --pids-limit 128 \
    \
    # Volumes
    -v /opt/caddy/Caddyfile:/etc/caddy/Caddyfile:ro,Z \
    -v /opt/caddy/data:/data:Z \
    -v /opt/caddy/config:/config:Z \
    -v /opt/caddy/logs:/var/log/caddy:Z \
    -v /opt/caddy/sites:/srv:ro,Z \
    \
    # Logging
    --log-driver journald \
    --log-opt tag="caddy" \
    \
    # Health Check
    --health-cmd "wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1" \
    --health-interval 30s \
    --health-timeout 5s \
    --health-retries 3 \
    \
    caddy:2-alpine
```

### 2.2 Custom Caddy Build mit Security-Modulen

```dockerfile
# Containerfile.caddy
FROM caddy:2-builder AS builder

RUN xcaddy build \
    --with github.com/caddy-dns/cloudflare \
    --with github.com/mholt/caddy-ratelimit \
    --with github.com/caddyserver/replace-response

FROM caddy:2-alpine

COPY --from=builder /usr/bin/caddy /usr/bin/caddy

# Non-root user
RUN addgroup -g 1001 -S caddy && \
    adduser -u 1001 -S caddy -G caddy

USER 1001:1001
```

---

## 3. Production Caddyfile

### 3.1 Vollständige Production-Konfiguration

```caddyfile
# ============================================================
# GLOBALE EINSTELLUNGEN
# ============================================================
{
    # E-Mail für Let's Encrypt
    email security@example.com
    
    # ACME Server (Production)
    acme_ca https://acme-v02.api.letsencrypt.org/directory
    
    # OCSP Stapling
    ocsp_stapling on
    
    # HTTP/3 aktivieren
    servers {
        protocols h1 h2 h3
    }
    
    # Admin API deaktivieren (Sicherheit!)
    admin off
    
    # Logging
    log {
        output file /var/log/caddy/access.log {
            roll_size 100mb
            roll_keep 30
            roll_keep_for 90d
        }
        format json
        level INFO
    }
    
    # Grace Period für Shutdown
    grace_period 30s
    
    # Timeouts (Anti-Slowloris)
    servers {
        timeouts {
            read_body   10s
            read_header 5s
            write       30s
            idle        120s
        }
        max_header_size 16kb
    }
}

# ============================================================
# HTTP → HTTPS REDIRECT
# ============================================================
http:// {
    redir https://{host}{uri} permanent
}

# ============================================================
# HAUPTDOMAIN — Angular SPA + API
# ============================================================
app.example.com {
    # TLS-Konfiguration
    tls {
        protocols tls1.3
        curves x25519 secp384r1
        alpn h2 http/1.1
    }
    
    # ─── SECURITY HEADERS ───
    header {
        # HSTS (2 Jahre, mit Subdomains und Preload)
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        
        # XSS Protection
        X-XSS-Protection "0"
        
        # Content Type Sniffing
        X-Content-Type-Options "nosniff"
        
        # Frame Protection
        X-Frame-Options "DENY"
        
        # Referrer Policy
        Referrer-Policy "strict-origin-when-cross-origin"
        
        # Permissions Policy
        Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()"
        
        # Content Security Policy (Angular SPA)
        Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.example.com wss://api.example.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests"
        
        # Cross-Origin Policies
        Cross-Origin-Opener-Policy "same-origin"
        Cross-Origin-Resource-Policy "same-origin"
        Cross-Origin-Embedder-Policy "require-corp"
        
        # Server Header entfernen
        -Server
        -X-Powered-By
        -X-AspNet-Version
    }
    
    # ─── RATE LIMITING ───
    # Allgemeines Rate Limit: 100 Requests/Sekunde pro IP
    rate_limit {
        zone main_limit {
            key {remote_host}
            events 100
            window 1s
        }
    }
    
    # ─── HEALTH CHECK ENDPOINT ───
    handle /health {
        respond "OK" 200
    }
    
    # ─── API PROXY ───
    handle /api/* {
        # API-spezifische Headers
        header {
            # Cache deaktivieren für API
            Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate"
            Pragma "no-cache"
            Expires "0"
        }
        
        # Request Size Limit (10 MB)
        request_body {
            max_size 10MB
        }
        
        # Reverse Proxy zum ASP.NET Core Container
        reverse_proxy http://api:5000 {
            # Health Check
            health_uri /health
            health_interval 30s
            health_timeout 5s
            health_status 200
            
            # Timeouts
            transport http {
                read_timeout 30s
                write_timeout 30s
                dial_timeout 5s
                response_header_timeout 30s
                keepalive 30s
                keepalive_idle_conns 10
            }
            
            # Trusted Proxies Header
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
            header_up X-Request-ID {uuid}
            
            # Sensible Header aus Response entfernen
            header_down -Server
            header_down -X-Powered-By
            header_down -X-AspNet-Version
        }
    }
    
    # ─── SIGNALR WEBSOCKET ───
    handle /hubs/* {
        reverse_proxy http://api:5000 {
            transport http {
                read_timeout 0
                write_timeout 0
            }
        }
    }
    
    # ─── ANGULAR SPA ───
    handle {
        root * /srv/app
        
        # Statische Dateien mit Caching
        @static {
            path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2 *.ttf
        }
        header @static {
            Cache-Control "public, max-age=31536000, immutable"
        }
        
        # HTML-Dateien nicht cachen (für Updates)
        @html {
            path *.html
        }
        header @html {
            Cache-Control "no-cache, no-store, must-revalidate"
        }
        
        # Angular SPA Routing: Alle nicht-existierenden Pfade → index.html
        try_files {path} /index.html
        file_server
    }
    
    # ─── BLOCKIERTE PFADE ───
    @blocked {
        path /wp-admin* /wp-login* /xmlrpc* /.env /.git* /phpmyadmin*
        path /actuator* /console* /manager* /admin/config*
    }
    handle @blocked {
        respond "Not Found" 404
    }
    
    # ─── REQUEST LOGGING ───
    log {
        output file /var/log/caddy/app-access.log {
            roll_size 50mb
            roll_keep 30
        }
        format json {
            time_format iso8601
        }
    }
}

# ============================================================
# API SUBDOMAIN (Optional — wenn separater API-Host)
# ============================================================
api.example.com {
    tls {
        protocols tls1.3
        curves x25519 secp384r1
    }
    
    # Strengere Security Headers für API
    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Content-Type "application/json"
        Cache-Control "no-store"
        -Server
        -X-Powered-By
    }
    
    # CORS Headers (restriktiv)
    @cors_preflight method OPTIONS
    handle @cors_preflight {
        header {
            Access-Control-Allow-Origin "https://app.example.com"
            Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS"
            Access-Control-Allow-Headers "Authorization, Content-Type, X-Request-ID"
            Access-Control-Max-Age "86400"
            Access-Control-Allow-Credentials "true"
        }
        respond "" 204
    }
    
    header {
        Access-Control-Allow-Origin "https://app.example.com"
        Access-Control-Allow-Credentials "true"
        Access-Control-Expose-Headers "X-Request-ID, X-RateLimit-Remaining"
    }
    
    # Strengeres Rate Limiting für API
    rate_limit {
        zone api_limit {
            key {remote_host}
            events 30
            window 1s
        }
    }
    
    # Request Size Limit
    request_body {
        max_size 5MB
    }
    
    # API Reverse Proxy
    reverse_proxy http://api:5000 {
        health_uri /health
        health_interval 15s
        
        transport http {
            read_timeout 30s
            write_timeout 30s
            dial_timeout 3s
        }
        
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
        header_up X-Request-ID {uuid}
    }
    
    log {
        output file /var/log/caddy/api-access.log {
            roll_size 100mb
            roll_keep 60
        }
        format json
    }
}

# ============================================================
# ADMIN PANEL (Separater Host, Extra-Härtung)
# ============================================================
admin.example.com {
    tls {
        protocols tls1.3
        # Client Certificate Authentication (mTLS)
        client_auth {
            mode require_and_verify
            trust_pool file /etc/caddy/certs/admin-ca.crt
        }
    }
    
    # IP-Whitelist für Admin
    @blocked_ip {
        not remote_ip 10.0.0.0/24
    }
    handle @blocked_ip {
        respond "Forbidden" 403
    }
    
    # Strengste Security Headers
    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://api.example.com; frame-ancestors 'none'"
        Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
        -Server
        -X-Powered-By
    }
    
    # Sehr strenges Rate Limiting
    rate_limit {
        zone admin_limit {
            key {remote_host}
            events 10
            window 1s
        }
    }
    
    # Admin API Proxy
    handle /api/* {
        reverse_proxy http://api:5000 {
            header_up X-Admin-Request "true"
            header_up X-Client-Cert {tls_client_subject}
        }
    }
    
    # Admin SPA
    handle {
        root * /srv/admin
        try_files {path} /index.html
        file_server
    }
    
    log {
        output file /var/log/caddy/admin-access.log {
            roll_size 50mb
            roll_keep 90
        }
        format json
    }
}
```

---

## 4. TLS & Certificate Management

### 4.1 TLS Best Practices

```yaml
Caddy TLS-Konfiguration:
  Minimum Version: TLS 1.3 (KEIN TLS 1.2 für Banking)
  
  Curves (in Reihenfolge der Präferenz):
    - x25519      # Schnellste, sicherste
    - secp384r1   # NIST P-384 (Government-approved)
  
  Cipher Suites (TLS 1.3, automatisch):
    - TLS_AES_256_GCM_SHA384
    - TLS_CHACHA20_POLY1305_SHA256
    - TLS_AES_128_GCM_SHA256
  
  Features:
    - OCSP Stapling: Automatisch
    - Certificate Transparency: Automatisch
    - HSTS: 2 Jahre + includeSubDomains + preload
    - HTTP/3 (QUIC): Aktiviert
```

### 4.2 Certificate Pinning (Optional)

```caddyfile
# In ASP.NET Core API (nicht in Caddy) — für zusätzliche Sicherheit:
# Certificate Pinning via Public-Key-Pins Header
# WARNUNG: Gefährlich bei falschem Pin — Lock-Out möglich!

# Stattdessen: Expect-CT Header
header {
    Expect-CT "max-age=86400, enforce"
}
```

### 4.3 mTLS für Admin-Bereich

```bash
# CA für Admin-Zertifikate erstellen
mkdir -p /opt/caddy/certs

# Root CA erstellen
openssl req -new -x509 -days 3650 -nodes \
    -keyout /opt/caddy/certs/admin-ca.key \
    -out /opt/caddy/certs/admin-ca.crt \
    -subj "/C=DE/O=MyOrg/CN=Admin CA"

# Admin-Client-Zertifikat erstellen
openssl req -new -nodes \
    -keyout /opt/caddy/certs/admin-client.key \
    -out /opt/caddy/certs/admin-client.csr \
    -subj "/C=DE/O=MyOrg/CN=Admin User"

openssl x509 -req -days 365 \
    -in /opt/caddy/certs/admin-client.csr \
    -CA /opt/caddy/certs/admin-ca.crt \
    -CAkey /opt/caddy/certs/admin-ca.key \
    -CAcreateserial \
    -out /opt/caddy/certs/admin-client.crt

# P12 für Browser-Import
openssl pkcs12 -export \
    -in /opt/caddy/certs/admin-client.crt \
    -inkey /opt/caddy/certs/admin-client.key \
    -out /opt/caddy/certs/admin-client.p12
```

---

## 5. Security Headers

### 5.1 Header-Referenz

| Header | Wert | Zweck |
|--------|------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Erzwingt HTTPS für 2 Jahre |
| `X-Content-Type-Options` | `nosniff` | Verhindert MIME-Sniffing |
| `X-Frame-Options` | `DENY` | Verhindert Clickjacking |
| `X-XSS-Protection` | `0` | Deaktiviert (moderner CSP ist besser) |
| `Content-Security-Policy` | Siehe CSP-Konfiguration | Verhindert XSS, Code Injection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Kontrolliert Referrer-Information |
| `Permissions-Policy` | Alle Features deaktiviert | Blockiert Browser-APIs |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isoliert Browsing Context |
| `Cross-Origin-Resource-Policy` | `same-origin` | Blockiert Cross-Origin Reads |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Aktiviert Cross-Origin Isolation |
| `Cache-Control` | `no-store` (API) | Verhindert Cache-Leaks |

### 5.2 Content Security Policy (CSP) Detail

```yaml
CSP für Angular SPA:
  default-src: "'self'"
  script-src: "'self'"                    # Keine inline Scripts!
  style-src: "'self' 'unsafe-inline'"    # Angular braucht inline Styles
  img-src: "'self' data: https:"
  font-src: "'self'"
  connect-src: "'self' https://api.example.com wss://api.example.com"
  frame-ancestors: "'none'"              # KEIN Iframe-Embedding
  base-uri: "'self'"
  form-action: "'self'"
  upgrade-insecure-requests: true

CSP für Admin Panel (Strenger):
  default-src: "'self'"
  script-src: "'self'"
  style-src: "'self'"                    # KEIN unsafe-inline!
  img-src: "'self' data:"
  font-src: "'self'"
  connect-src: "'self' https://api.example.com"
  frame-ancestors: "'none'"
  base-uri: "'self'"
  form-action: "'self'"
  upgrade-insecure-requests: true

CSP für API Responses:
  default-src: "'none'"                  # API liefert kein HTML
  frame-ancestors: "'none'"
```

---

## 6. Rate Limiting & DDoS Protection

### 6.1 Rate Limiting Strategie

```yaml
Endpunkt-basiertes Rate Limiting:
  Öffentliche Seiten:     100 req/s pro IP
  API (authentifiziert):   30 req/s pro IP
  API (Login):             5 req/m pro IP        # Brute-Force Schutz
  API (Password Reset):    3 req/h pro IP
  Admin Panel:             10 req/s pro IP
  File Upload:             5 req/m pro IP
  Health Check:            Unlimited (intern)
```

### 6.2 Caddy Rate Limit Konfiguration

```caddyfile
# Rate Limiting mit caddy-ratelimit Modul
(rate_limit_login) {
    rate_limit {
        zone login_limit {
            key {remote_host}
            events 5
            window 60s
        }
    }
}

# Login-Endpunkt mit strengem Rate Limit
handle /api/auth/login {
    import rate_limit_login
    reverse_proxy http://api:5000
}

# File Upload mit Rate Limit
handle /api/files/upload {
    rate_limit {
        zone upload_limit {
            key {remote_host}
            events 5
            window 60s
        }
    }
    request_body {
        max_size 50MB
    }
    reverse_proxy http://api:5000
}
```

---

## 7. WAF-ähnliche Schutzmaßnahmen

### 7.1 Request Filtering

```caddyfile
# Verdächtige Pfade blockieren
@suspicious_paths {
    path_regexp suspicious (?i)(\.env|\.git|wp-admin|wp-login|phpmyadmin|\.asp|\.php|cgi-bin|\.bak|\.old|\.sql)
}
handle @suspicious_paths {
    log {
        output file /var/log/caddy/waf-blocked.log
        format json
    }
    respond "Not Found" 404
}

# Verdächtige User-Agents blockieren
@bad_agents {
    header_regexp User-Agent (?i)(sqlmap|nikto|nmap|masscan|zgrab|dirbuster|gobuster|wpscan)
}
handle @bad_agents {
    respond "Forbidden" 403
}

# Verdächtige Query-Parameter
@sql_injection {
    query_regexp (?i)(union\s+select|or\s+1=1|drop\s+table|insert\s+into|delete\s+from|update\s+.+set)
}
handle @sql_injection {
    log {
        output file /var/log/caddy/waf-sqli.log
        format json
    }
    respond "Bad Request" 400
}

# XSS-Versuch in Query
@xss_attempt {
    query_regexp (?i)(<script|javascript:|on\w+=|alert\(|document\.cookie)
}
handle @xss_attempt {
    respond "Bad Request" 400
}

# Path Traversal
@path_traversal {
    path_regexp traversal (?i)(\.\./|\.\.\\|%2e%2e|%252e%252e)
}
handle @path_traversal {
    respond "Bad Request" 400
}
```

### 7.2 Request Size & Method Restrictions

```caddyfile
# Nur erlaubte HTTP-Methoden
@disallowed_methods {
    not method GET POST PUT DELETE PATCH OPTIONS HEAD
}
handle @disallowed_methods {
    respond "Method Not Allowed" 405
}

# TRACE/TRACK explizit blockieren
@trace_track {
    method TRACE TRACK
}
handle @trace_track {
    respond "Method Not Allowed" 405
}

# Allgemeines Request Size Limit
request_body {
    max_size 10MB
}
```

---

## 8. Reverse Proxy für ASP.NET Core

### 8.1 Optimierter Proxy

```caddyfile
# ASP.NET Core API Reverse Proxy
reverse_proxy http://api:5000 {
    # Load Balancing (mehrere API-Instanzen)
    # to http://api-1:5000
    # to http://api-2:5000
    # lb_policy round_robin
    
    # Health Checking
    health_uri /health
    health_interval 15s
    health_timeout 5s
    health_status 200
    health_body "Healthy"
    
    # Connection Pool
    transport http {
        read_timeout 30s
        write_timeout 30s
        dial_timeout 3s
        response_header_timeout 30s
        keepalive 30s
        keepalive_idle_conns 20
        max_conns_per_host 100
        
        # TLS zum Backend (wenn mTLS verwendet wird)
        # tls
        # tls_client_auth /etc/caddy/certs/proxy-client.crt /etc/caddy/certs/proxy-client.key
        # tls_trusted_ca_certs /etc/caddy/certs/api-ca.crt
    }
    
    # Proxy Headers
    header_up Host {upstream_hostport}
    header_up X-Real-IP {remote_host}
    header_up X-Forwarded-For {remote_host}
    header_up X-Forwarded-Proto {scheme}
    header_up X-Forwarded-Host {host}
    header_up X-Request-ID {uuid}
    
    # Sensitive Response Headers entfernen
    header_down -Server
    header_down -X-Powered-By
    header_down -X-AspNet-Version
    header_down -X-AspNetCore-Version
    
    # Automatic Retries (nur für idempotente Methoden)
    lb_try_duration 5s
    lb_try_interval 250ms
    
    # Buffer
    flush_interval -1
}
```

### 8.2 ASP.NET Core ForwardedHeaders

```csharp
// In ASP.NET Core Program.cs — Caddy Proxy-Headers verarbeiten
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor 
                             | ForwardedHeaders.XForwardedProto
                             | ForwardedHeaders.XForwardedHost;
    
    // Caddy Container IP als trusted Proxy
    options.KnownProxies.Add(IPAddress.Parse("172.16.0.2"));
    options.KnownNetworks.Add(new IPNetwork(
        IPAddress.Parse("172.16.0.0"), 24));
    
    // Header-Namen (Standard für Caddy)
    options.ForwardedForHeaderName = "X-Forwarded-For";
    options.ForwardedProtoHeaderName = "X-Forwarded-Proto";
    options.ForwardedHostHeaderName = "X-Forwarded-Host";
});

// Middleware GANZ am Anfang der Pipeline
app.UseForwardedHeaders();
```

---

## 9. Static File Serving (Angular)

### 9.1 Angular Build für Production

```bash
# Angular 21 Production Build
ng build --configuration production \
    --output-hashing all \
    --source-map false \
    --named-chunks false

# Build-Output nach Caddy Static-Verzeichnis kopieren
cp -r dist/my-app/browser/* /opt/caddy/sites/app/
```

### 9.2 Static File Security

```caddyfile
# Angular SPA Static Files
handle {
    root * /srv/app
    
    # Caching: Gehashte Assets langfristig cachen
    @hashed_assets {
        path_regexp hashed \.[a-f0-9]{16,}\.(js|css|woff2?|ttf|eot|svg|png|jpg|gif|ico)$
    }
    header @hashed_assets {
        Cache-Control "public, max-age=31536000, immutable"
    }
    
    # HTML-Dateien: KEIN Caching
    @html_files {
        path *.html /
    }
    header @html_files {
        Cache-Control "no-cache, no-store, must-revalidate"
        Pragma "no-cache"
        Expires "0"
    }
    
    # ngsw.json (Service Worker Manifest): Kein Caching
    @service_worker {
        path /ngsw.json /ngsw-worker.js
    }
    header @service_worker {
        Cache-Control "no-cache"
    }
    
    # SPA Routing
    try_files {path} /index.html
    file_server {
        precompressed gzip br
    }
    
    # Verzeichnis-Listing deaktivieren
    file_server browse off
}
```

---

## 10. Logging & Monitoring

### 10.1 Strukturiertes Logging

```caddyfile
# JSON-basiertes Access Log
log {
    output file /var/log/caddy/access.log {
        roll_size 100mb
        roll_keep 30
        roll_keep_for 90d
    }
    format json {
        time_format iso8601
    }
    level INFO
}

# Separates Error Log
log errors {
    output file /var/log/caddy/error.log {
        roll_size 50mb
        roll_keep 30
    }
    format json
    level ERROR
}
```

### 10.2 Log-Analyse

```bash
# Caddy Logs analysieren

# Top IP-Adressen
jq -r '.request.remote_ip' /var/log/caddy/access.log | sort | uniq -c | sort -rn | head -20

# 4xx/5xx Fehler
jq -r 'select(.status >= 400) | "\(.status) \(.request.uri) \(.request.remote_ip)"' \
    /var/log/caddy/access.log | sort | uniq -c | sort -rn | head -20

# Response-Zeiten > 1 Sekunde
jq -r 'select(.duration > 1) | "\(.duration)s \(.request.uri)"' \
    /var/log/caddy/access.log | sort -rn | head -20

# Verdächtige Requests
jq -r 'select(.request.uri | test("(\\.\\.|\\.env|\\.git|wp-admin)"; "i")) | "\(.request.remote_ip) \(.request.uri)"' \
    /var/log/caddy/access.log
```

### 10.3 Prometheus Metrics

```caddyfile
# Prometheus Metrics Endpoint (nur intern erreichbar!)
:9180 {
    metrics /metrics
    
    # Nur von localhost/Monitoring-Netz
    @allowed {
        remote_ip 127.0.0.1 10.0.0.0/24
    }
    handle @allowed {
        metrics /metrics
    }
    handle {
        respond "Forbidden" 403
    }
}
```

---

## 11. High Availability & Performance

### 11.1 Performance-Optimierung

```caddyfile
# Kompression
encode {
    gzip 6
    zstd
    minimum_length 256
}

# HTTP/3 (QUIC) ist standardmäßig aktiviert
# Clients nutzen automatisch HTTP/3 wenn verfügbar
```

### 11.2 Zero-Downtime Config Reload

```bash
# Caddy Config über API neu laden (wenn Admin API aktiviert)
# curl localhost:2019/load -X POST -H "Content-Type: text/caddyfile" --data-binary @Caddyfile

# Alternative: Container restart mit Podman
podman exec caddy caddy reload --config /etc/caddy/Caddyfile

# Konfiguration validieren
podman exec caddy caddy validate --config /etc/caddy/Caddyfile
```

### 11.3 Caddy Config Testen

```bash
# Config validieren bevor angewendet
podman exec caddy caddy validate --config /etc/caddy/Caddyfile

# Caddy mit Testconfig starten
podman exec caddy caddy adapt --config /etc/caddy/Caddyfile --pretty

# TLS-Konfiguration testen
# Extern: https://www.ssllabs.com/ssltest/
# Lokal:
openssl s_client -connect app.example.com:443 -tls1_3 -brief
```

---

## Weiterführende Dokumente

| Nächstes Dokument | Thema |
|-------------------|-------|
| [06 — ASP.NET Core API Security](06-aspnet-core-api-security.md) | Backend API Sicherheit |
| [07 — Angular & Admin Panel](07-angular-admin-panel-security.md) | Frontend-Sicherheit |
| [09 — Cryptography](09-cryptography-data-protection.md) | TLS-Konfiguration im Detail |
