# KurdMap — پیکربندی امنیتی Enterprise (وب‌سایت + پنل ادمین)

تاریخ: 2026-06-06
نگارش: v1
وضعیت: راهنمای عملیاتی + چک‌لیست اجرایی

> این سند دقیقاً می‌گوید **چه چیزی در کد اصلاح شد** و **چه کارهایی را شما باید روی سرور
> انجام دهید** تا وب‌سایت و پنل ادمین در بالاترین سطح امنیتی Enterprise قرار بگیرند و
> برای همیشه پایدار بمانند.

---

## 0) خلاصهٔ اجرایی (TL;DR)

- مشکل: در `kurdmap-admin/.../environment.prod.ts` آدرس API به‌صورت **هاردکد**
  (`https://gs6xapi.kurdmap.eu`) نوشته شده بود.
- اصلاح: پنل ادمین حالا **Same-Origin** است. مقدار `apiUrl` در prod به `''` (مسیر نسبی)
  تغییر کرد و Caddy مسیر `/api/*` روی `gs6x.kurdmap.eu` را به کانتینر API هدایت می‌کند.
- نتیجهٔ امنیتی: باندل ادمین **هیچ آدرس API خارجی** ندارد، **هیچ درخواست cross-origin**
  نمی‌زند (سطح حملهٔ CORS حذف شد) و origin واقعی API در جاوااسکریپت لو نمی‌رود.
- کارهای شما: ساخت image جدید ادمین، به‌روزرسانی `Caddyfile` روی سرور، و اجرای چک‌لیست
  بخش‌های ۴ تا ۹.

---

## 1) درک درست فایل‌های Environment (نکتهٔ مهم)

در Angular، فایل‌های environment در **زمان build** جایگزین می‌شوند. این رفتار از قبل درست
تنظیم شده است:

- `src/environments/environment.ts` → فقط برای **Local/Dev** (`ng serve`). مقدار
  `apiUrl: 'http://localhost:8080'` فقط روی دستگاه شما استفاده می‌شود و **هرگز** در نسخهٔ
  production نمی‌رود.
- `src/environments/environment.prod.ts` → فقط برای **Production** (build با
  `--configuration production`). در `angular.json` با `fileReplacements` جایگزین می‌شود.

پس وجود `localhost` در `environment.ts` یک اشکال امنیتی نیست؛ آن فایل اصلاً وارد production
نمی‌شود. اشکال واقعی، هاردکد بودن آدرس **خارجی** در فایل prod بود که اصلاح شد.

### وضعیت فعلی (درست و امن)

| اپ | فایل dev | فایل prod | الگوی prod |
|---|---|---|---|
| Frontend | `http://localhost:8080/api/v1` | `/api/v1` (نسبی) | Same-Origin از قبل ✅ |
| Admin | `http://localhost:8080` | `''` (نسبی) — **اصلاح‌شده** | Same-Origin ✅ |

> هر دو اپ در production آدرس API را **هاردکد نمی‌کنند** و همه‌چیز از طریق Caddy روی همان
> دامنه پراکسی می‌شود.

---

## 2) معماری Same-Origin پنل ادمین (بعد از اصلاح)

```text
Browser ──https──> gs6x.kurdmap.eu ──┬── /api/*  → (Caddy) → API container (localhost:API_PORT)
                                     └── /*      → (Caddy) → Admin SPA server (localhost:ADMIN_PORT)
```

- مرورگر فقط با `gs6x.kurdmap.eu` حرف می‌زند → از دید مرورگر همه‌چیز same-origin است.
- Caddy داخلی، `/api/*` را به API می‌فرستد و Host را به `localhost` بازنویسی می‌کند تا
  HostFiltering در ASP.NET رد نکند.
- توکن‌های JWT توسط interceptor به‌صورت `Authorization: Bearer` اضافه می‌شوند (نه کوکی
  cross-site)، پس این تغییر هیچ بخشی از احراز هویت را نمی‌شکند.

مزایا:
1. حذف کامل سطح حملهٔ CORS برای پنل ادمین.
2. عدم افشای origin واقعی API در باندل جاوااسکریپت.
3. سازگاری با CSP سخت‌گیرانه (`connect-src 'self'`).

---

## 3) چه چیزی در کد تغییر کرد (انجام‌شده ✅)

1. `src/kurdmap-admin/src/environments/environment.prod.ts`
   - `apiUrl: 'https://gs6xapi.kurdmap.eu'` → `apiUrl: ''` (مسیر نسبی same-origin).
2. `docker/Caddyfile` — بلوک `gs6x.kurdmap.eu`
   - افزودن `handle /api/* { reverse_proxy API ... header_up Host "localhost" }`
   - بقیهٔ مسیرها → `handle { reverse_proxy ADMIN ... }`
   - (همچنین دو خطای نگارشی Caddy که سرویس را می‌شکست رفع شد: خط reverse_proxy فرانت‌اند و
     کامنت snippet `kurdmap_noindex`.)

> این تغییرات نیاز به **build مجدد image ادمین** دارند (چون `apiUrl` در زمان build داخل
> باندل می‌نشیند).

---

## 4) کارهای شما روی سرور (Deploy این تغییر)

1. در CI، image ادمین را دوباره build و push کنید (تا `apiUrl=''` در باندل بنشیند).
2. فایل `docker/Caddyfile` را روی سرور به‌روزرسانی کنید:
   ```bash
   # بعد از کپی فایل جدید:
   sudo chgrp caddy /opt/kurdmap/docker/Caddyfile && sudo chmod 640 /opt/kurdmap/docker/Caddyfile
   sudo systemctl reload caddy
   ```
3. image جدید ادمین را با روش بدون‌قطعی بالا بیاورید:
   ```bash
   cd /opt/kurdmap/docker
   podman pull ghcr.io/<user-lowercase>/kurdmap-admin:latest
   podman compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build admin
   ```
4. تأیید:
   ```bash
   curl -I https://gs6x.kurdmap.eu                      # 200 + X-Robots-Tag
   curl -I https://gs6x.kurdmap.eu/api/v1/categories    # نباید 404 SPA بدهد؛ باید به API برسد
   ```
   سپس در مرورگر login کنید و مطمئن شوید درخواست‌ها به `gs6x.kurdmap.eu/api/...` می‌روند
   (نه `gs6xapi`).

---

## 5) سخت‌سازی API (.NET) — اقدامات شما

1. **CORS را محدود کنید.** چون ادمین دیگر same-origin است، origin آن لازم نیست. در
   `.env` فقط دامنهٔ frontend را نگه دارید (اگر frontend نیاز cross-origin دارد):
   - `FRONTEND_URL=https://kurdmap.eu`
   - `ADMIN_URL` را می‌توانید حذف یا بی‌اثر کنید (هیچ درخواست cross-origin ادمینی نمی‌آید).
2. **HostFiltering** را تنگ نگه دارید: `API_ALLOWED_HOSTS=localhost;api;kurdmap-api`.
   هیچ‌وقت `*` نگذارید.
3. **JWT**:
   - `JWT_SECRET` باید واقعاً تصادفی و حداقل ۴۸ بایت باشد: `openssl rand -base64 48`.
   - `JWT_ISSUER` و `JWT_AUDIENCE` را دقیق و ثابت نگه دارید.
   - عمر access token کوتاه (مثلاً ۱۵–۶۰ دقیقه) + refresh token چرخشی (از قبل پیاده شده).
4. **Rate limiting** برای endpoint های حساس (`/api/auth/login`, `/api/auth/register`).
   اگر در API نیست، در Caddy اضافه کنید (بخش ۷.۳).
5. **پاسخ‌های خطا** نباید جزئیات داخلی (stack trace) بدهند؛ در Production مطمئن شوید
   `ASPNETCORE_ENVIRONMENT=Production` است (هست).
6. **Logging**: `Serilog__MinimumLevel__Default=Warning` (هست). لاگ احراز هویت ناموفق را
   نگه دارید تا برای fail2ban استفاده شود.

---

## 6) سخت‌سازی اختصاصی پنل ادمین

1. **عدم ایندکس در گوگل** (انجام‌شده): هدر `X-Robots-Tag: noindex` + `robots.txt`
   با `Disallow: /` در سرور ادمین و snippet `kurdmap_noindex` در Caddy. پنل فقط با لینک
   مستقیم پیدا می‌شود.
2. **۲FA/TOTP** (از قبل موجود): برای همهٔ حساب‌های ادمین، TOTP را **اجباری** کنید
   (مسیر totp-setup/totp-verify در ادمین موجود است).
3. **پسورد ادمین قوی**: `SEED_ADMIN_PASSWORD` را حتماً به یک مقدار قوی و یکتا تغییر دهید
   و بعد از اولین login آن را عوض کنید. مقدار نمونه را هرگز در production نگه ندارید.
4. **(اختیاری، توصیه‌شده) محدودسازی دسترسی به پنل با IP Allowlist** در Caddy:
   ```caddy
   gs6x.kurdmap.eu {
       @blocked not remote_ip 1.2.3.4 5.6.7.0/24   # IP های مجاز شما
       respond @blocked "Not found" 404
       # ... بقیهٔ بلوک (handle /api/* و handle) ...
   }
   ```
   این کار پنل را عملاً از دید عموم پنهان می‌کند (حتی URL هم کافی نیست).
5. **(اختیاری) Basic Auth لایهٔ دوم** جلوی صفحهٔ ادمین (قبل از login اپ) برای دفاع در عمق:
   ```caddy
   basic_auth {
       admin <bcrypt-hash>   # با: caddy hash-password
   }
   ```
6. **خروج خودکار**: مطمئن شوید نشست‌های بی‌فعالیت منقضی می‌شوند (refresh token TTL).

---

## 7) سخت‌سازی Caddy / لبه (Edge)

### 7.1 هدرهای امنیتی (انجام‌شده)
HSTS preload, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy`, `Permissions-Policy` سخت‌گیرانه، حذف `Server`/`X-Powered-By`، و CSP.

### 7.2 سخت‌تر کردن CSP (اختیاری ولی توصیه‌شده)
CSP فعلی برای سازگاری `script-src 'unsafe-inline'` دارد. برای سطح بالاتر، در صورت امکان به
**nonce/hash-based CSP** مهاجرت کنید تا `'unsafe-inline'` حذف شود (نیازمند تنظیم build
Angular). این یک بهبود میان‌مدت است.

### 7.3 Rate limiting در لبه (اگر در API نیست)
با ماژول `rate_limit` کدی (یا یک reverse proxy جلوتر) نرخ `/api/auth/*` را محدود کنید تا
brute-force سخت شود.

### 7.4 پورت‌های upstream
حتماً طبق سند Deploy، پورت‌های `KURDMAP_*_UPSTREAM` را با پورت‌های واقعی publish هماهنگ
کنید تا 503 رخ ندهد (systemd drop-in).

---

## 8) سخت‌سازی سرور و شبکه (Host)

1. **Firewall**: فقط ۴۴۳/۸۰ (و SSH محدود) باز باشد. سرویس‌ها روی `127.0.0.1` bind شده‌اند
   (هست) پس از بیرون مستقیماً قابل دسترسی نیستند.
2. **SSH**: فقط با کلید، غیرفعال‌کردن root login و password auth.
3. **fail2ban**: روی لاگ‌های SSH و لاگ JSON ادمین/API برای IP های مهاجم.
4. **به‌روزرسانی خودکار امنیتی** سیستم‌عامل (مثلاً `dnf-automatic` در Rocky/RHEL).
5. **Rootless Podman** (هست): daemon روت ندارد.
6. **شبکهٔ داخلی** (هست): `backend-net` با `internal: true` → DB/Redis بدون اینترنت.
7. **منابع**: برای enforce واقعی resource limits، به Quadlet/systemd مهاجرت کنید
   (در `podman-compose` بسیاری از `deploy.resources` تضمین نمی‌شوند).

---

## 9) مدیریت Secrets و داده

1. فایل `.env` روی سرور: `chmod 600` و **هرگز** در گیت نرود.
2. مقادیر نمونهٔ `CHANGE_ME` و پسوردهای داخل `.env.production.example` را **حتماً** عوض
   کنید (این فایل فقط template است).
3. سکرت‌ها را به‌صورت دوره‌ای **چرخش** دهید (JWT_SECRET، پسورد DB/Redis، SMTP).
4. **Backup**: `backup.sh` را با cron زمان‌بندی و بازیابی را تست کنید. volume های
   `pgdata`/`redisdata` را هرگز prune نکنید.
5. اگر روزی سکرت‌ها در گیت history لو رفتند، آن‌ها را **باطل و جایگزین** کنید (rotate)،
   صرفِ حذف از فایل کافی نیست.

> ⚠️ هشدار: فایل `docker/.env.production.example` در ریپو شامل مقادیر واقعی‌نما برای
> `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET` است. اگر این‌ها سکرت‌های واقعی
> production هستند، **همین حالا روی سرور rotate کنید** و در ریپو فقط placeholder بگذارید.

---

## 10) چک‌لیست نهایی امنیتی (Enterprise)

کد/اپ:
- [x] حذف آدرس API هاردکد از پنل ادمین (same-origin).
- [x] Frontend و Admin هر دو در prod آدرس نسبی دارند.
- [x] هدرهای امنیتی + CSP در Caddy.
- [x] noindex کامل برای پنل ادمین.
- [ ] مهاجرت CSP به nonce-based (حذف `'unsafe-inline'`) — میان‌مدت.

API:
- [ ] CORS فقط برای frontend (حذف ADMIN_URL).
- [ ] `JWT_SECRET` قوی و چرخش‌شده.
- [ ] Rate limiting روی `/api/auth/*`.
- [x] HostFiltering محدود.

ادمین:
- [ ] TOTP اجباری برای همهٔ ادمین‌ها.
- [ ] `SEED_ADMIN_PASSWORD` قوی و تعویض‌شده بعد از اولین ورود.
- [ ] (توصیه) IP allowlist روی `gs6x.kurdmap.eu`.

سرور:
- [ ] Firewall فقط 443/80 + SSH محدود.
- [ ] SSH فقط با کلید، بدون root/password.
- [ ] fail2ban.
- [ ] به‌روزرسانی خودکار امنیتی.

Secrets/داده:
- [ ] `.env` با `chmod 600`، خارج از گیت.
- [ ] سکرت‌های نمونه عوض‌شده و rotate.
- [ ] Backup خودکار + تست بازیابی.

---

## 11) ساخت/رجستر کاربر از ترمینال سرور (تست‌شده ✅)

برای ساخت کاربر مستقیماً از ترمینال لینوکس سرور، اسکریپت
[docker/register-user.sh](../../docker/register-user.sh) آماده است. این اسکریپت از همان
مسیر امن API عبور می‌کند (هش پسورد، rate-limit و brute-force دقیقاً مثل اپ اعمال می‌شود) و
در صورت نیاز نقش (Admin/SuperAdmin/Moderator) را در دیتابیس می‌دهد — چون endpoint عمومی
`/api/auth/register` فقط نقش «User» می‌دهد (که درست و امن است).

```bash
cd /opt/kurdmap/docker

# کاربر معمولی (نقش User)
./register-user.sh user@kurdmap.eu

# کاربر ادمین (ثبت + ارتقای نقش Admin در دیتابیس)
./register-user.sh admin2@kurdmap.eu Admin

# کاملاً تعاملی
./register-user.sh
```

نکات کلیدی که در اسکریپت رعایت شده و **تست واقعی** شده‌اند:
- پسورد با `read -s` خوانده می‌شود و **هرگز** به‌صورت آرگومان پاس نمی‌شود (به history/process
  list لو نمی‌رود).
- درخواست‌ها هدر `Host: localhost` دارند، چون API روی HostFiltering است؛ بدون این هدر
  پاسخ **400** می‌گیرید (در تست تأیید شد: بدون Host → 400، با Host: localhost → 200).
- سیاست پسورد سمت اسکریپت با Identity هماهنگ است (حداقل ۸ کاراکتر، رقم، حروف کوچک و بزرگ).
- ارتقای نقش با psql و کوانتیزه‌سازی امن (`:'var'`) انجام می‌شود → بدون SQL injection. جداول
  `users`/`roles`/`user_roles` و ستون‌های PascalCase (`"NormalizedEmail"`, `"UserId"`).
- اجرای دوباره **idempotent** است (`ON CONFLICT DO NOTHING`).
- در پایان با login واقعی، اعتبار و نقش‌ها را راستی‌آزمایی می‌کند.

> هشدار: endpoint احراز هویت سقف **۵ درخواست در دقیقه** دارد. اگر چند بار پشت‌سرهم اجرا کنید
> ممکن است `429 Too Many Requests` بگیرید (این یعنی rate-limiter درست کار می‌کند) — یک دقیقه
> صبر کنید. کاربر در این حالت هم ساخته شده است.

### روش جایگزین: اولین ادمین با Seed
اگر جدول users خالی باشد، در اولین بوت API یک ادمین از روی متغیرهای `SEED_ADMIN_*` ساخته
می‌شود (نقش‌های SuperAdmin + Admin). حتماً `SEED_ADMIN_PASSWORD` را قوی بگذارید و بعد از
اولین ورود تغییر دهید.

---

## 12) نتیجهٔ ممیزی Build/Test (.NET 10 — انجام‌شده ✅)

- SDK: `.NET 10.0.300`، همهٔ پروژه‌ها `net10.0`.
- `dotnet build -c Release` → **0 Warning / 0 Error**.
- `dotnet test -c Release` → **104/104 Passed** (auth, register, login، duplicate،
  businesses، categories، advertisements caching و ...).
- تست واقعی end-to-end رجستر روی Postgres واقعی: ثبت User، ارتقای Admin، login موفق،
  idempotency و HostFiltering (400/200) همگی تأیید شدند.

---

## 13) خلاصهٔ ممیزی امنیتی کد (وضعیت فعلی)

| حوزه | وضعیت | جزئیات |
|---|---|---|
| JWT امضا | ✅ قوی | HMAC-SHA**512**، secret حداقل ۳۲ کاراکتر (fail-fast در startup) |
| Refresh token | ✅ | ۶۴ بایت تصادفی (RNG)، چرخشی، قابل ابطال، کوکی `HttpOnly`+`Secure`+`SameSite=Strict` |
| سیاست پسورد | ✅ | حداقل ۸، رقم/حروف کوچک/بزرگ، ایمیل یکتا |
| Lockout | ✅ | ۶ تلاش ناموفق → ۱۵ دقیقه قفل |
| Brute-force | ✅ | میدلور IP-based روی endpointهای auth + لاگ امنیتی |
| Rate limiting | ✅ | global 200/min، auth **5/min**، upload 10/min، admin 30/min |
| CORS | ✅ | فقط origin‌های صریح، بدون wildcard |
| HostFiltering | ✅ | `localhost;api;kurdmap-api` (تأیید: Host اشتباه → 400) |
| هدرهای امنیتی | ✅ | میدلور اختصاصی + Caddy (HSTS/CSP/XFO/...) |
| مدیریت خطا | ✅ | میدلور سراسری، بدون نشت stack trace |
| Antiforgery/XSRF | ✅ | `X-XSRF-TOKEN` + کوکی `SameSite=Strict`/`Secure` |
| Token blacklist | ✅ | JTI پس از logout بی‌اعتبار می‌شود |
| لاگ امنیتی | ✅ | Serilog ساخت‌یافته + correlation id + IP/UA |
| Migration | ✅ | با retry، در Production در صورت خطا fail می‌کند |

نقاط بهبود باقی‌مانده (اولویت متوسط): مهاجرت CSP به nonce-based (حذف `'unsafe-inline'`)؛
تنگ‌کردن CORS با حذف `ADMIN_URL` (چون ادمین same-origin شد)؛ مهاجرت resource limits به
Quadlet/systemd.

---

## 14) راستی‌آزمایی بعد از Deploy

```bash
# پنل ادمین: same-origin و noindex
curl -sI https://gs6x.kurdmap.eu | grep -i x-robots-tag
curl -sI https://gs6x.kurdmap.eu/api/v1/categories | head -n 1   # نباید SPA fallback بدهد

# هدرهای امنیتی فرانت‌اند
curl -sI https://kurdmap.eu | grep -iE 'strict-transport|content-security|x-frame|x-content-type'

# نبودن پنل در ایندکس
curl -s https://gs6x.kurdmap.eu/robots.txt    # باید Disallow: / باشد
```

در DevTools مرورگر، تب Network هنگام کار با پنل: همهٔ درخواست‌ها باید به دامنهٔ
`gs6x.kurdmap.eu` بروند و هیچ درخواست cross-origin به `gs6xapi` دیده نشود.
