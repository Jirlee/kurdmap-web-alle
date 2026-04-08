# چک‌لیست کامل پروژه KurdMap

> آخرین بروزرسانی: آوریل ۲۰۲۶  
> این سند شامل تمام موارد پیاده‌سازی شده، نشده و پیشنهادی پروژه KurdMap است.

---

## فهرست مطالب

1. [وضعیت فعلی پروژه](#-وضعیت-فعلی-پروژه)
2. [موارد پیاده‌سازی شده](#-موارد-پیاده‌سازی-شده)
3. [موارد پیاده‌سازی نشده](#-موارد-پیاده‌سازی-نشده)
4. [۵۰ ایده جدید](#-۵۰-ایده-جدید-برای-توسعه-آینده)
5. [راهنمای کامل دپلوی](#-راهنمای-کامل-دپلوی)

---

## ✅ وضعیت فعلی پروژه

| سرویس | فناوری | وضعیت |
|--------|--------|--------|
| KurdMap.API | ASP.NET Core 10, Clean Architecture, CQRS + MediatR | ✅ فعال |
| kurdmap-admin | Angular 21.2.0, Tailwind CSS 4.2.2, Vitest | ✅ فعال |
| kurdmap-frontend | Angular 21.2.0, SSR, Leaflet, ngx-translate | ✅ فعال |
| PostgreSQL | نسخه ۱۷-alpine | ✅ فعال |
| Redis | نسخه ۷-alpine | ✅ فعال |
| Docker Compose | ۵ سرویس | ✅ فعال |
| EF Core Migrations | ۲ مایگریشن (InitialCreate + AddReviewsAdvertisementsFavorites) | ✅ فعال |
| Podman Test Seed | `make seed` بعد از اجرای کانتینرها | ✅ فعال |
| CI/CD | GitHub Actions (۴ جاب) | ✅ فعال |

**تست‌ها:** ۱۷۳ تست (۹۰ .NET + ۵۹ Angular Admin + ۲۴ Angular Frontend)

---

## ✅ موارد پیاده‌سازی شده

### بک‌اند (API)

| شماره | مورد | وضعیت |
|--------|------|--------|
| 1 | معماری Clean Architecture (Domain, Application, Infrastructure, API) | ✅ |
| 2 | الگوی CQRS + MediatR | ✅ |
| 3 | الگوی Result Pattern برای مدیریت خطا | ✅ |
| 4 | FluentValidation برای اعتبارسنجی ورودی | ✅ |
| 5 | Pipeline Behaviors (Validation, Logging, Caching, Performance) | ✅ |
| 6 | JWT Bearer Authentication | ✅ |
| 7 | Rate Limiting (fixed, auth, upload) | ✅ |
| 8 | Health Checks (PostgreSQL + Redis) | ✅ |
| 9 | Serilog Structured Logging | ✅ |
| 10 | Security Headers Middleware | ✅ |
| 11 | Exception Handling Middleware | ✅ |
| 12 | Correlation ID Middleware | ✅ |
| 13 | Auto Seed (نقش‌ها + ادمین پیش‌فرض) | ✅ |
| 14 | Swagger با تعریف امنیت JWT | ✅ |
| 15 | CORS محدود شده | ✅ |
| 16 | Auto DI Registration | ✅ |
| 17 | ICacheService (Redis) | ✅ |
| 18 | IUnitOfWork Pattern | ✅ |
| 19 | IRequestContext | ✅ |
| 20 | EF Core Migration: InitialCreate (جداول پایه + Identity + categories/cities seed) | ✅ |
| 21 | EF Core Migration: AddReviewsAdvertisementsFavorites (جداول reviews, advertisements, favorites) | ✅ |
| 22 | EF Core Migration: AddIsFeaturedToBusiness (ستون IsFeatured در جدول businesses) | ✅ |
| 23 | مایگریشن خودکار در استارتاپ (MigrateDatabaseAsync با retry + backoff) | ✅ |
| 23 | اسکریپت Seed تستی (`docker/seed-data.sql`) با نام ستون‌های صحیح + IsFeatured | ✅ |

### موجودیت‌های دیتابیس (Entities)

| شماره | موجودیت | توضیحات | وضعیت |
|--------|---------|---------|--------|
| 1 | Business | کسب‌وکار اصلی با اطلاعات کامل | ✅ |
| 2 | BusinessImage | تصاویر کسب‌وکار | ✅ |
| 3 | MenuItem | منوی رستوران/کافه | ✅ |
| 4 | BusinessService | خدمات کسب‌وکار | ✅ |
| 5 | Category | دسته‌بندی‌ها | ✅ |
| 6 | City | شهرها | ✅ |
| 7 | Advertisement | تبلیغات/رکلام | ✅ |
| 8 | Review | نظرات و امتیازدهی | ✅ |
| 9 | Favorite | علاقه‌مندی‌ها | ✅ |

### کنترلرها (Controllers)

| شماره | کنترلر | اندپوینت‌ها | وضعیت |
|--------|---------|------------|--------|
| 1 | AuthController | Register, Login, Refresh | ✅ |
| 2 | BusinessesController | CRUD + Search + Verify + ToggleFeatured | ✅ |
| 3 | BusinessChildrenController | MenuItems + BusinessServices CRUD | ✅ |
| 4 | CategoriesController | CRUD کامل | ✅ |
| 5 | CitiesController | CRUD کامل | ✅ |
| 6 | ImagesController | Upload, SetPrimary, Delete | ✅ |
| 7 | UsersController | List, ChangeRole, ToggleStatus | ✅ |
| 8 | DashboardController | آمار | ✅ |
| 9 | AdvertisementsController | CRUD + Toggle | ✅ |
| 10 | ReviewsController | Create, Approve, Delete, GetByBusiness, GetAll | ✅ |
| 11 | FavoritesController | Toggle, GetUserFavorites | ✅ |

### پنل مدیریت (Admin Panel)

| شماره | صفحه | مسیر | وضعیت |
|--------|------|------|--------|
| 1 | ورود | `/login` | ✅ |
| 2 | داشبورد | `/` | ✅ |
| 3 | کسب‌وکارها | `/businesses` | ✅ |
| 4 | دسته‌بندی‌ها | `/categories` | ✅ |
| 5 | شهرها | `/cities` | ✅ |
| 6 | کاربران | `/users` | ✅ |
| 7 | تبلیغات | `/advertisements` | ✅ |
| 8 | نظرات | `/reviews` | ✅ |
| 9 | گزارشات | `/reports` | ✅ |
| 10 | تنظیمات | `/settings` | ✅ |

### سایت اصلی (Frontend)

| شماره | صفحه | توضیحات | وضعیت |
|--------|------|---------|--------|
| 1 | صفحه اصلی | نقشه + جستجو | ✅ |
| 2 | جستجو | فیلتر و نتایج | ✅ |
| 3 | جزئیات کسب‌وکار | اطلاعات + نقشه + نظرات + ستاره | ✅ |
| 4 | سیاست حریم خصوصی | Policy | ✅ |
| 5 | درباره ما | About | ✅ |
| 6 | تماس با ما | Contact | ✅ |
| 7 | دسته‌بندی‌ها | Categories | ✅ |
| 8 | SSR (Server-Side Rendering) | Express + Angular | ✅ |
| 9 | i18n (چهارزبانه) | کوردی، کرمانجی، آلمانی، انگلیسی | ✅ |
| 10 | سئو | JSON-LD, OG Tags, robots.txt, sitemap.xml | ✅ |
| 11 | کامپوننت ستاره | Star Rating Component | ✅ |
| 12 | ناوبری پایین موبایل | Bottom Navigation (Home, Search, Categories, About) | ✅ |
| 13 | دسترسی‌پذیری | aria-label ترجمه‌شده روی تمام دکمه‌ها + aria-live نتایج جستجو | ✅ |

### دسترسی‌پذیری و UI/UX — WCAG 2.2 AA (پنل مدیریت)

| شماره | مورد | وضعیت |
|--------|------|--------|
| 1 | لینک Skip-to-main-content (`sr-only focus:not-sr-only`) | ✅ |
| 2 | `scope="col"` روی تمام هدرهای جدول (۷ جدول) | ✅ |
| 3 | `<caption>` روی تمام جداول داده (۷ جدول) | ✅ |
| 4 | `aria-label` روی تمام دکمه‌های آیکونی عملیات | ✅ |
| 5 | `<label>` برای `<select>` فیلترها (businesses, users) | ✅ |
| 6 | اهداف لمسی ≥ ۴۴px (`min-h-11 min-w-11 p-2`) | ✅ |
| 7 | Sidebar overlay موبایل + بستن خودکار در تغییر مسیر | ✅ |
| 8 | نمای Table→Card واکنش‌گرای موبایل (۶ جدول) | ✅ |
| 9 | کارت‌های KPI قابل کلیک با `routerLink` | ✅ |
| 10 | مرتب‌سازی ستونی در جدول businesses | ✅ |
| 11 | کامپوننت Breadcrumb با برچسب‌های کوردی | ✅ |
| 12 | نمودار دایره‌ای SVG در داشبورد | ✅ |

### دسترسی‌پذیری و UI/UX — WCAG 2.2 AA (فرانتاند)

| شماره | مورد | وضعیت |
|--------|------|--------|
| 1 | `aria-label` روی ورودی جستجو (hero + صفحه جستجو) | ✅ |
| 2 | `aria-label` روی ورودی ایمیل خبرنامه | ✅ |
| 3 | `aria-live="polite"` روی تعداد نتایج جستجو | ✅ |
| 4 | ترجمه `aria-label` انگلیسی hardcoded (۹ مکان) | ✅ |
| 5 | کلیدهای `aria` در ۴ فایل زبان (en, de, ku, kmr) | ✅ |
| 6 | کامپوننت Bottom Navigation موبایل (`md:hidden`) | ✅ |
| 7 | فایل sitemap.xml با hreflang (۴ زبان) | ✅ |

---

## ❌ موارد پیاده‌سازی نشده

### بحرانی (Critical) — باید حتماً انجام شوند

| شماره | مورد | اولویت | توضیحات |
|--------|------|--------|---------|
| 1 | **تست‌های یکپارچگی بک‌اند (Integration Tests)** | ✅ انجام شد | ۱۳ تست WebApplicationFactory + InMemory DB |
| 2 | **تست‌های E2E** | ✅ انجام شد | Playwright — ۳ فایل spec (auth, navigation, accessibility) |
| 3 | **صفحه تنظیمات ادمین** | ✅ انجام شد | ۴ بخش: عمومی، ویژگی‌ها، آپلود/کش، SMTP |
| 4 | **پایپلاین دپلوی (deploy.yml)** | ✅ انجام شد | ۴ جاب: build → scan → push → deploy |
| 5 | **فایل .env** | ✅ انجام شد | .env.example با تمام متغیرها |
| 6 | **HttpOnly Cookie برای Refresh Token** | ✅ انجام شد | Cookie HttpOnly/Secure/SameSite=Strict + /api/auth/logout |
| 7 | **CSP بدون unsafe-inline/unsafe-eval** | ✅ انجام شد | Nonce-based CSP + HSTS preload |
| 8 | **رمزگذاری Secrets در Runtime** | 🔴 بالا | AES-256-GCM برای TOTP secrets |
| 9 | **اسکن وابستگی‌ها (Dependency Scanning)** | ✅ انجام شد | dependabot.yml (NuGet, npm, Docker, GitHub Actions) + Trivy |

### مهم (Important) — بسیار توصیه‌شده

| شماره | مورد | اولویت | توضیحات |
|--------|------|--------|---------|
| 10 | **تست‌های واحد برای Business/Category/City/Auth/User** | ✅ انجام شد | Business (7), Category (4), City (4), Advertisement (7), Domain Entities (20), Value Objects (7) |
| 11 | **تست‌های واحد فرانتاند** | ✅ انجام شد | ۲۴ تست Vitest (Business, Category, Language, SEO) |
| 12 | **صفحه پروفایل کاربر (Frontend)** | 🟡 متوسط | ویرایش اطلاعات، تغییر رمز، تاریخچه |
| 13 | **رابط کاربری علاقه‌مندی‌ها (Frontend)** | ✅ انجام شد | دکمه قلب در جزئیات کسب‌وکار + localStorage |
| 14 | **فرآیند ثبت‌نام صاحب کسب‌وکار** | 🟡 متوسط | ثبت‌نام + ادعای مالکیت + تأیید |
| 15 | **سیستم اعلان‌ها (Notifications)** | 🟡 متوسط | Toast + Badge + Email |
| 16 | **جستجوی پیشرفته با فیلتر** | 🟡 متوسط | Faceted filters، جستجوی متنی با highlighting |
| 17 | **صفحه‌بندی سمت سرور در جداول ادمین** | ✅ انجام شد | PaginatedList<T> + کامپوننت Pagination + Search/List Queries |
| 18 | **ESLint در پروژه ادمین** | ✅ انجام شد | @angular-eslint 21.3.1 + تمام فایل‌ها بدون خطا |
| 19 | **دسترسی‌پذیری (Accessibility - WCAG 2.2 AA)** | ✅ انجام شد | Skip-to-main, scope/caption در جداول، aria-label، aria-live، touch targets ≥44px، ترجمه aria، mobile cards، bottom nav، breadcrumb، sitemap.xml |
| 20 | **حالت تاریک (Dark Mode)** | ✅ انجام شد | CSS Variables + .dark selector + Toggle در Topbar — تمام صفحات |

### مطلوب (Nice-to-Have) — بهبود تجربه کاربری

| شماره | مورد | اولویت | توضیحات |
|--------|------|--------|---------|
| 21 | **Skeleton Loading** | ✅ انجام شد | اسکلت جدول در همه صفحات ادمین (businesses, categories, cities, reviews, ads) |
| 22 | **Empty States با تصاویر** | ✅ انجام شد | SVG اختصاصی برای هر جدول + متن راهنما |
| 23 | **Bulk Actions در جداول** | 🟢 پایین | Checkbox + انتخاب گروهی + عملیات دسته‌ای |
| 24 | **خروجی CSV/Excel/PDF** | ✅ انجام شد | CSV با BOM (UTF-8) + دانلود خودکار |
| 25 | **اعلان‌های Real-time (SignalR)** | 🟢 پایین | بروزرسانی آنی بدون رفرش |
| 26 | **Makefile برای توسعه محلی** | ✅ انجام شد | make build/run/test/scan/shell/backup/health |
| 27 | **SRI Hashes برای منابع خارجی** | 🟢 پایین | Subresource Integrity |
| 28 | **Container Image Signing** | 🟢 پایین | Cosign/Sigstore |

---

## 💡 ۵۰ ایده جدید برای توسعه آینده

### 🔐 امنیت و احراز هویت (ایده ۱-۱۰)

| # | ایده | توضیحات |
|---|------|---------|
| 1 | **احراز هویت چندلایه (Multi-Layer Auth)** | API Key → JWT Bearer → Device Binding → Role/Permission (۴ لایه دفاعی) |
| 2 | **ورود با Passkey/WebAuthn (FIDO2)** | احراز هویت بدون رمز عبور با اثر انگشت یا FaceID — استاندارد آینده |
| 3 | **ورود با OAuth2 (Google/GitHub)** | ورود اجتماعی برای ساده‌سازی ثبت‌نام کاربران |
| 4 | **Magic Link Authentication** | ارسال لینک ورود به ایمیل (۶۴ بایت رندوم، SHA256 هش، ۱۵ دقیقه اعتبار) |
| 5 | **احراز هویت دومرحله‌ای (TOTP/MFA)** | Google Authenticator یا SMS OTP با ۶ رقم، ۵ دقیقه اعتبار، ۳ تلاش |
| 6 | **قفل پیشرونده حساب (Progressive Lockout)** | ۵ تلاش → قفل ۱۵ دقیقه، افزایش نمایی تا سقف ۱۲۰ دقیقه |
| 7 | **Device Binding** | هش SHA256 از (دستگاه + مرورگر + سیستم‌عامل) در JWT claim — اعتبارسنجی هر درخواست |
| 8 | **Refresh Token در HttpOnly Cookie** | انتقال از localStorage به Cookie امن (HttpOnly/Secure/SameSite=Strict) |
| 9 | **گردش زنجیره‌ای Refresh Token** | هش SHA256 قبل ذخیره، تک‌بار مصرف، چرخش در هر refresh |
| 10 | **Pre-commit Secret Scanning** | نصب gitleaks/trufflehog برای جلوگیری از ارسال رمز به ریپو |

### 🏗️ زیرساخت و DevOps (ایده ۱۱-۲۰)

| # | ایده | توضیحات |
|---|------|---------|
| 11 | **استقرار Rootless با Podman** | اجرای کانتینرها بدون root — بدون daemon، بدون نقطه شکست واحد |
| 12 | **Pod Native برای سرویس‌ها** | گروه‌بندی API + DB + Redis در یک Pod (شبکه مشترک، ارتباط localhost) |
| 13 | **فایل‌سیستم فقط‌خواندنی (Read-Only FS)** | `--read-only` + tmpfs فقط برای /tmp و /app/logs |
| 14 | **محدودیت منابع کانتینر** | `--memory 512m --cpus 2.0 --pids-limit 256` برای هر سرویس |
| 15 | **شبکه دولایه (Dual-Tier Network)** | Frontend network (عمومی) + Backend network (داخلی بدون دسترسی خارجی) |
| 16 | **اسکن تصاویر با Trivy** | `trivy image kurdmap:latest` در CI قبل از deploy |
| 17 | **Quadlet (systemd units)** | مدیریت کانتینرها به عنوان سرویس systemd — راه‌اندازی خودکار |
| 18 | **Kubernetes Migration Path** | `podman generate kube` برای تولید manifest — آمادگی مهاجرت به K8s |
| 19 | **Multi-Environment Compose** | `docker-compose.yml` + `docker-compose.prod.yml` overlay برای production |
| 20 | **Makefile توسعه محلی** | `make build/run/test/scan/shell-api/shell-db/clean` برای سرعت توسعه |

### 🎨 رابط کاربری و تجربه کاربر (ایده ۲۱-۳۵)

| # | ایده | توضیحات |
|---|------|---------|
| 21 | **داشبورد KPI تعاملی** | ✅ کارت‌های قابل کلیک (routerLink → لیست فیلترشده)، نمودار دایره‌ای SVG — درصد تغییر و شخصی‌سازی بر اساس نقش باقی‌مانده |
| 22 | **جدول داده پیشرفته** | ✅ صفحه‌بندی سرور، مرتب‌سازی ستونی (businesses)، mobile card view — فیلتر چندوجهی و highlight باقی‌مانده |
| 23 | **فرم‌های پیشرو (Progressive Disclosure)** | پایه → جزئیات → پیشرفته، ذخیره خودکار پیش‌نویس، اعتبارسنجی inline |
| 24 | **تخته کانبان (Kanban Board)** | جدید → باز → در حال بررسی → تأیید شده → انتشار — کشیدن و رها کردن |
| 25 | **سیستم اعلان سلسله‌مراتبی** | Toast (۳-۵ ثانیه) → Banner (دائمی) → Badge (شمارنده) → Modal (مسدودکننده) → Email |
| 26 | **الگوی Master-Detail** | نوار کناری (۲۴۰px) + لیست (۳۵۰px) + جزئیات (flex-grow) — ایده‌آل برای نقشه |
| 27 | **Skeleton Loading منحصربه‌فرد** | اسکلت بارگذاری اختصاصی برای هر نوع محتوا (کارت، جدول، نقشه) |
| 28 | **Empty States تصویری** | حالت خالی با تصاویر SVG سفارشی و دکمه عملیات واضح |
| 29 | **مد تاریک کامل** | تم تاریک حرفه‌ای با رنگ‌های مناسب — ترکیب با سیستم‌عامل |
| 30 | **طراحی Mobile-First** | ✅ Table→Card responsive (6 جدول)، Bottom Tab Bar فرانتاند، sidebar overlay + auto-close — Swipe Actions باقی‌مانده |
| 31 | **Container Queries** | واکنش‌گرایی در سطح کامپوننت (نه فقط viewport) |
| 32 | **تایپوگرافی سیال (Fluid Typography)** | `clamp()` برای اندازه متن متناسب با صفحه |
| 33 | **شبکه ۸px Spacing** | فاصله‌گذاری منظم بر اساس ضریب ۸ پیکسل |
| 34 | **میانبرهای کیبورد (Keyboard Shortcuts)** | `Ctrl+K` پالت فرمان، `N` جدید، `J/K` بالا/پایین، `?` راهنما |
| 35 | **انیمیشن‌های Micro-Interaction** | Transition نرم برای hover، باز/بسته، اسکرول — بهبود احساس حرفه‌ای |

### ♿ دسترسی‌پذیری (Accessibility) (ایده ۳۶-۴۲)

| # | ایده | توضیحات |
|---|------|---------|
| 36 | **ممیزی WCAG 2.2 AA** | ✅ انجام شد — skip-to-main، scope/caption، aria-label، aria-live، touch targets، ترجمه aria، breadcrumb، sitemap |
| 37 | **HTML معنایی (Semantic HTML)** | ✅ `<main id="main-content">`, `<caption>` در جداول، `<label>` برای فیلترها، skip-to-main-content link |
| 38 | **ARIA کامل** | ✅ `aria-label` روی تمام دکمه‌های آیکونی (admin + frontend)، `aria-live="polite"` برای نتایج جستجو، `scope="col"` در ۷ جدول |
| 39 | **ناوبری کیبورد کامل** | ✅ Skip-to-main-content link (sr-only focus:not-sr-only) — Tab/Arrow keys باقی‌مانده |
| 40 | **Focus Visible** | `:focus-visible` فقط برای کیبورد (۳px solid، ۲px offset) |
| 41 | **رنگ تنها شاخص نیست** | ترکیب رنگ با آیکون، متن یا الگو برای کوررنگی |
| 42 | **اهداف لمسی ≥ ۴۸×۴۸px** | ✅ `min-h-11 min-w-11 p-2` (44px) روی تمام دکمه‌های عملیاتی در ۶ جدول ادمین |

### 🚀 ویژگی‌های جدید (ایده ۴۳-۵۰)

| # | ایده | توضیحات |
|---|------|---------|
| 43 | **جستجوی هوشمند با AI** | استفاده از مدل زبانی برای فهم جستجوی طبیعی کوردی/آلمانی |
| 44 | **سیستم چت مستقیم** | پیام‌رسانی بین کاربر و صاحب کسب‌وکار (SignalR real-time) |
| 45 | **PWA (Progressive Web App)** | قابلیت نصب، کش آفلاین، Push Notifications |
| 46 | **سیستم کوپن و تخفیف** | صاحبان کسب‌وکار کوپن ایجاد کنند، کاربران استفاده |
| 47 | **گزارش‌گیری پیشرفته با Chart.js** | نمودارهای تعاملی، فیلتر تاریخ، مقایسه دوره‌ای |
| 48 | **سیستم تیکت پشتیبانی** | کاربران مشکلات گزارش دهند، ادمین پیگیری کند |
| 49 | **API عمومی با مستندات** | REST API برای توسعه‌دهندگان شخص ثالث + API Key management |
| 50 | **اپلیکیشن موبایل (MAUI/.NET)** | اپ بومی Android/iOS با استفاده مجدد از لایه Domain و Application |

---

## 🚀 راهنمای کامل دپلوی

### ۱. پیش‌نیازها

| ابزار | نسخه | توضیحات |
|-------|-------|---------|
| Docker / Podman | ≥ 24.0 / ≥ 4.0 | `alias docker=podman` در صورت استفاده از Podman |
| Docker Compose | ≥ 2.20 | یا `podman-compose` |
| .NET SDK | 10.0 | برای ساخت بک‌اند |
| Node.js | ≥ 22.0 | برای ساخت فرانتاند |
| PostgreSQL | 17 | (در Docker) |
| Redis | 7 | (در Docker) |
| Nginx | ≥ 1.25 | به عنوان Reverse Proxy |
| Git | ≥ 2.40 | |
| Trivy | ≥ 0.50 | اسکن آسیب‌پذیری تصاویر |

### ۲. متغیرهای محیطی

فایل `.env` را در ریشه پروژه ایجاد کنید:

```env
# === عمومی ===
ENVIRONMENT=Production
APP_NAME=KurdMap

# === دیتابیس ===
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=kurdmap
POSTGRES_USER=kurdmap_user
POSTGRES_PASSWORD=<رمز-امن-تولید-کنید>

# === Redis ===
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<رمز-امن-تولید-کنید>

# === JWT ===
JWT_SECRET=<کلید-۶۴-کاراکتری-رندوم>
JWT_ISSUER=https://api.kurdmap.de
JWT_AUDIENCE=https://kurdmap.de
JWT_EXPIRY_MINUTES=60
JWT_REFRESH_EXPIRY_DAYS=7

# === API ===
API_URL=https://api.kurdmap.de
API_PORT=8080
CORS_ORIGINS=https://kurdmap.de,https://admin.kurdmap.de

# === Admin ===
ADMIN_URL=https://admin.kurdmap.de
ADMIN_PORT=8081

# === Frontend ===
FRONTEND_URL=https://kurdmap.de
FRONTEND_PORT=4000

# === SMTP ===
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@kurdmap.de
SMTP_PASSWORD=<رمز-smtp>
SMTP_FROM=noreply@kurdmap.de

# === لاگ ===
SEQ_URL=http://seq:5341
LOG_LEVEL=Warning

# === سایر ===
SEED_ADMIN_EMAIL=admin@kurdmap.de
SEED_ADMIN_PASSWORD=<رمز-ادمین-اولیه>
```

### ۳. ساختار Dockerfile‌ها (Multi-Stage)

#### API Dockerfile (بهینه‌سازی شده)

```dockerfile
# مرحله ساخت
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src
COPY ["KurdMap.API/KurdMap.API.csproj", "KurdMap.API/"]
COPY ["KurdMap.Application/KurdMap.Application.csproj", "KurdMap.Application/"]
COPY ["KurdMap.Domain/KurdMap.Domain.csproj", "KurdMap.Domain/"]
COPY ["KurdMap.Infrastructure/KurdMap.Infrastructure.csproj", "KurdMap.Infrastructure/"]
COPY ["KurdMap.Shared/KurdMap.Shared.csproj", "KurdMap.Shared/"]
RUN dotnet restore "KurdMap.API/KurdMap.API.csproj"
COPY . .
RUN dotnet publish "KurdMap.API/KurdMap.API.csproj" -c Release -o /app/publish --no-restore

# مرحله اجرا
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
RUN adduser -S appuser
WORKDIR /app
COPY --from=build /app/publish .
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget --spider -q http://localhost:8080/health || exit 1
ENTRYPOINT ["dotnet", "KurdMap.API.dll"]
```

### ۴. Docker Compose Production

```yaml
# docker-compose.prod.yml (overlay)
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    read_only: true
    tmpfs:
      - /tmp
      - /var/run/postgresql
    deploy:
      resources:
        limits:
          memory: 1g
          cpus: '2.0'
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL

  redis:
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 128mb
      --maxmemory-policy allkeys-lru
    read_only: true
    tmpfs:
      - /tmp
    deploy:
      resources:
        limits:
          memory: 256m
          cpus: '1.0'
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL

  api:
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Host=${POSTGRES_HOST};Port=${POSTGRES_PORT};Database=${POSTGRES_DB};Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}
      - ConnectionStrings__Redis=${REDIS_HOST}:${REDIS_PORT},password=${REDIS_PASSWORD}
      - Jwt__Secret=${JWT_SECRET}
      - Jwt__Issuer=${JWT_ISSUER}
      - Jwt__Audience=${JWT_AUDIENCE}
    read_only: true
    tmpfs:
      - /tmp:size=100m
    deploy:
      resources:
        limits:
          memory: 512m
          cpus: '2.0'
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE

  admin:
    read_only: true
    tmpfs:
      - /tmp
      - /var/cache/nginx
      - /var/run
    deploy:
      resources:
        limits:
          memory: 128m
          cpus: '0.5'

  frontend:
    read_only: true
    tmpfs:
      - /tmp:size=100m
    deploy:
      resources:
        limits:
          memory: 256m
          cpus: '1.0'
```

**استفاده:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### ۵. شبکه‌بندی دولایه (Dual-Tier Network)

```yaml
# اضافه به docker-compose.prod.yml
networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge
    internal: true  # بدون دسترسی اینترنت

services:
  postgres:
    networks:
      - backend-net
  redis:
    networks:
      - backend-net
  api:
    networks:
      - frontend-net
      - backend-net
  admin:
    networks:
      - frontend-net
  frontend:
    networks:
      - frontend-net
```

### ۶. Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/kurdmap.conf

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name kurdmap.de admin.kurdmap.de api.kurdmap.de;
    return 301 https://$host$request_uri;
}

# Frontend
server {
    listen 443 ssl http2;
    server_name kurdmap.de;

    ssl_certificate /etc/letsencrypt/live/kurdmap.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kurdmap.de/privkey.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), geolocation=(), payment=(), usb=()" always;

    # Block dotfiles
    location ~ /\. { deny all; }

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin Panel
server {
    listen 443 ssl http2;
    server_name admin.kurdmap.de;

    ssl_certificate /etc/letsencrypt/live/kurdmap.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kurdmap.de/privkey.pem;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# API
server {
    listen 443 ssl http2;
    server_name api.kurdmap.de;

    ssl_certificate /etc/letsencrypt/live/kurdmap.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kurdmap.de/privkey.pem;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;

    # API Key injection (if needed)
    # proxy_set_header X-API-Key $api_key;

    # Block Swagger in production
    location /swagger { deny all; }

    # Block dotfiles
    location ~ /\. { deny all; }

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### ۷. SSL با Let's Encrypt

```bash
# نصب Certbot
sudo apt install certbot python3-certbot-nginx

# دریافت گواهینامه
sudo certbot --nginx -d kurdmap.de -d admin.kurdmap.de -d api.kurdmap.de

# تمدید خودکار (هر ۱۲ ساعت)
echo "0 */12 * * * certbot renew --quiet" | sudo crontab -
```

### ۸. امن‌سازی PostgreSQL

```sql
-- postgresql.conf
-- password_encryption = 'scram-sha-256'
-- log_statement = 'ddl'
-- log_min_duration_statement = 500
-- idle_in_transaction_session_timeout = '30s'
-- listen_addresses = 'localhost'
```

### ۹. امن‌سازی Redis

```conf
# redis.conf
requirepass <رمز-قوی>
maxmemory 128mb
maxmemory-policy allkeys-lru
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
```

### ۱۰. مراحل دپلوی دستی

```bash
# ۱. کلون پروژه
git clone https://github.com/your-org/KurdMap-web-all.git
cd KurdMap-web-all

# ۲. ایجاد فایل .env از template
cp .env.example .env
nano .env  # ویرایش مقادیر

# ۳. تولید کلیدهای امن
openssl rand -base64 48  # برای JWT_SECRET
openssl rand -base64 32  # برای رمزهای عبور

# ۴. ساخت و اجرا
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# ۵. اعمال مایگریشن
docker compose exec api dotnet ef database update

# ۶. بررسی سلامت
curl -f http://localhost:8080/health
curl -f http://localhost:4000
curl -f http://localhost:8081

# ۷. مشاهده لاگ‌ها
docker compose logs -f api
```

### ۱۱. پشتیبان‌گیری (Backup)

```bash
# پشتیبان‌گیری دیتابیس
docker compose exec postgres pg_dump -U kurdmap_user kurdmap > backup_$(date +%Y%m%d).sql

# بازیابی
docker compose exec -i postgres psql -U kurdmap_user kurdmap < backup_20250601.sql

# کرون‌جاب پشتیبان‌گیری روزانه
echo "0 2 * * * cd /opt/kurdmap && docker compose exec -T postgres pg_dump -U kurdmap_user kurdmap | gzip > /backups/kurdmap_\$(date +\%Y\%m\%d).sql.gz" | sudo crontab -
```

### ۱۲. مانیتورینگ

```bash
# بررسی وضعیت سرویس‌ها
docker compose ps

# مصرف منابع
docker stats

# لاگ‌های ساختاریافته (پیشنهاد: Seq یا ELK Stack)
# docker run -d --name seq -p 5341:80 datalust/seq:latest
```

### ۱۳. بروزرسانی بدون Downtime

```bash
# ۱. Pull آخرین تغییرات
git pull origin main

# ۲. ساخت تصاویر جدید
docker compose build

# ۳. جایگزینی (rolling update)
docker compose up -d --no-deps api
docker compose up -d --no-deps admin
docker compose up -d --no-deps frontend

# ۴. بررسی سلامت
docker compose ps
curl -f http://localhost:8080/health
```

---

## 📋 چک‌لیست قبل از Production

- [ ] تمام رمزها تغییر داده شده (نه رمز پیش‌فرض)
- [ ] JWT_SECRET حداقل ۶۴ کاراکتر رندوم
- [ ] CORS فقط دامنه‌های مجاز
- [ ] Swagger در production غیرفعال
- [ ] HTTPS فعال با گواهینامه معتبر
- [ ] HSTS فعال (preload)
- [ ] Security Headers تنظیم شده
- [ ] دیتابیس فقط از شبکه داخلی قابل دسترسی
- [ ] Redis با رمز عبور
- [ ] پشتیبان‌گیری خودکار تنظیم شده
- [ ] لاگ‌ها ذخیره و مانیتور می‌شوند
- [ ] Rate Limiting فعال
- [ ] Health Checks پاسخ می‌دهند
- [ ] تصاویر Docker اسکن شده (Trivy)
- [ ] فایل `.env` در `.gitignore` است
