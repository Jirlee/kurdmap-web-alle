# KurdMap Deployment Audit (Hetzner Linux + Podman)

تاریخ Audit: 2026-06-05  
دامنه بررسی: فقط بر اساس فایل های واقعی پروژه در پوشه docker و فایل های مرتبط Deploy/API

## 1) Root Cause خطای اخیر CI/CD

خطای گزارش شده:

- Error: parsing reference "ghcr.io/***/kurdmap-api:latest": repository name must be lowercase

علت قطعی در فایل واقعی:

- در deploy workflow، pull از `${{ secrets.GHCR_USERNAME }}` انجام می شد و lowercase اجباری نداشت.
- مرجع: .github/workflows/deploy.yml (خطوط 205-207)

اصلاح انجام شده:

- GHCR username در مرحله Deploy به lowercase تبدیل شد و همان مقدار برای login/pull و .env استفاده می شود.

## 2) Audit کامل پوشه docker: چه چیزی باید روی سرور برود؟

### فایل های ضروری برای Production Server

این فایل ها باید روی سرور Hetzner منتقل شوند:

1. docker/docker-compose.yml
2. docker/docker-compose.prod.yml
3. docker/Caddyfile
4. docker/backup.sh
5. docker/.env.example (فقط به عنوان template)
6. docker/.env (فایل واقعی secrets روی سرور، از روی template ساخته می شود)

فایل های اختیاری (Operational):

1. docker/seed-data.sql فقط برای داده تست/دمو، نه برای Production دیتای واقعی
2. docker/Makefile برای راحتی دستورات (اختیاری)

### فایل هایی که Development هستند و نباید روی Production استفاده شوند

1. docker/docker-compose.override.yml
2. docker/start-dev.sh
3. docker/admin-dev-server.py
4. docker/api.Dockerfile
5. docker/admin.Dockerfile
6. docker/frontend.Dockerfile
7. docker/.env (نسخه Development محلی ریپو، نباید به سرور کپی شود)
8. docker/.dockerignore (فقط برای build context)
9. docker/seed-data.sql برای محیط واقعی production توصیه نمی شود (فقط در صورت نیاز کنترل شده)

## 3) ساختار نهایی پیشنهادی فولدر روی سرور

```text
/opt/kurdmap/
  docker/
    docker-compose.yml
    docker-compose.prod.yml
    Caddyfile
    backup.sh
    .env.example
    .env
  backups/
  logs/                 (اختیاری، اگر لاگ اپ جداگانه می خواهید)

/etc/caddy/Caddyfile   (فایل اصلی هاست، شامل import)
/var/www/kurdmap-admin (خروجی استاتیک پنل ادمین)
/var/log/caddy/
  kurdmap-frontend.log
  kurdmap-admin.log
  kurdmap-api.log
```

## 4) بررسی Caddyfile برای سرور Multi-Site

وضعیت: فایل فعلی از نظر معماری Multi-Site صحیح بود چون global options را داخل snippet نیاورده بود.  
اما برای Enterprise Readiness چند مورد مهم نیاز به ارتقا داشت:

1. CSP نداشت.
2. لاگ ها JSON نبودند.
3. هدرهای reverse proxy کامل نبودند.
4. کنترل cache برای admin static نداشت.

### نسخه نهایی Production/Enterprise

نسخه نهایی در فایل زیر اعمال شد:

- docker/Caddyfile

ویژگی های نسخه نهایی:

1. HTTPS: توسط Caddy و site block های دامنه ای فعال است.
2. Security Headers: کامل شد.
3. Reverse Proxy: header_up های استاندارد اضافه شد.
4. HSTS: فعال (`max-age=63072000; includeSubDomains; preload`).
5. CSP: برای frontend/admin اضافه شد.
6. X-Frame-Options: `DENY`.
7. X-Content-Type-Options: `nosniff`.
8. Referrer-Policy: `strict-origin-when-cross-origin`.
9. Permissions-Policy: سخت گیرانه تر شد.
10. Logging: JSON + log rotation.
11. Compression: `zstd gzip`.
12. API Body Limit: `10MB`.

نکته مهم Multi-Site:

- import باید در Caddy اصلی هاست باشد:

```caddy
import /opt/kurdmap/docker/Caddyfile*
```

## 5) بررسی docker-compose برای Podman Production

### نتیجه کلی

- ترکیب docker-compose.yml + docker-compose.prod.yml از نظر معماری امنیتی خوب است.
- ولی چند ریسک/نکته عملیاتی مهم وجود دارد.

### 5.1 Volumes

وضعیت:

1. `pgdata` درست است.
2. `redisdata` درست است.
3. `admin-static` درست است ولی نیاز به sync به `/var/www/kurdmap-admin` دارد (Caddy از host path می خواند).

ریسک:

- اگر sync انجام نشود، admin.kurdmap.de فایل جدید را سرو نمی کند.

### 5.2 Networks

وضعیت:

1. `backend-net` با `internal: true` صحیح و امن است.
2. API روی هر دو شبکه قرار دارد (لازم و درست).
3. DB/Redis host-exposed نیستند (در production overlay).

### 5.3 Healthcheck

وضعیت:

1. postgres: `pg_isready` مناسب.
2. redis: `redis-cli ping` مناسب.
3. api: `/health` مناسب.
4. admin: وجود `index.html` مناسب برای static publisher.
5. frontend: fetch localhost مناسب.

### 5.4 Restart Policy

- `unless-stopped` برای سرویس ها مناسب است.

### 5.5 Security

نکات مثبت:

1. read_only + tmpfs برای API/Frontend.
2. no-new-privileges.
3. cap_drop ALL.
4. pids_limit.
5. loopback bind روی 127.0.0.1.

نکته مهم Podman:

- بسیاری از تنظیمات `deploy.resources` در podman-compose ممکن است enforce نشوند. برای تضمین واقعی محدودیت منابع، بهتر است با systemd/quadlet یا گزینه های مستقیم runtime enforce شود.

## 6) مشکلات واقعی و ریسک های مشاهده شده (با نام فایل)

1. `.github/workflows/deploy.yml`:
   - GHCR username lowercase اجباری نداشت، باعث خطای pull می شد.
2. `.github/workflows/deploy.yml`:
   - مسیرهای sparse-checkout و SCP با ساختار واقعی repo همخوان نبودند (فایل های compose در docker/ هستند).
3. `docker/Caddyfile`:
   - قبل از اصلاح، CSP نداشت.
4. `docker/.env.example`:
   - شامل `SEED_ADMIN_PASSWORD` نمونه بود؛ برای production باید حتما جایگزین شود.
5. `docker/seed-data.sql`:
   - داده تستی و placeholder user IDs دارد؛ برای production واقعی مناسب نیست.
6. `docker/.env` محلی:
   - فایل development است و نباید روی سرور production استفاده/کپی شود.

## 7) .env Production کامل + توضیح متغیرها

فایل آماده شده:

- docker/.env.production.example

### توضیح متغیرها

1. `ENVIRONMENT`: محیط اجرای API (Production).
2. `APP_NAME`: نام برنامه.
3. `GHCR_USERNAME`: نام کاربری GitHub registry، حتما lowercase.
4. `FRONTEND_URL`: دامنه اصلی frontend برای CORS.
5. `ADMIN_URL`: دامنه پنل ادمین برای CORS.
6. `API_URL`: URL عمومی API.
7. `API_DOMAIN`: دامنه API برای AllowedHosts.
8. `API_PORT`: پورت loopback سرویس API روی هاست.
9. `FRONTEND_PORT`: پورت loopback سرویس Frontend SSR روی هاست.
10. `POSTGRES_DB`: نام دیتابیس PostgreSQL.
11. `POSTGRES_USER`: یوزر دیتابیس.
12. `POSTGRES_PASSWORD`: پسورد دیتابیس (سکرت).
13. `REDIS_PASSWORD`: پسورد Redis (سکرت).
14. `JWT_SECRET`: کلید امضای JWT (سکرت قوی).
15. `JWT_ISSUER`: issuer توکن JWT.
16. `JWT_AUDIENCE`: audience توکن JWT.
17. `Serilog__MinimumLevel__Default`: سطح log پیش فرض API.
18. `SEQ_URL`: مقصد مرکزی log (اختیاری).
19. `SMTP_HOST`: هاست SMTP.
20. `SMTP_PORT`: پورت SMTP.
21. `SMTP_USER`: کاربر SMTP.
22. `SMTP_PASSWORD`: پسورد SMTP.
23. `SMTP_FROM`: فرستنده ایمیل.
24. `SEED_ADMIN_EMAIL`: ایمیل ادمین اولیه (فقط اولین bootstrap).
25. `SEED_ADMIN_PASSWORD`: پسورد ادمین اولیه (فقط اولین bootstrap).
26. `SEED_ADMIN_FULLNAME`: نام کامل ادمین اولیه.

## 8) Register کاربر جدید بعد از Deploy

### 8.1 Register از طریق API چگونه انجام می شود

طبق فایل های واقعی:

1. endpoint: `POST /api/auth/register`
2. مرجع: src/KurdMap.API/Controllers/AuthController.cs
3. فیلدهای ورودی:
   - `Email` (required)
   - `Password` (required)
   - `FullName` (optional)
   - `ConfirmPassword` (optional، در صورت ارسال باید برابر Password باشد)
4. نقش پیش فرض کاربر: `User`

### 8.2 Register با curl

```bash
curl -X POST "https://api.kurdmap.de/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "StrongPass123!",
    "fullName": "New User",
    "confirmPassword": "StrongPass123!"
  }'
```

### 8.3 آیا Seed لازم است؟

- برای Register کاربر عادی: خیر.
- `seed-data.sql` فقط داده کسب وکار/منو/ریویو تستی می ریزد و برای production الزامی نیست.

### 8.4 Admin User باید از DB ساخته شود یا API؟

طبق Program.cs:

1. در startup، اگر هیچ کاربری وجود نداشته باشد، role ها و default admin خودکار seed می شوند.
2. این روش باید از طریق app startup انجام شود، نه SQL دستی مستقیم.
3. برای admin های بعدی، بهتر است از مسیر مدیریتی API/پنل استفاده شود.

## 9) مراحل Deploy روی Hetzner Linux با Podman (گام به گام)

## 9.1 پیش نیاز

1. Podman + podman compose نصب باشد.
2. Caddy روی host نصب و فعال باشد.
3. DNS دامنه ها به سرور اشاره کنند.
4. کاربر deploy دسترسی به `/opt/kurdmap` داشته باشد.

## 9.2 ایجاد ساختار مسیر

```bash
sudo mkdir -p /opt/kurdmap/docker /opt/kurdmap/backups /var/www/kurdmap-admin
sudo chown -R $USER:$USER /opt/kurdmap
```

## 9.3 کپی فایل ها از پوشه docker به سرور

فقط این فایل ها را کپی کنید:

1. docker/docker-compose.yml -> /opt/kurdmap/docker/docker-compose.yml
2. docker/docker-compose.prod.yml -> /opt/kurdmap/docker/docker-compose.prod.yml
3. docker/Caddyfile -> /opt/kurdmap/docker/Caddyfile
4. docker/backup.sh -> /opt/kurdmap/docker/backup.sh
5. docker/.env.example -> /opt/kurdmap/docker/.env.example

## 9.4 ساخت .env Production

```bash
cd /opt/kurdmap/docker
cp .env.example .env
nano .env
chmod 600 .env
chmod +x backup.sh
```

بهتر: از docker/.env.production.example پروژه به عنوان template استفاده کنید.

## 9.5 تنظیم Caddy اصلی هاست

در فایل اصلی `/etc/caddy/Caddyfile`:

```caddy
import /opt/kurdmap/docker/Caddyfile*
```

سپس:

```bash
sudo systemctl restart caddy
sudo systemctl status caddy --no-pager
```

## 9.6 Login به GHCR و Pull image ها

```bash
cd /opt/kurdmap/docker
podman login ghcr.io -u <ghcr-username-lowercase> --password-stdin
podman pull ghcr.io/<ghcr-username-lowercase>/kurdmap-api:latest
podman pull ghcr.io/<ghcr-username-lowercase>/kurdmap-admin:latest
podman pull ghcr.io/<ghcr-username-lowercase>/kurdmap-frontend:latest
```

## 9.7 بالا آوردن سرویس ها

```bash
cd /opt/kurdmap/docker
podman compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans || true
podman compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build
podman compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

## 9.8 Health Check

```bash
curl -f http://localhost:8080/health
curl -I http://localhost:4000
```

برای public endpoint:

```bash
curl -I https://kurdmap.de
curl -I https://admin.kurdmap.de
curl -I https://api.kurdmap.de/health
```

## 9.9 بررسی لاگ ها

```bash
cd /opt/kurdmap/docker
podman compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=200 api
podman compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=200 frontend
podman compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=200 admin
sudo tail -n 200 /var/log/caddy/kurdmap-api.log
sudo tail -n 200 /var/log/caddy/kurdmap-frontend.log
sudo tail -n 200 /var/log/caddy/kurdmap-admin.log
```

## 9.10 اطمینان از ارتباط صحیح Frontend/Admin/API

1. Frontend -> API:
   - از مرورگر در kurdmap.de یک endpoint عمومی API را تست کنید.
2. Admin -> API:
   - در admin.kurdmap.de login انجام دهید.
3. API -> DB/Redis:
   - health endpoint و لاگ API بدون خطای Connection String باشد.
4. Admin static publish:
   - بعد از deploy، فایل های admin از volume به `/var/www/kurdmap-admin` sync شده باشند.

نمونه sync:

```bash
VOL_PATH=$(podman volume inspect kurdmap_admin-static -f '{{ .Mountpoint }}')
sudo rsync -a --delete "$VOL_PATH/" /var/www/kurdmap-admin/
sudo chown -R caddy:caddy /var/www/kurdmap-admin
```

## 10) جمع بندی وضعیت Production Readiness

1. معماری شبکه و ایزوله سازی سرویس ها خوب است.
2. Caddy اکنون Production/Enterprise-ready تر شده است.
3. Workflow deploy برای مسیرهای واقعی repo و lowercase registry اصلاح شد.
4. برای عملیات پایدار production، sync خودکار admin-static و enforce واقعی resource limits در Podman باید در اولویت بعدی باشد.
