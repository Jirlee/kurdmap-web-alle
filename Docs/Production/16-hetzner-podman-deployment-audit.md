# KurdMap — Hetzner + Podman Deployment Audit & Runbook

تاریخ به‌روزرسانی: 2026-06-06
نگارش: v2 (بازنویسی کامل)
دامنه بررسی: فقط بر اساس فایل‌های واقعی پروژه در `docker/` + لاگ‌های واقعی سرور production

> هدف این سند: یک **Runbook پایدار و همیشگی** برای deploy و به‌روزرسانی KurdMap روی سرور
> Hetzner با Podman، طوری که سایت هیچ‌وقت برای کاربران از دسترس خارج نشود (Zero/Near-Zero
> Downtime)، توسعه‌دهنده مثل یک DevOps حرفه‌ای پیش برود، و هر بار deploy بدون خطا و قابل
> تکرار باشد.

---

## 0) خلاصه تغییرات این نگارش (نسبت به v1)

نسخه قبلی این سند بر اساس معماری قدیمی «Admin به‌صورت Static» نوشته شده بود. آن معماری
**حذف شده** و این موارد جایگزین شده‌اند:

1. **Admin دیگر Static نیست** — حالا مثل Frontend داخل کانتینر خودش سرو می‌شود
   (`docker/admin-server.py`, پورت داخلی 8080) و Caddy به آن `reverse_proxy` می‌زند.
   دیگر نیازی به `/var/www/kurdmap-admin` و volume به نام `admin-static` و مرحله `rsync`
   نیست. **این تغییر علت ۴۰۴ قبلی روی `gs6x.kurdmap.eu` را به‌طور کامل رفع کرد.**
2. **Healthcheck ادمین از `wget --spider` به `python3` تغییر کرد** — چون image ادمین Alpine
   است و `wget` busybox گزینهٔ `--spider` استاندارد GNU را ندارد و همیشه fail می‌داد
   (کانتینر `unhealthy` می‌ماند درحالی‌که `curl` جواب `200` می‌داد).
3. **پورت‌های Caddy حالا قابل‌تنظیم با Environment شدند** — تا روی هاستی که چند پروژه
   هم‌زمان دارد (پورت‌های 4000/8080 اشغال) دیگر خطای `503` رخ ندهد.
4. **یادآوری Migration دیتابیس** — مهاجرت جدید `AddBusinessSearchIndexes` باید روی DB
   production اجرا شود (بخش ۱۱).
5. بخش **Zero-Downtime Deploy** و **Troubleshooting واقعی** بر اساس لاگ‌های سرور اضافه شد.

---

## 1) Root Cause خطاهای واقعی که دیدیم (و راه‌حل قطعی)

### 1.1 خطای CI/CD: `repository name must be lowercase`
- علت: در `deploy.yml` مقدار `GHCR_USERNAME` بدون lowercase اجباری در pull/login استفاده می‌شد.
- وضعیت: **رفع‌شده** — username قبل از login/pull و نوشتن `.env` به lowercase تبدیل می‌شود.
- قانون همیشگی: مرجع GHCR همیشه باید owner/user با حروف کوچک باشد.

### 1.2 خطای ۴۰۴ روی `gs6x.kurdmap.eu` (پنل ادمین)
- علت: Caddy تنظیم بود فایل‌های ادمین را از مسیر host `/var/www/kurdmap-admin` بخواند، اما
  آن مسیر روی سرور اصلاً وجود نداشت (ادمین فقط داخل کانتینر بود، نه روی فایل‌سیستم هاست).
- وضعیت: **رفع‌شده** — ادمین حالا سرور داخلی دارد و Caddy با `reverse_proxy` به آن وصل می‌شود
  (دقیقاً مثل Frontend).

### 1.3 کانتینر `kurdmap-admin` با وضعیت `unhealthy`
- علائم در لاگ واقعی: `curl http://127.0.0.1:4001` جواب `200 OK` می‌داد، ولی `podman ps`
  می‌گفت `(unhealthy)`.
- علت قطعی: image ادمین مبتنی بر **Alpine** است؛ `wget` نسخهٔ busybox گزینهٔ `--spider`
  واقعی ندارد و healthcheck همیشه fail می‌شد. (image های API/Frontend مبتنی بر Debian هستند
  و `wget` کامل دارند، برای همین آن‌ها healthy می‌ماندند.)
- وضعیت: **رفع‌شده** — healthcheck ادمین به `python3` تغییر کرد (پایتون همیشه داخل image
  ادمین هست):
  ```
  python3 -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8080/',timeout=3).status==200 else 1)"
  ```

### 1.4 خطای `503` روی `https://kurdmap.eu` (Frontend)
- علائم در لاگ واقعی:
  - `curl -I http://127.0.0.1:5400` جواب `400` می‌داد (یعنی Frontend **بالا و سالم** است؛
    ۴۰۰ همان رد شدن Host=127.0.0.1 توسط SSR است و طبیعی است).
  - ولی `curl -I https://kurdmap.eu` از طرف Caddy جواب `503` می‌داد.
- علت قطعی: **عدم تطابق پورت**. روی این سرور کانتینرها روی پورت‌های **غیرپیش‌فرض** publish
  شده‌اند (Frontend روی `127.0.0.1:5400`, API روی `5180`)، اما Caddyfile هنوز به پورت‌های
  پیش‌فرض (`localhost:4000` و `localhost:8080`) reverse_proxy می‌کرد. Caddy روی پورت خالی
  health-check می‌کرد، upstream را down می‌دید و `503` می‌داد. (ادمین فقط به این دلیل کار
  می‌کرد که پورتش `4001` با مقدار پیش‌فرض Caddy یکی بود.)
- وضعیت: **رفع‌شده در سطح طراحی** — Caddyfile حالا upstream را از Environment می‌خواند
  (بخش ۸). فقط باید روی سرور مقادیر را ست کنید یا پورت‌ها را هم‌تراز کنید.

### 1.5 خطاهای `podman compose down` با پیام «dependent containers»
- علائم: هنگام `down` این خطاها ظاهر شد:
  `container ... has dependent containers which must be removed before it`.
- علت: این رفتار شناخته‌شدهٔ `podman-compose` (پیاده‌سازی Python) در ترتیب حذف کانتینرهای
  وابسته است؛ یک **خطای واقعی برنامه نیست**. در نهایت `up -d --force-recreate` شما وضعیت را
  تمیز بازیابی کرد.
- راه‌حل پایدار: برای recreate امن از روش بخش ۱۰ (Zero-Downtime) استفاده کنید و از `down`
  کامل پرهیز کنید مگر در maintenance برنامه‌ریزی‌شده.

---

## 2) معماری فعلی (Production)

```text
                 Internet (443/80)
                        │
                 ┌──────▼───────┐
                 │  Caddy (host)│  TLS + Security headers + Compression + Logs
                 └──────┬───────┘
        ┌───────────────┼────────────────────┐
        │ kurdmap.eu    │ gs6x.kurdmap.eu     │ gs6xapi.kurdmap.eu
        ▼               ▼                     ▼
  reverse_proxy   reverse_proxy          reverse_proxy
  FRONTEND_UP     ADMIN_UP               API_UP
  (loopback)      (loopback)             (loopback)
        │               │                     │
   ┌────▼────┐     ┌────▼────┐           ┌────▼────┐
   │frontend │     │ admin   │           │  api    │  (frontend-net)
   │ SSR     │     │ SPA srv │           │ .NET 10 │
   │ :4000   │     │ :8080   │           │ :8080   │
   └─────────┘     └─────────┘           └────┬────┘
                                              │ (backend-net, internal: true)
                                    ┌─────────┼─────────┐
                                    ▼                   ▼
                              ┌──────────┐        ┌──────────┐
                              │ postgres │        │  redis   │  (بدون اینترنت)
                              └──────────┘        └──────────┘
```

نکات کلیدی:
- هر سه سرویس public (frontend/admin/api) فقط روی `127.0.0.1` (loopback) publish می‌شوند؛
  فقط Caddy روی هاست به آن‌ها دسترسی دارد. هیچ‌کدام مستقیماً از اینترنت در دسترس نیستند.
- `backend-net` با `internal: true` است؛ DB و Redis **هیچ دسترسی اینترنتی ندارند**.
- ادمین حالا یک سرور SPA کوچک پایتونی دارد که در هر پاسخ هدر `X-Robots-Tag: noindex` و یک
  `robots.txt` با `Disallow: /` می‌فرستد → پنل ادمین در گوگل ایندکس نمی‌شود و فقط با لینک
  مستقیم قابل دسترسی است.

---

## 3) دقیقاً کدام فایل‌ها را باید روی سرور ببرم؟ (مهم)

مسیر روی سرور: `/opt/kurdmap/docker/`

### 3.1 فایل‌هایی که **باید** کپی/به‌روزرسانی شوند

| فایل | مقصد روی سرور | چه زمانی باید دوباره کپی شود |
|---|---|---|
| `docker/docker-compose.yml` | `/opt/kurdmap/docker/` | هر بار که این فایل در ریپو تغییر کند |
| `docker/docker-compose.prod.yml` | `/opt/kurdmap/docker/` | هر بار که این فایل تغییر کند |
| `docker/Caddyfile` | `/opt/kurdmap/docker/` | **هر بار که تغییر کند** (و سپس reload کدی) |
| `docker/backup.sh` | `/opt/kurdmap/docker/` | هنگام تغییر اسکریپت backup |
| `docker/.env.production.example` | `/opt/kurdmap/docker/` (به‌عنوان template) | هنگام افزودن متغیر جدید |
| `.env` (واقعی، روی سرور ساخته می‌شود) | `/opt/kurdmap/docker/.env` | فقط هنگام تغییر مقادیر؛ **هرگز در گیت نرود** |

> در این نگارش، چون ادمین خودش سرور دارد، **`docker/admin-server.py` فقط در زمان build
> داخل image قرار می‌گیرد** و نیازی به کپی دستی روی سرور ندارد (داخل image است).

### 3.2 فایل‌هایی که فقط برای Development هستند و **نباید** روی سرور استفاده شوند

1. `docker/docker-compose.override.yml`  (پورت‌ها/build dev، با `-f` صریح بارگذاری نمی‌شود)
2. `docker/start-dev.sh`
3. `docker/admin.Dockerfile` / `docker/api.Dockerfile` / `docker/frontend.Dockerfile`
   (فقط در CI برای build/push image لازم‌اند؛ روی سرور image از GHCR pull می‌شود)
4. `docker/Makefile` (اختیاری، فقط برای راحتی)
5. `docker/seed-data.sql` (فقط دادهٔ دمو/تست — برای production واقعی توصیه نمی‌شود)
6. `.env` نسخهٔ محلی dev (هرگز روی سرور)

### 3.3 پاسخ مستقیم به سؤال «الان چه چیزی باید ببرم؟»

اگر فقط همین تغییرات این جلسه را می‌خواهید روی سرور اعمال کنید:

1. **image جدید ادمین** را در CI build و push کنید (به‌خاطر تغییر healthcheck + سرور SPA).
2. روی سرور این فایل‌ها را به‌روزرسانی کنید:
   - `docker/Caddyfile`  (پورت‌های قابل‌تنظیم + بلوک reverse_proxy جدید ادمین)
   - `docker/docker-compose.yml` و `docker/docker-compose.prod.yml` (حذف volume ادمین + healthcheck + پورت ادمین)
3. در `/opt/kurdmap/docker/.env` متغیر `ADMIN_PORT` را اضافه کنید (بخش ۷).
4. پورت‌های upstream کدی را با سرور هماهنگ کنید (بخش ۸) — **این همان رفع 503 است**.
5. image ها را pull و سرویس‌ها را با روش Zero-Downtime بالا بیاورید (بخش ۱۰).

---

## 4) ساختار نهایی فولدر روی سرور

```text
/opt/kurdmap/
  docker/
    docker-compose.yml
    docker-compose.prod.yml
    Caddyfile
    backup.sh
    .env.production.example      (template)
    .env                         (secrets واقعی، chmod 600)
  backups/

/etc/caddy/Caddyfile             (فایل اصلی هاست؛ شامل import مربوط به KurdMap)
/etc/systemd/system/caddy.service.d/kurdmap.conf   (اختیاری: EnvironmentFile پورت‌ها)
/var/log/caddy/
  kurdmap-frontend.log
  kurdmap-admin.log
  kurdmap-api.log
```

> توجه: مسیر `/var/www/kurdmap-admin` **دیگر لازم نیست** و باید حذف شود (معماری استاتیک قدیمی).

---

## 5) فایل‌های `docker/` — وضعیت فعلی هرکدام

| فایل | نقش در Production | نکته |
|---|---|---|
| `docker-compose.yml` | Base تمام سرویس‌ها | volume `admin-static` حذف شد |
| `docker-compose.prod.yml` | Overlay امنیتی production | ادمین حالا پورت loopback publish می‌کند، `read_only` می‌ماند |
| `Caddyfile` | Reverse proxy + امنیت | upstreamها از Environment خوانده می‌شوند |
| `admin-server.py` | سرور SPA ادمین (داخل image) | noindex + robots.txt + SPA fallback |
| `backup.sh` | بکاپ DB | با cron زمان‌بندی شود |
| `.env.production.example` | template متغیرها | شامل `ADMIN_PORT` |

---

## 6) Caddyfile — وضعیت Enterprise

ویژگی‌های فعال:
1. HTTPS خودکار (Caddy + site block دامنه‌ای).
2. Security Headers کامل: HSTS (`max-age=63072000; includeSubDomains; preload`),
   `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` سخت‌گیرانه.
3. CSP برای frontend/admin.
4. هدر `X-Robots-Tag: noindex` اختصاصی برای ادمین (snippet `kurdmap_noindex`).
5. Compression: `zstd gzip` (در هر سه سایت). → بنابراین فشرده‌سازی در سطح اپ (Express/ASP.NET)
   لازم نیست و نباید اضافه شود (افزونگی).
6. Logging: JSON + log rotation.
7. API Body Limit: `10MB`.
8. هدرهای reverse proxy استاندارد (`X-Real-IP` و `X-Forwarded-*`).

نکتهٔ Multi-Site: import باید در `/etc/caddy/Caddyfile` اصلی هاست باشد:
```caddy
import /opt/kurdmap/docker/Caddyfile*
```
(ستارهٔ انتهایی باعث می‌شود اگر فایل نبود، Caddy کرش نکند.)

---

## 7) `.env` Production — متغیرها (کامل)

> الگوی آماده: `docker/.env.production.example`. روی سرور `.env` بسازید و `chmod 600` کنید.

متغیرهای کلیدی (علاوه بر مقادیر قبلی):

| متغیر | توضیح |
|---|---|
| `GHCR_USERNAME` | یوزر GHCR، **حتماً lowercase** |
| `FRONTEND_URL` / `ADMIN_URL` / `API_URL` | برای CORS و JWT |
| `API_DOMAIN` | برای `AllowedHosts` در ASP.NET |
| `API_PORT` | پورت loopback سرویس API روی هاست |
| `FRONTEND_PORT` | پورت loopback سرویس Frontend روی هاست |
| **`ADMIN_PORT`** | **جدید** — پورت loopback ادمین (پیش‌فرض `4001`)؛ باید با upstream کدی یکی باشد |
| `FRONTEND_ALLOWED_HOSTS` | میزبان‌های مجاز SSR (وگرنه 503) |
| `API_ALLOWED_HOSTS` | HostFiltering ASP.NET (شامل `localhost;api;kurdmap-api`) |
| `POSTGRES_*` / `REDIS_PASSWORD` / `JWT_*` | سکرت‌ها |
| `SEED_ADMIN_*` | فقط برای bootstrap اولین ادمین |

---

## 8) ⭐ پورت‌های Caddy روی هاست چند-پروژه‌ای (رفع همیشگی 503)

این مهم‌ترین بخش پایداری است. روی این سرور چند stack هم‌زمان اجرا می‌شوند، پس پورت‌های
پیش‌فرض `4000` و `8080` ممکن است اشغال باشند (مثلاً `8080` را `kozad-web` گرفته). به همین
دلیل KurdMap روی پورت‌های غیرپیش‌فرض publish شده است:

| سرویس | پورت host واقعی (نمونهٔ این سرور) | پیش‌فرض ریپو |
|---|---|---|
| frontend | `127.0.0.1:5400` | 4000 |
| api | `127.0.0.1:5180` | 8080 |
| admin | `127.0.0.1:4001` | 4001 |

Caddyfile حالا upstream را از Environment می‌خواند (با fallback به مقادیر پیش‌فرض):
```
reverse_proxy {$KURDMAP_FRONTEND_UPSTREAM:localhost:4000}   # kurdmap.eu
reverse_proxy {$KURDMAP_ADMIN_UPSTREAM:localhost:4001}      # gs6x.kurdmap.eu
reverse_proxy {$KURDMAP_API_UPSTREAM:localhost:8080}        # gs6xapi.kurdmap.eu
```

### راه‌حل پیشنهادی (حرفه‌ای، پایدار): systemd drop-in برای Caddy

یک فایل env کنار پروژه بسازید:
```bash
sudo tee /opt/kurdmap/docker/caddy.upstreams.env >/dev/null <<'EOF'
KURDMAP_FRONTEND_UPSTREAM=localhost:5400
KURDMAP_ADMIN_UPSTREAM=localhost:4001
KURDMAP_API_UPSTREAM=localhost:5180
EOF
```
سپس به سرویس Caddy تزریقش کنید:
```bash
sudo mkdir -p /etc/systemd/system/caddy.service.d
sudo tee /etc/systemd/system/caddy.service.d/kurdmap.conf >/dev/null <<'EOF'
[Service]
EnvironmentFile=/opt/kurdmap/docker/caddy.upstreams.env
EOF
sudo systemctl daemon-reload
sudo systemctl restart caddy
```

مزیت: پورت‌ها فقط در **یک‌جا** تعریف می‌شوند و دیگر هیچ‌وقت 503 ناشی از mismatch رخ نمی‌دهد؛
خود `Caddyfile` بدون تغییر روی همهٔ سرورها قابل‌استفاده می‌ماند.

### راه‌حل ساده (جایگزین): هم‌تراز کردن پورت‌ها
اگر پورت‌های `4000/8080/4001` روی هاست آزاد باشند، در `.env` همان‌ها را بگذارید
(`FRONTEND_PORT=4000`, `API_PORT=8080`, `ADMIN_PORT=4001`) تا با پیش‌فرض Caddy یکی شوند.
چون `8080` اینجا اشغال است، **راه‌حل systemd بالا ترجیح دارد**.

### تأیید سریع پورت‌ها قبل از reload کدی
```bash
ss -tlnp | grep -E '127.0.0.1:(5400|5180|4001)'   # باید هر سه LISTEN باشند
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5180/health   # api
curl -I http://127.0.0.1:4001                                              # admin -> 200 + X-Robots-Tag
```

---

## 9) Healthcheck ها (وضعیت فعلی)

| سرویس | Healthcheck | نکته |
|---|---|---|
| postgres | `pg_isready` | OK |
| redis | `redis-cli ping` | OK |
| api | wget به `/health` | image Debian است، `wget` کامل دارد |
| **admin** | **`python3` urllib به `:8080/`** | **Alpine است؛ از wget --spider استفاده نکنید** |
| frontend | `node fetch` به `:4000` | OK |

> درس مهم: healthcheck را با ابزاری بنویسید که **قطعاً داخل همان image هست**. برای ادمین
> Alpine، `python3` هست ولی `wget --spider` کار نمی‌کند.

---

## 10) ⭐ Deploy و Update بدون قطعی (Zero / Near-Zero Downtime)

هدف: کاربر هرگز سایت down نبیند. اصول:

1. **همیشه اول pull، بعد up** — تا کانتینر قدیمی تا لحظهٔ آخر بالا بماند.
2. **هرگز `down` کامل نزنید** برای یک آپدیت معمولی. فقط سرویس هدف را recreate کنید.
3. **DB را جدا و با احتیاط** آپدیت کنید (Migration؛ بخش ۱۱).
4. Caddy با active health-check، فقط وقتی upstream جدید سالم شد به آن ترافیک می‌دهد.

### 10.1 آپدیت یک سرویس بدون قطعی (مثلاً frontend یا admin)
```bash
cd /opt/kurdmap/docker

# 1) فقط image جدید را بکش (کانتینر فعلی هنوز بالا و در حال سرویس‌دهی است)
podman pull ghcr.io/<user-lowercase>/kurdmap-frontend:latest

# 2) فقط همان سرویس را با image جدید جایگزین کن
podman compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build frontend

# 3) سلامت را تأیید کن (تا healthy نشده، تمام نشده فرض نکن)
podman ps --format '{{.Names}}\t{{.Status}}' | grep kurdmap-frontend
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5400/   # یا پورت واقعی
```
> در این روش فقط همان کانتینر برای چند ثانیه recreate می‌شود؛ بقیهٔ سرویس‌ها دست‌نخورده
> می‌مانند. Caddy تا سالم‌شدن upstream جدید، خطای gateway را کوتاه نگه می‌دارد.

### 10.2 آپدیت همهٔ سرویس‌های اپ (بدون لمس DB/Redis)
```bash
cd /opt/kurdmap/docker
for img in api admin frontend; do
  podman pull ghcr.io/<user-lowercase>/kurdmap-$img:latest
done
# فقط سرویس‌های اپ را recreate کن؛ postgres/redis دست‌نخورده می‌مانند
podman compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build api admin frontend
```

### 10.3 اگر `podman-compose` خطای «dependent containers» داد
این خطا بی‌خطر است. اگر گیر کرد، فقط سرویس هدف را به‌صورت atomic جایگزین کنید:
```bash
podman pull ghcr.io/<user-lowercase>/kurdmap-admin:latest
podman rm -f kurdmap-admin
podman compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build admin
```
> چون postgres/redis/api را دست نمی‌زنید، سایت برای کاربرانی که در حال استفاده‌اند تقریباً
> بدون اختلال می‌ماند.

### 10.4 Rollback سریع (در صورت خرابی نسخهٔ جدید)
image قبلی را با digest نگه دارید و به آن برگردید:
```bash
# قبل از deploy، digest نسخهٔ سالم فعلی را یادداشت کنید:
podman image inspect ghcr.io/<user-lowercase>/kurdmap-api:latest -f '{{.Digest}}'
# برای rollback، با همان digest اجرا کنید (به‌جای latest):
#   image: ghcr.io/<user>/kurdmap-api@sha256:<digest>
```
> پیشنهاد قوی: در CI به‌جای فقط `:latest`، تگ نسخه‌دار (مثل `:2026-06-06` یا SHA کامیت) هم
> push کنید تا rollback قطعی و بدون ابهام باشد.

---

## 11) ⚠️ Migration دیتابیس هنگام Deploy (داده‌ها نباید آسیب ببینند)

یک مهاجرت جدید به ریپو اضافه شده است: **`AddBusinessSearchIndexes`** که دو ایندکس می‌سازد:
- `ix_businesses_city_id` روی `businesses(city_id)`
- ایندکس GIN تمام‌متنی `ix_businesses_search` (که قبلاً فقط در کامنت بود و هیچ‌وقت ساخته
  نشده بود → جستجو sequential-scan می‌کرد).

نحوهٔ اجرا روی production:
- پروژه یک `KurdMap.Migrator` (hosted service) دارد که در startup مهاجرت‌ها را اعمال می‌کند؛
  بنابراین صرفِ آپدیت image API و بالا آمدنش معمولاً کافی است.
- اگر مهاجرت‌ها را دستی می‌زنید، **اول backup بگیرید**، بعد اعمال کنید:
  ```bash
  bash /opt/kurdmap/docker/backup.sh        # backup قبل از هر تغییر schema
  # سپس API جدید را بالا بیاورید تا migration اجرا شود (یا dotnet ef database update)
  ```
- چون این مهاجرت فقط **ایندکس** اضافه می‌کند (نه drop/alter مخرب)، روی داده‌های موجود امن
  است. ایندکس GIN با `CREATE INDEX IF NOT EXISTS` ساخته می‌شود.

قانون طلایی: **قبل از هر deploy که schema را تغییر می‌دهد، حتماً backup بگیرید** و ترتیب
درست را رعایت کنید (اول migration سازگار-با-عقب، بعد کد جدید).

---

## 12) Deploy گام‌به‌گام (نصب اولیه روی سرور تازه)

### 12.1 پیش‌نیاز
1. Podman + podman compose نصب باشد.
2. Caddy روی host نصب و فعال باشد.
3. DNS دامنه‌ها (`kurdmap.eu`, `gs6x.kurdmap.eu`, `gs6xapi.kurdmap.eu`) به سرور اشاره کنند.
4. کاربر deploy به `/opt/kurdmap` دسترسی داشته باشد.

### 12.2 ساختار مسیر
```bash
sudo mkdir -p /opt/kurdmap/docker /opt/kurdmap/backups
sudo chown -R "$USER:$USER" /opt/kurdmap
```

### 12.3 کپی فایل‌ها (فقط فایل‌های بخش ۳.۱)
`docker-compose.yml`, `docker-compose.prod.yml`, `Caddyfile`, `backup.sh`, `.env.production.example`

### 12.4 ساخت `.env`
```bash
cd /opt/kurdmap/docker
cp .env.production.example .env
nano .env          # مقادیر واقعی + ADMIN_PORT را تنظیم کنید
chmod 600 .env
chmod +x backup.sh
```

### 12.5 تنظیم Caddy هاست + پورت‌ها (بخش ۸)
```bash
# در /etc/caddy/Caddyfile:
#   import /opt/kurdmap/docker/Caddyfile*
# سپس systemd drop-in پورت‌ها (بخش ۸) را بسازید و:
sudo systemctl daemon-reload
sudo systemctl restart caddy
sudo systemctl status caddy --no-pager
```
> اگر بعد از هر deploy فایل `Caddyfile` را overwrite می‌کنید، مالکیت/دسترسی را بازنشانی کنید:
> ```bash
> sudo chgrp caddy /opt/kurdmap/docker/Caddyfile && sudo chmod 640 /opt/kurdmap/docker/Caddyfile
> sudo systemctl reload caddy
> ```

### 12.6 Login و Pull
```bash
cd /opt/kurdmap/docker
echo "<TOKEN>" | podman login ghcr.io -u <user-lowercase> --password-stdin
for img in api admin frontend; do podman pull ghcr.io/<user-lowercase>/kurdmap-$img:latest; done
```

### 12.7 بالا آوردن سرویس‌ها (نصب اولیه)
```bash
cd /opt/kurdmap/docker
podman compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build
podman compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### 12.8 Health Check نهایی
```bash
curl -fsS http://127.0.0.1:5180/health     # api (پورت واقعی)
curl -I   http://127.0.0.1:5400            # frontend -> 400 طبیعی است (یعنی بالاست)
curl -I   http://127.0.0.1:4001            # admin -> 200 + X-Robots-Tag

curl -I https://kurdmap.eu
curl -I https://gs6x.kurdmap.eu
curl -I https://gs6xapi.kurdmap.eu/health
```

---

## 13) ساخت کاربر / ادمین بعد از Deploy

### 13.1 ثبت کاربر عادی (API)
- endpoint: `POST /api/auth/register`
- فیلدها: `Email` (الزامی), `Password` (الزامی), `FullName` (اختیاری),
  `ConfirmPassword` (اختیاری، اگر ارسال شد باید برابر Password باشد). نقش پیش‌فرض: `User`.
```bash
curl -X POST "https://gs6xapi.kurdmap.eu/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"StrongPass123!","fullName":"New User","confirmPassword":"StrongPass123!"}'
```

### 13.2 ادمین اولیه
- در startup، اگر هیچ کاربری نباشد، role ها و default admin به‌صورت خودکار seed می‌شوند
  (از `SEED_ADMIN_*` در `.env`). این کار از طریق app startup انجام می‌شود، نه SQL دستی.
- ادمین‌های بعدی از مسیر مدیریتی پنل/API ساخته شوند.
- `seed-data.sql` فقط دادهٔ کسب‌وکار/منو/ریویوی تستی است و برای production الزامی نیست.

---

## 14) Troubleshooting (بر اساس خطاهای واقعی)

| علامت | علت محتمل | راه‌حل |
|---|---|---|
| `gs6x.kurdmap.eu` → 404 | معماری قدیمی استاتیک / مسیر host نبود | معماری جدید reverse_proxy (همین سند) |
| `https://kurdmap.eu` → 503 | mismatch پورت upstream در Caddy | بخش ۸ (env پورت‌ها یا هم‌ترازی) |
| `kurdmap-admin` → unhealthy ولی curl=200 | wget busybox روی Alpine | healthcheck با python3 (بخش ۹) |
| `curl 127.0.0.1:<frontend>` → 400 | رد Host=127.0.0.1 توسط SSR | **طبیعی است**؛ یعنی سرویس بالاست |
| `podman compose down` → dependent containers | رفتار podman-compose | بخش ۱۰.۳ (recreate سرویس هدف) |
| `repository name must be lowercase` | username بزرگ در GHCR | lowercase اجباری در CI |
| API لاگ: `Failed to determine https port` | پشت reverse proxy، طبیعی | بی‌خطر؛ TLS را Caddy می‌بندد |

---

## 15) پیشنهادها و ایده‌ها (Roadmap پایداری و DevOps حرفه‌ای)

اولویت‌بندی‌شده از «سریع و مهم» تا «بلندمدت»:

### اولویت ۱ — پایداری فوری
1. **تگ نسخه‌دار image** (به‌جای فقط `latest`): `:<git-sha>` یا تاریخ، برای rollback قطعی.
2. **systemd drop-in پورت‌های Caddy** (بخش ۸) تا 503 برای همیشه حذف شود.
3. **backup خودکار با cron** + تست بازیابی دوره‌ای:
   ```bash
   # crontab کاربر deploy
   0 3 * * * /opt/kurdmap/docker/backup.sh >> /opt/kurdmap/backups/backup.log 2>&1
   ```
4. **Healthcheck‌ها را در CI smoke-test کنید** تا دوباره مثل ادمین `unhealthy` نشوند.

### اولویت ۲ — مشاهده‌پذیری (Observability)
5. **Uptime monitoring** خارجی (UptimeRobot/Healthchecks.io) روی هر سه دامنه + alert.
6. **متمرکزسازی لاگ** (Seq/Loki) — `SEQ_URL` از قبل در env هست؛ فعالش کنید.
7. **Dashboard منابع** (cAdvisor/node-exporter + Grafana) برای دیدن مصرف هر کانتینر.

### اولویت ۳ — Hardening و قابلیت‌اطمینان
8. **Quadlet / systemd-managed Podman**: تبدیل سرویس‌ها به unit های systemd (Quadlet) تا
   resource limits واقعاً enforce شوند (در `podman-compose` بسیاری از `deploy.resources`
   تضمین نمی‌شوند) و auto-restart مدیریت‌شده داشته باشید.
9. **Pin کردن image با digest** (`@sha256:...`) برای جلوگیری از pull ناخواستهٔ نسخهٔ خراب.
10. **Rate limiting / WAF سبک در Caddy** برای endpoint های حساس (login/register).
11. **فقط در صورت نیاز، fail2ban** روی لاگ‌های JSON کدی برای IP های مخرب.

### اولویت ۴ — فرآیند Deploy
12. **اسکریپت deploy تک‌فرمانی** (`deploy.sh`) که: pull → up سرویس به سرویس → health-check →
    در صورت ناسالمی rollback. (Near-zero-downtime تضمین‌شده.)
13. **Blue/Green ساده** برای frontend/admin: دو کانتینر موازی روی دو پورت و سوییچ upstream در
    Caddy؛ صفر قطعی واقعی.
14. **Migration جدا از deploy کد**: مرحلهٔ migration را به یک job مستقل تبدیل کنید (backup →
    migrate → سپس rollout کد) تا تغییرات schema هیچ‌وقت با rollout هم‌زمان ریسک نسازد.
15. **محافظت از volume های داده**: `pgdata`/`redisdata` هرگز در هیچ اسکریپتی prune نشوند؛
    دستور `podman volume prune` را در runbookها صریحاً ممنوع کنید.

---

## 16) جمع‌بندی وضعیت Production Readiness

1. معماری شبکه و ایزوله‌سازی سرویس‌ها قوی است (loopback + backend-net internal).
2. ادمین حالا مثل frontend سرو می‌شود، در گوگل ایندکس نمی‌شود، و فقط با لینک در دسترس است.
3. علت ریشه‌ای ۴۰۴ ادمین، ۵۰۳ فرانت‌اند، و unhealthy ادمین شناسایی و رفع شد.
4. Caddyfile حالا قابل‌حمل و مقاوم در برابر mismatch پورت است.
5. مسیر Zero/Near-Zero Downtime برای آپدیت‌ها مستند شد تا سایت برای کاربران پایدار بماند.
6. گام بعدی پیشنهادی: تگ نسخه‌دار + systemd drop-in پورت‌ها + backup cron + monitoring خارجی.
