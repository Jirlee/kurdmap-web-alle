# Network & Firewall Security

> **Ziel:** Government/Banking-Grade Netzwerksicherheit  
> **Komponenten:** firewalld, nftables, DDoS-Schutz, Netzwerksegmentierung, VPN  
> **Umgebung:** Rocky Linux · Podman Container · Caddy Reverse Proxy

---

## Inhaltsverzeichnis

- [1. Netzwerk-Architektur](#1-netzwerk-architektur)
- [2. firewalld Konfiguration](#2-firewalld-konfiguration)
- [3. nftables Advanced Rules](#3-nftables-advanced-rules)
- [4. Netzwerksegmentierung mit Podman](#4-netzwerksegmentierung-mit-podman)
- [5. DDoS Protection](#5-ddos-protection)
- [6. DNS Security](#6-dns-security)
- [7. VPN & Secure Remote Access](#7-vpn--secure-remote-access)
- [8. Network Monitoring & IDS](#8-network-monitoring--ids)
- [9. IPv6 Security](#9-ipv6-security)
- [10. TLS/SSL Network Configuration](#10-tlsssl-network-configuration)

---

## 1. Netzwerk-Architektur

### 1.1 Sichere Netzwerk-Topologie

```
                        ┌─────────────────────────┐
                        │      Internet            │
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │    DDoS Mitigation       │
                        │    (Cloudflare/OVH)      │
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │    firewalld (DROP)      │
                        │    Port 80, 443 only     │
                        └────────────┬────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                       │
    ┌─────────▼─────────┐  ┌────────▼────────┐    ┌────────▼────────┐
    │   DMZ-Zone         │  │  App-Zone        │    │  Data-Zone       │
    │   (Caddy Proxy)    │  │  (API Container) │    │  (DB Container)  │
    │   172.16.0.0/24    │  │  172.16.1.0/24   │    │  172.16.2.0/24   │
    │                    │  │                  │    │                  │
    │  ✓ Port 80/443     │  │  ✓ Port 5000     │    │  ✓ Port 5432     │
    │  ✗ Kein DB-Access  │  │  ✓ DB-Access     │    │  ✗ Kein Internet │
    │  ✗ Kein SSH        │  │  ✗ Kein Internet │    │  ✗ Nur von App   │
    └───────────────────┘  └──────────────────┘    └──────────────────┘
              │                      │                       │
    ┌─────────▼──────────────────────▼───────────────────────▼──────────┐
    │                    Management-Zone                                 │
    │                    (SSH via VPN Only)                              │
    │                    10.0.0.0/24                                     │
    └──────────────────────────────────────────────────────────────────┘
```

### 1.2 Netzwerk-Segmentierungs-Prinzipien

```yaml
Regeln:
  1. Default Deny: Alles blockiert, explizit erlaubt
  2. Minimal Access: Nur notwendige Ports zwischen Zonen
  3. Unidirectional Flow: Internet → DMZ → App → Data (nie umgekehrt)
  4. No Direct Access: Kein direkter Internet-Zugriff für App/Data Zone
  5. Management Separation: SSH/Admin nur über dedizierte Management-Zone
  6. Logging: Alle Zone-Übergänge werden protokolliert
```

---

## 2. firewalld Konfiguration

### 2.1 Grundkonfiguration

```bash
# firewalld installieren und aktivieren
sudo dnf install -y firewalld
sudo systemctl enable --now firewalld

# Status prüfen
sudo firewall-cmd --state

# Default Zone auf DROP setzen
sudo firewall-cmd --set-default-zone=drop

# Alle bestehenden Regeln anzeigen
sudo firewall-cmd --list-all-zones
```

### 2.2 Zonen-basierte Konfiguration

```bash
# ============================================================
# DMZ-Zone (Caddy Reverse Proxy)
# ============================================================
sudo firewall-cmd --permanent --new-zone=dmz-web 2>/dev/null
sudo firewall-cmd --permanent --zone=dmz-web --set-target=DROP

# Nur HTTP/HTTPS erlauben
sudo firewall-cmd --permanent --zone=dmz-web --add-service=http
sudo firewall-cmd --permanent --zone=dmz-web --add-service=https

# Rate Limiting für HTTP
sudo firewall-cmd --permanent --zone=dmz-web \
    --add-rich-rule='rule family="ipv4" service name="https" limit value="100/s" accept'

# ============================================================
# App-Zone (ASP.NET Core API Container)
# ============================================================
sudo firewall-cmd --permanent --new-zone=app-internal 2>/dev/null
sudo firewall-cmd --permanent --zone=app-internal --set-target=DROP

# Nur interner Zugriff von Caddy
sudo firewall-cmd --permanent --zone=app-internal \
    --add-rich-rule='rule family="ipv4" source address="172.16.0.0/24" port port="5000" protocol="tcp" accept'

# ============================================================
# Data-Zone (PostgreSQL Container)
# ============================================================
sudo firewall-cmd --permanent --new-zone=data-internal 2>/dev/null
sudo firewall-cmd --permanent --zone=data-internal --set-target=DROP

# Nur Zugriff von App-Zone
sudo firewall-cmd --permanent --zone=data-internal \
    --add-rich-rule='rule family="ipv4" source address="172.16.1.0/24" port port="5432" protocol="tcp" accept'

# ============================================================
# Management-Zone (SSH)
# ============================================================
sudo firewall-cmd --permanent --new-zone=management 2>/dev/null
sudo firewall-cmd --permanent --zone=management --set-target=DROP

# SSH nur von VPN/Management-Netzwerk
sudo firewall-cmd --permanent --zone=management \
    --add-rich-rule='rule family="ipv4" source address="10.0.0.0/24" port port="2222" protocol="tcp" limit value="3/m" accept'

# ============================================================
# Reload und Verifizierung
# ============================================================
sudo firewall-cmd --reload
sudo firewall-cmd --list-all-zones
```

### 2.3 Erweiterte firewalld-Regeln

```bash
# ============================================================
# IP-Blacklisting
# ============================================================

# IPSet für bekannte Angreifer-IPs erstellen
sudo firewall-cmd --permanent --new-ipset=blacklist --type=hash:ip
sudo firewall-cmd --permanent --new-ipset=blacklist-net --type=hash:net

# IPs zur Blacklist hinzufügen
sudo firewall-cmd --permanent --ipset=blacklist --add-entry=192.0.2.100

# Blacklist-IPSet in DROP-Regel verwenden
sudo firewall-cmd --permanent --zone=drop \
    --add-rich-rule='rule source ipset="blacklist" drop'
sudo firewall-cmd --permanent --zone=drop \
    --add-rich-rule='rule source ipset="blacklist-net" drop'

# ============================================================
# Geo-Blocking (Nur bestimmte Länder erlauben)
# ============================================================

# IPSet für erlaubte Länder erstellen
sudo firewall-cmd --permanent --new-ipset=allowed-countries --type=hash:net

# Länderspezifische IP-Ranges laden (Beispiel: DE, AT, CH)
# IP-Listen von https://www.ipdeny.com/ipblocks/data/countries/
for country in de at ch; do
    wget -q "https://www.ipdeny.com/ipblocks/data/countries/${country}.zone" -O "/tmp/${country}.zone"
    while IFS= read -r line; do
        sudo firewall-cmd --permanent --ipset=allowed-countries --add-entry="$line" 2>/dev/null
    done < "/tmp/${country}.zone"
done

# ============================================================
# Port Knocking (Erweiterte SSH-Absicherung)
# ============================================================
# Sequenz: Port 7000 → 8000 → 9000 → SSH öffnet sich für 30 Sekunden

sudo firewall-cmd --permanent --zone=management \
    --add-rich-rule='rule family="ipv4" port port="7000" protocol="tcp" log prefix="KNOCK1:" accept'

# (Port Knocking Implementierung erfordert knockd - siehe Abschnitt 7)

# ============================================================
# Bekannte Angriffs-Ports blockieren
# ============================================================
BLOCK_PORTS=(23 135 137 138 139 445 1433 1434 3306 3389 4444 5900 6379 8080 8443 9200 27017)

for port in "${BLOCK_PORTS[@]}"; do
    sudo firewall-cmd --permanent --zone=drop \
        --add-rich-rule="rule family='ipv4' port port='$port' protocol='tcp' log prefix='BLOCKED-PORT-$port:' drop"
done

# ============================================================
# ICMP Konfiguration
# ============================================================
# Nur echo-request und echo-reply erlauben, mit Rate Limiting
sudo firewall-cmd --permanent --zone=dmz-web --add-icmp-block-inversion
sudo firewall-cmd --permanent --zone=dmz-web --add-icmp-block=echo-request
sudo firewall-cmd --permanent --zone=dmz-web \
    --add-rich-rule='rule icmp-type name="echo-request" limit value="1/s" accept'

sudo firewall-cmd --reload
```

### 2.4 Logging-Konfiguration

```bash
# Firewall-Logging aktivieren
sudo firewall-cmd --permanent --set-log-denied=all

# Logging für spezifische Regeln
sudo firewall-cmd --permanent --zone=drop \
    --add-rich-rule='rule family="ipv4" log prefix="DROPPED:" level="info" limit value="5/m" drop'

# rsyslog für Firewall-Logs konfigurieren
sudo tee /etc/rsyslog.d/firewall.conf << 'EOF'
:msg, contains, "DROPPED:" /var/log/firewall-dropped.log
:msg, contains, "BLOCKED-PORT" /var/log/firewall-blocked.log
:msg, contains, "KNOCK" /var/log/firewall-knock.log
& stop
EOF

sudo systemctl restart rsyslog

# Log-Rotation
sudo tee /etc/logrotate.d/firewall << 'EOF'
/var/log/firewall-*.log {
    daily
    rotate 90
    compress
    delaycompress
    missingok
    notifempty
    create 0600 root root
}
EOF
```

---

## 3. nftables Advanced Rules

### 3.1 Umfassende nftables-Konfiguration

```bash
# nftables als Alternative/Ergänzung zu firewalld
# HINWEIS: firewalld nutzt intern nftables als Backend

# Direkte nftables-Regeln für erweiterte Szenarien
sudo tee /etc/nftables/production-security.nft << 'EOF'
#!/usr/sbin/nft -f

# Bestehende Regeln löschen
flush ruleset

# ============================================================
# VARIABLEN
# ============================================================
define DMZ_NET = 172.16.0.0/24
define APP_NET = 172.16.1.0/24
define DATA_NET = 172.16.2.0/24
define MGMT_NET = 10.0.0.0/24
define SSH_PORT = 2222
define HTTP_PORTS = { 80, 443 }
define API_PORT = 5000
define DB_PORT = 5432

# ============================================================
# RATE LIMITING SETS
# ============================================================
table inet filter {
    # Connection Tracking für Rate Limiting
    set rate_limit_http {
        type ipv4_addr
        flags dynamic,timeout
        timeout 1m
    }
    
    set rate_limit_ssh {
        type ipv4_addr
        flags dynamic,timeout
        timeout 5m
    }
    
    set blackhole {
        type ipv4_addr
        flags dynamic,timeout
        timeout 24h
    }

    # ============================================================
    # INPUT CHAIN
    # ============================================================
    chain input {
        type filter hook input priority 0; policy drop;
        
        # Blackholed IPs sofort droppen
        ip saddr @blackhole counter drop
        
        # Loopback erlauben
        iif "lo" accept
        
        # Established/Related erlauben
        ct state established,related accept
        
        # Invalid droppen
        ct state invalid counter drop
        
        # Anti-Spoofing
        ip saddr 127.0.0.0/8 counter drop
        ip saddr 0.0.0.0/8 counter drop
        ip saddr 169.254.0.0/16 counter drop
        ip saddr 224.0.0.0/3 counter drop
        
        # ICMP Rate Limiting
        ip protocol icmp icmp type echo-request \
            limit rate 10/second burst 5 packets accept
        ip protocol icmp icmp type { destination-unreachable, time-exceeded } accept
        
        # SSH mit Rate Limiting (nur Management-Netz)
        ip saddr $MGMT_NET tcp dport $SSH_PORT ct state new \
            limit rate 3/minute burst 5 packets accept
        
        # HTTP/HTTPS mit Rate Limiting
        tcp dport $HTTP_PORTS ct state new \
            add @rate_limit_http { ip saddr limit rate over 100/second } \
            add @blackhole { ip saddr } counter drop
        tcp dport $HTTP_PORTS ct state new accept
        
        # Container-Netzwerk Kommunikation
        ip saddr $DMZ_NET ip daddr $APP_NET tcp dport $API_PORT accept
        ip saddr $APP_NET ip daddr $DATA_NET tcp dport $DB_PORT accept
        
        # Alles andere loggen und droppen
        counter log prefix "[nftables-drop] " level info drop
    }
    
    # ============================================================
    # FORWARD CHAIN (für Container-Netzwerk)
    # ============================================================
    chain forward {
        type filter hook forward priority 0; policy drop;
        
        # Established/Related
        ct state established,related accept
        
        # DMZ → App Zone (nur API Port)
        ip saddr $DMZ_NET ip daddr $APP_NET tcp dport $API_PORT accept
        
        # App → Data Zone (nur DB Port)
        ip saddr $APP_NET ip daddr $DATA_NET tcp dport $DB_PORT accept
        
        # Kein Rückweg von Data → Internet
        ip saddr $DATA_NET ip daddr != { $APP_NET, $DATA_NET } drop
        
        # Log und Drop
        counter log prefix "[nftables-fwd-drop] " level info drop
    }
    
    # ============================================================
    # OUTPUT CHAIN
    # ============================================================
    chain output {
        type filter hook output priority 0; policy accept;
        
        # Ausgehende Verbindungen einschränken
        # Nur DNS, HTTP/S, NTP, SMTP erlauben
        ct state new tcp dport { 25, 53, 80, 443, 587 } accept
        ct state new udp dport { 53, 123 } accept
        ct state established,related accept
        
        # Loopback
        oif "lo" accept
        
        # Alles andere loggen
        counter log prefix "[nftables-out-drop] " level info drop
    }
}

# ============================================================
# SYN FLOOD PROTECTION
# ============================================================
table inet syn_flood {
    chain prerouting {
        type filter hook prerouting priority raw; policy accept;
        
        tcp flags syn limit rate over 100/second burst 150 packets drop
    }
}

# ============================================================
# PORT SCAN DETECTION
# ============================================================
table inet port_scan_detect {
    set port_scanners {
        type ipv4_addr
        flags dynamic,timeout
        timeout 24h
    }
    
    chain input {
        type filter hook input priority -1; policy accept;
        
        # Bekannte Port-Scanner droppen
        ip saddr @port_scanners drop
        
        # Neue TCP-Verbindungen auf geschlossene Ports = Port Scan
        ct state new tcp dport != $HTTP_PORTS \
            tcp dport != $SSH_PORT \
            add @port_scanners { ip saddr } \
            counter log prefix "[port-scan] " drop
    }
}
EOF
```

---

## 4. Netzwerksegmentierung mit Podman

### 4.1 Isolierte Podman-Netzwerke erstellen

```bash
# ============================================================
# DMZ-Netzwerk (Caddy Reverse Proxy)
# ============================================================
podman network create \
    --driver bridge \
    --subnet 172.16.0.0/24 \
    --gateway 172.16.0.1 \
    --disable-dns \
    --internal=false \
    dmz-network

# ============================================================
# App-Netzwerk (ASP.NET Core API)
# ============================================================
podman network create \
    --driver bridge \
    --subnet 172.16.1.0/24 \
    --gateway 172.16.1.1 \
    --disable-dns \
    --internal=true \
    app-network

# ============================================================
# Data-Netzwerk (PostgreSQL)
# ============================================================
podman network create \
    --driver bridge \
    --subnet 172.16.2.0/24 \
    --gateway 172.16.2.1 \
    --disable-dns \
    --internal=true \
    data-network

# Netzwerke anzeigen
podman network ls
podman network inspect dmz-network
```

### 4.2 Container mit Netzwerk-Isolation

```bash
# Caddy (DMZ + App Netzwerk)
podman run -d --name caddy \
    --network dmz-network \
    --network app-network \
    -p 80:80 -p 443:443 \
    --read-only \
    --cap-drop ALL \
    --cap-add NET_BIND_SERVICE \
    caddy:latest

# ASP.NET Core API (App + Data Netzwerk)
podman run -d --name api \
    --network app-network \
    --network data-network \
    --read-only \
    --cap-drop ALL \
    --tmpfs /tmp:rw,noexec,nosuid \
    api:latest

# PostgreSQL (nur Data Netzwerk)
podman run -d --name db \
    --network data-network \
    --cap-drop ALL \
    --cap-add CHOWN --cap-add SETUID --cap-add SETGID --cap-add FOWNER \
    -v pgdata:/var/lib/postgresql/data:Z \
    postgres:16-alpine
```

### 4.3 Container-zu-Container Firewall-Regeln

```bash
# Erweiterte iptables/nftables Regeln für Container-Netzwerke
# Diese Regeln stellen sicher, dass Container nur über erlaubte Ports kommunizieren

# Caddy → API: Nur Port 5000
sudo nft add rule inet filter forward \
    ip saddr 172.16.0.0/24 ip daddr 172.16.1.0/24 \
    tcp dport 5000 accept

# API → DB: Nur Port 5432
sudo nft add rule inet filter forward \
    ip saddr 172.16.1.0/24 ip daddr 172.16.2.0/24 \
    tcp dport 5432 accept

# DB → Internet: BLOCKIERT
sudo nft add rule inet filter forward \
    ip saddr 172.16.2.0/24 \
    ip daddr != { 172.16.1.0/24, 172.16.2.0/24 } drop

# API → Internet: BLOCKIERT (kein Outbound)
sudo nft add rule inet filter forward \
    ip saddr 172.16.1.0/24 \
    ip daddr != { 172.16.0.0/24, 172.16.1.0/24, 172.16.2.0/24 } drop
```

---

## 5. DDoS Protection

### 5.1 Kernel-Level DDoS-Schutz

```bash
# SYN Flood Protection
sudo tee /etc/sysctl.d/99-ddos-protection.conf << 'EOF'
# SYN Flood Protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.tcp_synack_retries = 1

# Connection Tracking Limits
net.netfilter.nf_conntrack_max = 1000000
net.netfilter.nf_conntrack_tcp_timeout_established = 600
net.netfilter.nf_conntrack_tcp_timeout_time_wait = 30

# TCP Timeouts reduzieren
net.ipv4.tcp_fin_timeout = 10
net.ipv4.tcp_tw_reuse = 1

# ICMP Rate Limiting
net.ipv4.icmp_ratelimit = 100
net.ipv4.icmp_ratemask = 88089

# ARP Flooding Protection
net.ipv4.neigh.default.gc_thresh1 = 1024
net.ipv4.neigh.default.gc_thresh2 = 4096
net.ipv4.neigh.default.gc_thresh3 = 8192
EOF

sudo sysctl -p /etc/sysctl.d/99-ddos-protection.conf
```

### 5.2 Anwendungs-Level DDoS-Schutz

```bash
# Caddy Rate Limiting (in Caddyfile)
# Siehe Dokument 05 für vollständige Caddy-Konfiguration

# Fail2Ban für HTTP DDoS
sudo tee /etc/fail2ban/filter.d/http-ddos.conf << 'EOF'
[Definition]
failregex = ^<HOST> -.*"(GET|POST|HEAD|PUT|DELETE).*HTTP.*"
ignoreregex =
EOF

sudo tee /etc/fail2ban/jail.d/http-ddos.conf << 'EOF'
[http-ddos]
enabled = true
port = http,https
filter = http-ddos
logpath = /var/log/caddy/access.log
maxretry = 300
findtime = 60
bantime = 3600
action = firewallcmd-ipset[name=blacklist, port="http,https"]
EOF
```

### 5.3 Slowloris Protection

```bash
# nftables Rule für Slowloris-Prevention
# Verbindungen pro IP begrenzen
sudo nft add rule inet filter input \
    ct state new tcp dport 443 \
    meter http_conn_limit { ip saddr limit rate over 50/second } drop

# Idle Connection Timeout
# In Caddy Konfiguration (siehe Dokument 05):
# servers {
#     timeouts {
#         read_body   10s
#         read_header 5s
#         write       30s
#         idle        120s
#     }
# }
```

---

## 6. DNS Security

### 6.1 DNS-Konfiguration

```bash
# Systemd-resolved für sichere DNS-Auflösung
sudo tee /etc/systemd/resolved.conf << 'EOF'
[Resolve]
# DNS-over-TLS verwenden
DNS=9.9.9.9#dns.quad9.net 149.112.112.112#dns.quad9.net
FallbackDNS=1.1.1.1#cloudflare-dns.com 1.0.0.1#cloudflare-dns.com
DNSOverTLS=yes

# DNSSEC aktivieren
DNSSEC=yes

# Multicast DNS deaktivieren
MulticastDNS=no

# LLMNR deaktivieren
LLMNR=no

# Cache-Größe
Cache=yes
CacheFromLocalhost=no
EOF

sudo systemctl restart systemd-resolved

# DNS-Auflösung testen
resolvectl status
resolvectl query example.com
```

### 6.2 DNS Record Security

```yaml
DNS Records für Ihre Domain:
  # CAA Record (Certificate Authority Authorization)
  # Nur Let's Encrypt darf Zertifikate ausstellen
  example.com. IN CAA 0 issue "letsencrypt.org"
  example.com. IN CAA 0 issuewild "letsencrypt.org"
  example.com. IN CAA 0 iodef "mailto:security@example.com"
  
  # SPF Record (Email Spoofing Prevention)
  example.com. IN TXT "v=spf1 ip4:YOUR_SERVER_IP -all"
  
  # DMARC Record
  _dmarc.example.com. IN TXT "v=DMARC1; p=reject; rua=mailto:dmarc@example.com; ruf=mailto:dmarc@example.com; fo=1"
  
  # DKIM Record (Email Authentication)
  # Generiert durch Ihren Mail-Server
  
  # TLSA Record (DANE)
  _443._tcp.example.com. IN TLSA 3 1 1 <certificate_hash>
```

---

## 7. VPN & Secure Remote Access

### 7.1 WireGuard VPN

```bash
# WireGuard installieren
sudo dnf install -y epel-release
sudo dnf install -y wireguard-tools

# Server-Keys generieren
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
chmod 600 /etc/wireguard/server_private.key

# Server-Konfiguration
sudo tee /etc/wireguard/wg0.conf << 'EOF'
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = <SERVER_PRIVATE_KEY>

# Post-Up Firewall-Regeln
PostUp = firewall-cmd --zone=management --add-interface=wg0
PostDown = firewall-cmd --zone=management --remove-interface=wg0

# DNS
DNS = 9.9.9.9

[Peer]
# Admin-Client 1
PublicKey = <CLIENT_PUBLIC_KEY>
AllowedIPs = 10.0.0.2/32
PresharedKey = <PRESHARED_KEY>
EOF

chmod 600 /etc/wireguard/wg0.conf

# WireGuard aktivieren
sudo systemctl enable --now wg-quick@wg0

# Firewall-Regel für WireGuard
sudo firewall-cmd --permanent --add-port=51820/udp
sudo firewall-cmd --reload

# Status prüfen
sudo wg show
```

### 7.2 Port Knocking

```bash
# knockd installieren
sudo dnf install -y knock-server

# Konfiguration
sudo tee /etc/knockd.conf << 'EOF'
[options]
    UseSyslog
    LogFile = /var/log/knockd.log
    Interface = eth0

[openSSH]
    sequence    = 7000,8000,9000
    seq_timeout = 15
    tcpflags    = syn
    start_command = /usr/bin/firewall-cmd --zone=management --add-rich-rule='rule family="ipv4" source address="%IP%" port port="2222" protocol="tcp" accept'
    cmd_timeout = 30
    stop_command = /usr/bin/firewall-cmd --zone=management --remove-rich-rule='rule family="ipv4" source address="%IP%" port port="2222" protocol="tcp" accept'
EOF

sudo systemctl enable --now knockd

# Client-seitig SSH-Port öffnen:
# knock server.example.com 7000 8000 9000
# ssh -p 2222 secadmin@server.example.com
```

---

## 8. Network Monitoring & IDS

### 8.1 Network Intrusion Detection (Suricata)

```bash
# Suricata installieren
sudo dnf install -y epel-release
sudo dnf install -y suricata

# Konfiguration
sudo tee /etc/suricata/suricata.yaml << 'YAML'
vars:
  address-groups:
    HOME_NET: "[172.16.0.0/24, 172.16.1.0/24, 172.16.2.0/24, 10.0.0.0/24]"
    EXTERNAL_NET: "!$HOME_NET"
    HTTP_SERVERS: "[172.16.0.0/24]"
    SQL_SERVERS: "[172.16.2.0/24]"
  port-groups:
    HTTP_PORTS: "80,443"
    SSH_PORTS: "2222"

default-log-dir: /var/log/suricata/
outputs:
  - eve-log:
      enabled: yes
      filetype: regular
      filename: eve.json
      types:
        - alert
        - http
        - dns
        - tls
        - ssh
        - flow
        - netflow

af-packet:
  - interface: eth0
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes

detect-engine:
  - profile: high
  - sgh-mpm-context: auto
  - inspection-recursion-limit: 3000
YAML

# Suricata-Regeln aktualisieren
sudo suricata-update

# Suricata starten
sudo systemctl enable --now suricata

# Alerts prüfen
sudo tail -f /var/log/suricata/eve.json | jq 'select(.event_type=="alert")'
```

### 8.2 Connection Monitoring

```bash
# Netzwerk-Monitoring-Script
sudo tee /usr/local/bin/network-monitor.sh << 'SCRIPT'
#!/bin/bash
# Netzwerk-Sicherheits-Überwachung

LOG="/var/log/network-security-monitor.log"
ALERT_TO="security@example.com"

echo "=== Network Security Check $(date) ===" >> "$LOG"

# Offene Ports prüfen
echo "--- Open Ports ---" >> "$LOG"
ss -tulnp | grep LISTEN >> "$LOG"

# Established Connections
echo "--- Established Connections ---" >> "$LOG"
ss -tunp state established >> "$LOG"

# Ungewöhnliche ausgehende Verbindungen
echo "--- Suspicious Outbound ---" >> "$LOG"
SUSPICIOUS=$(ss -tunp state established | grep -v -E ":(80|443|53|123|2222|5432) " | grep -v "127.0.0.1")
if [ -n "$SUSPICIOUS" ]; then
    echo "ALERT: Suspicious outbound connections detected!" >> "$LOG"
    echo "$SUSPICIOUS" >> "$LOG"
    echo "$SUSPICIOUS" | mail -s "[ALERT] Suspicious Network Activity - $(hostname)" "$ALERT_TO"
fi

# Connection Count pro IP
echo "--- Top Connection Sources ---" >> "$LOG"
ss -tn state established | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -20 >> "$LOG"

# Prüfen auf zu viele Verbindungen von einer IP
ss -tn state established | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | \
while read count ip; do
    if [ "$count" -gt 100 ]; then
        echo "ALERT: $ip has $count connections!" >> "$LOG"
        # Automatisch blockieren
        sudo firewall-cmd --ipset=blacklist --add-entry="$ip" 2>/dev/null
    fi
done
SCRIPT

sudo chmod 700 /usr/local/bin/network-monitor.sh

# Alle 5 Minuten ausführen
echo "*/5 * * * * /usr/local/bin/network-monitor.sh" | sudo crontab -
```

---

## 9. IPv6 Security

### 9.1 IPv6 deaktivieren (wenn nicht benötigt)

```bash
# IPv6 komplett deaktivieren
sudo tee /etc/sysctl.d/99-disable-ipv6.conf << 'EOF'
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 1
EOF

sudo sysctl -p /etc/sysctl.d/99-disable-ipv6.conf

# GRUB-Parameter hinzufügen
sudo sed -i 's/GRUB_CMDLINE_LINUX="\(.*\)"/GRUB_CMDLINE_LINUX="\1 ipv6.disable=1"/' /etc/default/grub
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

### 9.2 IPv6 Hardening (wenn verwendet)

```bash
# Wenn IPv6 benötigt wird: Härten statt deaktivieren
sudo tee /etc/sysctl.d/99-ipv6-security.conf << 'EOF'
# Router Advertisements ignorieren
net.ipv6.conf.all.accept_ra = 0
net.ipv6.conf.default.accept_ra = 0

# Redirects ignorieren
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0

# Source Routing deaktivieren
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Forwarding deaktivieren
net.ipv6.conf.all.forwarding = 0
net.ipv6.conf.default.forwarding = 0
EOF

sudo sysctl -p /etc/sysctl.d/99-ipv6-security.conf
```

---

## 10. TLS/SSL Network Configuration

### 10.1 System-weite TLS-Policy

```bash
# Crypto Policy auf FUTURE setzen (strengste Einstellung)
sudo update-crypto-policies --set FUTURE

# Oder Custom Policy erstellen
sudo tee /etc/crypto-policies/back-ends/opensslcnf.config << 'EOF'
[openssl_init]
providers = provider_sect
ssl_conf = ssl_sect

[provider_sect]
default = default_sect

[default_sect]
activate = 1

[ssl_sect]
system_default = system_default_sect

[system_default_sect]
MinProtocol = TLSv1.3
CipherSuites = TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256
EOF

# Verifizieren
update-crypto-policies --show
```

### 10.2 TLS Best Practices

```yaml
TLS-Konfiguration:
  Mindestversion: TLS 1.3 (TLS 1.2 nur wenn unbedingt nötig)
  
  Erlaubte Cipher Suites (TLS 1.3):
    - TLS_AES_256_GCM_SHA384
    - TLS_CHACHA20_POLY1305_SHA256
    - TLS_AES_128_GCM_SHA256
  
  Erlaubte Cipher Suites (TLS 1.2 Fallback):
    - ECDHE-ECDSA-AES256-GCM-SHA384
    - ECDHE-RSA-AES256-GCM-SHA384
    - ECDHE-ECDSA-CHACHA20-POLY1305
    - ECDHE-RSA-CHACHA20-POLY1305
  
  Key Exchange:
    - ECDHE mit P-384 oder P-256
    - X25519
  
  Zertifikate:
    - RSA 4096-bit ODER ECDSA P-384
    - OCSP Stapling aktivieren
    - Certificate Transparency (CT) Logs
    - CAA DNS Records setzen
  
  VERBOTEN:
    - SSLv2, SSLv3, TLS 1.0, TLS 1.1
    - RC4, DES, 3DES, MD5, SHA1
    - NULL Cipher
    - Export Cipher
    - Anonymous Key Exchange
```

---

## Weiterführende Dokumente

| Nächstes Dokument | Thema |
|-------------------|-------|
| [04 — Container Security](04-container-security-podman.md) | Podman-Isolierung |
| [05 — Reverse Proxy & TLS](05-reverse-proxy-tls-caddy.md) | Caddy-Konfiguration |
| [11 — Zero Trust Architecture](11-zero-trust-architecture.md) | mTLS & Micro-Segmentation |
