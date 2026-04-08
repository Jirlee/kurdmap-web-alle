# Zero Trust Architecture

> **Ziel:** "Never Trust, Always Verify" — Vollständige Zero Trust Implementierung  
> **Stack:** Rocky Linux, Podman, Caddy, ASP.NET Core 10, WireGuard  
> **Schwerpunkt:** Micro-Segmentation, mTLS, Identity-Aware Access, Continuous Verification

---

## Inhaltsverzeichnis

- [1. Zero Trust Principles](#1-zero-trust-principles)
- [2. Network Micro-Segmentation](#2-network-micro-segmentation)
- [3. Mutual TLS (mTLS)](#3-mutual-tls-mtls)
- [4. Identity-Aware Proxy](#4-identity-aware-proxy)
- [5. Service-to-Service Authentication](#5-service-to-service-authentication)
- [6. Device Trust & Posture](#6-device-trust--posture)
- [7. Continuous Authorization](#7-continuous-authorization)
- [8. Data-Centric Security](#8-data-centric-security)
- [9. Zero Trust Network Access (ZTNA)](#9-zero-trust-network-access-ztna)
- [10. Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Zero Trust Principles

### 1.1 Die 7 Grundsätze

```
┌──────────────────────────────────────────────────────────┐
│                 Zero Trust Architecture                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. VERIFY EXPLICITLY                                     │
│     Authentifiziere und autorisiere JEDEN Request          │
│     basierend auf allen verfügbaren Datenpunkten           │
│                                                           │
│  2. USE LEAST PRIVILEGE ACCESS                             │
│     Minimale Rechte, Just-in-Time, Just-Enough-Access      │
│                                                           │
│  3. ASSUME BREACH                                          │
│     Gehe davon aus, dass das Netzwerk kompromittiert ist    │
│     Minimiere Blast Radius, segmentiere Zugriff             │
│                                                           │
│  4. VERIFY IDENTITY (Mensch + Maschine)                     │
│     Starke Authentifizierung für Benutzer UND Services       │
│                                                           │
│  5. VERIFY DEVICE                                           │
│     Gerätestatus und -konformität prüfen                     │
│                                                           │
│  6. VERIFY WORKLOAD                                          │
│     Container-Herkunft und -Integrität prüfen                │
│                                                           │
│  7. CONTINUOUS MONITORING                                    │
│     Verhalten kontinuierlich analysieren und bewerten         │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 1.2 Zero Trust vs. Traditional Security

```
Traditional (Perimeter):
  [Internet] ─── Firewall ─── [Trusted Internal Network]
                                 └── Alles vertraut alles
                                 └── Lateral Movement möglich
                                 └── Ein Breach = Game Over

Zero Trust:
  [Internet] ─── Reverse Proxy ─── [Micro-Segments]
                                      ├── [Web] ← Verifiziert → [API]
                                      ├── [API] ← mTLS → [DB]
                                      ├── [Admin] ← mTLS + MFA + IP → [API]
                                      └── Jede Verbindung authentifiziert
                                      └── Lateral Movement blockiert
                                      └── Ein Breach = Begrenzter Schaden
```

---

## 2. Network Micro-Segmentation

### 2.1 Podman Network Isolation

```bash
# Isolierte Netzwerke für jede Sicherheitszone
podman network create --subnet 10.89.1.0/24 --gateway 10.89.1.1 \
  --disable-dns dmz-network

podman network create --subnet 10.89.2.0/24 --gateway 10.89.2.1 \
  --internal app-network

podman network create --subnet 10.89.3.0/24 --gateway 10.89.3.1 \
  --internal data-network

podman network create --subnet 10.89.4.0/24 --gateway 10.89.4.1 \
  --internal monitor-network
```

### 2.2 Container-Zuordnung

```bash
# Caddy (Reverse Proxy) — DMZ + App (Brücke)
podman run -d --name caddy \
  --network dmz-network:ip=10.89.1.10 \
  --network app-network:ip=10.89.2.10 \
  --publish 443:443 \
  caddy:latest

# API — App + Data (KEIN Internet-Zugang)
podman run -d --name api \
  --network app-network:ip=10.89.2.20 \
  --network data-network:ip=10.89.3.20 \
  myapp-api:latest

# Angular Static — Nur DMZ
podman run -d --name web \
  --network dmz-network:ip=10.89.1.20 \
  myapp-web:latest

# PostgreSQL — Nur Data (isoliert)
podman run -d --name postgres \
  --network data-network:ip=10.89.3.30 \
  postgres:17

# Redis — Nur Data
podman run -d --name redis \
  --network data-network:ip=10.89.3.40 \
  redis:7

# Monitoring — Eigenes Netzwerk + Zugriff auf alle
podman run -d --name prometheus \
  --network monitor-network:ip=10.89.4.10 \
  --network app-network:ip=10.89.2.50 \
  --network data-network:ip=10.89.3.50 \
  prometheus:latest
```

### 2.3 Netzwerk-Matrix

```
              │ DMZ    │ App    │ Data   │ Monitor│ Internet
──────────────┼────────┼────────┼────────┼────────┼─────────
Caddy         │ ✅     │ ✅     │ ❌     │ ❌     │ ✅ (443)
Web (Angular) │ ✅     │ ❌     │ ❌     │ ❌     │ ❌
API           │ ❌     │ ✅     │ ✅     │ ❌     │ ❌
PostgreSQL    │ ❌     │ ❌     │ ✅     │ ❌     │ ❌
Redis         │ ❌     │ ❌     │ ✅     │ ❌     │ ❌
Prometheus    │ ❌     │ ✅(RO) │ ✅(RO) │ ✅     │ ❌
Grafana       │ ❌     │ ❌     │ ❌     │ ✅     │ ❌
```

### 2.4 nftables Micro-Segmentation Rules

```bash
#!/usr/sbin/nft -f
# Zero Trust nftables Rules

table inet zero_trust {
    
    # Erlaubte Container-Kommunikation
    chain container_policy {
        type filter hook forward priority filter; policy drop;
        
        # Caddy → API (nur Port 5000)
        ip saddr 10.89.2.10 ip daddr 10.89.2.20 tcp dport 5000 accept
        
        # API → PostgreSQL (nur Port 5432)
        ip saddr 10.89.3.20 ip daddr 10.89.3.30 tcp dport 5432 accept
        
        # API → Redis (nur Port 6379)
        ip saddr 10.89.3.20 ip daddr 10.89.3.40 tcp dport 6379 accept
        
        # Prometheus → alle Targets (nur metrics ports)
        ip saddr 10.89.2.50 ip daddr 10.89.2.20 tcp dport 5000 accept
        ip saddr 10.89.3.50 ip daddr 10.89.3.30 tcp dport 9187 accept
        
        # Established Connections
        ct state established,related accept
        
        # Alles andere: DROP (Zero Trust)
        counter drop
    }
}
```

---

## 3. Mutual TLS (mTLS)

### 3.1 Certificate Authority Setup

```bash
#!/bin/bash
# create-mtls-certs.sh — Internal CA für Service-zu-Service mTLS

CA_DIR="/etc/myapp/pki"
mkdir -p "$CA_DIR"/{ca,server,client}

# 1. Internal CA erstellen
openssl ecparam -genkey -name secp384r1 -out "$CA_DIR/ca/ca-key.pem"
openssl req -new -x509 -sha384 \
  -key "$CA_DIR/ca/ca-key.pem" \
  -out "$CA_DIR/ca/ca.pem" \
  -days 3650 \
  -subj "/CN=MyApp Internal CA/O=MyApp/C=DE"

# 2. API Server Certificate
openssl ecparam -genkey -name secp384r1 -out "$CA_DIR/server/api-key.pem"
openssl req -new -sha384 \
  -key "$CA_DIR/server/api-key.pem" \
  -out "$CA_DIR/server/api.csr" \
  -subj "/CN=api/O=MyApp"

cat > "$CA_DIR/server/api-ext.cnf" << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=@alt_names
[alt_names]
DNS.1=api
DNS.2=api.app-network
IP.1=10.89.2.20
IP.2=10.89.3.20
EOF

openssl x509 -req -sha384 \
  -in "$CA_DIR/server/api.csr" \
  -CA "$CA_DIR/ca/ca.pem" \
  -CAkey "$CA_DIR/ca/ca-key.pem" \
  -CAcreateserial \
  -out "$CA_DIR/server/api.pem" \
  -days 365 \
  -extfile "$CA_DIR/server/api-ext.cnf"

# 3. Caddy Client Certificate (für mTLS zu API)
openssl ecparam -genkey -name secp384r1 -out "$CA_DIR/client/caddy-key.pem"
openssl req -new -sha384 \
  -key "$CA_DIR/client/caddy-key.pem" \
  -out "$CA_DIR/client/caddy.csr" \
  -subj "/CN=caddy/O=MyApp"

cat > "$CA_DIR/client/caddy-ext.cnf" << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature
extendedKeyUsage=clientAuth
EOF

openssl x509 -req -sha384 \
  -in "$CA_DIR/client/caddy.csr" \
  -CA "$CA_DIR/ca/ca.pem" \
  -CAkey "$CA_DIR/ca/ca-key.pem" \
  -CAcreateserial \
  -out "$CA_DIR/client/caddy.pem" \
  -days 365 \
  -extfile "$CA_DIR/client/caddy-ext.cnf"

# Permissions
chmod 600 "$CA_DIR"/*/key*.pem
chmod 644 "$CA_DIR"/*/*.pem "$CA_DIR"/*/*.csr
```

### 3.2 ASP.NET Core mTLS Server

```csharp
// Program.cs — API als mTLS Server
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5000, listenOptions =>
    {
        listenOptions.UseHttps(httpsOptions =>
        {
            httpsOptions.ServerCertificate = X509Certificate2.CreateFromPemFile(
                "/etc/myapp/pki/server/api.pem",
                "/etc/myapp/pki/server/api-key.pem");
            
            // mTLS — Client Certificate erforderlich
            httpsOptions.ClientCertificateMode = ClientCertificateMode.RequireCertificate;
            
            httpsOptions.ClientCertificateValidation = (certificate, chain, errors) =>
            {
                // Nur unsere CA akzeptieren
                if (errors != SslPolicyErrors.None && 
                    errors != SslPolicyErrors.RemoteCertificateChainErrors)
                    return false;
                
                chain!.ChainPolicy.TrustMode = X509ChainTrustMode.CustomRootTrust;
                chain.ChainPolicy.CustomTrustStore.Add(
                    new X509Certificate2("/etc/myapp/pki/ca/ca.pem"));
                
                return chain.Build(certificate!);
            };
        });
    });
});

// Client Certificate Forwarding (wenn Caddy terminiert)
builder.Services.AddCertificateForwarding(options =>
{
    options.CertificateHeader = "X-SSL-Client-Cert";
});

// Certificate-based Authentication Policy
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ServiceToService", policy =>
    {
        policy.RequireClaim("cn"); // Common Name aus Client Cert
        policy.RequireAssertion(context =>
        {
            var cn = context.User.FindFirst("cn")?.Value;
            var allowedServices = new[] { "caddy", "prometheus" };
            return cn is not null && allowedServices.Contains(cn);
        });
    });
});
```

### 3.3 Caddy als mTLS Client

```caddyfile
# Caddy → API mit Client Certificate
api.internal:5000 {
    reverse_proxy api:5000 {
        transport http {
            tls
            tls_client_auth /etc/caddy/pki/client/caddy.pem /etc/caddy/pki/client/caddy-key.pem
            tls_trusted_ca_certs /etc/caddy/pki/ca/ca.pem
        }
    }
}
```

---

## 4. Identity-Aware Proxy

### 4.1 Request Context Enrichment

```csharp
public class ZeroTrustMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ZeroTrustMiddleware> _logger;
    
    public async Task InvokeAsync(HttpContext context)
    {
        // Zero Trust Context sammeln
        var ztContext = new ZeroTrustContext
        {
            // Identity
            UserId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Roles = context.User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList(),
            MfaVerified = context.User.FindFirst("mfa_verified")?.Value == "true",
            
            // Device
            UserAgent = context.Request.Headers.UserAgent.ToString(),
            ClientIp = context.Connection.RemoteIpAddress?.ToString(),
            
            // Network
            IsInternalNetwork = IsInternalIp(context.Connection.RemoteIpAddress),
            HasClientCert = context.Connection.ClientCertificate is not null,
            ClientCertCn = context.Connection.ClientCertificate?.GetNameInfo(
                X509NameType.SimpleName, false),
            
            // Request
            RequestPath = context.Request.Path.Value,
            RequestMethod = context.Request.Method,
            Timestamp = DateTime.UtcNow
        };
        
        // Context für Policy Evaluation verfügbar machen
        context.Items["ZeroTrustContext"] = ztContext;
        
        // Risk Score berechnen
        var riskScore = CalculateRiskScore(ztContext);
        context.Items["RiskScore"] = riskScore;
        
        if (riskScore > 80)
        {
            _logger.LogWarning(
                "High risk request blocked. Score: {RiskScore}, Context: {@ZtContext}",
                riskScore, ztContext);
            context.Response.StatusCode = 403;
            return;
        }
        
        // Step-Up Authentication bei mittlerem Risiko
        if (riskScore > 50 && !ztContext.MfaVerified)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new 
            { 
                Error = "MFA verification required for this action",
                RequiresMfa = true 
            });
            return;
        }
        
        await _next(context);
    }
    
    private int CalculateRiskScore(ZeroTrustContext ctx)
    {
        var score = 0;
        
        // Nicht authentifiziert
        if (ctx.UserId is null) score += 40;
        
        // Kein MFA
        if (!ctx.MfaVerified) score += 20;
        
        // Externe IP
        if (!ctx.IsInternalNetwork) score += 10;
        
        // Kein Client Certificate
        if (!ctx.HasClientCert) score += 10;
        
        // Verdachtiger User Agent
        if (IsSuspiciousUserAgent(ctx.UserAgent)) score += 30;
        
        // Ungewöhnliche Uhrzeit (22:00-06:00)
        var hour = ctx.Timestamp.Hour;
        if (hour is < 6 or > 22) score += 15;
        
        // Sensitive Endpoints
        if (ctx.RequestPath?.StartsWith("/api/admin") == true) score += 10;
        if (ctx.RequestPath?.StartsWith("/api/banking") == true) score += 15;
        
        return Math.Min(score, 100);
    }
    
    private static bool IsInternalIp(IPAddress? ip)
    {
        if (ip is null) return false;
        var bytes = ip.GetAddressBytes();
        return bytes[0] == 10 || 
               (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
               (bytes[0] == 192 && bytes[1] == 168);
    }
    
    private static bool IsSuspiciousUserAgent(string ua) =>
        string.IsNullOrEmpty(ua) || 
        ua.Contains("curl", StringComparison.OrdinalIgnoreCase) ||
        ua.Contains("wget", StringComparison.OrdinalIgnoreCase) ||
        ua.Contains("python", StringComparison.OrdinalIgnoreCase);
}

public class ZeroTrustContext
{
    public string? UserId { get; set; }
    public List<string> Roles { get; set; } = [];
    public bool MfaVerified { get; set; }
    public string? UserAgent { get; set; }
    public string? ClientIp { get; set; }
    public bool IsInternalNetwork { get; set; }
    public bool HasClientCert { get; set; }
    public string? ClientCertCn { get; set; }
    public string? RequestPath { get; set; }
    public string? RequestMethod { get; set; }
    public DateTime Timestamp { get; set; }
}
```

---

## 5. Service-to-Service Authentication

### 5.1 Service Token Pattern

```csharp
public interface IServiceTokenProvider
{
    Task<string> GetServiceTokenAsync(string targetService);
}

public class ServiceTokenProvider : IServiceTokenProvider
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly RsaSecurityKey _signingKey;
    
    public Task<string> GetServiceTokenAsync(string targetService)
    {
        var claims = new List<Claim>
        {
            new("sub", "api-service"),
            new("aud", targetService),
            new("scope", "service-to-service"),
            new("jti", Guid.NewGuid().ToString())
        };
        
        var token = new JwtSecurityToken(
            issuer: "myapp-api",
            audience: targetService,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(5), // Sehr kurze Lebensdauer
            signingCredentials: new SigningCredentials(_signingKey, SecurityAlgorithms.RsaSha512)
        );
        
        return Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
    }
}
```

---

## 6. Device Trust & Posture

### 6.1 Device Fingerprinting (Angular)

```typescript
@Injectable({ providedIn: 'root' })
export class DeviceTrustService {
  
  async getDeviceFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth.toString(),
      new Date().getTimezoneOffset().toString(),
      navigator.hardwareConcurrency?.toString() ?? 'unknown',
      this.getCanvasFingerprint(),
    ];
    
    const fingerprint = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';
      ctx.textBaseline = 'alphabetic';
      ctx.font = '14px Arial';
      ctx.fillText('device-fp', 2, 15);
      return canvas.toDataURL().slice(-50);
    } catch {
      return 'canvas-blocked';
    }
  }
}
```

---

## 7. Continuous Authorization

### 7.1 Re-Authorization bei sensitiven Aktionen

```csharp
[AttributeUsage(AttributeTargets.Method)]
public class RequireReAuthAttribute : Attribute, IAsyncActionFilter
{
    private readonly int _maxAgeMinutes;
    
    public RequireReAuthAttribute(int maxAgeMinutes = 5)
    {
        _maxAgeMinutes = maxAgeMinutes;
    }
    
    public async Task OnActionExecutionAsync(
        ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var user = context.HttpContext.User;
        var authTimeClaim = user.FindFirst("auth_time")?.Value;
        
        if (authTimeClaim is null || 
            !long.TryParse(authTimeClaim, out var authTimeUnix))
        {
            context.Result = new UnauthorizedResult();
            return;
        }
        
        var authTime = DateTimeOffset.FromUnixTimeSeconds(authTimeUnix);
        var age = DateTimeOffset.UtcNow - authTime;
        
        if (age > TimeSpan.FromMinutes(_maxAgeMinutes))
        {
            context.Result = new ObjectResult(new
            {
                Error = "Re-authentication required",
                RequiresReAuth = true,
                MaxAgeMinutes = _maxAgeMinutes
            })
            { StatusCode = 403 };
            return;
        }
        
        await next();
    }
}

// Nutzung
[HttpPost("transfer")]
[RequireReAuth(maxAgeMinutes: 5)]
public async Task<IActionResult> TransferFunds(TransferDto dto)
{
    // Nur wenn Auth < 5 Minuten alt
}
```

---

## 8. Data-Centric Security

### 8.1 Data Classification

```csharp
public enum DataClassification
{
    Public = 0,        // Öffentliche Daten
    Internal = 1,      // Interne Daten
    Confidential = 2,  // Vertraulich (PII)
    Secret = 3,        // Geheim (Finanzdaten, Gesundheit)
    TopSecret = 4      // Höchst geheim (Krypto-Keys, Master Secrets)
}

[AttributeUsage(AttributeTargets.Property)]
public class DataClassificationAttribute : Attribute
{
    public DataClassification Level { get; }
    public DataClassificationAttribute(DataClassification level) => Level = level;
}

public class BankAccount
{
    [DataClassification(DataClassification.Internal)]
    public string AccountName { get; set; } = string.Empty;
    
    [DataClassification(DataClassification.Secret)]
    public string Iban { get; set; } = string.Empty;
    
    [DataClassification(DataClassification.Secret)]
    public decimal Balance { get; set; }
    
    [DataClassification(DataClassification.Confidential)]
    public string OwnerName { get; set; } = string.Empty;
}
```

### 8.2 Data Access Policies

```csharp
public class DataAccessPolicyService
{
    public bool CanAccess(ClaimsPrincipal user, DataClassification level)
    {
        var userClearance = GetUserClearance(user);
        
        return level switch
        {
            DataClassification.Public => true,
            DataClassification.Internal => user.Identity?.IsAuthenticated == true,
            DataClassification.Confidential => userClearance >= DataClassification.Confidential
                && user.HasClaim("mfa_verified", "true"),
            DataClassification.Secret => userClearance >= DataClassification.Secret
                && user.HasClaim("mfa_verified", "true")
                && user.IsInRole("BankingOperator"),
            DataClassification.TopSecret => userClearance >= DataClassification.TopSecret
                && user.HasClaim("mfa_verified", "true")
                && user.IsInRole("Admin")
                && IsFromTrustedDevice(user),
            _ => false
        };
    }
    
    private DataClassification GetUserClearance(ClaimsPrincipal user)
    {
        var clearance = user.FindFirst("security_clearance")?.Value;
        return Enum.TryParse<DataClassification>(clearance, out var level) 
            ? level 
            : DataClassification.Public;
    }
    
    private bool IsFromTrustedDevice(ClaimsPrincipal user) =>
        user.HasClaim("device_trusted", "true");
}
```

---

## 9. Zero Trust Network Access (ZTNA)

### 9.1 WireGuard VPN für Admin-Zugang

```ini
# /etc/wireguard/wg-admin.conf — Admin VPN
[Interface]
Address = 10.100.0.1/24
ListenPort = 51820
PrivateKey = <server-private-key>
PostUp = nft add rule inet zero_trust admin_vpn ip saddr 10.100.0.0/24 accept
PostDown = nft delete rule inet zero_trust admin_vpn ip saddr 10.100.0.0/24 accept

# Admin User 1
[Peer]
PublicKey = <admin1-public-key>
AllowedIPs = 10.100.0.10/32
PersistentKeepalive = 25

# Admin User 2
[Peer]
PublicKey = <admin2-public-key>
AllowedIPs = 10.100.0.11/32
PersistentKeepalive = 25
```

### 9.2 Admin-Zugang nur über VPN + mTLS + MFA

```
Admin Zugang (3-Faktor):
  
  Factor 1: VPN (Network)
  └── WireGuard VPN → 10.100.0.0/24
  
  Factor 2: mTLS (Device)
  └── Client Certificate → CN=admin-{name}
  
  Factor 3: MFA (Identity)
  └── FIDO2 Hardware Key
  
  Ergebnis:
  └── Alle 3 Faktoren → Admin Panel Zugang
  └── < 3 Faktoren → Zugang verweigert
```

---

## 10. Implementation Roadmap

### 10.1 Phasen-Plan

```yaml
Phase 1 — Foundation (Woche 1-2):
  ✅ Network Micro-Segmentation (Podman Networks)
  ✅ TLS 1.3 überall (Caddy, PostgreSQL, Redis)
  ✅ JWT Authentication mit kurzer Lebensdauer
  ✅ Rate Limiting auf allen Endpoints

Phase 2 — Identity (Woche 3-4):
  ✅ MFA für alle Benutzer
  ✅ FIDO2 für Admin-Accounts
  ✅ Session Management mit Concurrent Control
  ✅ Brute-Force Protection

Phase 3 — Service Security (Woche 5-6):
  ✅ mTLS zwischen Services (Caddy ↔ API)
  ✅ Service-Token für Service-zu-Service Auth
  ✅ Container Security Hardening
  ✅ Certificate Automation & Rotation

Phase 4 — Advanced (Woche 7-8):
  ✅ Zero Trust Middleware (Risk Scoring)
  ✅ Continuous Authorization (Re-Auth)
  ✅ Data Classification & Access Policies
  ✅ Device Trust & Fingerprinting

Phase 5 — Operations (Woche 9-10):
  ✅ Comprehensive Monitoring & Alerting
  ✅ Incident Response Playbooks
  ✅ VPN für Admin-Zugang
  ✅ Security Audit & Penetration Test
```

### 10.2 Zero Trust Checkliste

```yaml
Network:
  ✅ Micro-Segmentation (4 isolierte Netzwerke)
  ✅ No lateral movement (nftables enforce)
  ✅ All traffic encrypted (TLS 1.3)
  ✅ DNS-over-TLS

Identity:
  ✅ Strong authentication (JWT RS512)
  ✅ MFA für alle Benutzer
  ✅ FIDO2 für Admins
  ✅ Session Timeout (15 Min)

Device:
  ✅ Device Fingerprinting
  ✅ Client Certificates (mTLS)
  ✅ VPN für Admin-Zugang

Application:
  ✅ Least Privilege (RBAC + ABAC)
  ✅ Re-Authentication für sensitive Aktionen
  ✅ Data Classification & Enforcement
  ✅ Continuous Risk Assessment

Monitoring:
  ✅ All requests logged
  ✅ Security events alerted
  ✅ Anomaly detection
  ✅ Incident response playbooks
```

---

## Weiterführende Dokumente

| Nächstes Dokument | Thema |
|-------------------|-------|
| [03 — Network Security](03-network-firewall-security.md) | Firewall & Segmentation |
| [05 — Caddy](05-reverse-proxy-tls-caddy.md) | mTLS Konfiguration |
| [08 — Authentication](08-authentication-identity.md) | MFA & FIDO2 |
