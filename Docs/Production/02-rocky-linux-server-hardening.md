# Rocky Linux Server Hardening

> **Ziel:** Government/Banking-Grade OS-Härtung für Rocky Linux  
> **Grundlage:** CIS Benchmark, DISA STIG, OpenSCAP  
> **Zielumgebung:** Produktionsserver für ASP.NET Core 10 API + Podman + Caddy

---

## Inhaltsverzeichnis

- [1. Pre-Installation Security](#1-pre-installation-security)
- [2. Initial System Hardening](#2-initial-system-hardening)
- [3. Kernel Hardening](#3-kernel-hardening)
- [4. User & Access Management](#4-user--access-management)
- [5. SSH Hardening](#5-ssh-hardening)
- [6. SELinux Konfiguration](#6-selinux-konfiguration)
- [7. File System Security](#7-file-system-security)
- [8. System Auditing (auditd)](#8-system-auditing-auditd)
- [9. Intrusion Detection (AIDE)](#9-intrusion-detection-aide)
- [10. OpenSCAP Compliance](#10-openscap-compliance)
- [11. Automatic Security Updates](#11-automatic-security-updates)
- [12. Service Hardening](#12-service-hardening)

---

## 1. Pre-Installation Security

### 1.1 Secure Installation Media

```bash
# Rocky Linux 9 ISO herunterladen und verifizieren
wget https://download.rockylinux.org/pub/rocky/9/isos/x86_64/Rocky-9-latest-x86_64-dvd.iso
wget https://download.rockylinux.org/pub/rocky/9/isos/x86_64/CHECKSUM
wget https://download.rockylinux.org/pub/rocky/9/isos/x86_64/CHECKSUM.sig

# Checksum verifizieren
sha256sum -c CHECKSUM 2>&1 | grep OK

# GPG-Key importieren und Signatur prüfen
curl -o RPM-GPG-KEY-Rocky-9 https://download.rockylinux.org/pub/rocky/RPM-GPG-KEY-Rocky-9
gpg --import RPM-GPG-KEY-Rocky-9
gpg --verify CHECKSUM.sig CHECKSUM
```

### 1.2 Secure Boot & UEFI

```yaml
UEFI-Konfiguration:
  - Secure Boot aktivieren
  - GPT-Partitionierungsschema verwenden
  - UEFI-Passwort setzen
  - Boot-Reihenfolge fixieren (nur lokale Festplatte)
  - USB-Boot deaktivieren
  - PXE-Boot deaktivieren (wenn nicht benötigt)
```

### 1.3 Partitionierungsschema (Security-Optimiert)

```bash
# Empfohlenes Partitionslayout für maximale Sicherheit
# Separate Partitionen erlauben mount-spezifische Sicherheitsoptionen

/boot       - 1 GB    - ext4  - nodev,nosuid,noexec
/boot/efi   - 600 MB  - vfat
/            - 20 GB   - ext4
/home       - 50 GB   - ext4  - nodev,nosuid
/tmp        - 10 GB   - ext4  - nodev,nosuid,noexec
/var        - 30 GB   - ext4  - nodev
/var/log    - 20 GB   - ext4  - nodev,nosuid,noexec
/var/log/audit - 10 GB - ext4 - nodev,nosuid,noexec
/var/tmp    - 10 GB   - ext4  - nodev,nosuid,noexec
/opt        - 20 GB   - ext4  - nodev
swap        - 4-8 GB  - swap
```

### 1.4 Minimal Installation

```bash
# Minimal Installation wählen (kein GUI, keine unnötigen Pakete)
# Nur "Minimal Install" Profil auswählen

# Nach Installation: Unnötige Pakete prüfen
dnf list installed | wc -l

# Unnötige Pakete entfernen
sudo dnf remove -y \
  cups \
  avahi \
  bluetooth \
  iwl* \
  wpa_supplicant \
  ModemManager \
  NetworkManager-wifi
```

---

## 2. Initial System Hardening

### 2.1 System Updates

```bash
# ERSTE AKTION: Alle Pakete aktualisieren
sudo dnf update -y

# Sicherheits-Updates separat prüfen
sudo dnf updateinfo list security

# Nur Sicherheits-Updates installieren
sudo dnf update --security -y

# Repository-GPG-Keys verifizieren
rpm -qa gpg-pubkey*
rpm -qi gpg-pubkey-$(rpm -qa gpg-pubkey | head -1 | sed 's/gpg-pubkey-//')
```

### 2.2 Automatische Sicherheitsupdates

```bash
# dnf-automatic installieren
sudo dnf install -y dnf-automatic

# Konfiguration für Sicherheitsupdates
sudo tee /etc/dnf/automatic.conf << 'EOF'
[commands]
upgrade_type = security
random_sleep = 300
download_updates = yes
apply_updates = yes

[emitters]
emit_via = stdio,email

[email]
email_from = root@server.example.com
email_to = security@example.com
email_host = localhost

[base]
debuglevel = 1
EOF

# Timer aktivieren
sudo systemctl enable --now dnf-automatic-install.timer

# Timer-Status prüfen
sudo systemctl status dnf-automatic-install.timer
```

### 2.3 Unnecessary Services deaktivieren

```bash
# Liste aller aktiven Services
systemctl list-units --type=service --state=running

# Unnötige Services deaktivieren
DISABLE_SERVICES=(
    "avahi-daemon"
    "cups"
    "bluetooth"
    "kdump"
    "rpcbind"
    "nfs-client.target"
    "postfix"
    "chronyd"  # Nur wenn other NTP verwendet wird
)

for service in "${DISABLE_SERVICES[@]}"; do
    sudo systemctl disable --now "$service" 2>/dev/null
    echo "Deaktiviert: $service"
done

# Überprüfen welche Ports offen sind
sudo ss -tulnp

# Nur diese Ports sollten offen sein:
# - 22 (SSH) oder Custom SSH Port
# - 80/443 (HTTP/HTTPS) über Caddy Container
```

### 2.4 UMASK Hardening

```bash
# System-weite UMASK verschärfen
sudo sed -i 's/^UMASK.*/UMASK 077/' /etc/login.defs

# Bash-Profil härten
echo "umask 077" | sudo tee -a /etc/profile.d/umask.sh
sudo chmod 644 /etc/profile.d/umask.sh

# Verifizieren
grep UMASK /etc/login.defs
```

---

## 3. Kernel Hardening

### 3.1 Sysctl Security Parameters

```bash
# Umfassende Kernel-Härtung
sudo tee /etc/sysctl.d/99-security-hardening.conf << 'EOF'
# ============================================================
# NETZWERK-SICHERHEIT
# ============================================================

# IP Spoofing Protection (Reverse Path Filtering)
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# ICMP Redirects ignorieren (verhindert MitM-Angriffe)
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0

# Keine ICMP Redirects senden
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Source Routing deaktivieren
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Martian Packets loggen
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# ICMP Broadcast Requests ignorieren
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Bogus ICMP Responses ignorieren
net.ipv4.icmp_ignore_bogus_error_responses = 1

# TCP SYN Cookies aktivieren (SYN Flood Schutz)
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# IP Forwarding deaktivieren (kein Router)
# ACHTUNG: Für Podman Container Networking wird forwarding benötigt!
# Wenn Container networking verwendet wird, auf 1 setzen
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 0

# IPv6 deaktivieren wenn nicht benötigt
# net.ipv6.conf.all.disable_ipv6 = 1
# net.ipv6.conf.default.disable_ipv6 = 1

# TCP Timestamps (verhindert Uptime-Ermittlung)
net.ipv4.tcp_timestamps = 0

# TCP Window Scaling
net.ipv4.tcp_window_scaling = 1

# Optimierte TCP Settings
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15

# ============================================================
# KERNEL-SICHERHEIT
# ============================================================

# Kernel Pointer Zugriff einschränken
kernel.kptr_restrict = 2

# Kernel Log Zugriff einschränken
kernel.dmesg_restrict = 1

# kexec deaktivieren (verhindert Kernel-Replacement im Betrieb)
kernel.kexec_load_disabled = 1

# ptrace einschränken (verhindert Process Debugging)
kernel.yama.ptrace_scope = 3

# Unprivileged BPF deaktivieren
kernel.unprivileged_bpf_disabled = 1

# BPF JIT Hardening
net.core.bpf_jit_harden = 2

# Performance Events einschränken
kernel.perf_event_paranoid = 3

# Core Dumps deaktivieren
fs.suid_dumpable = 0

# PID Maximum erhöhen
kernel.pid_max = 65535

# File Descriptor Limit
fs.file-max = 65535

# Restrict unprivileged user namespaces
# ACHTUNG: Podman rootless benötigt user namespaces!
# Nur setzen wenn rootless Podman NICHT verwendet wird:
# kernel.unprivileged_userns_clone = 0

# Magic SysRq deaktivieren
kernel.sysrq = 0

# Randomize virtual address space (ASLR)
kernel.randomize_va_space = 2

# ============================================================
# SPEICHER-SICHERHEIT
# ============================================================

# ExecShield (ASLR ist aktiviert durch randomize_va_space)
# Verhindert bestimmte Speicherangriffe

# Memory Overcommit kontrollieren
vm.overcommit_memory = 0
vm.overcommit_ratio = 50

# Swap Nutzung minimieren
vm.swappiness = 10
EOF

# Anwenden
sudo sysctl -p /etc/sysctl.d/99-security-hardening.conf

# Verifizieren
sudo sysctl -a | grep -E "rp_filter|syncookies|kptr_restrict"
```

### 3.2 GRUB Kernel Parameters

```bash
# GRUB-Konfiguration sichern
sudo cp /etc/default/grub /etc/default/grub.backup

# Sicherheitsparameter zu GRUB_CMDLINE_LINUX hinzufügen
sudo sed -i 's/GRUB_CMDLINE_LINUX="\(.*\)"/GRUB_CMDLINE_LINUX="\1 audit=1 audit_backlog_limit=8192 slub_debug=FZP page_poison=1 vsyscall=none init_on_alloc=1 init_on_free=1 slab_nomerge pti=on randomize_kstack_offset=on"/' /etc/default/grub

# GRUB neu generieren
# Für BIOS:
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
# Für UEFI:
sudo grub2-mkconfig -o /boot/efi/EFI/rocky/grub.cfg

# GRUB-Passwort setzen
sudo grub2-setpassword
# → Starkes Passwort eingeben

# GRUB-Konfiguration schützen
sudo chmod 600 /boot/grub2/grub.cfg
```

### 3.3 Kernel Module Blacklisting

```bash
# Unnötige und gefährliche Kernel-Module deaktivieren
sudo tee /etc/modprobe.d/security-blacklist.conf << 'EOF'
# Unnötige Netzwerk-Protokolle
install dccp /bin/true
install sctp /bin/true
install rds /bin/true
install tipc /bin/true

# Unnötige Dateisysteme
install cramfs /bin/true
install freevxfs /bin/true
install jffs2 /bin/true
install hfs /bin/true
install hfsplus /bin/true
install squashfs /bin/true
install udf /bin/true
install vfat /bin/true   # Nur wenn kein UEFI verwendet wird

# USB Storage (wenn nicht benötigt)
install usb-storage /bin/true

# Firewire
install firewire-core /bin/true
install firewire-net /bin/true
install firewire-sbp2 /bin/true
install firewire-ohci /bin/true

# Bluetooth (wenn nicht benötigt)
install bluetooth /bin/true
install btusb /bin/true

# Drahtlose Netzwerke (auf Server nicht benötigt)
install cfg80211 /bin/true
install mac80211 /bin/true
EOF
```

### 3.4 System Resource Limits

```bash
# Security Limits konfigurieren
sudo tee /etc/security/limits.d/99-security.conf << 'EOF'
# Prevent fork bombs
*    hard    nproc     4096
*    soft    nproc     2048

# Core Dumps deaktivieren
*    hard    core      0
*    soft    core      0

# Maximum locked memory
*    hard    memlock   64
*    soft    memlock   64

# Maximum file size (1 GB)
*    hard    fsize     1048576
*    soft    fsize     1048576

# Maximum open files
*    hard    nofile    65535
*    soft    nofile    32768

# Maximum number of pending signals
*    hard    sigpending 16384
EOF
```

---

## 4. User & Access Management

### 4.1 Password Policy

```bash
# Passwort-Qualitätskonfiguration
sudo tee /etc/security/pwquality.conf << 'EOF'
# Minimale Passwortlänge
minlen = 14

# Minimale Anzahl verschiedener Zeichenklassen
minclass = 4

# Maximale aufeinanderfolgende gleiche Zeichen
maxrepeat = 2

# Maximale aufeinanderfolgende Zeichen einer Klasse
maxclassrepeat = 4

# Mindestens 1 Kleinbuchstabe
lcredit = -1

# Mindestens 1 Großbuchstabe
ucredit = -1

# Mindestens 1 Ziffer
dcredit = -1

# Mindestens 1 Sonderzeichen
ocredit = -1

# Prüfung gegen Dictionary
dictcheck = 1

# Prüfung gegen Username
usercheck = 1

# Maximale Übereinstimmung mit altem Passwort
difok = 8

# Passwort-Qualität auch für root erzwingen
enforce_for_root

# Retry bei Passwort-Eingabe
retry = 3
EOF

# Login-Definitionen verschärfen
sudo sed -i 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS   90/' /etc/login.defs
sudo sed -i 's/^PASS_MIN_DAYS.*/PASS_MIN_DAYS   7/' /etc/login.defs
sudo sed -i 's/^PASS_WARN_AGE.*/PASS_WARN_AGE   14/' /etc/login.defs
sudo sed -i 's/^PASS_MIN_LEN.*/PASS_MIN_LEN    14/' /etc/login.defs

# SHA512 mit hohen Runden für Passwort-Hashing
sudo sed -i 's/^ENCRYPT_METHOD.*/ENCRYPT_METHOD SHA512/' /etc/login.defs
echo "SHA_CRYPT_MIN_ROUNDS 10000" | sudo tee -a /etc/login.defs
echo "SHA_CRYPT_MAX_ROUNDS 100000" | sudo tee -a /etc/login.defs
```

### 4.2 PAM Security

```bash
# Account Lockout Policy
sudo tee /etc/security/faillock.conf << 'EOF'
# Account sperren nach 5 fehlgeschlagenen Versuchen
deny = 5

# Sperrzeit: 15 Minuten
unlock_time = 900

# Auch root sperren
even_deny_root

# Root Sperrzeit: 30 Minuten
root_unlock_time = 1800

# Audit-Logging für fehlgeschlagene Versuche
audit

# Silent Mode (keine Information an Angreifer)
silent
EOF

# Passwort-Historie (letzte 24 Passwörter merken)
sudo sed -i '/pam_pwhistory/d' /etc/pam.d/system-auth
echo "password    requisite     pam_pwhistory.so remember=24 enforce_for_root use_authtok" | \
  sudo tee -a /etc/pam.d/system-auth

# su-Zugriff auf wheel-Gruppe beschränken
sudo sed -i 's/^#auth.*required.*pam_wheel.so use_uid/auth            required        pam_wheel.so use_uid/' /etc/pam.d/su
```

### 4.3 User Account Hardening

```bash
# System-Accounts sperren und Shell entfernen
SYSTEM_USERS=(
    "bin" "daemon" "adm" "lp" "sync" "shutdown" "halt"
    "mail" "operator" "games" "ftp" "nobody" "systemd-coredump"
)

for user in "${SYSTEM_USERS[@]}"; do
    sudo usermod -L "$user" 2>/dev/null
    sudo usermod -s /sbin/nologin "$user" 2>/dev/null
done

# Root Shell auf nologin setzen (SSH-Root ist bereits deaktiviert)
# VORSICHT: Nur wenn ein anderer Admin-Benutzer existiert!
# sudo usermod -s /sbin/nologin root

# Unnötige Benutzer entfernen
for user in games news; do
    sudo userdel -r "$user" 2>/dev/null
done

# Admin-Benutzer erstellen
sudo useradd -m -G wheel -s /bin/bash secadmin
sudo passwd secadmin  # Starkes Passwort setzen

# Prüfen: Kein Benutzer außer root hat UID 0
awk -F: '($3 == 0) {print $1}' /etc/passwd
# Ergebnis sollte nur "root" sein

# Passwort-Ablauf für alle Benutzer prüfen
for user in $(awk -F: '($3 >= 1000) && ($1 != "nobody") {print $1}' /etc/passwd); do
    sudo chage -l "$user"
done
```

### 4.4 Sudo Hardening

```bash
# Sichere sudoers-Konfiguration
sudo tee /etc/sudoers.d/99-security << 'EOF'
# Allgemeine Sicherheitseinstellungen
Defaults    requiretty
Defaults    use_pty
Defaults    logfile="/var/log/sudo.log"
Defaults    log_input,log_output
Defaults    iolog_dir="/var/log/sudo-io/%{user}/%{seq}"
Defaults    timestamp_timeout=5
Defaults    passwd_timeout=1
Defaults    passwd_tries=3
Defaults    env_reset
Defaults    env_keep = "COLORS DISPLAY HOSTNAME HISTSIZE KDEDIR LS_COLORS"
Defaults    secure_path = /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Defaults    !visiblepw
Defaults    always_set_home
Defaults    match_group_by_gid
Defaults    env_clean

# Kein NOPASSWD für wheel-Gruppe (kommentiert Standard aus)
%wheel  ALL=(ALL)       ALL
EOF

sudo chmod 440 /etc/sudoers.d/99-security

# sudo-Log-Verzeichnis erstellen
sudo mkdir -p /var/log/sudo-io
sudo chmod 700 /var/log/sudo-io
```

---

## 5. SSH Hardening

### 5.1 SSH-Konfiguration (Höchste Sicherheit)

```bash
# Backup erstellen
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Sichere SSH-Konfiguration
sudo tee /etc/ssh/sshd_config.d/99-hardening.conf << 'EOF'
# ============================================================
# PROTOKOLL UND NETZWERK
# ============================================================
Port 2222                      # Non-Standard Port
Protocol 2                     # Nur SSH Protokoll 2
AddressFamily inet             # Nur IPv4 (IPv6 deaktivieren wenn nicht benötigt)
ListenAddress 0.0.0.0          # An alle Interfaces binden

# ============================================================
# HOST KEYS (nur starke Algorithmen)
# ============================================================
HostKey /etc/ssh/ssh_host_ed25519_key
HostKey /etc/ssh/ssh_host_rsa_key

# ============================================================
# KRYPTOGRAPHIE (Government-Grade)
# ============================================================
Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com,aes256-ctr
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512
HostKeyAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256

# ============================================================
# AUTHENTIFIZIERUNG
# ============================================================
LoginGraceTime 30
PermitRootLogin no
StrictModes yes
MaxAuthTries 3
MaxSessions 5

# Nur Public Key Authentication
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Passwort-Auth DEAKTIVIEREN
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
KerberosAuthentication no
GSSAPIAuthentication no

# PAM verwenden
UsePAM yes

# ============================================================
# ZUGRIFFSBESCHRÄNKUNG
# ============================================================
AllowUsers secadmin
AllowGroups wheel
DenyUsers root
DenyGroups nobody

# ============================================================
# SESSION-SICHERHEIT
# ============================================================
X11Forwarding no
AllowTcpForwarding no
AllowAgentForwarding no
PermitTunnel no
GatewayPorts no
PrintMotd no
PrintLastLog yes
TCPKeepAlive yes
PermitUserEnvironment no
Compression no
ClientAliveInterval 300
ClientAliveCountMax 2
UseDNS no
MaxStartups 10:30:60

# ============================================================
# LOGGING
# ============================================================
SyslogFacility AUTH
LogLevel VERBOSE

# ============================================================
# SFTP
# ============================================================
Subsystem sftp /usr/libexec/openssh/sftp-server -f AUTHPRIV -l INFO

# ============================================================
# BANNER
# ============================================================
Banner /etc/issue.net
EOF

# Login-Banner erstellen
sudo tee /etc/issue.net << 'EOF'
*******************************************************************
*                       AUTHORIZED ACCESS ONLY                     *
*                                                                  *
*  This system is the property of [ORGANIZATION NAME].             *
*  Access is restricted to authorized personnel only.              *
*  All activities are monitored, logged, and audited.              *
*  Unauthorized access is a criminal offense and will be           *
*  prosecuted to the fullest extent of the law.                    *
*                                                                  *
*  By continuing, you consent to monitoring and recording          *
*  of all your activities on this system.                          *
*******************************************************************
EOF

# Berechtigungen setzen
sudo chmod 600 /etc/ssh/sshd_config.d/99-hardening.conf
sudo chmod 644 /etc/issue.net

# SSH-Konfiguration testen
sudo sshd -t

# SSH-Service neu starten
sudo systemctl restart sshd
```

### 5.2 SSH Key Management

```bash
# ED25519 Key generieren (auf dem CLIENT, nicht Server)
ssh-keygen -t ed25519 -a 100 -C "secadmin@production-$(date +%Y%m%d)" \
    -f ~/.ssh/id_ed25519_production

# Berechtigungen setzen
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519_production
chmod 644 ~/.ssh/id_ed25519_production.pub
chmod 600 ~/.ssh/authorized_keys

# Key zum Server kopieren
ssh-copy-id -i ~/.ssh/id_ed25519_production.pub -p 2222 secadmin@server

# SSH Client hardened Konfiguration (auf dem CLIENT)
cat > ~/.ssh/config << 'EOF'
Host production
    HostName server.example.com
    Port 2222
    User secadmin
    IdentityFile ~/.ssh/id_ed25519_production
    IdentitiesOnly yes
    Protocol 2
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking ask
    VerifyHostKeyDNS yes
    ForwardAgent no
    ForwardX11 no
    PasswordAuthentication no
    HashKnownHosts yes
    Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com
    MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
    KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
    AddKeysToAgent no
EOF

chmod 600 ~/.ssh/config
```

### 5.3 Fail2Ban für SSH

```bash
# Fail2Ban installieren
sudo dnf install -y epel-release
sudo dnf install -y fail2ban fail2ban-firewalld

# Fail2Ban Konfiguration
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd
banaction = firewallcmd-ipset
banaction_allports = firewallcmd-ipset
ignoreip = 127.0.0.1/8 ::1

# E-Mail-Benachrichtigung
destemail = security@example.com
sender = fail2ban@server.example.com
mta = sendmail
action = %(action_mwl)s

[sshd]
enabled = true
port = 2222
logpath = %(sshd_log)s
maxretry = 3
bantime = 86400

[sshd-ddos]
enabled = true
port = 2222
logpath = %(sshd_log)s
maxretry = 6
findtime = 300
bantime = 172800
filter = sshd-ddos
EOF

# Fail2Ban starten
sudo systemctl enable --now fail2ban

# Status prüfen
sudo fail2ban-client status sshd
```

---

## 6. SELinux Konfiguration

### 6.1 SELinux aktivieren und erzwingen

```bash
# SELinux Status prüfen
getenforce
sestatus

# SELinux auf Enforcing setzen
sudo setenforce 1
sudo sed -i 's/^SELINUX=.*/SELINUX=enforcing/' /etc/selinux/config

# SELinux-Tools installieren
sudo dnf install -y \
    setools-console \
    policycoreutils-python-utils \
    setroubleshoot-server \
    selinux-policy-targeted \
    selinux-policy-devel

# SELinux Status verifizieren
sestatus
# Erwartete Ausgabe:
# SELinux status:                 enabled
# Current mode:                   enforcing
# Policy:                         targeted
```

### 6.2 SELinux Booleans für Sicherheit

```bash
# Sicherheitsrelevante Booleans setzen
# Memory Execution verhindern
sudo setsebool -P deny_execmem on

# Sichere Module-Ladung
sudo setsebool -P secure_mode_insmod on

# SSH Sysadmin Login verhindern
sudo setsebool -P ssh_sysadm_login off

# Container-spezifische Booleans
# Podman Container erlauben
sudo setsebool -P container_manage_cgroup on

# HTTP-Dienst-Booleans (restriktiv)
sudo setsebool -P httpd_can_network_connect off
sudo setsebool -P httpd_can_sendmail off
sudo setsebool -P httpd_enable_cgi off
sudo setsebool -P httpd_execmem off

# Alle aktuellen Booleans prüfen
sudo getsebool -a | grep -E "on$" | sort

# Container-relevante Booleans auflisten
sudo getsebool -a | grep container
```

### 6.3 SELinux für Podman Container

```bash
# Container SELinux-Policy erstellen
# Podman verwendet automatisch :Z und :z Volume-Labels
# :Z = private Label (nur dieser Container)
# :z = shared Label (mehrere Container)

# Beispiel: Volume mit SELinux-Kontext mounten
podman run -d --name myapp \
    -v /opt/app/data:/data:Z \
    -v /opt/app/config:/config:ro,Z \
    myapp:latest

# Custom SELinux-Policy für Anwendung erstellen
cat > /tmp/myapp-container.te << 'EOF'
module myapp-container 1.0;

require {
    type container_t;
    type container_file_t;
    class file { read write open getattr };
    class dir { read search open getattr };
}

# Container darf nur eigene Dateien lesen/schreiben
allow container_t container_file_t:file { read write open getattr };
allow container_t container_file_t:dir { read search open getattr };
EOF

# Policy kompilieren und installieren
checkmodule -M -m -o /tmp/myapp-container.mod /tmp/myapp-container.te
semodule_package -o /tmp/myapp-container.pp -m /tmp/myapp-container.mod
sudo semodule -i /tmp/myapp-container.pp

# SELinux-Denials überwachen
sudo ausearch -m avc -ts recent
sudo sealert -a /var/log/audit/audit.log
```

---

## 7. File System Security

### 7.1 Mount Options Hardening

```bash
# /etc/fstab mit Sicherheits-Mount-Optionen
# Bestehende Einträge anpassen:

# /tmp mit nodev,nosuid,noexec
sudo sed -i '/\/tmp/s/defaults/defaults,nodev,nosuid,noexec/' /etc/fstab

# /var/tmp mit nodev,nosuid,noexec
sudo sed -i '/\/var\/tmp/s/defaults/defaults,nodev,nosuid,noexec/' /etc/fstab

# /home mit nodev,nosuid
sudo sed -i '/\/home/s/defaults/defaults,nodev,nosuid/' /etc/fstab

# /var/log mit nodev,nosuid,noexec
sudo sed -i '/\/var\/log/s/defaults/defaults,nodev,nosuid,noexec/' /etc/fstab

# /dev/shm mit nodev,nosuid,noexec
echo "tmpfs /dev/shm tmpfs defaults,nodev,nosuid,noexec 0 0" | sudo tee -a /etc/fstab

# Remount mit neuen Optionen
sudo mount -o remount /tmp
sudo mount -o remount /var/tmp
sudo mount -o remount /home
sudo mount -o remount /dev/shm

# Verifizieren
mount | grep -E "tmp|home|shm"
```

### 7.2 File Permissions Audit

```bash
# World-Writable Files finden und beheben
sudo find / -xdev -type f -perm -0002 -exec chmod o-w {} \;

# World-Writable Directories finden (ohne Sticky Bit)
sudo find / -xdev -type d \( -perm -0002 -a ! -perm -1000 \) -exec chmod o-w {} \;

# Unowned Files finden
sudo find / -xdev \( -nouser -o -nogroup \) -print

# SUID/SGID Files auditieren
sudo find / -perm /6000 -type f -exec ls -ld {} \; > /root/suid_sgid_audit.txt

# Unnötige SUID-Bits entfernen
REMOVE_SUID=(
    "/usr/bin/at"
    "/usr/bin/newgrp"
    "/usr/bin/chage"
    "/usr/bin/gpasswd"
)

for binary in "${REMOVE_SUID[@]}"; do
    if [ -f "$binary" ]; then
        sudo chmod u-s "$binary"
        echo "SUID entfernt: $binary"
    fi
done

# Wichtige Dateien schützen
sudo chmod 600 /etc/shadow
sudo chmod 600 /etc/gshadow
sudo chmod 644 /etc/passwd
sudo chmod 644 /etc/group
sudo chmod 600 /etc/ssh/sshd_config
sudo chmod 700 /root
```

### 7.3 Immutable Files

```bash
# Kritische Konfigurationsdateien unveränderlich machen
# VORSICHT: Muss vor Änderungen wieder entfernt werden!

# Setzen
sudo chattr +i /etc/passwd
sudo chattr +i /etc/shadow
sudo chattr +i /etc/group
sudo chattr +i /etc/gshadow
sudo chattr +i /etc/ssh/sshd_config

# Append-Only für Logs
sudo chattr +a /var/log/secure
sudo chattr +a /var/log/audit/audit.log

# Status prüfen
lsattr /etc/passwd /etc/shadow

# Zum Ändern: chattr -i /etc/passwd
```

---

## 8. System Auditing (auditd)

### 8.1 Audit-Regeln

```bash
# auditd installieren
sudo dnf install -y audit

# Umfassende Audit-Regeln
sudo tee /etc/audit/rules.d/99-security.rules << 'EOF'
# Alle bestehenden Regeln löschen
-D

# Buffer-Größe
-b 8192

# Failure Mode (1=printk, 2=panic)
-f 1

# ============================================================
# IDENTITÄT UND AUTHENTIFIZIERUNG
# ============================================================
-w /etc/passwd -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/gshadow -p wa -k identity
-w /etc/security/opasswd -p wa -k identity

# ============================================================
# ZUGRIFFSKONTROLLE
# ============================================================
-w /etc/sudoers -p wa -k sudoers
-w /etc/sudoers.d/ -p wa -k sudoers

# ============================================================
# SSH-KONFIGURATION
# ============================================================
-w /etc/ssh/sshd_config -p wa -k sshd_config
-w /etc/ssh/sshd_config.d/ -p wa -k sshd_config

# ============================================================
# SYSTEMZEIT
# ============================================================
-a always,exit -F arch=b64 -S adjtimex -S settimeofday -k time-change
-a always,exit -F arch=b32 -S adjtimex -S settimeofday -S stime -k time-change
-a always,exit -F arch=b64 -S clock_settime -k time-change
-a always,exit -F arch=b32 -S clock_settime -k time-change
-w /etc/localtime -p wa -k time-change

# ============================================================
# NETZWERK-KONFIGURATION
# ============================================================
-a always,exit -F arch=b64 -S sethostname -S setdomainname -k system-locale
-a always,exit -F arch=b32 -S sethostname -S setdomainname -k system-locale
-w /etc/issue -p wa -k system-locale
-w /etc/issue.net -p wa -k system-locale
-w /etc/hosts -p wa -k system-locale
-w /etc/hostname -p wa -k system-locale
-w /etc/sysconfig/network -p wa -k system-locale

# ============================================================
# LOGIN/LOGOUT EVENTS
# ============================================================
-w /var/log/faillog -p wa -k logins
-w /var/log/lastlog -p wa -k logins
-w /var/run/faillock/ -p wa -k logins

# ============================================================
# SESSION-ÄNDERUNGEN
# ============================================================
-w /var/run/utmp -p wa -k session
-w /var/log/wtmp -p wa -k session
-w /var/log/btmp -p wa -k session

# ============================================================
# DATEI-LÖSCHUNG
# ============================================================
-a always,exit -F arch=b64 -S unlink -S unlinkat -S rename -S renameat \
    -F auid>=1000 -F auid!=4294967295 -k delete
-a always,exit -F arch=b32 -S unlink -S unlinkat -S rename -S renameat \
    -F auid>=1000 -F auid!=4294967295 -k delete

# ============================================================
# KERNEL MODULE
# ============================================================
-w /sbin/insmod -p x -k modules
-w /sbin/rmmod -p x -k modules
-w /sbin/modprobe -p x -k modules
-a always,exit -F arch=b64 -S init_module -S delete_module \
    -S finit_module -k modules

# ============================================================
# PRIVILEGIERTE BEFEHLE
# ============================================================
-a always,exit -F path=/usr/bin/sudo -F perm=x -F auid>=1000 \
    -F auid!=4294967295 -k privileged_cmd
-a always,exit -F path=/usr/bin/su -F perm=x -F auid>=1000 \
    -F auid!=4294967295 -k privileged_cmd
-a always,exit -F path=/usr/bin/passwd -F perm=x -F auid>=1000 \
    -F auid!=4294967295 -k privileged_cmd

# ============================================================
# CONTAINER-AKTIVITÄTEN
# ============================================================
-w /usr/bin/podman -p x -k container_cmd
-w /usr/bin/buildah -p x -k container_cmd
-w /usr/bin/skopeo -p x -k container_cmd

# ============================================================
# DATEISYSTEM-MOUNTS
# ============================================================
-a always,exit -F arch=b64 -S mount -F auid>=1000 \
    -F auid!=4294967295 -k mounts
-a always,exit -F arch=b32 -S mount -F auid>=1000 \
    -F auid!=4294967295 -k mounts

# ============================================================
# RECHTE-ESKALATION
# ============================================================
-a always,exit -F arch=b64 -S setuid -S setgid -S setreuid \
    -S setregid -S setresuid -S setresgid -k privilege_escalation
-a always,exit -F arch=b32 -S setuid -S setgid -S setreuid \
    -S setregid -S setresuid -S setresgid -k privilege_escalation

# ============================================================
# KONFIGURATION UNVERÄNDERLICH MACHEN (LETZTER EINTRAG!)
# ============================================================
-e 2
EOF

# auditd neu starten
sudo service auditd restart

# Regeln verifizieren
sudo auditctl -l

# Audit-Log-Konfiguration
sudo tee /etc/audit/auditd.conf << 'EOF'
log_file = /var/log/audit/audit.log
log_format = RAW
log_group = root
priority_boost = 4
flush = INCREMENTAL_ASYNC
freq = 50
num_logs = 10
max_log_file = 100
max_log_file_action = ROTATE
space_left = 25%
space_left_action = EMAIL
admin_space_left = 10%
admin_space_left_action = HALT
disk_full_action = HALT
disk_error_action = HALT
action_mail_acct = root
EOF

sudo service auditd restart
```

### 8.2 Audit-Suche und Analyse

```bash
# Nach fehlgeschlagenen Logins suchen
sudo ausearch -m USER_LOGIN --success no -i

# SSH-Key-Änderungen suchen
sudo ausearch -k sshd_config -i

# Sudo-Nutzung anzeigen
sudo ausearch -k privileged_cmd -i

# Container-Aktivitäten anzeigen
sudo ausearch -k container_cmd -i

# Täglichen Audit-Report erstellen
sudo aureport

# Detaillierter Authentication Report
sudo aureport -au

# Summary der letzten 24 Stunden
sudo aureport --summary -ts yesterday
```

---

## 9. Intrusion Detection (AIDE)

### 9.1 AIDE Einrichtung

```bash
# AIDE installieren
sudo dnf install -y aide

# AIDE Konfiguration anpassen
sudo tee /etc/aide.conf.d/99-custom.conf << 'EOF'
# Custom AIDE-Regeln für maximale Sicherheit

# Kritische Systemdateien
/etc      p+u+g+s+m+c+md5+sha256+sha512
/bin      p+u+g+s+m+c+md5+sha256+sha512
/sbin     p+u+g+s+m+c+md5+sha256+sha512
/usr/bin  p+u+g+s+m+c+md5+sha256+sha512
/usr/sbin p+u+g+s+m+c+md5+sha256+sha512
/boot     p+u+g+s+m+c+md5+sha256+sha512
/lib      p+u+g+s+m+c+md5+sha256+sha512
/lib64    p+u+g+s+m+c+md5+sha256+sha512

# SSH-Konfiguration
/etc/ssh  p+u+g+s+m+c+md5+sha256

# Container-Binaries
/usr/bin/podman   p+u+g+s+m+c+md5+sha256
/usr/bin/buildah  p+u+g+s+m+c+md5+sha256

# Ausschlüsse (dynamische Dateien)
!/var/log
!/var/cache
!/var/tmp
!/tmp
!/run
!/proc
!/sys
!/dev
!/var/lib/containers
EOF

# AIDE-Datenbank initialisieren
sudo aide --init

# Datenbank aktivieren
sudo mv /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz

# Ersten Check ausführen
sudo aide --check
```

### 9.2 AIDE Automatisierung

```bash
# Täglicher AIDE-Check via Cron
sudo tee /usr/local/bin/aide-daily-check.sh << 'SCRIPT'
#!/bin/bash
# AIDE Daily Integrity Check

REPORT="/var/log/aide/aide-report-$(date +%Y%m%d).log"
MAIL_TO="security@example.com"

mkdir -p /var/log/aide

echo "AIDE Integrity Check Report" > "$REPORT"
echo "Date: $(date)" >> "$REPORT"
echo "Hostname: $(hostname)" >> "$REPORT"
echo "================================" >> "$REPORT"

/usr/sbin/aide --check >> "$REPORT" 2>&1
RESULT=$?

if [ $RESULT -ne 0 ]; then
    echo "ALERT: AIDE detected changes!" >> "$REPORT"
    # Mail-Benachrichtigung bei Änderungen
    mail -s "[ALERT] AIDE Integrity Check Failed - $(hostname)" \
        "$MAIL_TO" < "$REPORT"
fi

# Alte Reports aufräumen (90 Tage behalten)
find /var/log/aide -name "aide-report-*.log" -mtime +90 -delete
SCRIPT

sudo chmod 700 /usr/local/bin/aide-daily-check.sh
echo "0 4 * * * /usr/local/bin/aide-daily-check.sh" | sudo crontab -
```

---

## 10. OpenSCAP Compliance

### 10.1 OpenSCAP Setup

```bash
# OpenSCAP installieren
sudo dnf install -y openscap-scanner scap-security-guide

# Verfügbare Profile anzeigen
oscap info /usr/share/xml/scap/ssg/content/ssg-rl9-ds.xml

# CIS Benchmark Scan durchführen
sudo oscap xccdf eval \
    --profile xccdf_org.ssgproject.content_profile_cis \
    --results /root/openscap-cis-results.xml \
    --report /root/openscap-cis-report.html \
    /usr/share/xml/scap/ssg/content/ssg-rl9-ds.xml

# DISA STIG Scan
sudo oscap xccdf eval \
    --profile xccdf_org.ssgproject.content_profile_stig \
    --results /root/openscap-stig-results.xml \
    --report /root/openscap-stig-report.html \
    /usr/share/xml/scap/ssg/content/ssg-rl9-ds.xml
```

### 10.2 Automatische Remediation

```bash
# Remediation-Script generieren
sudo oscap xccdf generate fix \
    --profile xccdf_org.ssgproject.content_profile_cis \
    --fix-type bash \
    --output /root/cis-remediation.sh \
    /usr/share/xml/scap/ssg/content/ssg-rl9-ds.xml

# Script prüfen (NICHT blind ausführen!)
less /root/cis-remediation.sh

# Ansible Playbook für Remediation generieren
sudo oscap xccdf generate fix \
    --profile xccdf_org.ssgproject.content_profile_cis \
    --fix-type ansible \
    --output /root/cis-remediation.yml \
    /usr/share/xml/scap/ssg/content/ssg-rl9-ds.xml
```

---

## 11. Automatic Security Updates

### 11.1 DNF Automatic

```bash
# Konfiguration (bereits in Abschnitt 2.2 erstellt)
# Timer-basierte automatische Updates

# Überprüfen ob Timer aktiv ist
systemctl list-timers dnf-automatic*

# Manueller Test
sudo dnf-automatic
```

### 11.2 Security Advisory Monitoring

```bash
# Monitoring-Script für Sicherheits-Advisories
sudo tee /usr/local/bin/security-advisory-check.sh << 'SCRIPT'
#!/bin/bash
# Prüft auf neue Sicherheits-Advisories

MAIL_TO="security@example.com"
DATE=$(date +%Y%m%d)

# Sicherheits-Updates prüfen
UPDATES=$(dnf updateinfo list security 2>/dev/null)

if [ -n "$UPDATES" ]; then
    echo "Security Advisories for $(hostname) - $DATE" > /tmp/sec-advisory.txt
    echo "==========================================" >> /tmp/sec-advisory.txt
    echo "$UPDATES" >> /tmp/sec-advisory.txt
    
    # CVE Details
    echo "" >> /tmp/sec-advisory.txt
    echo "CVE Details:" >> /tmp/sec-advisory.txt
    dnf updateinfo info security 2>/dev/null >> /tmp/sec-advisory.txt
    
    mail -s "[SECURITY] Updates available - $(hostname)" \
        "$MAIL_TO" < /tmp/sec-advisory.txt
    rm -f /tmp/sec-advisory.txt
fi
SCRIPT

sudo chmod 700 /usr/local/bin/security-advisory-check.sh

# Täglich um 6:00 Uhr prüfen
echo "0 6 * * * /usr/local/bin/security-advisory-check.sh" | sudo crontab -
```

---

## 12. Service Hardening

### 12.1 Systemd Service Hardening

```bash
# Beispiel: Gehärteter systemd Service für eine Anwendung
sudo tee /etc/systemd/system/myapp.service << 'EOF'
[Unit]
Description=My Secure Application
After=network.target

[Service]
Type=simple
User=myapp
Group=myapp
ExecStart=/opt/myapp/myapp

# ============================================================
# SICHERHEITS-HÄRTUNG
# ============================================================

# Dateisystem
ProtectHome=yes
ProtectSystem=strict
ReadWritePaths=/opt/myapp/data /var/log/myapp
PrivateTmp=yes
NoNewPrivileges=yes

# Netzwerk
PrivateDevices=yes
RestrictAddressFamilies=AF_INET AF_INET6

# Kernel
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectKernelLogs=yes
ProtectControlGroups=yes
ProtectClock=yes
ProtectHostname=yes

# Capabilities entfernen
CapabilityBoundingSet=
AmbientCapabilities=

# Syscalls einschränken
SystemCallFilter=@system-service
SystemCallArchitectures=native

# Memory
MemoryDenyWriteExecute=yes
LockPersonality=yes
RestrictRealtime=yes
RestrictSUIDSGID=yes

# Resource Limits
LimitNOFILE=65535
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
```

### 12.2 Chronyd (NTP) Hardening

```bash
# Sichere NTP-Konfiguration
sudo tee /etc/chrony.conf << 'EOF'
# NTP-Server (mehrere für Redundanz)
server 0.rocky.pool.ntp.org iburst
server 1.rocky.pool.ntp.org iburst
server 2.rocky.pool.ntp.org iburst
server 3.rocky.pool.ntp.org iburst

# Drift-Datei
driftfile /var/lib/chrony/drift

# System-Uhr beim Start synchronisieren
makestep 1.0 3

# Kernel-Synchronisation
rtcsync

# Log-Verzeichnis
logdir /var/log/chrony
log measurements statistics tracking

# Zugriff einschränken
deny all
allow 127.0.0.1
allow ::1

# Key-Authentifizierung für NTP
keyfile /etc/chrony.keys
EOF

sudo systemctl restart chronyd
```

---

## Verifizierung

```bash
# Gesamte Härtung verifizieren - Schnelltest
echo "=== System Security Verification ==="
echo ""
echo "1. SELinux Status:"
getenforce
echo ""
echo "2. Firewall Status:"
sudo firewall-cmd --state
echo ""
echo "3. SSH Konfiguration:"
sudo sshd -T | grep -E "permitrootlogin|passwordauthentication|pubkeyauthentication|port"
echo ""
echo "4. Fail2Ban Status:"
sudo fail2ban-client status 2>/dev/null || echo "Fail2Ban nicht installiert"
echo ""
echo "5. auditd Status:"
sudo systemctl is-active auditd
echo ""
echo "6. AIDE Status:"
sudo aide --check 2>/dev/null | head -5 || echo "AIDE nicht initialisiert"
echo ""
echo "7. Kernel Hardening:"
sysctl kernel.kptr_restrict kernel.dmesg_restrict kernel.yama.ptrace_scope
echo ""
echo "8. Offene Ports:"
sudo ss -tulnp | grep LISTEN
echo ""
echo "9. SUID Files:"
find /usr -perm /4000 -type f 2>/dev/null | wc -l
echo ""
echo "10. World-Writable Files:"
find / -xdev -type f -perm -0002 2>/dev/null | wc -l
```

---

## Weiterführende Dokumente

| Nächstes Dokument | Thema |
|-------------------|-------|
| [03 — Network & Firewall Security](03-network-firewall-security.md) | Netzwerksicherheit |
| [04 — Container Security](04-container-security-podman.md) | Podman-Härtung |
| [10 — Monitoring & Incident Response](10-monitoring-logging-incident-response.md) | Überwachung |
