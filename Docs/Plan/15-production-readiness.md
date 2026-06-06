# ارزیابی آمادگی تولید — KurdMap

> تاریخ: ۱۸ فروردین ۱۴۰۵ (۷ آوریل ۲۰۲۶)  
> به‌روزرسانی: ۲۴ فروردین ۱۴۰۵ (۱۳ آوریل ۲۰۲۶) — **تمام P0 + تمام P1 + ۱۰ P2 رفع شدند**  
> هدف: آیا KurdMap آماده استقرار روی سرور Production است؟  
> نتیجه: ✅ **آماده تولید است** — ۳۸ مورد رفع شد (14 P0 + 14 P1 + 10 P2)

---

## فهرست

1. [نتیجه نهایی](#1-نتیجه-نهایی)
2. [چک‌لیست بحرانی قبل از دپلوی](#2-چک‌لیست-بحرانی-قبل-از-دپلوی)
3. [ساختار سرور پیشنهادی](#3-ساختار-سرور-پیشنهادی)
4. [گام‌به‌گام دپلوی](#4-گام‌به‌گام-دپلوی)
5. [وضعیت هر سرویس](#5-وضعیت-هر-سرویس)
6. [امتیاز تفصیلی](#6-امتیاز-تفصیلی)

---

## 1. نتیجه نهایی

### ✅ آماده تولید

| معیار | وضعیت | توضیح |
|--------|--------|--------|
| **بیلد** | ✅ موفق | بک‌اند (0 error) + ادمین (0 error) + فرانتاند (0 error) |
| **تست‌ها** | ✅ پاس | ۹۰ بک‌اند + ۵۹ ادمین + ۲۷ فرانتاند = **۱۷۶** تست |
| **معماری** | ✅ عالی | Clean Architecture + CQRS + MediatR + FluentValidation |
| **Secrets** | ✅ **رفع شد** | env var syntax در docker-compose + appsettings.Development.json |
| **CSP** | ✅ **رفع شد** | nonce-based در SecurityHeadersMiddleware + SSR server.ts |
| **XSS** | ✅ **بررسی شد** | `bypassSecurityTrustHtml()` در کد وجود نداشت (مستندات قدیمی) |
| **SSRF** | ✅ **رفع شد** | path validation + normalize در server.ts |
| **SSL** | ✅ **آماده** | nginx-proxy.conf با Let's Encrypt config |
| **Reverse Proxy** | ✅ **آماده** | ۳ server block + rate limiting + security headers |
| **Backup** | ✅ **آماده** | backup.sh — pg_dump + gzip + retention ۳۰ روز |
| **Production Config** | ✅ **رفع شد** | API URL در admin و frontend تنظیم شد |

### ✅ آماده دپلوی

```
۱۴ مورد P0 رفع شدند ✅ → مرحله بعد: تنظیم سرور و اجرای certbot
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
| **OS** | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |
| **Container** | Docker CE / Podman 5+ | Podman 5+ (rootless) |

### دامنه‌ها

| سرویس | دامنه | پورت داخلی |
|--------|--------|-----------|
| Frontend (SSR) | `kurdmap.de` | `:4000` |
| Admin Panel | `admin.kurdmap.de` | `:8081` |
| API | `gs6xapi.kurdmap.eu` | `:8080` |

### معماری شبکه

```
Internet
    │
    ▼
┌─────────────────┐
│   Nginx (443)   │  ← SSL termination
│   Reverse Proxy │
└────┬────┬────┬──┘
     │    │    │
     ▼    ▼    ▼
   ┌──┐ ┌──┐ ┌──┐     frontend-net (bridge)
   │FE│ │AD│ │AP│
   └──┘ └──┘ └┬─┘
              │
         ┌────┴────┐    backend-net (internal)
         ▼         ▼
      ┌────┐    ┌─────┐
      │ PG │    │Redis│
      └────┘    └─────┘
```

---

## 4. گام‌به‌گام دپلوی

### مرحله ۱: آماده‌سازی سرور

```bash
# ۱. به‌روزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# ۲. نصب Podman (یا Docker)
sudo apt install -y podman podman-compose

# ۳. نصب Nginx
sudo apt install -y nginx certbot python3-certbot-nginx

# ۴. نصب Git
sudo apt install -y git
```

### مرحله ۲: کلون و تنظیم

```bash
# ۱. کلون پروژه
git clone https://github.com/YOUR_ORG/KurdMap-web-all.git /opt/kurdmap
cd /opt/kurdmap

# ۲. ایجاد .env
cp .env.example .env

# ۳. تولید رمزهای قوی
echo "JWT_SECRET=$(openssl rand -base64 48)" >> .env
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env
echo "REDIS_PASSWORD=$(openssl rand -base64 32)" >> .env
echo "SEED_ADMIN_PASSWORD=$(openssl rand -base64 16)" >> .env

# ۴. ویرایش مقادیر
nano .env
```

### مرحله ۳: ساخت و اجرا

```bash
# ۱. ساخت تصاویر
podman-compose -f docker-compose.yml -f docker-compose.prod.yml build

# ۲. اجرا
podman-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# ۳. بررسی سلامت
curl -f http://localhost:8080/health
curl -f http://localhost:4000
curl -f http://localhost:8081

# ۴. Seed دیتابیس (اختیاری: داده تستی)
make seed
```

### مرحله ۴: SSL و Nginx

```bash
# ۱. تنظیم Nginx
sudo cp docker/nginx-proxy.conf /etc/nginx/sites-available/kurdmap.conf
sudo ln -s /etc/nginx/sites-available/kurdmap.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# ۲. SSL
sudo certbot --nginx -d kurdmap.de -d www.kurdmap.de -d admin.kurdmap.de -d gs6xapi.kurdmap.eu

# ۳. تمدید خودکار
echo "0 */12 * * * certbot renew --quiet" | sudo crontab -
```

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
| Tests | ✅ | ۹۰/۹۰ پاس (xUnit + NSubstitute) |
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
| Tests | ✅ | ۵۹ تست Vitest |
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
| Tests | ✅ | ۲۷/۲۷ پاس (Vitest + BrowserStorageService) |
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
