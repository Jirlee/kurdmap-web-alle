# راهنمای کامل استقرار سرور — KurdMap

> تاریخ: ۲۰ فروردین ۱۴۰۵ (۹ آوریل ۲۰۲۶)  
> هدف: راه‌اندازی KurdMap از صفر روی سرور Hetzner (Rocky Linux + Podman + Caddy)  
> **هر پروژه کاملاً مستقل است — هیچ پروژه‌ای روی پروژه دیگر تأثیر نمی‌گذارد**

---

## فهرست

1. [معماری سرور](#1-معماری-سرور)
2. [قانون طلایی: استقلال پروژه‌ها](#2-قانون-طلایی-استقلال-پروژه‌ها)
3. [ساختار فایل‌ها روی سرور](#3-ساختار-فایل‌ها-روی-سرور)
4. [مرحله ۱: آماده‌سازی دایرکتوری](#4-مرحله-۱-آماده‌سازی-دایرکتوری)
5. [مرحله ۲: ساخت env.](#5-مرحله-۲-ساخت-env)
6. [مرحله ۳: اولین اجرای CI/CD](#6-مرحله-۳-اولین-اجرای-cicd)
7. [مرحله ۴: بالا آوردن KurdMap](#7-مرحله-۴-بالا-آوردن-kurdmap)
8. [مرحله ۵: تنظیم DNS](#8-مرحله-۵-تنظیم-dns)
9. [مرحله ۶: اتصال Caddy](#9-مرحله-۶-اتصال-caddy)
10. [مرحله ۷: تأیید نهایی](#10-مرحله-۷-تأیید-نهایی)
11. [مرحله ۸: Backup](#11-مرحله-۸-backup)
12. [دستورات مفید](#12-دستورات-مفید)
13. [عیب‌یابی](#13-عیب‌یابی)
14. [هر فایل چه کاری انجام می‌دهد](#14-هر-فایل-چه-کاری-انجام-می‌دهد)

---

## 1. معماری سرور

```
سرور Hetzner (Rocky Linux)
│
├── Caddy (systemd روی هاست — مشترک بین همه پروژه‌ها)
│   ├── /etc/caddy/Caddyfile          ← فایل اصلی Caddy
│   ├── import /opt/kozad/Caddyfile*  ← Kozad
│   ├── import /opt/jirlee/Caddyfile* ← Jirlee
│   └── import /opt/kurdmap/docker/Caddyfile* ← KurdMap
│
├── /opt/kozad/      ← پروژه Kozad (کاملاً مستقل)
├── /opt/jirlee/     ← پروژه Jirlee (کاملاً مستقل)
└── /opt/kurdmap/    ← پروژه KurdMap (کاملاً مستقل)
```

**پورت‌های هر پروژه:**

| پروژه | Web | API | Admin | DB Port |
|--------|-----|-----|-------|---------|
| **Kozad** | `:8080` | `:8081` | `:8082` | بسته |
| **Jirlee** | `:4200` | `:5082` | `:5050` | `127.0.0.1:5432` |
| **KurdMap** | `:4000` | `:8080` ⚠️ | `:8081` ⚠️ | بسته |

> **⚠️ تداخل پورت:** KurdMap API (`:8080`) و Admin (`:8081`) با Kozad تداخل دارد!  
> اگر KurdMap و Kozad همزمان بالا باشند، پورت‌های KurdMap را در `.env` تغییر دهید.

---

## 2. قانون طلایی: استقلال پروژه‌ها

### مشکلی که پیش آمد

وقتی `import /opt/kurdmap/docker/Caddyfile` (بدون ستاره) به Caddy اضافه شد ولی فایل روی سرور وجود نداشت:
- **Caddy کرش کرد**
- **تمام سایت‌ها** (Kozad + Jirlee + KurdMap) خاموش شدند
- یک پروژه باعث خرابی همه پروژه‌ها شد

### راه‌حل: Glob Import (ستاره *)

```caddy
# ❌ خطرناک — اگر فایل نباشد Caddy کرش می‌کند:
import /opt/kurdmap/docker/Caddyfile

# ✅ ایمن — اگر فایل نباشد نادیده می‌گیرد:
import /opt/kurdmap/docker/Caddyfile*
```

**ستاره (`*`) در آخر مسیر** باعث می‌شود Caddy از glob pattern استفاده کند:
- اگر فایل وجود داشته باشد → لود می‌شود ✅
- اگر فایل وجود نداشته باشد → نادیده گرفته می‌شود ✅
- **هیچ پروژه‌ای نمی‌تواند Caddy را کرش کند** ✅

### قوانین استقلال

| قانون | توضیح |
|-------|--------|
| هر پروژه دایرکتوری جدا دارد | `/opt/kurdmap/`, `/opt/jirlee/`, `/opt/kozad/` |
| هر پروژه Compose مجزا دارد | هر کدام `podman compose` خودش — بدون اشتراک |
| هر پروژه `.env` مجزا دارد | هیچ secret مشترکی بین پروژه‌ها نیست |
| Caddy از glob import استفاده می‌کند | `import /opt/X/Caddyfile*` — کرش نمی‌کند |
| CI/CD هرگز Caddy را restart نمی‌کند | فقط فایل‌ها SCP می‌شوند — Caddy دست نمی‌خورد |
| پورت‌ها تداخل ندارند | هر پروژه پورت‌های منحصر به فرد دارد |

---

## 3. ساختار فایل‌ها روی سرور

```
/opt/kurdmap/                        ← ریشه پروژه
├── .env                             ← رمزها (دستی — یکبار ساخته می‌شود)
├── .env.example                     ← الگو (از CI/CD)
├── docker-compose.yml               ← تنظیمات اصلی (از CI/CD)
├── docker-compose.prod.yml          ← تنظیمات امنیتی production (از CI/CD)
└── docker/
    ├── Caddyfile                    ← تنظیمات Caddy برای KurdMap (از CI/CD)
    ├── backup.sh                    ← اسکریپت پشتیبان‌گیری (از CI/CD)
    └── seed-data.sql                ← داده اولیه (از CI/CD)
```

> **هیچ Dockerfile، سورس‌کد، یا `.git` روی سرور نیست.**  
> ایمیج‌ها از GHCR پول می‌شوند. فایل‌ها با SCP از CI/CD می‌آیند.

---

## 4. مرحله ۱: آماده‌سازی دایرکتوری

```bash
# 1. ساخت دایرکتوری
sudo mkdir -p /opt/kurdmap/docker
sudo chown -R kozad_deploy:kozad_deploy /opt/kurdmap

# 2. اجازه خواندن برای Caddy (که با USER=caddy اجرا می‌شود)
chmod o+rx /opt/kurdmap /opt/kurdmap/docker
```

**چرا `chmod o+rx`؟**  
Caddy به عنوان یوزر `caddy` اجرا می‌شود، نه `kozad_deploy`. بدون این اجازه، Caddy نمی‌تواند Caddyfile را بخواند.

---

## 5. مرحله ۲: ساخت .env

```bash
cd /opt/kurdmap

# 1. کپی از الگو (بعد از اولین CI/CD) یا دستی بسازید:
cat > .env << 'EOF'
# ── General ──
ENVIRONMENT=Production
GHCR_USERNAME=nestcodegit

# ── PostgreSQL ──
POSTGRES_DB=kurdmap
POSTGRES_USER=kurdmap_user
POSTGRES_PASSWORD=CHANGE_ME

# ── Redis ──
REDIS_PASSWORD=CHANGE_ME

# ── JWT ──
JWT_SECRET=CHANGE_ME
JWT_ISSUER=https://gs6xapi.kurdmap.eu
JWT_AUDIENCE=https://kurdmap.de

# ── URLs ──
FRONTEND_URL=https://kurdmap.de
ADMIN_URL=https://admin.kurdmap.de
API_DOMAIN=gs6xapi.kurdmap.eu

# ── Ports (تنظیم کنید اگر با پورت‌های فعلی تداخل دارد) ──
API_PORT=8080
EOF

# 2. رمزهای قوی تولید کنید
sed -i "s|JWT_SECRET=CHANGE_ME|JWT_SECRET=$(openssl rand -base64 48)|" .env
sed -i "s|POSTGRES_PASSWORD=CHANGE_ME|POSTGRES_PASSWORD=$(openssl rand -base64 32)|" .env
sed -i "s|REDIS_PASSWORD=CHANGE_ME|REDIS_PASSWORD=$(openssl rand -base64 32)|" .env

# 3. بررسی نتیجه
cat .env
```

> **مهم:** فایل `.env` هرگز توسط CI/CD بازنویسی نمی‌شود. فقط یکبار دستی ساخته می‌شود.

---

## 6. مرحله ۳: اولین اجرای CI/CD

پس از push به `main` در GitHub:

1. **build-and-test** → بیلد + تست‌ها
2. **security-scan** → Trivy اسکن ایمیج‌ها
3. **push-images** → ایمیج‌ها به GHCR
4. **deploy** → SCP فایل‌ها + SSH ← `podman compose up`

CI/CD فایل‌های زیر را SCP می‌کند:
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `docker/Caddyfile`
- `docker/backup.sh`
- `docker/seed-data.sql`
- `.env.example`

> **اگر `.env` وجود نداشته باشد** → deploy با خطای واضح متوقف می‌شود:  
> `❌ .env file not found! First deploy? Run: cp .env.example .env && nano .env`

---

## 7. مرحله ۴: بالا آوردن KurdMap

### اگر CI/CD خودکار اجرا شده:

CI/CD خودش `podman compose up -d` را اجرا می‌کند. فقط بررسی کنید:

```bash
cd /opt/kurdmap
podman compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### اگر می‌خواهید دستی اجرا کنید:

```bash
cd /opt/kurdmap

# 1. لاگین به GHCR
echo "YOUR_TOKEN" | podman login ghcr.io -u nestcodegit --password-stdin

# 2. پول ایمیج‌ها
podman pull ghcr.io/nestcodegit/kurdmap-api:latest
podman pull ghcr.io/nestcodegit/kurdmap-admin:latest
podman pull ghcr.io/nestcodegit/kurdmap-frontend:latest

# 3. اجرا
podman compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build

# 4. بررسی
podman compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

**نتیجه مورد انتظار:**

```
NAME               STATUS              PORTS
kurdmap-postgres   Up (healthy)        5432/tcp
kurdmap-redis      Up (healthy)        6379/tcp
kurdmap-api        Up (healthy)        127.0.0.1:8080->8080/tcp
kurdmap-admin      Up (healthy)        127.0.0.1:8081->8081/tcp
kurdmap-frontend   Up (healthy)        127.0.0.1:4000->4000/tcp
```

### تست مستقیم (بدون Caddy/DNS):

```bash
# API
curl -f http://localhost:8080/health
# باید برگرداند: Healthy

# Frontend
curl -sf -o /dev/null -w "%{http_code}" http://localhost:4000
# باید برگرداند: 200

# Admin
curl -sf -o /dev/null -w "%{http_code}" http://localhost:8081
# باید برگرداند: 200
```

---

## 8. مرحله ۵: تنظیم DNS

در پنل مدیریت دامنه (Cloudflare، INWX، یا هر provider):

| نوع | نام | مقدار | Proxy |
|-----|------|-------|-------|
| A | `kurdmap.de` | `<IP سرور>` | خاموش (DNS only) |
| A | `admin.kurdmap.de` | `<IP سرور>` | خاموش |
| A | `gs6xapi.kurdmap.eu` | `<IP سرور>` | خاموش |
| CNAME | `www.kurdmap.de` | `kurdmap.de` | خاموش |

> **مهم:** اگر از Cloudflare استفاده می‌کنید، Proxy را خاموش کنید (DNS Only).  
> Caddy خودش SSL می‌گیرد — اگر Cloudflare Proxy فعال باشد، TLS تداخل می‌کند.

### تست DNS:

```bash
dig +short kurdmap.de
dig +short admin.kurdmap.de
dig +short gs6xapi.kurdmap.eu
# هر سه باید IP سرور را برگردانند
```

---

## 9. مرحله ۶: اتصال Caddy

### ۶.۱ — اضافه کردن import (فقط یکبار)

```bash
# 1. Caddyfile اصلی هاست را ویرایش کنید
sudo nano /etc/caddy/Caddyfile

# 2. در انتهای فایل اضافه کنید:
# ── KurdMap ──
import /opt/kurdmap/docker/Caddyfile*
```

> **حتماً با ستاره `*` باشد!** بدون ستاره، اگر فایل حذف شود Caddy کرش می‌کند.

### ۶.۲ — اطمینان از اجازه خواندن

```bash
chmod o+rx /opt/kurdmap /opt/kurdmap/docker
chmod 644 /opt/kurdmap/docker/Caddyfile
```

### ۶.۳ — تست و اعمال تغییرات

```bash
# اول تست کنید (بدون اعمال)
sudo caddy validate --config /etc/caddy/Caddyfile

# اگر Valid configuration بود:
sudo systemctl restart caddy

# بررسی
sudo systemctl status caddy --no-pager
```

### ۶.۴ — تست HTTPS (۱-۲ دقیقه صبر کنید تا Caddy certificate بگیرد)

```bash
curl -f https://gs6xapi.kurdmap.eu/health
curl -f https://kurdmap.de
curl -f https://admin.kurdmap.de
```

---

## 10. مرحله ۷: تأیید نهایی

```bash
# 1. همه سایت‌ها کار می‌کنند؟
curl -sf -o /dev/null -w "KurdMap API: %{http_code}\n" https://gs6xapi.kurdmap.eu/health
curl -sf -o /dev/null -w "KurdMap Web: %{http_code}\n" https://kurdmap.de
curl -sf -o /dev/null -w "KurdMap Admin: %{http_code}\n" https://admin.kurdmap.de

# 2. سایت‌های دیگر هم کار می‌کنند؟ (استقلال پروژه)
curl -sf -o /dev/null -w "Kozad: %{http_code}\n" https://kozad.net
curl -sf -o /dev/null -w "Jirlee: %{http_code}\n" https://jirlee.com

# 3. TLS درست est?
curl -sI https://gs6xapi.kurdmap.eu | grep -i "strict-transport"
# باید برگرداند: strict-transport-security: max-age=63072000...
```

---

## 11. مرحله ۸: Backup

```bash
# 1. تست Backup
cd /opt/kurdmap
chmod +x docker/backup.sh
./docker/backup.sh

# 2. Cron روزانه (ساعت ۳ شب)
crontab -e
# اضافه کنید:
0 3 * * * /opt/kurdmap/docker/backup.sh >> /var/log/kurdmap-backup.log 2>&1
```

---

## 12. دستورات مفید

### مدیریت KurdMap

```bash
cd /opt/kurdmap

# بالا آوردن
podman compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build

# متوقف کردن
podman compose -f docker-compose.yml -f docker-compose.prod.yml down

# لاگ‌ها
podman compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api

# وضعیت
podman compose -f docker-compose.yml -f docker-compose.prod.yml ps

# ری‌استارت یک سرویس
podman compose -f docker-compose.yml -f docker-compose.prod.yml restart api

# Seed دیتابیس
podman compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  psql -U kurdmap_user -d kurdmap < docker/seed-data.sql
```

### مدیریت Caddy (مشترک)

```bash
# وضعیت
sudo systemctl status caddy

# تست config (بدون اعمال)
sudo caddy validate --config /etc/caddy/Caddyfile

# اعمال تغییرات
sudo systemctl restart caddy

# لاگ‌ها
sudo tail -f /var/log/caddy/caddy.log
sudo tail -f /var/log/caddy/kurdmap-api.log
```

---

## 13. عیب‌یابی

### مشکل: API برمی‌گرداند 400 Bad Request

**علت:** ASP.NET Core فقط دامنه‌های مشخص را قبول می‌کند.

**بررسی:**
```bash
curl -v http://localhost:8080/health 2>&1 | grep "Bad Request"
```

**حل:** `AllowedHosts` در `docker-compose.prod.yml` باید شامل `localhost` باشد:
```yaml
AllowedHosts: "${API_DOMAIN:-gs6xapi.kurdmap.eu};kurdmap-api;localhost"
```

### مشکل: Admin health check stuck on (starting)

**علت:** `nginx:alpine` از BusyBox wget استفاده می‌کند که فلگ‌های `--no-verbose` و `--tries=N` را نمی‌شناسد.

**حل:** Docker Compose health check با `-q --spider`:
```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -q --spider http://localhost:8081/ || exit 1"]
```

### مشکل: Caddy کرش کرد و همه سایت‌ها خاموش شدند

**علت:** `import /path/to/missing/file` بدون glob → Caddy خطا می‌دهد و بالا نمی‌آید.

**حل فوری:**
```bash
# 1. فایل Caddyfile اصلی را ویرایش کنید
sudo nano /etc/caddy/Caddyfile

# 2. import خطادار را حذف یا ستاره اضافه کنید:
#    import /opt/kurdmap/docker/Caddyfile*

# 3. ری‌استارت
sudo systemctl start caddy
```

**جلوگیری:** همیشه `*` در آخر import:
```caddy
import /opt/kurdmap/docker/Caddyfile*   ← ایمن
import /opt/jirlee/Caddyfile*           ← ایمن
```

### مشکل: Caddy can't rename log file: permission denied

**علت:** فایل‌های لاگ قبلاً با یوزر دیگری ساخته شده‌اند.

**حل:**
```bash
sudo chown -R caddy:caddy /var/log/caddy/
sudo systemctl restart caddy
```

### مشکل: Caddy reload connection refused

**علت:** `admin off` در global options Caddy → Admin API (port 2019) غیرفعال است. `reload` به Admin API نیاز دارد.

**حل:** از `restart` به جای `reload` استفاده کنید:
```bash
sudo systemctl restart caddy    # ✅ کار می‌کند
# sudo systemctl reload caddy   # ❌ ارور می‌دهد
```

### مشکل: Redis container Exited (1)

**علت:** `cap_drop: ALL` + `no-new-privileges:true` باعث می‌شود `gosu` (setuid binary) کار نکند.

**حل:** `user: "999:999"` در `docker-compose.prod.yml` → Redis مستقیماً با یوزر redis اجرا می‌شود، بدون gosu.

### مشکل: تداخل پورت با Kozad

**علت:** KurdMap API=`:8080` و Kozad Web=`:8080` هر دو روی یک پورت هستند.

**حل:** در `.env` پورت API را تغییر دهید و `docker-compose.yml` از `API_PORT` استفاده می‌کند:
```bash
# .env
API_PORT=9080
```

---

## 14. هر فایل چه کاری انجام می‌دهد

### docker-compose.yml — فایل اصلی

**چه کاری می‌کند:** ۵ سرویس را تعریف می‌کند + شبکه‌ها + volume ها

| سرویس | ایمیج | پورت | شبکه | وظیفه |
|--------|--------|------|------|-------|
| `postgres` | `postgres:17-alpine` | بسته | backend-net | دیتابیس |
| `redis` | `redis:7-alpine` | بسته | backend-net | کش + سشن |
| `api` | `kurdmap-api` | `127.0.0.1:8080` | هر دو | .NET 10 API |
| `admin` | `kurdmap-admin` | `127.0.0.1:8081` | frontend-net | Angular SPA + Nginx |
| `frontend` | `kurdmap-frontend` | `127.0.0.1:4000` | frontend-net | Angular SSR + Node |

**شبکه‌ها:**
- `frontend-net` (bridge): API + Admin + Frontend → قابل دسترسی از `127.0.0.1` (Caddy)
- `backend-net` (internal): API + PostgreSQL + Redis → **بدون دسترسی به اینترنت**

### docker-compose.prod.yml — تنظیمات امنیتی

**چه کاری می‌کند:** ایمیج‌های GHCR + ۸ لایه امنیتی

| لایه | تنظیم | توضیح |
|------|--------|--------|
| 0 | Rootless Podman | بدون root daemon |
| 1 | شبکه دوگانه | DB/Redis ایزوله |
| 2 | `read_only: true` | فایل‌سیستم فقط-خواندنی |
| 3 | `cap_drop: ALL` | حذف همه capability ها |
| 4 | `no-new-privileges` | جلوگیری از setuid |
| 5 | `memory/cpu/pids limit` | جلوگیری از DoS |
| 6 | `127.0.0.1` binding | فقط Caddy دسترسی دارد |
| 7 | `internal: true` | DB/Redis بدون اینترنت |

### docker/Caddyfile — تنظیمات reverse proxy

**چه کاری می‌کند:** ۳ دامنه را به ۳ سرویس وصل می‌کند + Auto TLS

```
kurdmap.de         → localhost:4000 (Frontend SSR)
admin.kurdmap.de   → localhost:8081 (Admin Nginx)
gs6xapi.kurdmap.eu     → localhost:8080 (API .NET)
```

**ویژگی‌ها:**
- Auto TLS (Let's Encrypt) — بدون certbot
- Security Headers (HSTS, X-Frame-Options, CSP, ...)
- Gzip + Zstd compression
- www → non-www redirect

### docker/backup.sh — پشتیبان‌گیری

**چه کاری می‌کند:** `pg_dump` + gzip + نگهداری ۳۰ روز

### .env — متغیرهای محیطی

**چه کاری می‌کند:** رمزها و URLها — فقط روی سرور، هرگز در Git

### deploy.yml — CI/CD خودکار

**چه کاری می‌کند:** وقتی کد push می‌شود:

```
1. Build & Test     → dotnet test + ng test + ng build
2. Security Scan    → Trivy (آسیب‌پذیری ایمیج‌ها)
3. Push Images      → GHCR (api, admin, frontend)
4. Deploy           → SCP فایل‌ها + SSH → podman compose up
```

**چه کاری نمی‌کند:**
- ❌ Caddy را restart نمی‌کند (استقلال پروژه)
- ❌ `.env` را تغییر نمی‌دهد
- ❌ سورس‌کد به سرور نمی‌فرستد

---

## خلاصه (Quick Start)

```bash
# ═══ روی سرور — فقط یکبار ═══

# 1. دایرکتوری
sudo mkdir -p /opt/kurdmap/docker
sudo chown -R kozad_deploy:kozad_deploy /opt/kurdmap
chmod o+rx /opt/kurdmap /opt/kurdmap/docker

# 2. ساخت .env
cd /opt/kurdmap
nano .env    # رمزهای قوی تنظیم کنید

# 3. اضافه کردن import به Caddy (با ستاره!)
sudo nano /etc/caddy/Caddyfile
# اضافه کنید: import /opt/kurdmap/docker/Caddyfile*

# ═══ Push to main → CI/CD خودکار ═══

# 4. بعد از Deploy موفق → Caddy را یکبار restart کنید
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl restart caddy

# 5. تأیید
curl -f https://gs6xapi.kurdmap.eu/health
curl -f https://kurdmap.de
curl -f https://admin.kurdmap.de
```
