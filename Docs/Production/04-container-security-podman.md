# Container Security with Podman

> **Ziel:** Maximale Container-Isolierung für Government/Banking-Grade Deployment  
> **Runtime:** Podman (Rootless, Daemonless)  
> **Stack:** ASP.NET Core 10 API · Angular 21 · PostgreSQL · Caddy · Redis

---

## Inhaltsverzeichnis

- [1. Warum Podman für Sicherheit](#1-warum-podman-für-sicherheit)
- [2. Rootless Container Setup](#2-rootless-container-setup)
- [3. Image Security](#3-image-security)
- [4. Container Runtime Security](#4-container-runtime-security)
- [5. Seccomp & AppArmor Profiles](#5-seccomp--apparmor-profiles)
- [6. SELinux Container Policies](#6-selinux-container-policies)
- [7. Resource Limits & Isolation](#7-resource-limits--isolation)
- [8. Secure Container Networking](#8-secure-container-networking)
- [9. Volume & Storage Security](#9-volume--storage-security)
- [10. Pod-basierte Architektur](#10-pod-basierte-architektur)
- [11. Container Monitoring & Auditing](#11-container-monitoring--auditing)
- [12. Production Deployment Patterns](#12-production-deployment-patterns)

---

## 1. Warum Podman für Sicherheit

### 1.1 Podman vs Docker — Sicherheitsvergleich

| Feature | Podman | Docker | Security Impact |
|---------|--------|--------|-----------------|
| **Daemon** | Kein Daemon | Docker Daemon (root) | Podman: Keine root-Daemon-Angriffsfläche |
| **Root-Modus** | Rootless Standard | Root Standard | Podman: Container Escape → kein root |
| **User Namespaces** | Native | Optional | Podman: UID-Mapping isoliert Container |
| **SELinux** | Native Integration | Optional | Podman: Automatische SELinux-Labels |
| **Socket** | Kein Socket nötig | Docker Socket (root) | Podman: Kein Socket = kein Privilege Escalation Vektor |
| **Fork/Exec** | Direkt via conmon | Via Daemon | Podman: Prozess-Vererbung transparent |
| **Kubernetes** | Pod-native | Compose | Podman: Kubernetes-kompatible Pods |
| **Cgroup v2** | Native | Legacy Support | Podman: Bessere Ressourcenisolierung |

### 1.2 Sicherheitsarchitektur

```
┌─────────────────────────────────────────────────────────────┐
│                     Podman Security Layers                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 7: Image Security                                     │
│  ├── Trusted Registries (Signierte Images)                   │
│  ├── Vulnerability Scanning (Trivy/Grype)                    │
│  ├── Minimal Base Images (Distroless/Alpine)                 │
│  └── SBOM (Software Bill of Materials)                       │
│                                                              │
│  Layer 6: Container Runtime                                  │
│  ├── Read-Only Filesystem                                    │
│  ├── No New Privileges                                       │
│  ├── Dropped Capabilities                                    │
│  └── Non-Root User in Container                              │
│                                                              │
│  Layer 5: Seccomp / AppArmor                                 │
│  ├── Custom Seccomp Profiles                                 │
│  ├── Restricted Syscalls                                     │
│  └── AppArmor/SELinux MAC                                    │
│                                                              │
│  Layer 4: User Namespaces                                    │
│  ├── UID/GID Mapping                                         │
│  ├── Rootless Execution                                      │
│  └── No Real Root in Container                               │
│                                                              │
│  Layer 3: Network Isolation                                  │
│  ├── Isolated Networks                                       │
│  ├── Internal Networks (no external access)                  │
│  └── Network Policies                                        │
│                                                              │
│  Layer 2: SELinux                                            │
│  ├── container_t Type                                        │
│  ├── Volume Labels (:Z/:z)                                   │
│  └── Custom SELinux Policies                                 │
│                                                              │
│  Layer 1: Cgroup v2                                          │
│  ├── CPU/Memory Limits                                       │
│  ├── PID Limits                                              │
│  └── I/O Limits                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Rootless Container Setup

### 2.1 Rootless Podman einrichten

```bash
# Voraussetzungen prüfen
podman info --format '{{.Host.Security.Rootless}}'
# Sollte "true" ausgeben

# User Namespaces aktivieren
echo "user.max_user_namespaces=28633" | sudo tee /etc/sysctl.d/99-userns.conf
sudo sysctl -p /etc/sysctl.d/99-userns.conf

# Subuid/Subgid für Container-Benutzer konfigurieren
# Jeder Benutzer bekommt einen Range von 65536 UIDs
echo "secadmin:100000:65536" | sudo tee -a /etc/subuid
echo "secadmin:100000:65536" | sudo tee -a /etc/subgid

# Podman Storage konfigurieren
mkdir -p ~/.config/containers
tee ~/.config/containers/storage.conf << 'EOF'
[storage]
driver = "overlay"

[storage.options]
mount_program = "/usr/bin/fuse-overlayfs"

[storage.options.overlay]
mountopt = "nodev,metacopy=on"
EOF

# Podman-System migrieren
podman system migrate

# Verifizieren
podman unshare cat /proc/self/uid_map
# Erwartete Ausgabe:
#     0     1000        1     (Container-root = Host-User)
# 1     100000    65536     (Container-UIDs gemappt)

# Test: Container als non-root starten
podman run --rm alpine id
# uid=0(root) gid=0(root) — Aber im Host ist dies UID 100000!
```

### 2.2 Rootless Networking

```bash
# Rootless Podman verwendet slirp4netns oder pasta für Networking
# pasta ist schneller und sicherer

# pasta installieren (wenn nicht vorhanden)
sudo dnf install -y passt

# Podman auf pasta konfigurieren
tee ~/.config/containers/containers.conf << 'EOF'
[containers]
# Default-Netzwerk-Mode
netns = "private"

# Default-User in Containern
userns = "auto"

[network]
# pasta statt slirp4netns verwenden
default_rootless_network_cmd = "pasta"

[engine]
# Healthchecks aktivieren
healthcheck_events = true
EOF
```

### 2.3 Systemd User Services für Podman

```bash
# Container als Systemd User Service (rootless)
mkdir -p ~/.config/systemd/user

# Podman Auto-Update konfigurieren
systemctl --user enable --now podman-auto-update.timer

# Lingering aktivieren (Services laufen ohne Login)
sudo loginctl enable-linger secadmin
```

---

## 3. Image Security

### 3.1 Trusted Registries

```bash
# Nur vertrauenswürdige Registries erlauben
sudo tee /etc/containers/registries.conf << 'EOF'
# Unqualifizierte Image-Suche einschränken
[registries.search]
registries = ['docker.io', 'registry.access.redhat.com', 'quay.io']

# Blockierte Registries
[registries.block]
registries = ['docker.io/library/latest']

# Insecure Registries (KEINE in Production!)
[registries.insecure]
registries = []

# Registry-Mirrors
[[registry]]
prefix = "docker.io"
location = "docker.io"

[[registry.mirror]]
location = "mirror.gcr.io"
EOF

# Nur signierte Images akzeptieren
sudo tee /etc/containers/policy.json << 'EOF'
{
    "default": [
        {
            "type": "reject"
        }
    ],
    "transports": {
        "docker": {
            "docker.io/library": [
                {
                    "type": "signedBy",
                    "keyType": "GPGKeys",
                    "keyPath": "/etc/pki/rpm-gpg/RPM-GPG-KEY-docker"
                }
            ],
            "registry.access.redhat.com": [
                {
                    "type": "signedBy",
                    "keyType": "GPGKeys",
                    "keyPath": "/etc/pki/rpm-gpg/RPM-GPG-KEY-redhat-release"
                }
            ],
            "quay.io": [
                {
                    "type": "insecureAcceptAnything"
                }
            ]
        },
        "atomic": {
            "": [
                {
                    "type": "reject"
                }
            ]
        }
    }
}
EOF
```

### 3.2 Image Scanning

```bash
# Trivy installieren (Vulnerability Scanner)
sudo rpm -ivh https://github.com/aquasecurity/trivy/releases/download/v0.58.0/trivy_0.58.0_Linux-64bit.rpm

# Image scannen
trivy image --severity HIGH,CRITICAL myapp:latest

# Scan mit SBOM-Ausgabe
trivy image --format spdx-json --output sbom.json myapp:latest

# In CI/CD Pipeline: Scan blockiert bei kritischen Schwachstellen
trivy image --exit-code 1 --severity CRITICAL myapp:latest

# Grype als Alternative
# curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
# grype myapp:latest --fail-on critical
```

### 3.3 Secure Containerfile (Dockerfile)

```dockerfile
# ============================================================
# MULTI-STAGE BUILD — ASP.NET Core 10 API
# ============================================================

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

# Dependency Layer (cached)
COPY *.csproj ./
RUN dotnet restore --runtime linux-musl-x64

# Build Layer
COPY . .
RUN dotnet publish -c Release -o /app/publish \
    --runtime linux-musl-x64 \
    --self-contained true \
    -p:PublishTrimmed=true \
    -p:PublishSingleFile=true \
    -p:DebugType=none \
    -p:DebugSymbols=false

# Stage 2: Production (Distroless-ähnlich)
FROM mcr.microsoft.com/dotnet/runtime-deps:10.0-alpine AS production

# Sicherheits-Labels
LABEL maintainer="security@example.com" \
      version="1.0" \
      security.scan="required"

# Non-Root User erstellen
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup -h /app -s /sbin/nologin

# Minimale Pakete (keine Shell, kein Package Manager in Production!)
RUN apk --no-cache add \
    ca-certificates \
    tzdata && \
    # Package Manager entfernen (Angreifer kann nichts installieren)
    rm -rf /sbin/apk /usr/share/apk /etc/apk /var/cache/apk

WORKDIR /app

# Nur notwendige Dateien kopieren
COPY --from=build --chown=1001:1001 /app/publish .

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Als non-root User ausführen
USER 1001:1001

# Nur den benötigten Port exponieren
EXPOSE 5000

# Read-only filesystem unterstützen
ENV DOTNET_EnableDiagnostics=0
ENV ASPNETCORE_URLS=http://+:5000
ENV TZ=Europe/Berlin

ENTRYPOINT ["./MyApp"]
```

### 3.4 Image Signing mit Cosign

```bash
# Cosign installieren
# https://docs.sigstore.dev/cosign/installation/

# Key-Pair generieren
cosign generate-key-pair

# Image signieren
cosign sign --key cosign.key myregistry.com/myapp:v1.0

# Signatur verifizieren
cosign verify --key cosign.pub myregistry.com/myapp:v1.0

# SBOM an Image anhängen
cosign attach sbom --sbom sbom.json myregistry.com/myapp:v1.0
```

---

## 4. Container Runtime Security

### 4.1 Maximale Runtime-Härtung

```bash
# ============================================================
# PRODUCTION CONTAINER — Maximale Sicherheit
# ============================================================
podman run -d \
    --name api-production \
    \
    # === USER & PRIVILEGES ===
    --user 1001:1001 \                    # Non-root User
    --userns=auto \                       # Automatisches UID-Mapping
    --security-opt no-new-privileges \    # Keine Privilege Escalation
    \
    # === CAPABILITIES ===
    --cap-drop ALL \                      # Alle Capabilities entfernen
    # --cap-add NET_BIND_SERVICE \        # Nur wenn Port < 1024 nötig
    \
    # === FILESYSTEM ===
    --read-only \                         # Read-only Root Filesystem
    --tmpfs /tmp:rw,noexec,nosuid,size=100m \  # Temporäres Verzeichnis
    --tmpfs /var/tmp:rw,noexec,nosuid,size=50m \
    \
    # === SECURITY PROFILES ===
    --security-opt seccomp=/etc/containers/seccomp-strict.json \
    --security-opt label=type:container_t \
    \
    # === RESOURCE LIMITS ===
    --memory 512m \                       # Memory Limit
    --memory-swap 512m \                  # Kein Swap
    --cpus 1.0 \                          # CPU Limit
    --pids-limit 256 \                    # Process Limit
    --ulimit nofile=65535:65535 \
    --ulimit nproc=4096:4096 \
    \
    # === NETWORK ===
    --network app-network \               # Isoliertes Netzwerk
    --ip 172.16.1.10 \                    # Feste IP
    --dns 9.9.9.9 \                       # Sicherer DNS
    --hostname api \
    \
    # === HEALTH CHECK ===
    --health-cmd "wget -q --spider http://localhost:5000/health || exit 1" \
    --health-interval 30s \
    --health-timeout 5s \
    --health-retries 3 \
    --health-start-period 15s \
    \
    # === ENVIRONMENT ===
    --env-file /opt/app/env/production.env \
    \
    # === LOGGING ===
    --log-driver journald \
    --log-opt tag="api-production" \
    \
    # === RESTART POLICY ===
    --restart on-failure:5 \
    \
    # === LABELS ===
    --label "security.level=government" \
    --label "io.containers.autoupdate=registry" \
    \
    myregistry.com/myapp:v1.0-signed
```

### 4.2 Capability Reference

```yaml
# Linux Capabilities — Was Container NICHT haben sollten
NIEMALS erlauben:
  CAP_SYS_ADMIN:    "Gefährlichste Capability — fast wie root"
  CAP_NET_ADMIN:    "Netzwerk-Konfiguration ändern"
  CAP_SYS_PTRACE:   "Andere Prozesse debuggen — Container Escape Vektor"
  CAP_SYS_MODULE:   "Kernel-Module laden"
  CAP_SYS_RAWIO:    "Raw I/O Zugriff"
  CAP_MKNOD:        "Device Nodes erstellen"
  CAP_NET_RAW:      "Raw Sockets — ARP/DNS Spoofing möglich"

Nur wenn WIRKLICH nötig:
  CAP_NET_BIND_SERVICE: "Nur für Container die Port < 1024 brauchen"
  CAP_CHOWN:            "Nur für DB-Container Initialisierung"
  CAP_SETUID:           "Nur für DB-Container Initialisierung"
  CAP_SETGID:           "Nur für DB-Container Initialisierung"
  CAP_FOWNER:           "Nur für DB-Container Initialisierung"

Best Practice:
  --cap-drop ALL              # Erst alles entfernen
  --cap-add NET_BIND_SERVICE  # Dann nur das Nötige hinzufügen
```

---

## 5. Seccomp & AppArmor Profiles

### 5.1 Strict Seccomp Profile

```json
// /etc/containers/seccomp-strict.json
{
    "defaultAction": "SCMP_ACT_ERRNO",
    "defaultErrnoRet": 1,
    "archMap": [
        {
            "architecture": "SCMP_ARCH_X86_64",
            "subArchitectures": ["SCMP_ARCH_X86", "SCMP_ARCH_X32"]
        }
    ],
    "syscalls": [
        {
            "names": [
                "accept", "accept4", "access", "arch_prctl", "bind",
                "brk", "capget", "capset", "chdir", "chmod", "chown",
                "clock_getres", "clock_gettime", "clock_nanosleep",
                "clone", "close", "connect", "dup", "dup2", "dup3",
                "epoll_create", "epoll_create1", "epoll_ctl", "epoll_pwait",
                "epoll_wait", "eventfd", "eventfd2", "execve", "exit",
                "exit_group", "faccessat", "fadvise64", "fallocate",
                "fchmod", "fchmodat", "fchown", "fchownat", "fcntl",
                "fdatasync", "flock", "fork", "fstat", "fstatfs",
                "fsync", "ftruncate", "futex", "getcwd", "getdents",
                "getdents64", "getegid", "geteuid", "getgid", "getgroups",
                "getpeername", "getpgrp", "getpid", "getppid", "getpriority",
                "getrandom", "getresgid", "getresuid", "getrlimit",
                "getrusage", "getsid", "getsockname", "getsockopt",
                "gettid", "gettimeofday", "getuid", "inotify_add_watch",
                "inotify_init", "inotify_init1", "inotify_rm_watch",
                "ioctl", "kill", "lchown", "lgetxattr", "link", "linkat",
                "listen", "llistxattr", "lseek", "lstat", "madvise",
                "memfd_create", "mincore", "mkdir", "mkdirat", "mlock",
                "mlock2", "mlockall", "mmap", "mprotect", "mremap",
                "msgctl", "msgget", "msgrcv", "msgsnd", "msync",
                "munlock", "munlockall", "munmap", "nanosleep",
                "newfstatat", "open", "openat", "pause", "pipe",
                "pipe2", "poll", "ppoll", "prctl", "pread64",
                "preadv", "prlimit64", "pselect6", "pwrite64",
                "pwritev", "read", "readahead", "readlink", "readlinkat",
                "readv", "recv", "recvfrom", "recvmmsg", "recvmsg",
                "rename", "renameat", "renameat2", "restart_syscall",
                "rmdir", "rt_sigaction", "rt_sigpending", "rt_sigprocmask",
                "rt_sigreturn", "rt_sigsuspend", "rt_sigtimedwait",
                "sched_getaffinity", "sched_getattr", "sched_getparam",
                "sched_get_priority_max", "sched_get_priority_min",
                "sched_getscheduler", "sched_yield", "seccomp",
                "select", "semctl", "semget", "semop", "semtimedop",
                "send", "sendfile", "sendmmsg", "sendmsg", "sendto",
                "setgid", "setgroups", "sethostname", "setitimer",
                "setpgid", "setpriority", "setresgid", "setresuid",
                "setsid", "setsockopt", "setuid", "shmat", "shmctl",
                "shmdt", "shmget", "shutdown", "sigaltstack", "signalfd",
                "signalfd4", "socket", "socketpair", "splice", "stat",
                "statfs", "statx", "symlink", "symlinkat", "sync",
                "sync_file_range", "sysinfo", "tee", "tgkill",
                "timer_create", "timer_delete", "timer_getoverrun",
                "timer_gettime", "timer_settime", "timerfd_create",
                "timerfd_gettime", "timerfd_settime", "times",
                "truncate", "umask", "uname", "unlink", "unlinkat",
                "utime", "utimensat", "utimes", "vfork", "wait4",
                "waitid", "waitpid", "write", "writev"
            ],
            "action": "SCMP_ACT_ALLOW"
        },
        {
            "names": ["clone"],
            "action": "SCMP_ACT_ALLOW",
            "args": [
                {
                    "index": 0,
                    "value": 2114060288,
                    "op": "SCMP_CMP_MASKED_EQ"
                }
            ],
            "comment": "Verhindere CLONE_NEWUSER ohne Berechtigung"
        }
    ]
}
```

Save this as `/etc/containers/seccomp-strict.json`.

### 5.2 Seccomp Audit Mode

```bash
# Seccomp im Audit-Mode starten (zum Testen welche Syscalls benötigt werden)
podman run --rm \
    --security-opt seccomp=unconfined \
    --annotation io.containers.trace-syscall="of:/tmp/seccomp-trace.json" \
    myapp:latest

# Generiertes Profil als Basis verwenden
cat /tmp/seccomp-trace.json
```

---

## 6. SELinux Container Policies

### 6.1 SELinux Container-Typen

```bash
# Standard-Container-Typen in SELinux
# container_t:       Standard Container-Prozess
# container_file_t:  Container-Dateien
# container_ro_t:    Read-Only Container-Dateien
# container_net_t:   Container mit Netzwerk-Zugriff

# SELinux-Kontext eines laufenden Containers prüfen
podman inspect --format '{{.ProcessLabel}}' api-production
# Erwartete Ausgabe: system_u:system_r:container_t:s0:c100,c200

# Volume-Labels
# :Z — private Unconfined (nur dieser Container)
# :z — shared (mehrere Container können zugreifen)
podman run -v /data:/data:Z myapp:latest      # Exklusiv
podman run -v /shared:/shared:z myapp:latest   # Geteilt

# SELinux-Denials für Container prüfen
sudo ausearch -m avc -c container -ts recent
```

### 6.2 Custom SELinux Policy für Container

```bash
# Custom Policy wenn Container spezielle Berechtigungen braucht
cat > /tmp/myapp-container-policy.te << 'EOF'
module myapp-container 1.0;

require {
    type container_t;
    type http_port_t;
    type postgresql_port_t;
    class tcp_socket { name_connect };
}

# Container darf HTTP-Ports kontaktieren
allow container_t http_port_t:tcp_socket name_connect;

# Container darf PostgreSQL kontaktieren
allow container_t postgresql_port_t:tcp_socket name_connect;
EOF

# Kompilieren und installieren
checkmodule -M -m -o /tmp/myapp-container-policy.mod /tmp/myapp-container-policy.te
semodule_package -o /tmp/myapp-container-policy.pp -m /tmp/myapp-container-policy.mod
sudo semodule -i /tmp/myapp-container-policy.pp
```

---

## 7. Resource Limits & Isolation

### 7.1 Cgroup v2 Resource Limits

```bash
# Container mit strikten Resource Limits
podman run -d --name api \
    --memory 512m \            # Max 512 MB RAM
    --memory-swap 512m \       # Kein Swap (memory == memory-swap)
    --memory-reservation 256m \ # Soft Limit
    --cpus 1.0 \               # Max 1 CPU Core
    --cpu-shares 512 \         # Relative CPU-Gewichtung
    --pids-limit 256 \         # Max 256 Prozesse
    --blkio-weight 300 \       # I/O Gewichtung
    --device-read-bps /dev/sda:10mb \   # Lese-Bandbreite
    --device-write-bps /dev/sda:10mb \  # Schreib-Bandbreite
    myapp:latest

# Resource-Nutzung überwachen
podman stats api
podman stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.PIDs}}"
```

### 7.2 OOM-Handling

```bash
# OOM Score anpassen (niedrigerer Score = weniger wahrscheinlich gekillt)
podman run -d --name db \
    --memory 1g \
    --memory-swap 1g \
    --oom-score-adj -500 \   # DB soll als letztes gekillt werden
    postgres:16-alpine

# OOM-Kill deaktivieren (VORSICHT: Kann System-Hang verursachen)
# Nur für kritische Datenbank-Container
# podman run --oom-kill-disable ...
```

---

## 8. Secure Container Networking

### 8.1 Network Isolation Patterns

```bash
# ============================================================
# Pattern 1: Vollständig isolierte Netzwerke
# ============================================================

# Externe Zone: Caddy (einziger Container mit Port-Exposure)
podman network create --internal=false --subnet 172.20.0.0/24 external-net

# Interne Zone: API + Worker (kein externer Zugang)
podman network create --internal=true --subnet 172.20.1.0/24 internal-net

# Daten-Zone: Datenbank + Cache (nur intern)
podman network create --internal=true --subnet 172.20.2.0/24 data-net

# ============================================================
# Pattern 2: Multi-Network Container
# ============================================================

# Caddy: external + internal (Bridge zwischen Zonen)
podman run -d --name caddy \
    --network external-net \
    --network internal-net \
    -p 443:443 -p 80:80 \
    caddy:latest

# API: internal + data (kann Caddy und DB erreichen)
podman run -d --name api \
    --network internal-net \
    --network data-net \
    myapp:latest

# DB: nur data (kann nur von API erreicht werden)
podman run -d --name db \
    --network data-net \
    postgres:16-alpine

# ============================================================
# Pattern 3: DNS-Isolation
# ============================================================

# Kein DNS im Container (verhindert DNS-basierte Angriffe)
podman run -d --name api \
    --network internal-net \
    --dns none \
    --add-host=db:172.20.2.10 \
    --add-host=redis:172.20.2.20 \
    myapp:latest
```

### 8.2 mTLS zwischen Containern

```bash
# Mutual TLS für Container-zu-Container Kommunikation
# Siehe Dokument 11 (Zero Trust) für vollständige mTLS-Implementierung

# Zertifikate im Container mounten
podman run -d --name api \
    -v /opt/certs/api:/certs:ro,Z \
    -e ASPNETCORE_Kestrel__Certificates__Default__Path=/certs/api.pfx \
    -e ASPNETCORE_Kestrel__Certificates__Default__Password=<from-secrets> \
    myapp:latest
```

---

## 9. Volume & Storage Security

### 9.1 Sichere Volume-Konfiguration

```bash
# ============================================================
# Named Volumes (Managed by Podman)
# ============================================================
podman volume create --label security=high pgdata
podman volume create --label security=high app-logs

# Volume-Inspizierung
podman volume inspect pgdata

# ============================================================
# Bind Mounts mit Restriktionen
# ============================================================

# Read-Only Config
podman run -v /opt/app/config:/config:ro,Z myapp:latest

# Read-Write nur für Logs (noexec,nosuid)
podman run -v /opt/app/logs:/logs:rw,Z,noexec,nosuid myapp:latest

# Temporäre Dateien (begrenzte Größe)
podman run --tmpfs /tmp:rw,noexec,nosuid,size=100m myapp:latest

# ============================================================
# Secrets (NIEMALS in Environment Variables!)
# ============================================================

# Secret erstellen
echo "SuperSecretDBPassword" | podman secret create db-password -

# Secret in Container verwenden
podman run -d --name api \
    --secret db-password \
    myapp:latest
# Secret ist unter /run/secrets/db-password verfügbar

# Mehrere Secrets
podman secret create jwt-key /opt/secrets/jwt.key
podman secret create tls-cert /opt/secrets/tls.crt

podman run -d --name api \
    --secret db-password \
    --secret jwt-key \
    --secret tls-cert \
    myapp:latest
```

### 9.2 Encrypted Volumes

```bash
# LUKS-verschlüsselte Volumes für sensitive Daten
# Voraussetzung: cryptsetup installiert

# Verschlüsseltes Volume erstellen
sudo dd if=/dev/zero of=/opt/encrypted-db.img bs=1M count=5120
sudo cryptsetup luksFormat /opt/encrypted-db.img
sudo cryptsetup luksOpen /opt/encrypted-db.img encrypted-db
sudo mkfs.ext4 /dev/mapper/encrypted-db
sudo mkdir -p /mnt/encrypted-db
sudo mount /dev/mapper/encrypted-db /mnt/encrypted-db

# Container mit verschlüsseltem Volume
podman run -d --name db \
    -v /mnt/encrypted-db:/var/lib/postgresql/data:Z \
    postgres:16-alpine

# Nach Herunterfahren: Volume sicher schließen
sudo umount /mnt/encrypted-db
sudo cryptsetup luksClose encrypted-db
```

---

## 10. Pod-basierte Architektur

### 10.1 Production Pod Definition

```bash
# ============================================================
# Vollständiger Production Pod
# ============================================================

# Pod erstellen mit Netzwerk-Isolation
podman pod create \
    --name production-pod \
    --network external-net \
    --network internal-net \
    --network data-net \
    -p 443:443 -p 80:80 \
    --dns 9.9.9.9 \
    --share net,ipc

# Caddy im Pod
podman run -d --pod production-pod \
    --name caddy \
    --read-only \
    --cap-drop ALL --cap-add NET_BIND_SERVICE \
    --security-opt no-new-privileges \
    -v /opt/caddy/Caddyfile:/etc/caddy/Caddyfile:ro,Z \
    -v caddy-data:/data:Z \
    -v caddy-config:/config:Z \
    caddy:latest

# API im Pod
podman run -d --pod production-pod \
    --name api \
    --read-only \
    --user 1001:1001 \
    --cap-drop ALL \
    --security-opt no-new-privileges \
    --memory 512m --cpus 1.0 --pids-limit 256 \
    --secret db-password --secret jwt-key \
    --tmpfs /tmp:rw,noexec,nosuid,size=100m \
    myregistry.com/api:v1.0

# PostgreSQL im Pod
podman run -d --pod production-pod \
    --name db \
    --cap-drop ALL \
    --cap-add CHOWN --cap-add SETUID --cap-add SETGID --cap-add FOWNER \
    --security-opt no-new-privileges \
    --memory 1g --cpus 2.0 --pids-limit 512 \
    --secret db-password \
    -v pgdata:/var/lib/postgresql/data:Z \
    postgres:16-alpine

# Pod-Status prüfen
podman pod ps
podman pod inspect production-pod
```

### 10.2 Kubernetes YAML Export

```bash
# Pod als Kubernetes YAML exportieren
podman generate kube production-pod > /opt/k8s/production-pod.yaml

# YAML mit Podman deployen
podman play kube /opt/k8s/production-pod.yaml

# Systemd Service aus Pod generieren
podman generate systemd --new --files --name production-pod
sudo mv pod-production-pod.service /etc/systemd/system/
sudo systemctl enable --now pod-production-pod
```

---

## 11. Container Monitoring & Auditing

### 11.1 Container Health Monitoring

```bash
# Health-Status aller Container prüfen
podman ps --format "{{.Names}}\t{{.Status}}" --filter health=unhealthy

# Container Logs überwachen
podman logs --follow --since 1h api

# Resource-Nutzung in Echtzeit
podman stats --no-stream --format \
    "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.PIDs}}"

# Container Events
podman events --filter type=container --since 24h
```

### 11.2 Audit Script für Container

```bash
sudo tee /usr/local/bin/container-security-audit.sh << 'SCRIPT'
#!/bin/bash
# Container Security Audit Script

REPORT="/var/log/container-audit-$(date +%Y%m%d).log"

echo "=== Container Security Audit $(date) ===" > "$REPORT"

# Laufende Container
echo -e "\n--- Running Containers ---" >> "$REPORT"
podman ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" >> "$REPORT"

# Privilegierte Container (sollte KEINE geben!)
echo -e "\n--- Privileged Containers (ALERT if any!) ---" >> "$REPORT"
for c in $(podman ps -q); do
    PRIV=$(podman inspect --format '{{.HostConfig.Privileged}}' "$c")
    if [ "$PRIV" = "true" ]; then
        echo "ALERT: Container $(podman inspect --format '{{.Name}}' $c) is PRIVILEGED!" >> "$REPORT"
    fi
done

# Root-Container (sollte KEINE geben!)
echo -e "\n--- Root Containers (ALERT if any!) ---" >> "$REPORT"
for c in $(podman ps -q); do
    USER=$(podman inspect --format '{{.Config.User}}' "$c")
    if [ -z "$USER" ] || [ "$USER" = "0" ] || [ "$USER" = "root" ]; then
        echo "WARNING: Container $(podman inspect --format '{{.Name}}' $c) runs as root/no user set" >> "$REPORT"
    fi
done

# Read-Only Filesystem Check
echo -e "\n--- Read-Only Filesystem Check ---" >> "$REPORT"
for c in $(podman ps -q); do
    RO=$(podman inspect --format '{{.HostConfig.ReadonlyRootfs}}' "$c")
    NAME=$(podman inspect --format '{{.Name}}' "$c")
    echo "$NAME: ReadOnly=$RO" >> "$REPORT"
done

# Capabilities Check
echo -e "\n--- Capabilities Check ---" >> "$REPORT"
for c in $(podman ps -q); do
    NAME=$(podman inspect --format '{{.Name}}' "$c")
    CAPS=$(podman inspect --format '{{.EffectiveCaps}}' "$c")
    echo "$NAME: $CAPS" >> "$REPORT"
done

# Image Vulnerability Check
echo -e "\n--- Image Vulnerabilities ---" >> "$REPORT"
for img in $(podman images --format '{{.Repository}}:{{.Tag}}' | grep -v '<none>'); do
    echo "Scanning: $img" >> "$REPORT"
    trivy image --severity CRITICAL "$img" 2>/dev/null >> "$REPORT"
done

echo -e "\n=== Audit Complete ===" >> "$REPORT"
SCRIPT

chmod 700 /usr/local/bin/container-security-audit.sh
```

---

## 12. Production Deployment Patterns

### 12.1 Auto-Update mit Rollback

```bash
# Container mit Auto-Update Label
podman run -d \
    --name api \
    --label "io.containers.autoupdate=registry" \
    myregistry.com/api:latest

# Auto-Update Timer aktivieren
systemctl --user enable --now podman-auto-update.timer

# Manuelles Update mit Rollback
podman auto-update --dry-run   # Erst testen
podman auto-update              # Dann ausführen
podman auto-update --rollback   # Bei Fehler zurückrollen
```

### 12.2 Blue-Green Deployment

```bash
# Blue (aktuell aktiv)
podman run -d --name api-blue \
    --network internal-net --ip 172.20.1.10 \
    myregistry.com/api:v1.0

# Green (neue Version)
podman run -d --name api-green \
    --network internal-net --ip 172.20.1.11 \
    myregistry.com/api:v1.1

# Health Check der neuen Version
curl -f http://172.20.1.11:5000/health

# Caddy-Konfiguration umschalten (siehe Dokument 05)
# Caddy API: caddy reload --config /etc/caddy/Caddyfile

# Alten Container stoppen
podman stop api-blue
podman rm api-blue

# Green umbenennen
podman rename api-green api-blue
```

---

## Weiterführende Dokumente

| Nächstes Dokument | Thema |
|-------------------|-------|
| [05 — Reverse Proxy & TLS](05-reverse-proxy-tls-caddy.md) | Caddy-Konfiguration |
| [12 — CI/CD Pipeline](12-cicd-deployment-security.md) | Image Build & Scan |
| [03 — Network Security](03-network-firewall-security.md) | Container-Netzwerke |
