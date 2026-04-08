# Monitoring, Logging & Incident Response

> **Ziel:** Vollständige Sicherheitsüberwachung und automatisierte Reaktion  
> **Stack:** auditd, Serilog, Prometheus, Grafana, Fail2Ban, AIDE, Suricata  
> **Schwerpunkt:** SIEM, Alerting, Incident Playbooks

---

## Inhaltsverzeichnis

- [1. Monitoring Architecture](#1-monitoring-architecture)
- [2. Linux System Auditing (auditd)](#2-linux-system-auditing-auditd)
- [3. Application Logging (Serilog)](#3-application-logging-serilog)
- [4. Centralized Log Management](#4-centralized-log-management)
- [5. Metrics & Alerting (Prometheus/Grafana)](#5-metrics--alerting-prometheusgrafana)
- [6. Intrusion Detection (AIDE + Suricata)](#6-intrusion-detection-aide--suricata)
- [7. Fail2Ban Advanced Configuration](#7-fail2ban-advanced-configuration)
- [8. Container Monitoring](#8-container-monitoring)
- [9. Incident Response Playbooks](#9-incident-response-playbooks)
- [10. Security Dashboard](#10-security-dashboard)

---

## 1. Monitoring Architecture

### 1.1 Übersicht

```
┌────────────────────────────────────────────────────────────┐
│                 Security Monitoring Stack                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  auditd  │  │ Serilog  │  │ Suricata │  │  AIDE    │   │
│  │ (OS)     │  │ (App)    │  │ (IDS)    │  │ (FIM)    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │         │
│       ▼              ▼              ▼              ▼         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Centralized Log Aggregation                 │   │
│  │          (journald → rsyslog → Log Files)            │   │
│  └────────────────────┬────────────────────────────────┘   │
│                       │                                     │
│       ┌───────────────┼───────────────┐                    │
│       ▼               ▼               ▼                    │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │Prometheus│  │ Log Analysis │  │  Fail2Ban    │        │
│  │(Metrics) │  │ (grep/awk)   │  │ (Auto-Block) │        │
│  └────┬─────┘  └──────────────┘  └──────────────┘        │
│       │                                                    │
│       ▼                                                    │
│  ┌──────────┐                                              │
│  │ Grafana  │  ← Dashboards + Alerting                    │
│  └──────────┘                                              │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Linux System Auditing (auditd)

### 2.1 Audit Rules

```bash
# /etc/audit/rules.d/99-security.rules

# Selbstschutz — Audit-Konfiguration unveränderbar
-e 2

# Puffer-Größe
-b 8192

# === Identity & Authentication ===
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/gshadow -p wa -k identity
-w /etc/security/opasswd -p wa -k identity

# === Authentication Events ===
-w /var/log/faillog -p wa -k login_events
-w /var/log/lastlog -p wa -k login_events
-w /var/run/faillock/ -p wa -k login_events

# === Privilege Escalation ===
-a always,exit -F arch=b64 -S execve -F euid=0 -F auid>=1000 -F auid!=4294967295 -k privilege_escalation
-w /etc/sudoers -p wa -k sudo_changes
-w /etc/sudoers.d/ -p wa -k sudo_changes
-a always,exit -F arch=b64 -S setuid -S setgid -S setreuid -S setregid -k privilege_change

# === Network Configuration ===
-a always,exit -F arch=b64 -S sethostname -S setdomainname -k network_config
-w /etc/hosts -p wa -k network_config
-w /etc/sysconfig/network -p wa -k network_config
-w /etc/NetworkManager/ -p wa -k network_config

# === Firewall Changes ===
-w /etc/firewalld/ -p wa -k firewall
-w /usr/sbin/nft -p x -k firewall
-w /usr/sbin/iptables -p x -k firewall

# === System Boot & Shutdown ===
-w /sbin/shutdown -p x -k power
-w /sbin/reboot -p x -k power
-w /sbin/halt -p x -k power

# === Kernel & Module Loading ===
-a always,exit -F arch=b64 -S init_module -S finit_module -S delete_module -k kernel_modules
-w /etc/modprobe.d/ -p wa -k kernel_modules

# === Container Events (Podman) ===
-w /usr/bin/podman -p x -k container
-w /etc/containers/ -p wa -k container_config
-a always,exit -F arch=b64 -S clone -F a0&0x7C020000 -k container_create

# === Crypto & Keys ===
-w /etc/pki/ -p wa -k crypto
-w /etc/ssl/ -p wa -k crypto
-a always,exit -F arch=b64 -S open -F dir=/etc/myapp/keys -k key_access

# === Cron & Scheduled Tasks ===
-w /etc/crontab -p wa -k cron
-w /etc/cron.d/ -p wa -k cron
-w /var/spool/cron/ -p wa -k cron

# === File Deletion ===
-a always,exit -F arch=b64 -S unlink -S rename -S unlinkat -S renameat -F auid>=1000 -F auid!=4294967295 -k file_deletion

# === SSH ===
-w /etc/ssh/sshd_config -p wa -k ssh_config
-w /root/.ssh/ -p wa -k ssh_keys
```

### 2.2 Audit Log Analyse

```bash
#!/bin/bash
# audit-report.sh — Täglicher Security Audit Report

echo "=== Security Audit Report $(date) ==="

# Failed Login Attempts
echo -e "\n--- Failed Logins (letzte 24h) ---"
ausearch -ts yesterday -m USER_LOGIN --success no 2>/dev/null | \
  aureport -au --summary

# Privilege Escalation
echo -e "\n--- Privilege Escalation ---"
ausearch -ts yesterday -k privilege_escalation 2>/dev/null | \
  aureport -x --summary | head -20

# File Changes
echo -e "\n--- Critical File Changes ---"
ausearch -ts yesterday -k identity -k ssh_config -k firewall 2>/dev/null | \
  aureport -f --summary

# Container Events
echo -e "\n--- Container Events ---"
ausearch -ts yesterday -k container 2>/dev/null | \
  aureport -x --summary

# Key Access
echo -e "\n--- Key/Certificate Access ---"
ausearch -ts yesterday -k key_access -k crypto 2>/dev/null | \
  aureport -f --summary

echo "=== End Report ==="
```

---

## 3. Application Logging (Serilog)

### 3.1 Serilog Setup

```csharp
// Program.cs
builder.Host.UseSerilog((context, services, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithProcessId()
        .Enrich.WithThreadId()
        .Enrich.WithCorrelationId()
        .Enrich.WithProperty("Application", "MyBankingApp")
        .Enrich.WithProperty("Environment", context.HostingEnvironment.EnvironmentName)
        // Structured Logging (JSON)
        .WriteTo.Console(new RenderedCompactJsonFormatter())
        // File Logging (Rotation)
        .WriteTo.File(
            new CompactJsonFormatter(),
            path: "/var/log/myapp/app-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 90,
            fileSizeLimitBytes: 100_000_000, // 100MB
            rollOnFileSizeLimit: true)
        // Security Events (separater Log)
        .WriteTo.Logger(lc => lc
            .Filter.ByIncludingOnly(e => 
                e.Properties.ContainsKey("SecurityEvent"))
            .WriteTo.File(
                new CompactJsonFormatter(),
                path: "/var/log/myapp/security-.log",
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 365));
});
```

### 3.2 Security Event Logging

```csharp
public static class SecurityEventLogger
{
    public static void LogAuthSuccess(ILogger logger, string userId, string ip)
    {
        logger.ForContext("SecurityEvent", true)
            .ForContext("EventType", "AUTH_SUCCESS")
            .Information(
                "User {UserId} authenticated successfully from {IpAddress}",
                userId, ip);
    }
    
    public static void LogAuthFailure(ILogger logger, string email, string ip, string reason)
    {
        logger.ForContext("SecurityEvent", true)
            .ForContext("EventType", "AUTH_FAILURE")
            .Warning(
                "Authentication failed for {Email} from {IpAddress}: {Reason}",
                email, ip, reason);
    }
    
    public static void LogPrivilegedAction(
        ILogger logger, string userId, string action, object details)
    {
        logger.ForContext("SecurityEvent", true)
            .ForContext("EventType", "PRIVILEGED_ACTION")
            .Information(
                "User {UserId} performed privileged action: {Action} {@Details}",
                userId, action, details);
    }
    
    public static void LogSuspiciousActivity(
        ILogger logger, string ip, string indicator, object details)
    {
        logger.ForContext("SecurityEvent", true)
            .ForContext("EventType", "SUSPICIOUS")
            .Warning(
                "Suspicious activity from {IpAddress}: {Indicator} {@Details}",
                ip, indicator, details);
    }
    
    public static void LogDataAccess(
        ILogger logger, string userId, string resource, string action)
    {
        logger.ForContext("SecurityEvent", true)
            .ForContext("EventType", "DATA_ACCESS")
            .Information(
                "User {UserId} accessed {Resource}: {Action}",
                userId, resource, action);
    }
}
```

### 3.3 Audit Middleware

```csharp
public class AuditLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuditLoggingMiddleware> _logger;
    
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var requestId = context.TraceIdentifier;
        var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var method = context.Request.Method;
        var path = context.Request.Path.Value;
        
        try
        {
            await _next(context);
            
            stopwatch.Stop();
            
            // Alle Requests loggen (für Audit Trail)
            _logger.ForContext("SecurityEvent", true)
                .ForContext("EventType", "API_REQUEST")
                .Information(
                    "HTTP {Method} {Path} responded {StatusCode} in {Duration}ms " +
                    "[User: {UserId}, IP: {IpAddress}, RequestId: {RequestId}]",
                    method, path, context.Response.StatusCode,
                    stopwatch.ElapsedMilliseconds, userId, ip, requestId);
            
            // Verdächtige Status Codes
            if (context.Response.StatusCode is 401 or 403)
            {
                SecurityEventLogger.LogSuspiciousActivity(
                    _logger, ip, $"HTTP {context.Response.StatusCode}",
                    new { Method = method, Path = path, UserId = userId });
            }
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            
            _logger.ForContext("SecurityEvent", true)
                .ForContext("EventType", "API_ERROR")
                .Error(ex,
                    "HTTP {Method} {Path} failed after {Duration}ms " +
                    "[User: {UserId}, IP: {IpAddress}]",
                    method, path, stopwatch.ElapsedMilliseconds, userId, ip);
            
            throw;
        }
    }
}
```

### 3.4 Sensitive Data Masking

```csharp
// Serilog Destructure Policy — Sensitive Daten maskieren
public class SensitiveDataDestructuringPolicy : IDestructuringPolicy
{
    private static readonly HashSet<string> SensitiveFields = new(StringComparer.OrdinalIgnoreCase)
    {
        "password", "secret", "token", "apiKey", "api_key",
        "creditCard", "credit_card", "ssn", "socialSecurityNumber",
        "bankAccount", "bank_account", "iban", "cvv", "pin"
    };
    
    public bool TryDestructure(
        object value, ILogEventPropertyValueFactory propertyValueFactory, 
        out LogEventPropertyValue? result)
    {
        result = null;
        if (value is null) return false;
        
        var properties = value.GetType().GetProperties();
        var logProperties = new List<LogEventProperty>();
        
        foreach (var prop in properties)
        {
            var propValue = prop.GetValue(value);
            
            if (SensitiveFields.Contains(prop.Name))
            {
                logProperties.Add(new LogEventProperty(
                    prop.Name, new ScalarValue("***REDACTED***")));
            }
            else
            {
                logProperties.Add(new LogEventProperty(
                    prop.Name, propertyValueFactory.CreatePropertyValue(propValue)));
            }
        }
        
        result = new StructureValue(logProperties);
        return true;
    }
}

// Registrierung
.Destructure.With<SensitiveDataDestructuringPolicy>()
```

---

## 4. Centralized Log Management

### 4.1 Log Aggregation mit rsyslog

```bash
# /etc/rsyslog.d/90-myapp.conf

# Application Logs
module(load="imfile")

# API Application Log
input(type="imfile"
    File="/var/log/myapp/app-*.log"
    Tag="myapp-api"
    Severity="info"
    Facility="local0")

# Security Events
input(type="imfile"
    File="/var/log/myapp/security-*.log"
    Tag="myapp-security"
    Severity="warning"
    Facility="local1")

# Caddy Access Log
input(type="imfile"
    File="/var/log/caddy/access.log"
    Tag="caddy-access"
    Severity="info"
    Facility="local2")

# Container Logs
input(type="imfile"
    File="/var/log/containers/*.log"
    Tag="container"
    Severity="info"
    Facility="local3")

# Alle Security Events in separater Datei
local1.* /var/log/security/all-security.log
```

### 4.2 Log Rotation

```conf
# /etc/logrotate.d/myapp
/var/log/myapp/*.log {
    daily
    rotate 365      # 1 Jahr aufbewahren (Compliance)
    compress
    delaycompress
    missingok
    notifempty
    create 0640 myapp myapp
    sharedscripts
    postrotate
        systemctl reload rsyslog
    endscript
}

/var/log/security/*.log {
    daily
    rotate 730      # 2 Jahre für Security Logs
    compress
    delaycompress
    missingok
    notifempty
    create 0600 root root
}
```

---

## 5. Metrics & Alerting (Prometheus/Grafana)

### 5.1 ASP.NET Core Metrics

```csharp
// NuGet: prometheus-net.AspNetCore
builder.Services.AddSingleton<SecurityMetricsService>();

public class SecurityMetricsService
{
    // Authentication Metrics
    private readonly Counter _authSuccessTotal = Metrics.CreateCounter(
        "auth_success_total", "Successful authentications",
        new CounterConfiguration { LabelNames = ["method"] });
    
    private readonly Counter _authFailureTotal = Metrics.CreateCounter(
        "auth_failure_total", "Failed authentications",
        new CounterConfiguration { LabelNames = ["reason"] });
    
    private readonly Counter _mfaVerificationsTotal = Metrics.CreateCounter(
        "mfa_verifications_total", "MFA verification attempts",
        new CounterConfiguration { LabelNames = ["result"] });
    
    // Rate Limiting Metrics
    private readonly Counter _rateLimitHitsTotal = Metrics.CreateCounter(
        "rate_limit_hits_total", "Rate limit hits",
        new CounterConfiguration { LabelNames = ["endpoint", "ip"] });
    
    // Security Events
    private readonly Counter _securityEventsTotal = Metrics.CreateCounter(
        "security_events_total", "Security events",
        new CounterConfiguration { LabelNames = ["type", "severity"] });
    
    // Active Sessions
    private readonly Gauge _activeSessionsGauge = Metrics.CreateGauge(
        "active_sessions_current", "Currently active sessions");
    
    // Request Duration
    private readonly Histogram _requestDuration = Metrics.CreateHistogram(
        "http_request_duration_seconds", "HTTP request duration",
        new HistogramConfiguration
        {
            LabelNames = ["method", "endpoint", "status"],
            Buckets = [.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10]
        });
    
    public void RecordAuthSuccess(string method) => 
        _authSuccessTotal.WithLabels(method).Inc();
    
    public void RecordAuthFailure(string reason) => 
        _authFailureTotal.WithLabels(reason).Inc();
    
    public void RecordRateLimitHit(string endpoint, string ip) => 
        _rateLimitHitsTotal.WithLabels(endpoint, ip).Inc();
    
    public void RecordSecurityEvent(string type, string severity) => 
        _securityEventsTotal.WithLabels(type, severity).Inc();
}
```

### 5.2 Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "security_alerts.yml"

scrape_configs:
  # ASP.NET Core API
  - job_name: 'aspnet-api'
    scheme: https
    tls_config:
      ca_file: /etc/prometheus/certs/ca.crt
    static_configs:
      - targets: ['api:5000']
    metrics_path: '/metrics'
  
  # Caddy
  - job_name: 'caddy'
    static_configs:
      - targets: ['caddy:2019']
    metrics_path: '/metrics'
  
  # Node Exporter (System)
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
  
  # PostgreSQL
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

### 5.3 Security Alert Rules

```yaml
# security_alerts.yml
groups:
  - name: security_alerts
    rules:
      # Brute Force Detection
      - alert: BruteForceAttack
        expr: rate(auth_failure_total[5m]) > 10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Brute force attack detected"
          description: "More than 10 auth failures per minute for 2+ minutes"
      
      # Ungewöhnliche Login-Zeiten
      - alert: OffHoursLogin
        expr: auth_success_total and (hour() < 6 or hour() > 22)
        labels:
          severity: warning
        annotations:
          summary: "Login outside business hours"
      
      # Rate Limit Spike
      - alert: RateLimitSpike
        expr: rate(rate_limit_hits_total[5m]) > 50
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "High rate limit hits — possible DDoS"
      
      # Disk Space (für Logs)
      - alert: DiskSpaceLow
        expr: node_filesystem_avail_bytes{mountpoint="/var/log"} / node_filesystem_size_bytes{mountpoint="/var/log"} < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Log disk space below 10%"
      
      # Container Restart
      - alert: ContainerRestart
        expr: increase(container_restarts_total[1h]) > 3
        labels:
          severity: warning
        annotations:
          summary: "Container restarting frequently"
      
      # High Error Rate
      - alert: HighErrorRate
        expr: rate(http_request_duration_seconds_count{status=~"5.."}[5m]) / rate(http_request_duration_seconds_count[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "API error rate above 5%"
      
      # Certificate Expiry
      - alert: CertificateExpiringSoon
        expr: (probe_ssl_earliest_cert_expiry - time()) / 86400 < 14
        labels:
          severity: warning
        annotations:
          summary: "TLS certificate expires in less than 14 days"
```

---

## 6. Intrusion Detection (AIDE + Suricata)

### 6.1 AIDE (File Integrity Monitoring)

```bash
# /etc/aide.conf
@@define DBDIR /var/lib/aide
@@define LOGDIR /var/log/aide

database_in=file:@@{DBDIR}/aide.db.gz
database_out=file:@@{DBDIR}/aide.db.new.gz
database_new=file:@@{DBDIR}/aide.db.new.gz

gzip_dbout=yes

# Rules
NORMAL = p+i+n+u+g+s+b+m+c+sha512
PERMS = p+u+g+acl+selinux+xattrs
LOG = p+u+g+n+S+acl+selinux+xattrs
CONTENT = sha512+ftype
DATAONLY = p+n+u+g+s+acl+selinux+xattrs+sha512

# Critical System Binaries
/bin NORMAL
/sbin NORMAL
/usr/bin NORMAL
/usr/sbin NORMAL

# Configuration Files
/etc NORMAL
!/etc/mtab
!/etc/resolv.conf

# Application
/opt/myapp NORMAL
/etc/myapp NORMAL

# Security Keys
/etc/myapp/keys CONTENT

# Container Images
/var/lib/containers CONTENT

# Log Files (nur Permissions, nicht Inhalt)
/var/log LOG
```

```bash
# AIDE Initialisierung und täglicher Check
aide --init
mv /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz

# Cron Job
echo "0 3 * * * root /usr/sbin/aide --check | mail -s 'AIDE Report' admin@example.com" \
  > /etc/cron.d/aide-check
```

### 6.2 Suricata IDS Rules

```yaml
# /etc/suricata/rules/local.rules

# SQL Injection Detection
alert http any any -> any any (msg:"SQL Injection Attempt"; \
  content:"UNION"; nocase; content:"SELECT"; nocase; \
  sid:1000001; rev:1; classtype:web-application-attack;)

# XSS Detection
alert http any any -> any any (msg:"XSS Attempt"; \
  content:"<script"; nocase; \
  sid:1000002; rev:1; classtype:web-application-attack;)

# Path Traversal
alert http any any -> any any (msg:"Path Traversal Attempt"; \
  content:"../"; \
  sid:1000003; rev:1; classtype:web-application-attack;)

# Brute Force SSH
alert tcp any any -> any 2222 (msg:"SSH Brute Force"; \
  flow:to_server; threshold:type both,track by_src,count 5,seconds 60; \
  sid:1000004; rev:1; classtype:attempted-admin;)

# Port Scan
alert tcp any any -> any any (msg:"Port Scan Detected"; \
  flags:S; threshold:type both,track by_src,count 20,seconds 10; \
  sid:1000005; rev:1; classtype:attempted-recon;)
```

---

## 7. Fail2Ban Advanced Configuration

### 7.1 Custom Jails

```ini
# /etc/fail2ban/jail.d/myapp.conf

[myapp-auth]
enabled = true
port = https
filter = myapp-auth
logpath = /var/log/myapp/security-*.log
maxretry = 5
findtime = 600
bantime = 1800
action = firewallcmd-rich-rules[actiontype=<reject>]
         sendmail[dest=admin@example.com, sender=fail2ban@example.com]

[myapp-api-abuse]
enabled = true
port = https
filter = myapp-api-abuse
logpath = /var/log/myapp/security-*.log
maxretry = 100
findtime = 60
bantime = 3600
action = firewallcmd-rich-rules[actiontype=<drop>]

[caddy-ratelimit]
enabled = true
port = http,https
filter = caddy-ratelimit
logpath = /var/log/caddy/access.log
maxretry = 50
findtime = 60
bantime = 3600
action = firewallcmd-rich-rules[actiontype=<drop>]

[sshd-aggressive]
enabled = true
port = 2222
filter = sshd[mode=aggressive]
logpath = /var/log/secure
maxretry = 3
findtime = 600
bantime = 86400
action = firewallcmd-rich-rules[actiontype=<drop>]
         sendmail[dest=admin@example.com]
```

### 7.2 Custom Filters

```ini
# /etc/fail2ban/filter.d/myapp-auth.conf
[Definition]
failregex = "EventType":"AUTH_FAILURE".*"IpAddress":"<HOST>"
ignoreregex =

# /etc/fail2ban/filter.d/myapp-api-abuse.conf
[Definition]
failregex = "EventType":"SUSPICIOUS".*"IpAddress":"<HOST>"
            "EventType":"API_REQUEST".*"StatusCode":429.*"IpAddress":"<HOST>"
ignoreregex =

# /etc/fail2ban/filter.d/caddy-ratelimit.conf
[Definition]
failregex = "status":429.*"remote_ip":"<HOST>"
ignoreregex =
```

---

## 8. Container Monitoring

### 8.1 Podman Health Checks

```bash
# Container Health Check
podman run -d \
  --name api \
  --health-cmd='curl -sf http://localhost:5000/health || exit 1' \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  --health-start-period=60s \
  myapp-api:latest

# Health Status prüfen
podman healthcheck run api
podman inspect --format='{{.State.Health.Status}}' api
```

### 8.2 Container Monitoring Script

```bash
#!/bin/bash
# container-monitor.sh — Podman Container Überwachung

ALERT_EMAIL="admin@example.com"

check_containers() {
    local unhealthy=()
    
    for container in $(podman ps --format '{{.Names}}'); do
        local status
        status=$(podman inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null)
        
        case "$status" in
            "unhealthy")
                unhealthy+=("$container")
                logger -p local0.err "Container $container is UNHEALTHY"
                ;;
            "")
                # Kein Health Check konfiguriert
                local running
                running=$(podman inspect --format='{{.State.Running}}' "$container")
                if [ "$running" != "true" ]; then
                    unhealthy+=("$container")
                    logger -p local0.err "Container $container is NOT RUNNING"
                fi
                ;;
        esac
    done
    
    if [ ${#unhealthy[@]} -gt 0 ]; then
        echo "UNHEALTHY containers: ${unhealthy[*]}" | \
          mail -s "ALERT: Container Health Issue" "$ALERT_EMAIL"
    fi
}

# Resource Usage
check_resources() {
    podman stats --no-stream --format \
      "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" | \
      while read -r line; do
        logger -p local0.info "Container stats: $line"
      done
}

check_containers
check_resources
```

---

## 9. Incident Response Playbooks

### 9.1 Playbook: Brute Force Attack

```yaml
Playbook: Brute Force Attack Detected
Trigger: BruteForceAttack Alert oder Fail2Ban Notification
Severity: HIGH

Sofortmaßnahmen (0-5 Minuten):
  1. Angreifer-IP identifizieren:
     - fail2ban-client status myapp-auth
     - ausearch -k login_events -ts recent
  
  2. IP sofort blockieren:
     - firewall-cmd --add-rich-rule='rule family=ipv4 source address=<IP> drop' --permanent
     - firewall-cmd --reload
  
  3. Betroffene Accounts sperren:
     - Alle Accounts mit > 3 Failed Logins prüfen
     - Verdächtige Accounts deaktivieren

Analyse (5-30 Minuten):
  4. Angriffsumfang bestimmen:
     - grep "AUTH_FAILURE" /var/log/myapp/security-*.log | sort | uniq -c | sort -rn
     - Welche Accounts wurden angegriffen?
     - Waren Logins erfolgreich?
  
  5. Kompromittierung prüfen:
     - Erfolgreiche Logins von Angreifer-IP?
     - Ungewöhnliche API-Aktivität?

Behebung (30-60 Minuten):
  6. Passwort-Reset für betroffene Accounts
  7. Alle Sessions invalidieren
  8. MFA erzwingen für betroffene Accounts
  9. WAF Rules aktualisieren

Nachbereitung:
  10. Incident Report erstellen
  11. Fail2Ban Regeln verschärfen
  12. IP-Reputation-Liste aktualisieren
```

### 9.2 Playbook: Data Breach

```yaml
Playbook: Suspected Data Breach
Trigger: Ungewöhnlicher Datenzugriff, Exfiltration-Verdacht
Severity: CRITICAL

Sofortmaßnahmen (0-15 Minuten):
  1. NICHT den Server herunterfahren (Beweise sichern!)
  
  2. Netzwerk-Isolation:
     - Betroffenen Container/Service isolieren
     - podman network disconnect <network> <container>
     - Outbound-Traffic einschränken
  
  3. Beweise sichern:
     - Memory Dump: podman checkpoint --export=/tmp/evidence.tar <container>
     - Logs kopieren: cp -a /var/log /tmp/evidence/logs/
     - Audit Logs: cp /var/log/audit/audit.log /tmp/evidence/
     - Container Inspect: podman inspect <container> > /tmp/evidence/inspect.json

Analyse (15-60 Minuten):
  4. Timeline erstellen:
     - Wann begann der Zugriff?
     - Welche Daten wurden abgerufen?
     - Wie erfolgte der Zugang?
  
  5. Umfang bestimmen:
     - Welche Datenbanktabellen betroffen?
     - Wie viele Datensätze?
     - Welche Benutzer betroffen?

Kommunikation:
  6. Intern: Security Team, Management, Legal
  7. Extern (bei Bedarf): Datenschutzbehörde (72h DSGVO!)
  8. Betroffene Benutzer informieren

Behebung:
  9. Schwachstelle schließen
  10. Alle Credentials rotieren
  11. Forensische Analyse abschließen
  12. Post-Incident Review
```

### 9.3 Playbook: Compromised Container

```yaml
Playbook: Compromised Container
Trigger: Unexpected process, file change, network connection
Severity: CRITICAL

Sofortmaßnahmen:
  1. Container stoppen (NICHT löschen):
     - podman stop <container>
  
  2. Container-Filesystem exportieren:
     - podman export <container> > /tmp/evidence/container-fs.tar
  
  3. Logs sichern:
     - podman logs <container> > /tmp/evidence/container.log 2>&1
  
  4. Neuen sauberen Container starten:
     - podman run -d --name <container>-clean <image>:latest

Analyse:
  5. Filesystem vergleichen:
     - diff <exported_fs> <original_image>
  
  6. Verdächtige Prozesse/Dateien identifizieren
  7. Netzwerkverbindungen des Containers analysieren
  8. Image-Integrität prüfen (Cosign verify)

Behebung:
  9. Image neu bauen (ohne Kompromittierung)
  10. Alle Secrets rotieren
  11. Container-Security-Policies verschärfen
```

---

## 10. Security Dashboard

### 10.1 Grafana Dashboard Definition

```json
{
  "dashboard": {
    "title": "Security Operations Dashboard",
    "panels": [
      {
        "title": "Authentication Overview",
        "type": "stat",
        "targets": [
          { "expr": "sum(rate(auth_success_total[24h]))", "legendFormat": "Successful Logins" },
          { "expr": "sum(rate(auth_failure_total[24h]))", "legendFormat": "Failed Logins" }
        ]
      },
      {
        "title": "Auth Failure Rate (5m)",
        "type": "timeseries",
        "targets": [
          { "expr": "sum(rate(auth_failure_total[5m])) by (reason)" }
        ],
        "alert": {
          "conditions": [{ "evaluator": { "params": [10], "type": "gt" } }]
        }
      },
      {
        "title": "Rate Limit Hits",
        "type": "timeseries",
        "targets": [
          { "expr": "sum(rate(rate_limit_hits_total[5m])) by (endpoint)" }
        ]
      },
      {
        "title": "Active Fail2Ban Bans",
        "type": "gauge",
        "targets": [
          { "expr": "fail2ban_banned_total" }
        ]
      },
      {
        "title": "Container Health",
        "type": "table",
        "targets": [
          { "expr": "container_health_status" }
        ]
      },
      {
        "title": "Security Events (24h)",
        "type": "bargauge",
        "targets": [
          { "expr": "sum(increase(security_events_total[24h])) by (type)" }
        ]
      }
    ]
  }
}
```

---

## Weiterführende Dokumente

| Nächstes Dokument | Thema |
|-------------------|-------|
| [02 — Rocky Linux](02-rocky-linux-server-hardening.md) | auditd & AIDE Setup |
| [06 — API Security](06-aspnet-core-api-security.md) | API Audit Middleware |
| [11 — Zero Trust](11-zero-trust-architecture.md) | Continuous Monitoring |
