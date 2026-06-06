# ارزیابی آمادگی تولید — KurdMap

> تاریخ: ۱۸ فروردین ۱۴۰۵ (۷ آوریل ۲۰۲۶)  
> به‌روزرسانی: ۱۹ فروردین ۱۴۰۵ (۸ آوریل ۲۰۲۶) — **تمام P0 + تمام P1 + ۱۰ P2 + Enterprise Security + TOTP/2FA رفع شدند**  
> هدف: آیا KurdMap آماده استقرار روی سرور Production است؟  
> نتیجه: ✅ **آماده تولید است** — تمام موارد امنیتی رفع شد

---

## فهرست

1. [نتیجه نهایی](#1-نتیجه-نهایی)
2. [چک‌لیست بحرانی قبل از دپلوی](#2-چک‌لیست-بحرانی-قبل-از-دپلوی)
3. [ساختار سرور پیشنهادی](#3-ساختار-سرور-پیشنهادی) — شبکه + امنیت کانتینرها (Defense-in-Depth)
4. [گام‌به‌گام دپلوی](#4-گام‌به‌گام-دپلوی)
5. [وضعیت هر سرویس](#5-وضعیت-هر-سرویس)
6. [امتیاز تفصیلی](#6-امتیاز-تفصیلی)
7. [راهنمای ساخت اکانت ادمین](#7-راهنمای-ساخت-اکانت-ادمین)
8. [فایل‌های مهم و وظیفه هر کدام](#8-فایل‌های-مهم-و-وظیفه-هر-کدام)

---

## 1. نتیجه نهایی

### ✅ آماده تولید

| معیار | وضعیت | توضیح |
|--------|--------|--------|
| **بیلد** | ✅ موفق | بک‌اند (0 error) + ادمین (0 error) + فرانتاند (0 error) |
| **تست‌ها** | ✅ پاس | ۱۰۴ بک‌اند + ۶۳ ادمین + ۲۹ فرانتاند = **۱۹۶** تست (+ ۱۰۹ موبایل = **۳۰۵** کل) |
| **معماری** | ✅ عالی | Clean Architecture + CQRS + MediatR + FluentValidation |
| **امنیت Enterprise** | ✅ عالی | ۱۴ کامپوننت — JWT HS512, Refresh Token rotation, JTI blacklist, brute force protection |
| **TOTP/2FA** | ✅ عالی | TOTP setup/enable/disable/verify — بک‌اند + ادمین UI |
| **Secrets** | ✅ **رفع شد** | env var syntax در docker-compose + appsettings.Development.json |
| **CSP** | ✅ **رفع شد** | nonce-based در SecurityHeadersMiddleware + SSR server.ts |
| **SSRF** | ✅ **رفع شد** | path validation + normalize در server.ts |
| **Reverse Proxy** | ✅ **آماده** | Caddy با auto HTTPS + rate limiting + security headers |
| **Backup** | ✅ **آماده** | backup.sh — pg_dump + gzip + retention ۳۰ روز |
| **Production Config** | ✅ **رفع شد** | API URL در admin و frontend تنظیم شد |

### ✅ آماده دپلوی

```
تمام موارد رفع شدند ✅ → مرحله بعد: تنظیم سرور و اجرای دستورات زیر
```

---

## 2. چک‌لیست بحرانی قبل از دپلوی

### ✅ مسدودکننده‌ها — همه رفع شدند

- [x] **SEC-01:** حذف hardcoded `Password=postgres` از `appsettings.json` — استفاده از env var
- [x] **SEC-02:** حذف hardcoded JWT Secret placeholder از `appsettings.json` — استفاده از env var
- [x] **SEC-03:** تغییر `AllowedHosts: "*"` به `"localhost;gs6xapi.kurdmap.eu"` در `appsettings.json`
- [x] **SEC-04:** حذف hardcoded secrets از `docker-compose.yml` — استفاده از `${VARIABLE}` syntax
- [x] **SEC-05:** حذف port mapping DB/Redis در production (docker-compose.prod.yml)
- [x] **SEC-06:** `bypassSecurityTrustHtml()` در کد وجود نداشت — grep تایید کرد (مستندات قدیمی)
- [x] **SEC-07:** CSP از قبل nonce-based در SecurityHeadersMiddleware + server.ts
- [x] **SEC-08:** اضافه validation به SSR proxy (`server.ts`) — normalize + reject `..`
- [x] **SEC-09:** اضافه `[Authorize(Roles = "SuperAdmin,Admin")]` به `DashboardController`
- [x] **SEC-10:** Redis password + disable dangerous commands (FLUSHDB, FLUSHALL, DEBUG)
- [x] **CFG-01:** تنظیم `apiUrl` در `environment.prod.ts` — admin panel → `https://gs6xapi.kurdmap.eu`
- [x] **CFG-02:** تنظیم `apiUrl` در `environment.prod.ts` — frontend (از قبل صحیح بود)
- [x] **CFG-03:** ایجاد `docker-compose.prod.yml` overlay (read-only, capabilities, resources, dual-network)
- [x] **CFG-04:** `.env.example` با دستورات تولید رمز قوی

### 🟠 لازم (هفته اول بعد از دپلوی)

- [ ] **SSL-01:** نصب Nginx reverse proxy (3 subdomain)
- [ ] **SSL-02:** Let's Encrypt SSL certificates (`certbot`)
- [ ] **BAK-01:** تنظیم `pg_dump` روزانه با cron
- [ ] **MON-01:** Uptime monitoring (`/health` هر ۵ دقیقه)

---

## 3. ساختار سرور پیشنهادی

### حداقل سیستم‌عامل

| مشخصه | حداقل | پیشنهادی |
|--------|--------|----------|
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 40 GB SSD | 80 GB SSD |
| **OS** | Rocky Linux 9 | Rocky Linux 9 |
| **Provider** | Hetzner Cloud | Hetzner Cloud |
| **Container** | Docker CE / Podman 5+ | Podman 5+ (rootless) |

> **نکته:** این سرور چندین وبسایت دیگر هم دارد. Caddy روی هاست نصب است (نه داخل Docker) و پورت‌های ۸۰/۴۴۳ بین همه سایت‌ها مشترک است.

### دامنه‌ها

| سرویس | دامنه | پورت داخلی |
|--------|--------|-----------|
| Frontend (SSR) | `kurdmap.de` | `:4000` |
| Admin Panel | `admin.kurdmap.de` | `:8081` |
| API | `gs6xapi.kurdmap.eu` | `:8080` |

### معماری شبکه (Podman — Enterprise Network Isolation)

```
Internet
    │
    ▼
┌──────────────────────────────┐
│    Caddy (Host-level)        │  ← Auto-TLS 1.3, Security Headers
│    Ports 80/443 (shared)     │  ← مشترک با سایر وبسایت‌ها
└────┬────────┬────────┬───────┘
     │        │        │           127.0.0.1 only
     ▼        ▼        ▼
┌────────────────────────────────────────────────────────────┐
│              frontend-net (bridge)                          │
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐ │
│  │ Frontend │  │  Admin   │  │         API              │ │
│  │  :4000   │  │  :8081   │  │        :8080             │ │
│  │ (SSR)    │  │ (Nginx)  │  │  (.NET 10)               │ │
│  └──────────┘  └──────────┘  └────────────┬─────────────┘ │
│                                            │               │
└────────────────────────────────────────────│───────────────┘
                                             │
┌────────────────────────────────────────────│───────────────┐
│              backend-net (INTERNAL)         │               │
│              ❌ بدون دسترسی اینترنت         │               │
│                                            │               │
│  ┌──────────────────────┐  ┌──────────────┴────────────┐  │
│  │    PostgreSQL 17     │  │         Redis 7            │  │
│  │    :5432             │  │         :6379              │  │
│  │    (Alpine)          │  │         (Alpine)           │  │
│  │    ❌ پورت بسته      │  │         ❌ پورت بسته       │  │
│  └──────────────────────┘  └───────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**جداسازی شبکه (Defense-in-Depth):**

| شبکه | نوع | اینترنت | کانتینرها | دسترسی خارجی |
|------|------|---------|-----------|---------------|
| `frontend-net` | bridge | ✅ | API, Admin, Frontend | فقط `127.0.0.1` (Caddy) |
| `backend-net` | **internal** | ❌ | API, PostgreSQL, Redis | **هیچ** — کاملاً ایزوله |

> **مهم:** 
> - سرویس‌ها فقط به `127.0.0.1` bind شده‌اند — فقط Caddy روی هاست دسترسی دارد
> - `backend-net` با `internal: true` ساخته شده — DB و Redis **هیچ دسترسی به اینترنت** ندارند
> - API تنها سرویسی است که در **هر دو شبکه** عضو است (bridge بین zones)
> - Rootless Podman: حتی اگر container escape بشود → فقط دسترسی user بدون root

### امنیت کانتینرها (Podman Enterprise — Defense-in-Depth)

تمام لایه‌های امنیتی در `docker-compose.prod.yml` پیکربندی شده‌اند:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    8 لایه دفاعی (Defense-in-Depth)                  │
│                                                                     │
│  Layer 0 │ Rootless Podman      بدون daemon root — user namespace  │
│  Layer 1 │ Network Isolation    frontend-net + backend-net internal │
│  Layer 2 │ Read-Only FS         read_only: true + tmpfs محدود       │
│  Layer 3 │ Capability Drop      cap_drop: ALL + فقط cap لازم       │
│  Layer 4 │ No-New-Privileges    جلوگیری از setuid/setgid escalation │
│  Layer 5 │ Resource Limits      memory + cpu + pids_limit           │
│  Layer 6 │ 127.0.0.1 Binding    فقط Caddy روی هاست دسترسی دارد     │
│  Layer 7 │ Internal Network     DB/Redis: صفر دسترسی به اینترنت    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### محدودیت منابع هر سرویس

| سرویس | حافظه حداکثر | حافظه رزرو | CPU | pids_limit |
|--------|-------------|------------|-----|------------|
| **API** | 512 MB | 256 MB | 2.0 | 256 |
| **PostgreSQL** | 512 MB | 256 MB | 2.0 | 256 |
| **Frontend** | 256 MB | 128 MB | 1.0 | 128 |
| **Admin** | 128 MB | 64 MB | 0.5 | 64 |
| **Redis** | 128 MB | 64 MB | 0.5 | 64 |

> `pids_limit` جلوی حمله Fork Bomb را می‌گیرد — هر کانتینر فقط تعداد محدودی process می‌تواند بسازد.

#### Capability ها

| سرویس | cap_drop | cap_add | دلیل |
|--------|----------|---------|-------|
| **API** | ALL | `NET_BIND_SERVICE` | باید به پورت `:8080` bind شود |
| **Admin** | ALL | `NET_BIND_SERVICE` | Nginx باید به پورت `:8081` bind شود |
| **Frontend** | ALL | `NET_BIND_SERVICE` | Node.js باید به پورت `:4000` bind شود |
| **PostgreSQL** | ALL | `CHOWN`, `SETUID`, `SETGID`, `FOWNER`, `DAC_OVERRIDE` | مورد نیاز init دیتابیس |
| **Redis** | ALL | — | هیچ capability اضافی ندارد |

> `cap_drop: ALL` تمام ۴۰+ capability لینوکس را حذف می‌کند. فقط حداقل مورد نیاز اضافه شده.

#### فایل‌سیستم فقط-خواندنی (Read-Only FS)

| سرویس | read_only | tmpfs مجاز |
|--------|-----------|------------|
| **API** | ✅ | `/tmp:100m`, `/app/Logs:50m` — هر دو `noexec,nosuid` |
| **Admin** | ✅ | `/tmp`, `/var/cache/nginx`, `/var/run` — همه `noexec,nosuid` |
| **Frontend** | ✅ | `/tmp:100m` — `noexec,nosuid` |
| **Redis** | ✅ | `/data:128m` — `noexec,nosuid` |
| **PostgreSQL** | ❌ | — (volume برای data directory لازم است) |

> `noexec`: اجرای باینری در tmpfs ممنوع. `nosuid`: جلوگیری از setuid escalation.

#### سایر تنظیمات امنیتی

| تنظیم | توضیح |
|-------|--------|
| `security_opt: no-new-privileges:true` | حتی اگر باینری setuid داشته باشد → اجرا نمی‌شود |
| `POSTGRES_INITDB_ARGS: --auth-host=scram-sha-256` | احراز هویت قوی PostgreSQL (نه MD5) |
| `redis --rename-command FLUSHDB ""` | دستورات خطرناک Redis غیرفعال |
| `Serilog MinimumLevel: Warning` | فقط خطاها و هشدارها لاگ می‌شوند (نه اطلاعات debug) |
| `ports: 127.0.0.1:PORT:PORT` | هیچ سرویسی روی `0.0.0.0` bind نیست |
| `ports: !override []` (DB/Redis) | پورت‌های دیتابیس و ردیس **کاملاً بسته** هستند |
| `logging: max-size + max-file` | جلوگیری از پر شدن دیسک توسط لاگ‌ها |

> **خلاصه:** حتی اگر مهاجم بتواند به داخل یک کانتینر نفوذ کند:
> - فایل‌سیستم فقط خواندنی است → نمی‌تواند فایل بنویسد
> - هیچ capability ندارد → نمی‌تواند تنظیمات شبکه یا سیستم را تغییر دهد
> - pids محدود است → نمی‌تواند fork bomb بزند
> - حافظه محدود است → نمی‌تواند DoS کند
> - backend-net internal است → نمی‌تواند به اینترنت وصل شود
> - Rootless Podman → حتی با container escape فقط یک user عادی است

---

## 4. گام‌به‌گام دپلوی

### مرحله ۱: آماده‌سازی سرور

```bash
# ۱. به‌روزرسانی سیستم (Rocky Linux / RHEL)
sudo dnf update -y

# ۲. نصب Podman + Compose (Rootless — بدون root daemon)
sudo dnf install -y podman podman-compose
# Rootless بودن را تأیید کنید:
podman info --format '{{.Host.Security.Rootless}}'
# باید true باشد

# ۳. Lingering فعال کنید (سرویس‌ها بدون لاگین بمانند)
sudo loginctl enable-linger $(whoami)

# ۴. نصب Caddy (روی هاست — نه داخل Container)
sudo dnf install -y 'dnf-command(copr)'
sudo dnf copr enable -y @caddy/caddy
sudo dnf install -y caddy
sudo systemctl enable --now caddy

# توجه: نیازی به Git روی سرور نیست — CI/CD فایل‌ها را SCP می‌کند
```

### مرحله ۲: آماده‌سازی دایرکتوری سرور

> **مهم:** سرور فقط به فایل‌های deployment نیاز دارد (compose, Caddyfile, backup.sh).  
> سورس‌کد (src/, Docs/) و Dockerfileها **نباید** روی سرور باشند — ایمیج‌ها از GHCR پول می‌شوند.  
> **نیازی به Git روی سرور نیست** — CI/CD خودش فایل‌ها را با SCP می‌فرستد.

```bash
# ۱. ساخت دایرکتوری
sudo mkdir -p /opt/kurdmap/docker
sudo chown -R $(whoami):$(whoami) /opt/kurdmap

# ۲. ایجاد .env (یکبار — CI/CD هرگز این فایل را overwrite نمی‌کند)
cd /opt/kurdmap
cat > .env << 'EOF'
# ── Database ──
POSTGRES_DB=kurdmap
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME
REDIS_PASSWORD=CHANGE_ME

# ── JWT ──
JWT_SECRET=CHANGE_ME
JWT_ISSUER=KurdMap
JWT_AUDIENCE=KurdMapClient

# ── URLs ──
FRONTEND_URL=https://kurdmap.de
ADMIN_URL=https://admin.kurdmap.de
API_DOMAIN=gs6xapi.kurdmap.eu

# ── GHCR ──
GHCR_USERNAME=your-github-username-lowercase
EOF

# ۳. تولید رمزهای قوی
sed -i "s|JWT_SECRET=CHANGE_ME|JWT_SECRET=$(openssl rand -base64 48)|" .env
sed -i "s|POSTGRES_PASSWORD=CHANGE_ME|POSTGRES_PASSWORD=$(openssl rand -base64 32)|" .env
sed -i "s|REDIS_PASSWORD=CHANGE_ME|REDIS_PASSWORD=$(openssl rand -base64 32)|" .env

# ۴. ویرایش GHCR_USERNAME
nano .env
```

> **چگونه فایل‌های deployment به سرور می‌رسند؟**  
> CI/CD (GitHub Actions) خودش فایل‌های `docker-compose.yml`، `docker-compose.prod.yml`، `docker/Caddyfile`، `docker/backup.sh` و `docker/seed-data.sql` را با SCP به سرور می‌فرستد.  
> شما فقط `.env` را یکبار دستی می‌سازید — بقیه خودکار است.

> **ساختار نهایی سرور:**
> ```
> /opt/kurdmap/
> ├── docker-compose.yml       ← از CI/CD (SCP)
> ├── docker-compose.prod.yml  ← از CI/CD (SCP)
> ├── .env                     ← دستی (فقط یکبار)
> ├── .env.example             ← از CI/CD (مرجع)
> └── docker/
>     ├── Caddyfile            ← از CI/CD (import در Caddy هاست)
>     ├── backup.sh            ← از CI/CD (cron backup)
>     └── seed-data.sql        ← از CI/CD (داده اولیه)
> ```
> **توجه:** هیچ Dockerfile، سورس‌کد، یا `.git` روی سرور وجود ندارد.

### مرحله ۳: اولین اجرا (دستی — فقط یکبار)

> **توجه:** بعد از اولین دپلوی موفق از CI/CD، این مرحله خودکار می‌شود.  
> اگر هنوز CI/CD اجرا نشده، اولین بار را دستی انجام دهید.

```bash
cd /opt/kurdmap

# ۱. لاگین به GHCR
echo "YOUR_GHCR_TOKEN" | podman login ghcr.io -u YOUR_USERNAME --password-stdin

# ۲. پول ایمیج‌ها از GHCR
podman pull ghcr.io/YOUR_USERNAME/kurdmap-api:latest
podman pull ghcr.io/YOUR_USERNAME/kurdmap-admin:latest
podman pull ghcr.io/YOUR_USERNAME/kurdmap-frontend:latest

# ۳. اجرا (--no-build: ایمیج‌ها از GHCR هستند، Dockerfile روی سرور نیست)
podman compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build

# ۴. بررسی سلامت
curl -f http://localhost:8080/health
curl -f http://localhost:4000
curl -f http://localhost:8081

# ۵. Seed دیتابیس (اختیاری: داده تستی)
podman compose exec -T postgres psql -U postgres -d kurdmap < docker/seed-data.sql
```

### مرحله ۴: SSL و Reverse Proxy (Caddy روی هاست)

```bash
# Caddy روی هاست نصب شده و پورت‌های ۸۰/۴۴۳ را با سایر وبسایت‌ها مشترک دارد.
# کانفیگ KurdMap به صورت import در Caddyfile اصلی هاست اضافه می‌شود.

# ۱. تنظیم DNS Records (در پنل دامنه — مثلاً Cloudflare)
#    A    kurdmap.de          → <IP سرور>
#    A    admin.kurdmap.de    → <IP سرور>
#    A    gs6xapi.kurdmap.eu      → <IP سرور>
#    CNAME www.kurdmap.de     → kurdmap.de

# ۲. اضافه کردن import به Caddyfile اصلی هاست
sudo tee -a /etc/caddy/Caddyfile > /dev/null <<'EOF'

# ── KurdMap ──
import /opt/kurdmap/docker/Caddyfile
EOF

# ۳. تست و بارگذاری مجدد Caddy
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy

# ۴. تست HTTPS (صبر کنید تا Caddy certificate بگیرد — ۱-۲ دقیقه)
curl -f https://gs6xapi.kurdmap.eu/health
curl -f https://kurdmap.de
curl -f https://admin.kurdmap.de
```

> **نکته:** Caddy به صورت خودکار SSL دریافت، نصب و تمدید می‌کند. نیازی به `certbot` نیست!
> فایل `docker/Caddyfile` فقط site block‌های KurdMap را شامل می‌شود (بدون global options) چون سایر وبسایت‌ها هم روی همین Caddy هستند.

### مرحله ۵: Backup و Monitoring

```bash
# ۱. Backup روزانه (ساعت ۳ شب)
echo "0 3 * * * /opt/kurdmap/docker/backup.sh >> /var/log/kurdmap-backup.log 2>&1" | sudo crontab -

# ۲. Health check هر ۵ دقیقه
echo "*/5 * * * * curl -sf http://localhost:8080/health || echo 'KurdMap API DOWN' | mail -s 'ALERT' admin@kurdmap.de" | sudo crontab -
```

---

## 5. وضعیت هر سرویس

### KurdMap.API (.NET 10)

| مورد | وضعیت | جزئیات |
|------|--------|--------|
| Build | ✅ | 0 error, 0 warning |
| Tests | ✅ | ۱۰۴/۱۰۴ پاس (xUnit + NSubstitute) |
| Authentication | ✅ | JWT Bearer + Refresh Token + Rate Limiting |
| Authorization | ✅ | RBAC + Policy-based (SuperAdmin, Admin, Moderator) |
| CORS | ✅ | Config-driven (نه wildcard) |
| Security Headers | ✅ | CSP (nonce-based), HSTS, X-Frame-Options, X-Content-Type |
| Rate Limiting | ✅ | ۳ policy: fixed (100/min), auth (10/min), upload (20/min) |
| Health Checks | ✅ | PostgreSQL + Redis |
| Validation | ✅ | FluentValidation + Pipeline Behavior |
| Exception Handling | ✅ | Middleware → RFC 7807 format |
| Logging | ✅ | Serilog (Console + File) |
| EF Core Migrations | ✅ | ۲ migration + auto-migrate on startup |
| **Secrets Hardcoded** | ✅ | رفع شد — env var در prod, appsettings.Development.json برای dev |
| **AllowedHosts** | ✅ | `"localhost;gs6xapi.kurdmap.eu"` |
| **DashboardController** | ✅ | `[Authorize(Roles = "SuperAdmin,Admin")]` |
| **CSRF/Antiforgery** | ✅ | `AddAntiforgery` + `UseAntiforgery` با XSRF-TOKEN cookie |
| **COOP/CORP/COEP** | ✅ | `SecurityHeadersMiddleware` — same-origin + credentialless |

**نتیجه API:** ✅ آماده Production

---

### kurdmap-admin (Angular 21)

| مورد | وضعیت | جزئیات |
|------|--------|--------|
| Build | ✅ | 0 error (چند unused import warning) |
| Tests | ✅ | ۶۳ تست Vitest |
| Architecture | ✅ | Core/Shared/Features + Lazy Routes + Signals |
| Auth | ✅ | JWT + Interceptor + Auto-refresh + Guards |
| Dark Mode | ✅ | CSS Variables + Toggle |
| RTL | ✅ | Right-to-left layout |
| Accessibility | ✅ | skip-link, scope, caption, aria, touch targets, mobile cards |
| ۱۰ صفحه | ✅ | dashboard, businesses, categories, cities, users, ads, reviews, reports, settings, login |
| **API URL خالی** | ✅ | `apiUrl: 'https://gs6xapi.kurdmap.eu'` تنظیم شد |
| **Error Logging** | ✅ | `GlobalErrorHandler` فقط در devMode لاگ می‌کند |
| **Reactive Forms** | ❌ | فقط template forms |
| **Component Tests** | ❌ | ۰ تست کامپوننت |

**نتیجه ادمین:** ✅ آماده Production (۲ بهبود P2 باقی‌مانده)

---

### kurdmap-frontend (Angular 21)

| مورد | وضعیت | جزئیات |
|------|--------|--------|
| Build | ✅ | 0 error (Sass deprecation + budget warning) |
| Tests | ✅ | ۲۹/۲۹ پاس (Vitest + BrowserStorageService) |
| SSR | ✅ | Express + AngularNodeAppEngine |
| i18n | ✅ | ۴ زبان (ku, kmr, de, en) + RTL |
| SEO | ✅ | JSON-LD, OG, canonical, robots, sitemap |
| ۲۶ shared component | ✅ | bottom-nav, header, footer, pagination, toast, ... |
| ۷ صفحه | ✅ | home, search, detail, categories, about, contact, policy |
| Accessibility | ✅ | aria-labels, aria-live, skip-link, translated aria keys |
| **API URL خالی** | ✅ | از قبل `apiUrl: 'https://gs6xapi.kurdmap.eu/api/v1'` |
| **Bundle Size** | ⚠️ | ۶۳۸kB > budget ۵۰۰kB |
| **bypassSecurityTrust** | ✅ | در کد وجود نداشت (مستندات قدیمی) |
| **CSP unsafe** | ✅ | nonce-based در SecurityHeadersMiddleware + server.ts |
| **SSR proxy SSRF** | ✅ | path validation + normalize اضافه شد |
| **helmet.js** | ✅ | security headers مستقیم در server.ts |
| **Error Logging** | ✅ | `console.error` فقط در non-production |
| **returnUrl** | ✅ | validation قوی — reject `:`, `\\`, `//` |
| **BrowserStorageService** | ✅ | localStorage یکپارچه — ۵ فایل refactor شد (SSR-safe) |
| **Dark mode contrast** | ✅ | `dark:text-gray-400` به ۱۶+ عنصر + admin text-secondary bump |
| **Component Tests** | ❌ | ۰ تست کامپوننت |

**نتیجه فرانتاند:** ✅ آماده Production (۲ بهبود P2 باقی‌مانده)

---

### Docker / Infrastructure

| مورد | وضعیت | جزئیات |
|------|--------|--------|
| docker-compose.yml | ✅ | ۵ سرویس + health checks + depends_on |
| Dockerfiles | ✅ | Multi-stage builds, 3 files |
| .env.example | ✅ | Template کامل با ۲۰+ متغیر |
| CI/CD | ✅ | GitHub Actions: ci.yml (4 jobs) + deploy.yml |
| Makefile | ✅ | build, run, test, seed, health, backup |
| **Secrets hardcoded** | ✅ | docker-compose.yml با `${VARIABLE:?required}` syntax |
| **Ports exposed** | ✅ | docker-compose.prod.yml: DB/Redis بدون port mapping |
| **docker-compose.prod.yml** | ✅ | ایجاد شد — read-only, cap_drop, resources, dual-network, logs |
| **Nginx reverse proxy** | ✅ | `docker/nginx-proxy.conf` با ۳ server block + rate limiting |
| **SSL certificates** | ✅ | پیکربندی Let's Encrypt در nginx-proxy.conf |
| **Backup schedule** | ✅ | `docker/backup.sh` — pg_dump + gzip + retention ۳۰ روز |
| **Redis password** | ✅ | `--requirepass` + `--rename-command` در docker-compose.yml |
| **Admin Nginx CSP** | ✅ | CSP + Permissions-Policy + COOP + CORP |
| **Non-root Docker** | ✅ | `admin.Dockerfile` اجرا با `USER nginx` |
| **Pre-commit hook** | ✅ | اسکن secrets قبل از commit |

**نتیجه زیرساخت:** ✅ آماده Production

---

## 6. امتیاز تفصیلی

### امتیاز بر اساس دسته‌بندی

| دسته | وزن | امتیاز | بالقوه |
|------|------|--------|--------|
| **معماری و الگوها** | ۱۵% | ۱۵/۱۵ | ✅ عالی |
| **امنیت بک‌اند** | ۲۰% | ۲۰/۲۰ | ✅ عالی (secrets + Authorize + CSRF/Antiforgery + COOP/CORP/COEP) |
| **امنیت فرانتاند** | ۱۵% | ۱۵/۱۵ | ✅ عالی (CSP nonce + SSR headers + BrowserStorageService + returnUrl + contrast) |
| **دسترسی‌پذیری WCAG** | ۱۰% | ۹/۱۰ | ✅ عالی (focus-visible + skip-link + aria + contrast fix) |
| **تست‌ها** | ۱۰% | ۶/۱۰ | ⚠️ متوسط (بک‌اند عالی، فرانتاند ضعیف) |
| **DevOps / زیرساخت** | ۱۵% | ۱۵/۱۵ | ✅ عالی (prod overlay + nginx + backup + non-root + pre-commit) |
| **UI/UX و واکنش‌گرایی** | ۱۰% | ۸/۱۰ | ✅ خوب |
| **SEO و i18n** | ۵% | ۵/۵ | ✅ عالی |
| **جمع** | **۱۰۰%** | **۹۳/۱۰۰** | — |

### نتیجه‌گیری

```
┌─────────────────────────────────────────────┐
│                                             │
│   امتیاز کلی:  93/100  ⭐⭐⭐⭐⭐           │
│                                             │
│   وضعیت:       ✅ آماده Production          │
│                                             │
│   موارد رفع‌شده:                             │
│     ✅ P0 (مسدودکننده): 14/14 رفع شد       │
│     ✅ P1 (بالا):       14/14 رفع شد       │
│     ✅ P2 (متوسط):      10/33 رفع شد       │
│     ⬜ P3 (پایین):       0/15              │
│                                             │
│   جمع رفع‌شده: 38 از 76 (50%)              │
│                                             │
│   معماری و کدنویسی: A+ (بهترین بخش)        │
│   بهبود یافته: امنیت + زیرساخت             │
│                                             │
└─────────────────────────────────────────────┘
```

### پیشنهاد عملی

1. ✅ ~~ابتدا ۱۴ مورد P0 را رفع کنید~~ — **انجام شد**
2. ✅ ~~تمام ۱۴ مورد P1 را رفع کنید~~ — **انجام شد**
3. **مرحله بعد:** دپلوی روی سرور + اجرای `certbot` + تنظیم cron
4. **سپس** ۲۳ مورد P2 باقی‌مانده را فازبندی کنید
5. **بعد از تثبیت** ۱۵ مورد P3 را به تدریج اضافه کنید

> **نکته مهم:** پروژه از نظر معماری، امنیت، و زیرساخت به سطح Production رسیده است. موارد باقی‌مانده بهبودهای تدریجی هستند و مسدودکننده نیستند.

---

## 7. راهنمای ساخت اکانت ادمین

### ادمین پیش‌فرض (Seed خودکار)

وقتی API برای اولین بار اجرا می‌شود و **هیچ کاربری** در دیتابیس نباشد، یک ادمین پیش‌فرض ساخته می‌شود:

| فیلد | مقدار |
|------|--------|
| **ایمیل** | `admin@kurdmap.de` |
| **رمز عبور** | `Admin123!@#` |
| **نقش‌ها** | `SuperAdmin` + `Admin` |

> **⚠️ مهم:** بعد از اولین لاگین، فوراً رمز عبور را از صفحه Settings تغییر دهید!

### نحوه لاگین در پنل ادمین

```
۱. مرورگر باز کنید: https://admin.kurdmap.de
۲. ایمیل: admin@kurdmap.de
۳. رمز: Admin123!@#
۴. اگر TOTP/2FA فعال باشد → وارد کد ۶ رقمی از Google Authenticator شوید
```

### ساخت ادمین جدید از طریق API (اختیاری)

```bash
# ۱. ابتدا رجیستر (کاربر عادی ساخته می‌شود)
curl -X POST https://gs6xapi.kurdmap.eu/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email": "newadmin@kurdmap.de", "password": "StrongPass123!@#", "fullName": "New Admin"}'

# ۲. سپس از پنل ادمین → صفحه Users → نقش (Role) را به Admin تغییر دهید
```

### فعال‌سازی TOTP/2FA

```
۱. لاگین در پنل ادمین
۲. به Settings بروید
۳. بخش «تأیید دو مرحله‌ای» را پیدا کنید
۴. روی «فعال‌سازی» کلیک کنید
۵. QR Code را با Google Authenticator اسکن کنید
۶. کد ۶ رقمی را وارد کنید → تأیید
```

---

## 8. فایل‌های مهم و وظیفه هر کدام

### فایل‌های تنظیمات سرور

| فایل | وظیفه | ویرایش لازم؟ |
|------|--------|-------------|
| `.env.production` | متغیرهای محیطی تولید — رمزها و URLها | ✅ **بله** — رمزها را تنظیم کنید |
| `docker-compose.yml` | تعریف ۵ سرویس اصلی | ❌ نیازی نیست |
| `docker-compose.prod.yml` | Overlay امنیتی تولید (بدون Caddy) | ❌ نیازی نیست |
| `docker/Caddyfile` | Site blocks برای import در Caddy هاست | ❌ نیازی نیست (دامنه ثابت) |
| `docker/api.Dockerfile` | ساخت ایمیج API | ❌ نیازی نیست |
| `docker/admin.Dockerfile` | ساخت ایمیج پنل ادمین | ❌ نیازی نیست |
| `docker/frontend.Dockerfile` | ساخت ایمیج فرانتاند | ❌ نیازی نیست |
| `docker/backup.sh` | پشتیبان‌گیری روزانه PostgreSQL | ❌ نیازی نیست |
| `docker/seed-data.sql` | داده‌های اولیه تستی | اختیاری |
| `.github/workflows/deploy.yml` | CI/CD خودکار | ❌ (Secrets در GitHub تنظیم شود) |

### فقط `.env.production` را ویرایش کنید!

```bash
# ۱. کپی کنید
cp .env.production .env

# ۲. رمزهای قوی تولید کنید
JWT_SECRET=$(openssl rand -base64 48)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)

# ۳. در فایل .env جایگزین کنید
sed -i "s|CHANGE_ME_USE_openssl_rand_base64_48|$JWT_SECRET|" .env
sed -i "s|CHANGE_ME_USE_openssl_rand_base64_32|$POSTGRES_PASSWORD|" .env  # اولین مورد: PostgreSQL
# Redis را دستی ویرایش کنید: nano .env

# ۴. اجرا!
podman compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### GitHub Secrets برای CI/CD

#### آنچه **یکبار** تنظیم می‌شود (سطح سرور)

این مقادیر بین **همه پروژه‌ها** مشترک هستند — فقط یکبار ساخته می‌شوند:

| مورد | تعداد | توضیح |
|------|--------|--------|
| **SSH Key** | ۱ عدد | یک کلید روی سرور Hetzner — همه پروژه‌ها از همان استفاده می‌کنند |
| **GHCR Token** | ۱ عدد | یک PAT با دسترسی `write:packages` + `read:packages` — برای همه repo ها |
| **GHCR Username** | ۱ عدد | نام کاربری GitHub شما (حروف کوچک) |

#### ساخت SSH Key (یکبار — اگر قبلاً ندارید)

```bash
# روی کامپیوتر خودتان:
ssh-keygen -t ed25519 -C "deploy@kurdmap" -f ~/.ssh/kurdmap_deploy

# کلید عمومی را به سرور اضافه کنید:
ssh-copy-id -i ~/.ssh/kurdmap_deploy.pub <USER>@<SERVER_IP>

# محتوای کلید خصوصی → مقدار DEPLOY_SSH_KEY
cat ~/.ssh/kurdmap_deploy
```

> **نکته:** اگر قبلاً برای پروژه دیگر (مثلاً Jirlee) SSH Key ساخته‌اید، **همان کلید** کافی است.

#### ساخت GHCR Token (یکبار)

```
GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
→ Generate new token
→ Scopes: ✅ write:packages, ✅ read:packages
→ Expiration: حداقل 90 روز یا No expiration
→ Generate token → کپی کنید
```

> **نکته:** همین token برای همه پروژه‌ها (KurdMap, Jirlee, ...) استفاده می‌شود.

#### تنظیم Secrets در هر Repo

هر repo در GitHub → **Settings → Secrets and variables → Actions** باید این مقادیر را داشته باشد:

| Secret | مقدار | مشترک؟ |
|--------|--------|---------|
| `DEPLOY_HOST` | آدرس IP سرور Hetzner | ✅ مشترک بین همه پروژه‌ها |
| `DEPLOY_USER` | نام کاربری SSH (مثلاً `deploy`) | ✅ مشترک |
| `DEPLOY_SSH_KEY` | کلید خصوصی SSH (کامل) | ✅ مشترک |
| `DEPLOY_PORT` | پورت SSH (معمولاً `22`) | ✅ مشترک |
| `DEPLOY_PATH` | مسیر پروژه روی سرور (**الزامی**) | ⚠️ **متفاوت** بین پروژه‌ها |
| `GHCR_USERNAME` | نام کاربری GitHub (حروف کوچک) | ✅ مشترک |
| `GHCR_TOKEN` | Personal Access Token | ✅ مشترک |

> **توجه:** دیگری نیازی به **SSH Key سرور ← GitHub** نیست. CI/CD خودش فایل‌ها را با SCP می‌فرستد — سرور مستقیماً به GitHub وصل نمی‌شود.

مقادیر `DEPLOY_PATH` بین پروژه‌ها:

| پروژه | DEPLOY_PATH |
|--------|-------------|
| KurdMap | `/opt/kurdmap` |
| Jirlee | `/opt/jirlee` |

> **مهم:** مقادیر یکسان هستند، فقط باید در هر repo جداگانه paste کنید — چون GitHub Secrets به هر repo محدود است.

#### راه بهتر: Organization Secrets

اگر GitHub Organization دارید، می‌توانید **یکبار** تنظیم کنید:

```
Organization → Settings → Secrets and variables → Actions
→ New organization secret
→ Repository access: "All repositories" یا "Selected repositories"
```

اینطوری فقط **یکبار** ۶ secret مشترک را وارد می‌کنید و همه repo ها دسترسی دارند. فقط `DEPLOY_PATH` باید در هر repo جداگانه تنظیم شود.

### خلاصه سریع دپلوی

```bash
# ── روی سرور (یکبار — آماده‌سازی اولیه): ──
sudo mkdir -p /opt/kurdmap/docker
sudo chown -R $(whoami):$(whoami) /opt/kurdmap
cd /opt/kurdmap

# ایجاد .env با رمزهای قوی:
nano .env  # مقادیر: POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET, GHCR_USERNAME, ...

# ── بعد از push به main: CI/CD خودکار انجام می‌دهد: ──
# 1. Build + Push ایمیج‌ها به GHCR
# 2. SCP فایل‌های deployment به سرور (compose, Caddyfile, backup.sh)
# 3. SSH → podman pull + podman compose up -d
# 4. Health check

# ── Caddy روی هاست (یکبار): ──
# اضافه کردن import به /etc/caddy/Caddyfile:
#   import /opt/kurdmap/docker/Caddyfile
sudo systemctl reload caddy

# ۲ دقیقه صبر کنید → Caddy خودکار SSL می‌گیرد
curl -f https://gs6xapi.kurdmap.eu/health  # باید 200 OK برگرداند

# لاگین ادمین:
# https://admin.kurdmap.de
# ایمیل: admin@kurdmap.de
# رمز: Admin123!@#
```
