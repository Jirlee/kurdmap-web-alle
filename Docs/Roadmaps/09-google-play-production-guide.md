# KurdMap — راهنمای کامل و جامع انتشار در Google Play 2026

> **Account ID:** `635757844545686658`
> **Package:** `de.kurdmap.mobile`
> **Version:** `1.0.0` · **versionCode:** `1`
> **تاریخ آخرین بروزرسانی:** ۸ آوریل ۲۰۲۶
> **وضعیت:** ✅ اپ در Google Play Console ساخته شده · ✅ AAB آماده آپلود (44MB)

### 📚 منابع رسمی

| منبع | لینک | توضیح |
|------|------|-------|
| Google Play Console | https://play.google.com/console | داشبورد اصلی |
| Play Academy | https://playacademy.withgoogle.com/ | آموزش رسمی Google |
| Android Distribute | https://developer.android.com/distribute | مستندات توزیع |
| App Testing Requirements | https://support.google.com/googleplay/android-developer/answer/14151465 | الزامات تست برای اکانت‌های جدید |
| Prepare for Review | https://support.google.com/googleplay/android-developer/answer/9859455 | آماده‌سازی برای بررسی |
| Set Up Dashboard | https://support.google.com/googleplay/android-developer/answer/9859454 | تنظیمات Dashboard |
| Prepare & Roll Out | https://support.google.com/googleplay/android-developer/answer/9859348 | آماده‌سازی و انتشار release |
| Play App Signing | https://support.google.com/googleplay/android-developer/answer/9842756 | مدیریت امضای اپ |

---

## فهرست مطالب

| # | بخش | وضعیت |
|---|------|--------|
| 1 | [وضعیت فعلی پروژه](#1-وضعیت-فعلی-پروژه) | ✅ |
| 2 | [Roadmap کامل تا Production](#2-roadmap-کامل-تا-production) | 🗺️ |
| 3 | [تأیید هویت Developer Account](#3-تأیید-هویت-developer-account) | ⬜ |
| 4 | [معماری API و اتصال اپ به سرور](#4-معماری-api-و-اتصال-اپ-به-سرور) | 📖 |
| 5 | [API Keys و تنظیمات Third-Party](#5-api-keys-و-تنظیمات-third-party) | 📖 |
| 6 | [راه‌اندازی سرور Production](#6-راهاندازی-سرور-production) | ⬜ |
| 7 | [فایل‌های Build آماده](#7-فایلهای-build-آماده) | ✅ |
| 8 | [Set up your app — تکمیل اطلاعات اپ](#8-set-up-your-app--تکمیل-اطلاعات-اپ) | ⬜ |
| 9 | [Internal Testing — آپلود AAB](#9-internal-testing--آپلود-aab) | ⬜ |
| 10 | [Closed Testing — ۱۲ تستر · ۱۴ روز](#10-closed-testing--۱۲-تستر--۱۴-روز) | ⬜ |
| 11 | [Apply for Production Access](#11-apply-for-production-access) | ⬜ |
| 12 | [Store Listing — صفحه فروشگاه](#12-store-listing--صفحه-فروشگاه) | ⬜ |
| 13 | [Content Rating](#13-content-rating) | ⬜ |
| 14 | [Data Safety](#14-data-safety) | ⬜ |
| 15 | [Privacy Policy](#15-privacy-policy) | ⬜ |
| 16 | [App Access — اکانت تست](#16-app-access--اکانت-تست) | ⬜ |
| 17 | [Signing Keystore](#17-signing-keystore) | ✅ |
| 18 | [Checklist نهایی](#18-checklist-نهایی) | 📋 |
| 19 | [دستورات Build](#19-دستورات-build) | 📖 |
| 20 | [Rebuild و آپدیت](#20-rebuild-و-آپدیت) | 📖 |

---

## 1. وضعیت فعلی پروژه

### ✅ تست‌ها

| Target | نتیجه |
|--------|--------|
| TypeScript | **0 errors** |
| Mobile Jest | **17 suite · 109 tests passed** |
| .NET Build | **0 warnings · 0 errors** |
| .NET Tests | **90 passed** |

### ✅ فایل‌های تنظیمات

| فایل | وضعیت | توضیح |
|------|--------|-------|
| `app.json` | ✅ | `versionCode: 1`، `package: de.kurdmap.mobile`، `blockedPermissions` |
| `eas.json` | ✅ | `autoIncrement: true`، `buildType: app-bundle`، `releaseStatus: draft` |
| `.env.production` | ✅ | `EXPO_PUBLIC_API_URL=https://gs6xapi.kurdmap.eu` |
| `babel.config.js` | ✅ | `transform-remove-console` در production |
| Icons/Splash | ✅ | `icon.png` (1024×1024)، `adaptive-icon.png`، `splash.png`، `favicon.png` |
| `android/app/build.gradle` | ✅ | Release signing با `kurdmap-upload.keystore` |

### ✅ قابلیت‌های اجباری Google Play

| قابلیت | وضعیت | الزام |
|--------|--------|-------|
| حذف حساب کاربری (Account Deletion) | ✅ backend + mobile | اجباری از ۲۰۲۴ |
| صفحه Privacy Policy (GDPR) | ✅ `app/policy.tsx` | اجباری |
| i18n ۴ زبانه | ✅ de · en · ku · kmr | — |
| Target SDK 34 | ✅ | اجباری ≥ API 33 |
| AAB format | ✅ 44MB | اجباری (APK قبول نمی‌شود) |

### ✅ خروجی‌های Build آماده

| فایل | مسیر | حجم |
|------|------|------|
| **AAB** | `release-output/kurdmap-v1.0.0.aab` | **44 MB** |
| **APK** | `release-output/kurdmap-v1.0.0.apk` | **84 MB** |

---

## 2. Roadmap کامل تا Production

```
📅 هفته ۱ (الان)
│
├── ✅ مرحله ۰: Build AAB + APK
│   ├── APK: 84MB (تست مستقیم)
│   └── AAB: 44MB (Google Play)
│
├── ⬜ مرحله ۱: تأیید هویت Developer Account
│   ├── Identity verification (پاسپورت/ID)
│   ├── Android device verification
│   └── Phone number verification
│   ⏳ ۲-۵ روز کاری
│
├── ⬜ مرحله ۲: Set up your app
│   ├── Privacy Policy URL
│   ├── App access (test account)
│   ├── Ads declaration → No
│   ├── Target audience → 18+
│   ├── Content rating questionnaire
│   ├── Data safety form
│   └── Government/Financial/Health → No
│
├── ⬜ مرحله ۳: Store Listing
│   ├── Title + Description (de-DE + en-US)
│   ├── Screenshots (حداقل ۲، توصیه ۴-۸)
│   ├── Feature Graphic (1024×500)
│   ├── App Icon (512×512)
│   └── Contact details
│
├── ⬜ مرحله ۴: Internal Testing
│   ├── آپلود AAB
│   ├── Release notes وارد کن
│   ├── اضافه کردن testers
│   └── تست روی دستگاه واقعی
│
📅 هفته ۲
│
├── ⬜ مرحله ۵: سرور Production
│   ├── Deploy gs6xapi.kurdmap.eu
│   ├── SSL certificate
│   ├── CORS تنظیم
│   ├── Seed data
│   └── Test account برای Google Review
│
├── ⬜ مرحله ۶: Closed Testing شروع
│   ├── Promote از Internal → Closed
│   ├── حداقل ۱۲ tester اضافه کن
│   ├── لینک opt-in بفرست
│   └── ⏳ شمارش ۱۴ روزه شروع می‌شود
│
📅 هفته ۳-۴ (۱۴ روز صبر)
│
├── ⬜ جمع‌آوری feedback از testers
├── ⬜ رفع باگ‌ها (در صورت نیاز rebuild)
│
📅 بعد از ۱۴ روز
│
├── ⬜ مرحله ۷: Apply for Production Access
│   ├── پاسخ به سؤالات
│   ├── ⏳ بررسی ≤ ۷ روز
│   └── دسترسی Production فعال می‌شود
│
├── ⬜ مرحله ۸: Production Release
│   ├── Create release در Production track
│   ├── آپلود AAB نهایی
│   ├── Review → Rollout
│   └── 🎉 اپ در Google Play!
│
📅 مجموع: ~۴ تا ۶ هفته
```

---

## 3. تأیید هویت Developer Account

> ⚠️ **بدون تکمیل تأیید هویت نمی‌توانی اپ منتشر کنی!**
>
> **منبع رسمی:** https://support.google.com/googleplay/android-developer/answer/14316361

### مرحله ۳.۱: Identity Verification (تأیید هویت)

1. **Google Play Console → Account details → Identity verification**
2. مدرک شناسایی آپلود کن:
   - **بهترین:** پاسپورت
   - **جایگزین:** Personalausweis (کارت شناسایی آلمان)
   - **جایگزین:** Führerschein (گواهینامه)
3. ⚠️ **مهم:** مدرک را دستکاری نکن — باعث رد و بلاک اکانت می‌شود
4. ⏳ بررسی: **۲ تا ۵ روز کاری**

### مرحله ۳.۲: Android Device Verification (تأیید دستگاه اندرویدی)

> **منبع رسمی:** https://support.google.com/googleplay/android-developer/answer/14316361

1. اپلیکیشن **Google Play Console** را از Play Store روی گوشی Android نصب کن
2. با **همان اکانت Google** که Play Console را ساختی لاگین کن
3. تأیید خودکار انجام می‌شود ✅

### مرحله ۳.۳: Phone Number Verification (تأیید شماره تلفن)

> **این مرحله بعد از تأیید هویت فعال می‌شود!**

مطابق صفحه‌ای که در Google Play Console می‌بینی:

1. **ابتدا** Identity verification را تکمیل کن و تأیید بشود
2. برو به **Settings → Account details**
3. شماره تلفن صحیح بودنش را چک کن
4. **"Verify"** را بزن
5. کد تأیید را از طریق **SMS** یا **تماس تلفنی** دریافت کن
6. کد را وارد کن و **"Verify"** بزن ✅

> 💡 **نکته مهم:** اگر با SMS مشکل داشتی، روش تماس تلفنی را امتحان کن. اگر هیچ‌کدام کار نکرد، با [support تماس بگیر](https://support.google.com/googleplay/android-developer/gethelp).

---

## 4. معماری API و اتصال اپ به سرور

### ساختار کلی اتصال

```
┌──────────────────────┐         ┌──────────────────────┐
│   KurdMap Mobile App  │  HTTPS  │   gs6xapi.kurdmap.eu      │
│   (React Native)      │────────▶│   (ASP.NET Core 10)   │
│                        │         │                        │
│  .env.production:      │         │  ← PostgreSQL          │
│  EXPO_PUBLIC_API_URL=  │         │  ← Redis               │
│  https://gs6xapi.kurdmap.eu│         │                        │
└──────────────────────┘         └──────────────────────┘
```

### نحوه اتصال اپ به API

**فایل:** `src/kurdmap-mobile/src/api/client.ts`

اپ از **Axios** برای ارتباط با API استفاده می‌کند. دو کلاینت وجود دارد:

| کلاینت | Base URL | استفاده |
|--------|----------|---------|
| `apiClient` | `https://gs6xapi.kurdmap.eu/api/v1` | businesses, categories, cities, reviews, favorites |
| `authClient` | `https://gs6xapi.kurdmap.eu/api/auth` | login, register, logout, delete-account |

**آدرس API از کجا می‌آید؟**

```
اولویت ۱: Constants.expoConfig?.extra?.apiUrl  (از app.json → extra)
اولویت ۲: process.env.EXPO_PUBLIC_API_URL       (از .env فایل‌ها)
اولویت ۳: http://localhost:8080                  (پیش‌فرض — فقط توسعه)
```

### ⚠️ آیا باید API URL را در اپ بگذاری؟

**بله، اما خودکار تنظیم شده.** تو نیازی به تغییر دستی نداری:

| محیط | فایل | مقدار `EXPO_PUBLIC_API_URL` | نتیجه |
|------|------|-----|--------|
| Development | `.env` | `http://localhost:8080` | به سرور local وصل می‌شود |
| Development (.NET) | `.env.local` | `http://localhost:5110` | به dotnet run وصل می‌شود |
| **Production** | **`.env.production`** | **`https://gs6xapi.kurdmap.eu`** | **✅ به سرور واقعی** |

**در build تولیدی (AAB/APK):**
- وقتی با `eas build --profile production` یا Gradle build می‌سازی
- **Expo خودکار** از `.env.production` استفاده می‌کند
- همچنین `eas.json` → `production.env.EXPO_PUBLIC_API_URL` هم `https://gs6xapi.kurdmap.eu` تنظیم شده

> 🔑 **نتیجه:** URL در build نهایی embedded است. کاربر چیزی نمی‌بیند، اپ خودکار به `https://gs6xapi.kurdmap.eu` وصل می‌شود.

### JWT Authentication — نحوه احراز هویت

```
کاربر login → سرور JWT access token + refresh token می‌دهد
                    ↓
access token در SecureStore (رمزنگاری‌شده) ذخیره می‌شود
                    ↓
هر request: Authorization: Bearer <access_token>
                    ↓
وقتی access token منقضی شد (۱۵ دقیقه):
    → خودکار /api/auth/refresh صدا زده می‌شود
    → token جدید می‌گیرد
    → request دوباره ارسال می‌شود
                    ↓
اگر refresh token هم منقضی شد (۷ روز):
    → کاربر logout و redirect به login
```

### لیست کامل API Endpoints

| مسیر | متد | نیاز به Token | توضیح |
|------|------|:---:|-------|
| `/api/auth/register` | POST | ❌ | ثبت‌نام کاربر جدید |
| `/api/auth/login` | POST | ❌ | ورود و دریافت JWT |
| `/api/auth/refresh` | POST | ❌ | تمدید token |
| `/api/auth/logout` | POST | ✅ | خروج و حذف refresh token |
| `/api/auth/forgot-password` | POST | ❌ | درخواست ریست رمز |
| `/api/auth/reset-password` | POST | ❌ | تنظیم رمز جدید |
| `/api/auth/delete-account` | DELETE | ✅ | حذف حساب (+ رمز) |
| `/api/v1/businesses/search` | GET | ❌ | جستجوی کسب‌وکار |
| `/api/v1/businesses/{slug}` | GET | ❌ | جزئیات کسب‌وکار |
| `/api/v1/categories` | GET | ❌ | لیست دسته‌بندی‌ها |
| `/api/v1/cities` | GET | ❌ | لیست شهرها |
| `/api/v1/reviews/{businessId}` | GET | ❌ | نظرات کسب‌وکار |
| `/api/v1/reviews` | POST | ✅ | ثبت نظر جدید |
| `/api/v1/favorites` | GET | ✅ | لیست علاقه‌مندی‌ها |
| `/api/v1/favorites/toggle` | POST | ✅ | اضافه/حذف علاقه‌مندی |
| `/api/v1/advertisements/active` | GET | ❌ | تبلیغات فعال |
| `/health` | GET | ❌ | سلامت سرور |

### Rate Limiting (محدودیت درخواست)

| Policy | محدودیت | اعمال روی |
|--------|---------|----------|
| `fixed` (global) | **100 request/minute** per IP | همه endpoints |
| `auth` | **10 request/minute** per IP | login/register/forgot-password |
| `upload` | **20 request/minute** per IP | آپلود فایل |

---

## 5. API Keys و تنظیمات Third-Party

### آیا اپ KurdMap به API Key نیاز دارد؟

| سرویس | API Key لازم؟ | کجا تنظیم شده؟ | آیا باید تغییر دهی؟ |
|--------|:---:|-------|:---:|
| **KurdMap API** (backend خودمان) | ❌ خیر — از JWT Authentication استفاده می‌کند | `client.ts` + `.env.production` | ❌ |
| **Google Maps** | ❌ خیر — اپ از `react-native-maps` با OpenStreetMap/default tiles استفاده می‌کند | `app.json` → `react-native-maps` plugin ندارد | ❌ |
| **Sentry** (Crash Reporting) | ✅ بله — `SENTRY_AUTH_TOKEN` برای upload، `DSN` برای runtime | `app.json` plugins + `sentry.properties` | ⚠️ اختیاری |
| **Expo Push Notifications** | ❌ خیر — از Expo Push Service رایگان | `expo-notifications` plugin | ❌ |
| **Firebase** | ❌ خیر — مستقیم استفاده نمی‌شود | — | ❌ |

### Sentry — تنظیمات Crash Reporting

**وضعیت فعلی:** Sentry plugin در `app.json` تنظیم شده ولی AUTH_TOKEN تنظیم نشده.

**فایل `app.json` (plugins):**
```json
["@sentry/react-native", {
  "organization": "kurdmap",
  "project": "kurdmap-mobile"
}]
```

**فایل `android/sentry.properties`:**
```
defaults.url=https://sentry.io/
defaults.org=kurdmap
defaults.project=kurdmap-mobile
```

**برای فعال‌سازی Sentry (اختیاری):**

1. اکانت رایگان بساز: https://sentry.io
2. یک پروژه React Native بساز
3. **DSN** (Data Source Name) را کپی کن:
   ```
   SENTRY_DSN=https://xxxx@o123.ingest.sentry.io/456
   ```
4. در `.env.production` اضافه کن:
   ```
   SENTRY_DSN=https://xxxx@o123.ingest.sentry.io/456
   ```
5. **Auth Token** برای source maps:
   ```
   SENTRY_AUTH_TOKEN=sntrys_xxxx
   ```

> 💡 **برای الان نیازی نیست.** اپ بدون Sentry هم کار می‌کند. Sentry فقط برای مشاهده crash reports در production مفید است.
>
> ⚠️ **در local build:** خط `sentry.gradle` در `android/app/build.gradle` کامنت شده تا مشکل build نداشته باشیم.

### Expo Push Notifications — نحوه کار

اپ از **Expo Push Notification Service** استفاده می‌کند:

```
Mobile App → Expo Push Service → Firebase Cloud Messaging (FCM) → گوشی کاربر
```

**تنظیمات در `app.json`:**
```json
["expo-notifications", {
  "icon": "./assets/icon.png",
  "color": "#10B981"
}]
```

**آیا به FCM key نیاز داری؟**
- برای **Expo Go**: ❌ خیر (رایگان و خودکار)
- برای **Production build**: بعداً باید `google-services.json` از Firebase Console بگیری
- **الان:** بدون notifications هم اپ کامل کار می‌کند

### نقشه (Maps) — بدون API Key

اپ از `react-native-maps` استفاده می‌کند. در Android از **Google Maps** پیش‌فرض Android استفاده می‌شود که **نیازی به API key جداگانه ندارد** وقتی از Google Play نصب شود.

> اگر بعداً بخواهی Google Maps پیشرفته استفاده کنی (مثل Places API)، باید از [Google Cloud Console](https://console.cloud.google.com) یک Maps API key بسازی و در `AndroidManifest.xml` اضافه کنی.

---

## 6. راه‌اندازی سرور Production

### ⚠️ سرور `gs6xapi.kurdmap.eu` باید آنلاین باشد قبل از submit!

### ۶.۱: تنظیمات سرور — متغیرهای محیطی

فایل `.env` در ریشه پروژه باید این متغیرها را داشته باشد:

```bash
# ═══════════════════════════════════════
#  KurdMap Production Environment
# ═══════════════════════════════════════

# --- App ---
APP_NAME=KurdMap
ENVIRONMENT=Production

# --- Database ---
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=kurdmap_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<یک_رمز_قوی_تصادفی_بگذار>

# --- Redis ---
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<یک_رمز_قوی_تصادفی>

# --- JWT (امنیت حیاتی!) ---
JWT_SECRET=<حداقل_۶۴_کاراکتر_تصادفی>
JWT_ISSUER=KurdMap
JWT_AUDIENCE=KurdMapClient
JWT_EXPIRY_MINUTES=15
JWT_REFRESH_EXPIRY_DAYS=7

# --- تولید JWT_SECRET ---
# openssl rand -base64 48

# --- CORS ---
Cors__AllowedOrigins__0=https://kurdmap.de
Cors__AllowedOrigins__1=https://admin.kurdmap.de
Cors__AllowedOrigins__2=https://gs6xapi.kurdmap.eu

# --- URLs ---
API_URL=https://gs6xapi.kurdmap.eu
API_PORT=8080
FRONTEND_URL=https://kurdmap.de
FRONTEND_PORT=80
ADMIN_URL=https://admin.kurdmap.de
ADMIN_PORT=80
```

### ۶.۲: CORS — اجازه اتصال از اپ موبایل

**مهم:** اپ موبایل (React Native) مستقیماً HTTP requests ارسال می‌کند.
React Native **از CORS browser policy پیروی نمی‌کند**، ولی سرور باید CORS تنظیم شده باشد.

**فایل `src/KurdMap.API/Program.cs`:**
```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? Array.Empty<string>();
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

**برای Production** مطمئن شو `Cors:AllowedOrigins` شامل:
```json
[
  "https://kurdmap.de",
  "https://admin.kurdmap.de"
]
```

> 💡 **موبایل اپ نیازی به CORS origin ندارد** — CORS فقط برای مرورگر اعمال می‌شود. ولی برای frontend و admin panel وب لازم است.

### ۶.۳: Deploy با Docker

```bash
# در سرور Production:
cd /path/to/KurdMap-web-all

# ساخت images
docker-compose -f docker-compose.yml build

# اجرا
docker-compose -f docker-compose.yml up -d

# بررسی سلامت
curl https://gs6xapi.kurdmap.eu/health
```

### ۶.۴: SSL Certificate

```bash
# با Let's Encrypt (رایگان):
sudo certbot --nginx -d gs6xapi.kurdmap.eu -d kurdmap.de -d admin.kurdmap.de

# یا اگر از reverse proxy (nginx/traefik) استفاده می‌کنی:
# در nginx config:
server {
    listen 443 ssl;
    server_name gs6xapi.kurdmap.eu;
    ssl_certificate /etc/letsencrypt/live/gs6xapi.kurdmap.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gs6xapi.kurdmap.eu/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8080;
    }
}
```

### ۶.۵: Checklist سرور

| مورد | دستور بررسی | وضعیت |
|------|-------------|--------|
| سرور آنلاین | `curl https://gs6xapi.kurdmap.eu/health` | ⬜ |
| SSL معتبر | `curl -v https://gs6xapi.kurdmap.eu 2>&1 \| grep "SSL"` | ⬜ |
| Database seed شده | `curl https://gs6xapi.kurdmap.eu/api/v1/cities` | ⬜ |
| Login کار می‌کند | `curl -X POST https://gs6xapi.kurdmap.eu/api/auth/login -d '...'` | ⬜ |
| Test account ساخته شده | `review@kurdmap.de / TestReview2026!` | ⬜ |

---

## 7. فایل‌های Build آماده

### خروجی‌ها

| فایل | مسیر | حجم | کاربرد |
|------|------|------|--------|
| **AAB** ← Google Play | `src/kurdmap-mobile/release-output/kurdmap-v1.0.0.aab` | **44 MB** | آپلود به Internal Testing |
| **APK** ← تست مستقیم | `src/kurdmap-mobile/release-output/kurdmap-v1.0.0.apk` | **84 MB** | نصب مستقیم روی گوشی |

### امضای دیجیتال

| مشخصه | مقدار |
|-------|-------|
| **Signer** | `CN=KurdMap, OU=Mobile, O=KurdMap, L=Berlin, ST=Berlin, C=DE` |
| **Algorithm** | `SHA384withRSA, 2048-bit` |
| **Validity** | تا ۲۴ اوت ۲۰۵۳ |
| **Keystore** | `android/app/kurdmap-upload.keystore` |
| **Alias** | `kurdmap-upload` |

### تست APK روی گوشی

**روش ۱: USB + adb:**
```bash
adb install src/kurdmap-mobile/release-output/kurdmap-v1.0.0.apk
```

**روش ۲: انتقال فایل:**
1. فایل `kurdmap-v1.0.0.apk` را به گوشی انتقال بده (USB/Bluetooth/Cloud)
2. در File Manager باز کن
3. "Install" بزن (شاید نیاز به فعال‌سازی "Unknown sources" باشد)

**روش ۳: لینک Internal Testing:**
- بعد از آپلود AAB به Internal Testing، لینک تست می‌گیری که از Play Store نصب کنی

---

## 8. Set up your app — تکمیل اطلاعات اپ

> **منبع رسمی:** https://support.google.com/googleplay/android-developer/answer/9859455
>
> در **Google Play Console → KurdMap → Dashboard** بخش **"Set up your app"** را باز کن.

### ۸.۱: App access (دسترسی به اپ)

**مسیر:** Policy and programs → App content → App access

| گزینه | انتخاب |
|-------|--------|
| **"All or some functionality is restricted"** | ✅ انتخاب کن |

سپس **"+ Add new instructions"** بزن:

```
Login type: Email and password

Test account credentials:
Email: review@kurdmap.de
Password: TestReview2026!

This account can be used to test all app features including 
search, map, favorites, reviews, and account deletion.
The app also works without login for browsing businesses.
```

### ۸.۲: Ads (تبلیغات)

**مسیر:** Policy and programs → App content → Ads

| سؤال | جواب |
|------|------|
| Does your app contain ads? | **No** |

### ۸.۳: Content rating

→ [بخش ۱۳](#13-content-rating) ↓

### ۸.۴: Target audience and content

**مسیر:** Policy and programs → App content → Target audience and content

| سؤال | جواب |
|------|------|
| Target age group | **18 and over** |
| Is this a news app? | **No** |
| Does the app appeal to children? | **No** |

> ⚠️ **نکته:** اگر "13 to 17" یا کمتر انتخاب کنی، باید از Families Policy پیروی کنی. چون اپ کسب‌وکار است، `18+` بهترین انتخاب است.

### ۸.۵: Data safety

→ [بخش ۱۴](#14-data-safety) ↓

### ۸.۶: Government apps

| سؤال | جواب |
|------|------|
| Is this a government app? | **No** |

### ۸.۷: Financial features

| سؤال | جواب |
|------|------|
| Does this app provide financial services? | **No** |

### ۸.۸: Health apps

| سؤال | جواب |
|------|------|
| Is this a health app? | **No** |

---

## 9. Internal Testing — آپلود AAB

> **منبع رسمی:** https://support.google.com/googleplay/android-developer/answer/9845334

### مرحله ۹.۱: Select Testers

1. **Google Play Console → KurdMap → Testing → Internal testing → Testers**
2. **"Create email list"** → نام: `KurdMap Internal Team`
3. ایمیل خودت را اضافه کن
4. **"Save changes"**

### مرحله ۹.۲: Create a New Release

1. **Testing → Internal testing → Releases → "Create new release"**

### مرحله ۹.۳: App Integrity (بار اول)

Google Play هنگام اولین آپلود از تو می‌خواهد:

```
📋 "App signing by Google Play"
   ✅ "Let Google manage and protect your app signing key"
   → قبول کن (highly recommended)
```

**این یعنی چه؟**
- تو فقط **upload key** (`kurdmap-upload.keystore`) را نگه می‌داری
- Google Play با **signing key** خودش اپ را امضا می‌کند
- اگر upload key گم شد، می‌توانی reset درخواست دهی
- Google Play App Signing امنیت بیشتری دارد

### مرحله ۹.۴: آپلود AAB

1. فایل **`kurdmap-v1.0.0.aab`** (44MB) از `release-output/` بردار
2. Drag & Drop در بخش **"App bundles"**
3. صبر کن تا upload و validation تمام شود ✅
4. اگر خطا بود → بخش [Rebuild](#19-دستورات-build) ببین

### مرحله ۹.۵: Release Details

| فیلد | مقدار |
|------|-------|
| **Release name** | `1.0.0` (حداکثر ۵۰ کاراکتر) |

**Release notes:** روی **"Add release notes"** کلیک کن و زبان‌ها اضافه کن:

**🇩🇪 German (de-DE) — زبان پیش‌فرض:**
```
KurdMap v1.0.0 — Erste Veröffentlichung!

• Finden Sie kurdische Geschäfte in Köln und Düsseldorf
• Interaktive Karte mit GPS-Standort
• Bewertungen lesen und schreiben
• Favoriten speichern
• Dunkler Modus
• 4 Sprachen: Deutsch, Englisch, Kurdisch (Sorani), Kurmanji
```

**🇬🇧 English (en-US):**
```
KurdMap v1.0.0 — First Release!

• Find Kurdish businesses in Cologne and Düsseldorf
• Interactive map with GPS location
• Read and write reviews
• Save favorites
• Dark mode
• 4 languages: German, English, Kurdish (Sorani), Kurmanji
```

### مرحله ۹.۶: Review and Rollout

1. **"Save"** → ذخیره draft
2. **"Review release"** → بررسی خطاها
3. اگر warning داشت (مثلاً Store Listing incomplete) → بعداً تکمیل می‌شود، ولی release قابل ارسال است
4. **"Start rollout to Internal testing"** → تأیید ✅

### مرحله ۹.۷: کپی لینک تست

1. **Internal testing → Testers** tab
2. **"Copy link"** — این لینک opt-in است
3. این لینک را در مرورگر گوشی باز کن → به Play Store می‌رود → "Join the test" → "Download"

---

## 10. Closed Testing — ۱۲ تستر · ۱۴ روز

> **منبع رسمی:** https://support.google.com/googleplay/android-developer/answer/14151465
>
> ⚠️ **این مرحله الزامی است.** بدون Closed Testing نمی‌توانی به Production دسترسی داشته باشی.

### الزامات (مطابق Google Play 2025/2026):

| الزام | توضیح |
|-------|-------|
| حداقل **۱۲ tester** | باید opt-in کرده باشند |
| **۱۴ روز متوالی** | از زمان opt-in شمارش می‌شود |
| **واقعی باشند** | تسترها باید واقعاً اپ را نصب و استفاده کنند |
| **opt-in بمانند** | اگر tester از تست خارج شود، شمارش ریست نمی‌شود ولی باید ≥12 باقی بمانند |

### مرحله ۱۰.۱: ساخت Closed Testing Track

1. **Testing → Closed testing → Manage track → "Create new release"**
2. **یا:** از Internal Testing → **"Promote release"** → **"Closed testing"**

### مرحله ۱۰.۲: اضافه کردن Testers

**روش ایمیل لیست (ساده‌ترین):**

1. **Closed testing → Testers**
2. **"Create email list"** → نام: `KurdMap Beta Testers`
3. حداقل **۱۲ تا ۲۰ ایمیل** اضافه کن

**چطور ۱۲+ تستر پیدا کنی؟**

مطابق [راهنمای رسمی Google](https://support.google.com/googleplay/android-developer/answer/14151465):

| منبع | توضیح |
|------|-------|
| دوستان و خانواده | ساده‌ترین راه |
| همکاران | اگر تیم داری |
| شبکه‌های اجتماعی | پست بگذار و بخواه تست کنند |
| انجمن‌های کوردی | گروه‌های تلگرام/واتساپ |
| Reddit/Discord | کامیونیتی‌های developer |

### مرحله ۱۰.۳: لینک Opt-in بفرست

1. **Closed testing → Testers → "Copy link"**
2. لینک را برای هر ۱۲+ نفر بفرست
3. **آنها باید:**
   - لینک را باز کنند
   - **"Join"** یا **"Accept invitation"** بزنند
   - **اپ را نصب کنند**
   - **۱۴ روز opt-in بمانند**

### مرحله ۱۰.۴: پیگیری وضعیت

در Dashboard می‌توانی ببینی:
```
✅ Publish a closed testing release     ← باید release فعال باشد
⬜ Have at least 12 testers opted-in    ← 0 testers currently opted in
⬜ Run for at least 14 days             ← شمارش بعد از opt-in شروع می‌شود
```

### مرحله ۱۰.۵: جمع‌آوری Feedback

**Play Console → Ratings and reviews → Testing feedback**

- feedback تسترها فقط به تو نمایش داده می‌شود
- در Play Store عمومی پیدا نیست
- **باگ‌ها را رفع کن** و در صورت نیاز build جدید آپلود کن

---

## 11. Apply for Production Access

> **منبع رسمی:** https://support.google.com/googleplay/android-developer/answer/14151465#apply

### شرایط فعال شدن دکمه "Apply for Production":

| ✅ | شرط |
|---|------|
| ✅ | Identity verification تکمیل شده |
| ✅ | Set up your app تکمیل شده |
| ✅ | Closed testing release فعال |
| ✅ | ≥ 12 tester opt-in شده |
| ✅ | ≥ 14 روز گذشته |

### مرحله ۱۱.۱: Apply

1. **Dashboard → "Apply for production"**
2. به ۳ بخش سؤالات پاسخ بده:

### Part 1: Tell us about your closed test

```
⮞ "How did you recruit testers?"
→ "Personal and professional network — I asked friends, family, and 
   colleagues to test the app"

⮞ "How did you communicate with testers?"
→ "Email and messaging apps (WhatsApp/Telegram)"

⮞ "Summarize feedback from testers"
→ "Testers found the app easy to use for finding Kurdish businesses. 
   Minor UI improvements were made based on feedback. Search and map 
   features worked well on different devices."
```

### Part 2: Tell us about your app

```
⮞ "What does your app do?"
→ "KurdMap helps users find Kurdish businesses (restaurants, barbers, 
   shops) in German cities like Cologne and Düsseldorf. Users can 
   search, view on a map, read reviews, and save favorites."

⮞ "Who is the target audience?"
→ "Kurdish community and anyone interested in Kurdish culture in Germany. 
   Age 18+."
```

### Part 3: Production readiness

```
⮞ "Is your app ready for production?"
→ "Yes — all features tested, GDPR compliant, account deletion available, 
   4 languages supported, dark mode included."
```

### مرحله ۱۱.۲: بعد از Apply

- ⏳ بررسی: **معمولاً ≤ ۷ روز**
- اگر تأیید شد → **Production track** فعال می‌شود
- اگر رد شد → دلیل ایمیل می‌شود. رفع کن و دوباره apply کن

---

## 12. Store Listing — صفحه فروشگاه

> **منبع رسمی:** https://support.google.com/googleplay/android-developer/answer/9859152

**مسیر:** Grow users → Store presence → Main store listing

### 🇩🇪 German (زبان پیش‌فرض)

**App name** (حداکثر ۳۰ کاراکتر):
```
KurdMap
```

**Short description** (حداکثر ۸۰ کاراکتر):
```
Finden Sie kurdische Restaurants, Friseure & Geschäfte in Köln und Düsseldorf
```

**Full description** (حداکثر ۴۰۰۰ کاراکتر):
```
KurdMap – Ihre Plattform für kurdische Geschäfte in Deutschland!

📍 Finden Sie kurdische Restaurants, Friseure, Hotels und Dienstleistungen in Köln und Düsseldorf
⭐ Lesen und schreiben Sie Bewertungen
❤️ Speichern Sie Ihre Lieblingsgeschäfte
🗺️ Interaktive Karte mit Standortsuche
🔍 Erweiterte Suche mit Umkreisfilter und Kategorien
🌙 Dunkler Modus für komfortables Browsen
🌐 Verfügbar auf Deutsch, Englisch, Kurdisch (Sorani) und Kurmanji

Funktionen:
• Entdecken Sie kurdische Geschäfte in Ihrer Nähe
• Detaillierte Geschäftsprofile mit Öffnungszeiten, Fotos und Kontaktdaten
• Bewertungen lesen und eigene Erfahrungen teilen
• Favoriten speichern für schnellen Zugriff
• Interaktive Kartenansicht mit GPS-Standort
• Offline-Banner bei fehlender Internetverbindung
• DSGVO-konform — Ihre Daten sind sicher
• Konto jederzeit löschbar

Entdecken Sie die Vielfalt kurdischer Kultur direkt in Ihrer Nähe!
```

### 🇬🇧 English

**App name:**
```
KurdMap
```

**Short description:**
```
Find Kurdish restaurants, barbers & shops in Cologne and Düsseldorf
```

**Full description:**
```
KurdMap — Your platform for Kurdish businesses in Germany!

📍 Find Kurdish restaurants, barbers, hotels and services in Cologne & Düsseldorf
⭐ Read and write reviews
❤️ Save your favorite businesses
🗺️ Interactive map with location search
🔍 Advanced search with radius filter and categories
🌙 Dark mode for comfortable browsing
🌐 Available in German, English, Kurdish (Sorani) and Kurmanji

Features:
• Discover Kurdish businesses near you
• Detailed business profiles with hours, photos, and contact info
• Read reviews and share your experiences
• Save favorites for quick access
• Interactive map view with GPS location
• Offline banner when no internet connection
• GDPR compliant — your data is safe
• Delete your account at any time

Discover the diversity of Kurdish culture near you!
```

### 🟢 Kurdî (Soranî)

**App name:**
```
KurdMap
```

**Short description:**
```
چێشتخانە، دەلاک و کاروباری کوردی لە کۆلن و دوسلدۆرف بدۆزەرەوە
```

### Graphics (وسایل گرافیکی)

| Asset | ابعاد | فرمت | الزامی؟ | وضعیت |
|-------|-------|------|:---:|--------|
| **App icon** | 512×512 | PNG (32-bit, no alpha) | ✅ | بساز از `icon.png` |
| **Feature graphic** | 1024×500 | PNG/JPG | ✅ | ❌ باید بسازی |
| **Phone screenshots** | min 2, max 8 | PNG/JPG | ✅ | ❌ باید بگیری |
| **7-inch tablet screenshots** | min 1 | PNG/JPG | ❌ | اختیاری |
| **10-inch tablet screenshots** | min 1 | PNG/JPG | ❌ | اختیاری |

### ساخت آیکون ۵۱۲:

```bash
# اگر imagemagick داری:
convert assets/icon.png -resize 512x512 assets/icon-512.png

# یا با rsvg-convert:
rsvg-convert -w 512 -h 512 assets/svg/icon.svg -o assets/icon-512.png

# یا آنلاین: https://www.iloveimg.com/resize-image
```

### گرفتن Screenshots:

1. اپ را با Expo Go یا APK نصب‌شده اجرا کن
2. حداقل **۲ اسکرین‌شات** (توصیه: **۴ تا ۸**)
3. صفحات پیشنهادی:
   - 📱 صفحه اصلی (Home با انتخاب شهر)
   - 🗺️ نقشه (Map با مارکرها)
   - 🔍 جستجو (Search با فیلترها)
   - 📄 جزئیات کسب‌وکار (Business Detail)
   - ⭐ نظرات (Reviews)
   - 🌙 حالت تاریک (Dark Mode)
4. ابعاد: **حداقل ۳۲۰px**, **حداکثر ۳۸۴۰px**
5. **JPEG/PNG**, حداکثر ۸MB هر فایل

### ساخت Feature Graphic:

بنر **۱۰۲۴×۵۰۰** پیکسل با:
- لوگوی KurdMap
- متن: **"Kurdish Businesses in Germany"**
- رنگ پس‌زمینه: `#064E3B` (emerald)
- ابزار: [Canva](https://canva.com) یا [Figma](https://figma.com)

### Categorization

| فیلد | مقدار |
|------|-------|
| **App type** | Application |
| **Category** | Travel & Local |
| **Tags** | Kurdish, Businesses, Local, Map, Germany |

### Contact details

| فیلد | مقدار |
|------|-------|
| **Email** | `support@kurdmap.de` |
| **Website** | `https://kurdmap.de` |
| **Phone** | (اختیاری) |

---

## 13. Content Rating

> **منبع رسمی:** https://support.google.com/googleplay/android-developer/answer/9859655

**مسیر:** Policy and programs → App content → Content rating → **"Start questionnaire"**

### Questionnaire:

| سؤال | جواب |
|------|------|
| **Email address** | ایمیل تماس |
| **Category** | **"Utility, Productivity, Communication, or other"** |
| Does the app allow user interaction or information exchange? | **Yes** (reviews) |
| Can users share their location? | **Yes** |
| Does the app contain violence? | **No** |
| Does the app contain sexual content? | **No** |
| Does the app contain profanity/crude humor? | **No** |
| Does the app reference drugs/alcohol/tobacco? | **No** |
| Does the app contain gambling? | **No** |
| Does the app allow purchases? | **No** |
| Are there ads in the app? | **No** |
| Does the app contain elements that may be disturbing? | **No** |

**Apply questionnaire** → نتایج را بررسی → **Save**

**نتیجه مورد انتظار:** `PEGI 3` / `Everyone` / `USK: ab 0`

---

## 14. Data Safety

> **منبع رسمی:** https://support.google.com/googleplay/android-developer/answer/10787469

**مسیر:** Policy and programs → App content → Data safety → **"Start"**

### سؤال ۱: آیا اپ داده جمع‌آوری یا به اشتراک می‌گذارد؟

**→ "Yes"**

### سؤال ۲: آیا داده‌ها رمزنگاری شده منتقل می‌شوند؟

**→ "Yes"** (HTTPS/TLS 1.2+)

### سؤال ۳: آیا کاربران می‌توانند حذف داده درخواست دهند؟

**→ "Yes"** (Account Deletion → Profile → Delete Account)

**URL حذف داده (اختیاری):**
```
https://kurdmap.de/delete-account
```

### سؤال ۴: جدول داده‌ها

**Location:**

| نوع | جمع‌آوری | اشتراک | هدف |
|-----|:---:|:---:|-----|
| Approximate location | ✅ | ❌ | App functionality: یافتن کسب‌وکارهای نزدیک |
| Precise location | ✅ | ❌ | App functionality: نمایش موقعیت روی نقشه |

**Personal info:**

| نوع | جمع‌آوری | اشتراک | هدف |
|-----|:---:|:---:|-----|
| Name | ✅ | ❌ | Account management: نمایش در پروفایل |
| Email address | ✅ | ❌ | Account management: ثبت‌نام و ورود |

**App activity:**

| نوع | جمع‌آوری | اشتراک | هدف |
|-----|:---:|:---:|-----|
| App interactions | ✅ | ❌ | Analytics: جستجو و مرور |

**App info and performance:**

| نوع | جمع‌آوری | اشتراک | هدف |
|-----|:---:|:---:|-----|
| Crash logs | ✅ | ❌ | Analytics: Sentry crash reporting |

**Device or other IDs:**

| نوع | جمع‌آوری | اشتراک | هدف |
|-----|:---:|:---:|-----|
| Device or other IDs | ✅ | ❌ | App functionality: Push notifications |

### مهم:

هر data type که "Yes" زدی → یک زیرصفحه دارد:

| سؤال | جواب |
|------|------|
| Is this data required or optional? | **Required** (برای location و email) |
| Is this data processed ephemerally? | **No** |
| Will you share this data with third parties? | **No** |

بعد از تکمیل → **"Submit"**

---

## 15. Privacy Policy

### URL اجباری

Google Play یک **URL عمومی قابل دسترس** برای Privacy Policy می‌خواهد.

### گزینه‌ها:

**گزینه ۱: صفحه وب kurdmap.de (بهترین)**
```
https://kurdmap.de/privacy
```
- محتوا از `app/policy.tsx` در اپ موجود است
- همان محتوا را در وب‌سایت هم بگذار

**گزینه ۲: GitHub Pages (رایگان و سریع)**
1. Repository بساز: `kurdmap-privacy`
2. فایل `index.html` با محتوای Privacy Policy
3. Settings → Pages → فعال کن
4. URL: `https://YOUR_USERNAME.github.io/kurdmap-privacy/`

**گزینه ۳: Notion (سریع‌ترین)**
1. صفحه Notion بساز
2. Share → Published to web
3. URL عمومی را در Play Console وارد کن

### محتوای Privacy Policy که باید داشته باشد:

```
KurdMap — Privacy Policy
Last updated: April 2026

1. Data We Collect:
   - Name (for profile and reviews)
   - Email address (for account registration and login)
   - Location data (to find nearby businesses)
   - Device identifiers (for push notifications)
   - App usage data (search queries, browsing)

2. How We Store Data:
   - JWT tokens: Encrypted in SecureStore (on device)
   - Preferences: AsyncStorage (on device)
   - Account data: PostgreSQL database (server, encrypted in transit)
   
3. Third-party Services:
   - OpenStreetMap/Google Maps: Map tile rendering
   - Sentry (optional): Crash reporting
   - Expo Push Service: Push notifications via FCM
   
4. Data Sharing:
   - We do NOT sell or share personal data with third parties
   - Your reviews are publicly visible with your display name
   
5. Your GDPR Rights:
   - Access: View your data in Profile
   - Correct: Edit your profile
   - Delete: Profile → Delete Account (permanent, PII anonymized)
   - Portability: Contact privacy@kurdmap.de
   
6. Data Processing Location:
   - Germany (EU) — GDPR compliant
   
7. Account Deletion:
   - Available in-app: Profile → Delete Account
   - Requires password confirmation
   - Performs soft delete + PII anonymization
   
8. Contact:
   - Email: privacy@kurdmap.de
   - Website: https://kurdmap.de
```

### وارد کردن URL در Play Console:

1. **Policy and programs → App content → Privacy Policy → "Start"**
2. URL وارد کن (مثلاً `https://kurdmap.de/privacy`)
3. **"Save"**

---

## 16. App Access — اکانت تست

### چرا لازم است؟

Google Review Team اپ تو را بررسی می‌کند. اگر لاگین لازم باشد، باید **اکانت تست** بدهی.

### ساخت اکانت تست:

**۱. در سرور production یک کاربر بساز:**

```bash
curl -X POST https://gs6xapi.kurdmap.eu/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Google Review",
    "email": "review@kurdmap.de",
    "password": "TestReview2026!"
  }'
```

**۲. در Play Console:**

**مسیر:** Policy and programs → App content → App access

```
App access type: "All or some functionality is restricted"

Instructions:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test account credentials:
Email: review@kurdmap.de
Password: TestReview2026!

This account can access all app features:
- Search and browse businesses
- View map and business details
- Read and write reviews
- Add/remove favorites
- Account deletion (Profile → Delete Account)

Note: The app also works without login for 
browsing businesses, viewing maps, and searching.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 17. Signing Keystore

### Upload Keystore

| مشخصه | مقدار |
|-------|-------|
| **فایل** | `android/app/kurdmap-upload.keystore` |
| **نوع** | PKCS12 |
| **Alias** | `kurdmap-upload` |
| **Password** | `KurdMap2026Secure` |
| **Algorithm** | RSA 2048-bit |
| **اعتبار** | ۱۰,۰۰۰ روز (تا اوت ۲۰۵۳) |

### ⚠️ نکات امنیتی حیاتی:

| # | نکته |
|---|------|
| 1 | فایل keystore **هرگز در Git commit نشود** (در `.gitignore` است) |
| 2 | **backup در جای امن ذخیره کن** (USB رمزنگاری، password manager، safe deposit) |
| 3 | **اگر گم شود:** باید Upload Key Reset از Google درخواست دهی (پروسه طولانی) |
| 4 | در CI/CD: password از environment variable بخوان |

### تنظیمات Gradle

**فایل `android/app/build.gradle`:**
```groovy
signingConfigs {
    release {
        storeFile file('kurdmap-upload.keystore')
        storePassword System.getenv("KURDMAP_UPLOAD_STORE_PASSWORD") ?: 'KurdMap2026Secure'
        keyAlias 'kurdmap-upload'
        keyPassword System.getenv("KURDMAP_UPLOAD_KEY_PASSWORD") ?: 'KurdMap2026Secure'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ...
    }
}
```

---

## 18. Checklist نهایی

### ✅ انجام شده:

- [x] TypeScript: 0 errors
- [x] Jest Tests: 109/109 passed
- [x] Backend Tests: 90/90 passed
- [x] AAB built and signed (44MB)
- [x] APK built for testing (84MB)
- [x] Account deletion — backend + mobile
- [x] Privacy Policy screen — GDPR compliant
- [x] `versionCode: 1`, `package: de.kurdmap.mobile`
- [x] Production API URL embedded: `https://gs6xapi.kurdmap.eu`
- [x] `blockedPermissions` — CAMERA, AUDIO مسدود
- [x] `transform-remove-console` — حذف console.log
- [x] i18n: ۴ زبان کامل
- [x] App icons + splash screen + adaptive icon
- [x] Upload keystore ساخته شده
- [x] Target SDK 34, Min SDK 24, Compile SDK 35

### ⬜ توسط تو:

**فاز ۱ — تأیید هویت (هفته ۱):**
- [ ] Identity verification (پاسپورت/ID)
- [ ] Android device verification
- [ ] Phone number verification

**فاز ۲ — Set up your app (هفته ۱):**
- [ ] Privacy Policy URL وارد کن
- [ ] App access با test account
- [ ] Ads → No
- [ ] Target audience → 18+
- [ ] Content rating questionnaire
- [ ] Data safety form
- [ ] Government/Financial/Health → No

**فاز ۳ — Store Listing (هفته ۱):**
- [ ] Title + Description (de-DE, en-US)
- [ ] Screenshots (حداقل ۲)
- [ ] Feature graphic (1024×500)
- [ ] App icon (512×512)
- [ ] Contact details
- [ ] Category: Travel & Local

**فاز ۴ — Internal Testing (هفته ۱-۲):**
- [ ] AAB آپلود
- [ ] Release notes وارد کن
- [ ] Testers اضافه کن
- [ ] خودت تست کن

**فاز ۵ — سرور Production (هفته ۲):**
- [ ] Deploy `gs6xapi.kurdmap.eu`
- [ ] SSL Certificate
- [ ] Database seed
- [ ] Test account: `review@kurdmap.de`
- [ ] Health check: `/health`

**فاز ۶ — Closed Testing (هفته ۲-۴):**
- [ ] ≥ 12 tester اضافه کن
- [ ] لینک opt-in بفرست
- [ ] ۱۴ روز صبر
- [ ] Feedback جمع‌آوری

**فاز ۷ — Production (بعد از ۱۴ روز):**
- [ ] Apply for production access
- [ ] پاسخ به سؤالات
- [ ] Production release ← آپلود AAB نهایی
- [ ] 🎉 **Published!**

---

## 19. دستورات Build

```bash
# ═══════════════════════════════════════════════
#  KurdMap — Local Build Commands (Linux)
# ═══════════════════════════════════════════════

# ────── متغیرهای محیطی ──────
export ANDROID_HOME=~/Android/Sdk
export JAVA_HOME=/usr
export NODE_OPTIONS='--no-experimental-strip-types'

# ────── بررسی کد ──────
cd src/kurdmap-mobile

# TypeScript
npx tsc --noEmit

# Tests
npx jest

# ────── Prebuild (فقط بار اول یا بعد تغییر native) ──────
npx expo prebuild --platform android --clean

# ⚠️ بعد از prebuild: خط sentry.gradle در build.gradle کامنت کن:
# فایل: android/app/build.gradle
# // apply from: new File(["node", "--print", ...], "sentry.gradle")

# ────── Build APK (تست مستقیم) ──────
cd android
./gradlew assembleRelease --no-daemon
# خروجی: android/app/build/outputs/apk/release/app-release.apk

# ────── Build AAB (Google Play) ──────
./gradlew bundleRelease --no-daemon
# خروجی: android/app/build/outputs/bundle/release/app-release.aab

# ────── کپی به release-output ──────
mkdir -p ../release-output
cp app/build/outputs/bundle/release/app-release.aab ../release-output/kurdmap-v1.0.0.aab
cp app/build/outputs/apk/release/app-release.apk ../release-output/kurdmap-v1.0.0.apk

# ────── بررسی امضا ──────
jarsigner -verify -verbose -certs ../release-output/kurdmap-v1.0.0.aab 2>&1 | head -10

# ────── حل مشکل file watchers (اگر ENOSPC شد) ──────
# پاک‌سازی cache های gradle از node_modules:
find node_modules -path "*/android/build" -type d -exec rm -rf {} + 2>/dev/null
```

---

## 20. Rebuild و آپدیت

### تغییر فقط در JavaScript/TypeScript:

```bash
cd src/kurdmap-mobile/android
./gradlew bundleRelease --no-daemon
```

### تغییر در Native (plugins, SDK, etc.):

```bash
cd src/kurdmap-mobile
npx expo prebuild --platform android --clean
# ⚠️ خط sentry.gradle را دوباره کامنت کن
# ⚠️ signing config را اگر overwrite شد fix کن
cd android
./gradlew bundleRelease --no-daemon
```

### افزایش versionCode برای آپلود جدید:

**فایل `android/app/build.gradle`:**
```groovy
defaultConfig {
    versionCode 2        // ← هر آپلود +1
    versionName "1.0.1"  // ← نسخه نمایشی
}
```

> ⚠️ Google Play هر AAB با `versionCode` تکراری را **رد** می‌کند!

### OTA Update (بدون build جدید):

اگر از EAS استفاده می‌کنی:
```bash
eas update --branch production --message "Bug fix v1.0.1"
```
> OTA Update فقط تغییرات JS/TS را push می‌کند. برای تغییرات native باید AAB جدید بسازی.

---

## Appendix: ساختار فایل‌ها

```
src/kurdmap-mobile/
├── app.json                    ← تنظیمات Expo (package, versionCode, plugins)
├── eas.json                    ← تنظیمات EAS Build/Submit
├── .env                        ← Development: localhost:8080
├── .env.local                  ← Development: localhost:5110
├── .env.production             ← Production: https://gs6xapi.kurdmap.eu
├── release-output/             ← ⬇️ خروجی‌های آماده آپلود
│   ├── kurdmap-v1.0.0.aab      ← 44 MB — آپلود به Google Play
│   └── kurdmap-v1.0.0.apk      ← 84 MB — تست مستقیم روی گوشی
├── android/
│   ├── app/
│   │   ├── build.gradle        ← signing config + versions
│   │   ├── kurdmap-upload.keystore  ← ⚠️ Upload key (در .gitignore)
│   │   └── src/main/AndroidManifest.xml ← permissions, deep links, notifications
│   └── sentry.properties       ← Sentry org + project config
├── assets/
│   ├── icon.png                ← 1024×1024 آیکون
│   ├── adaptive-icon.png       ← 1024×1024 Android adaptive
│   ├── splash.png              ← Splash screen
│   └── svg/                    ← فایل‌های SVG اصلی
├── src/
│   ├── api/
│   │   ├── client.ts           ← Axios setup, JWT interceptors, base URLs
│   │   ├── auth.ts             ← register, login, logout, deleteAccount
│   │   ├── businesses.ts       ← search, getBySlug
│   │   ├── reviews.ts          ← getReviews, createReview
│   │   └── favorites.ts        ← getFavorites, toggleFavorite
│   ├── stores/auth-store.ts    ← Zustand store: login, logout, deleteAccount
│   └── i18n/locales/           ← de.ts, en.ts, ku.ts, kmr.ts
└── app/
    ├── (tabs)/profile.tsx      ← UI حذف حساب
    └── policy.tsx              ← Privacy Policy screen
```

---

**پایان راهنما**

> **فایل AAB آماده آپلود:**
> `src/kurdmap-mobile/release-output/kurdmap-v1.0.0.aab` (44 MB)
>
> **مرحله بعدی فوری:**
> 1. Identity verification تکمیل کن (پاسپورت آپلود)
> 2. Set up your app تکمیل کن
> 3. Internal Testing → AAB آپلود
> 4. Screenshots بگیر و Store Listing تکمیل کن
