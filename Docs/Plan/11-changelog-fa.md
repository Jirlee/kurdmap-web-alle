# گزارش تغییرات KurdMap — نسخه جدید

## تاریخ: آوریل ۲۰۲۶

---

## ۱. رفع خطای ۵۰۰ در جستجوی کسب‌وکارها

**مشکل:** درخواست `GET /api/v1/businesses/search` در بار دوم با خطای ۵۰۰ مواجه می‌شد.

**علت:** کلاس `PaginatedList` هنگام بازیابی از کش Redis نمی‌توانست deserialize شود چون نام پارامترهای constructor با نام فیلدهای JSON مطابقت نداشت.

**راه‌حل:** اضافه کردن `[JsonConstructor]` با پارامترهای مطابق فیلدهای JSON شامل `items`, `pageNumber`, `totalPages`, `totalCount`, `hasPreviousPage`, `hasNextPage`. تغییر `HasPreviousPage` و `HasNextPage` از computed به stored properties.

**فایل‌های تغییر یافته:**
- `KurdMap.Application/Common/Models/PaginatedList.cs`

---

## ۲. حذف محدودیت کلن و دوسلدورف — پوشش کل آلمان

**تغییر:** پلتفرم از دو شهر کلن و دوسلدورف به کل آلمان گسترش یافت.

**جزئیات:**
- متن‌های زیرنویس در هر ۴ فایل زبان (en, de, ku, kmr) به «سراسر آلمان» تغییر یافت
- فوتر: «Köln & Düsseldorf» → «Bundesweit, Deutschland»
- Hero Section: شمارنده شهرها از ۲ به ۱۶، کسب‌وکارها از ۸ به ۵۰
- نقشه Leaflet: مرکز پیش‌فرض از کلن `[50.9375, 6.9603]` به مرکز آلمان `[51.1657, 10.4515]`
- متا تگ `index.html`: «in Köln und Düsseldorf» → «in ganz Deutschland»

**فایل‌های تغییر یافته:**
- `public/i18n/en.json`, `de.json`, `ku.json`, `kmr.json`
- `footer.component.ts`
- `hero-section.component.ts`
- `leaflet-map.component.ts`
- `index.html`

---

## ۳. صفحه حریم خصوصی (Privacy Policy)

**تغییر:** صفحه سیاست حریم خصوصی مطابق GDPR اضافه شد.

**جزئیات:**
- کامپوننت `PolicyComponent` با ۶ بخش: مقدمه، جمع‌آوری داده، کوکی‌ها، سرویس‌های ثالث، حقوق کاربران، اطلاعات تماس
- `ModalService` با type جدید `policy` و متد `openPolicy()`
- `ModalOverlayComponent` برای نمایش صفحه policy بروزرسانی شد
- لینک در فوتر (بخش لینک‌های سریع و نوار پایینی)
- ترجمه کامل در هر ۴ زبان

**فایل‌های ایجاد شده:**
- `features/policy/policy.component.ts`

**فایل‌های تغییر یافته:**
- `modal.service.ts`, `modal-overlay.component.ts`, `footer.component.ts`
- هر ۴ فایل i18n

---

## ۴. بهبود بخش دسته‌بندی‌ها و فونت‌ها

**مشکل:** فونت بخش دسته‌بندی بزرگ و نامناسب بود.

**تغییرات:**
- اندازه هدر: `text-3xl sm:text-4xl` → `text-2xl sm:text-3xl`
- padding کارت: `p-6` → `p-5`، gap: `gap-4` → `gap-3`
- آیکون‌های متنی `material-symbols:*` به ایموجی تبدیل شدند با متد `getEmoji()`
- پس‌زمینه آیکون: `size-10 rounded-xl bg-primary-50`
- اندازه متن: `text-sm` → `text-[13px]`
- بخش انتخاب شهرها هم مشابه کوچک‌تر شد

**فونت‌های جدید:**
- **DM Sans** (Latin): وزن ۴۰۰ تا ۷۰۰ — فونت مدرن و خوانا
- **Vazirmatn** (Kurdish/Arabic RTL): وزن ۴۰۰، ۵۰۰، ۷۰۰ — بهترین فونت فارسی/کُردی برای وب
- `@font-face` از Google Fonts CDN بارگذاری می‌شود

**فایل‌های تغییر یافته:**
- `category-cards.component.ts`
- `city-selector.component.ts`
- `styles.scss`

---

## ۵. پنج ویژگی جدید در صفحه اصلی

### ۵.۱ راهنمای استفاده (How It Works)
سه مرحله ساده: **جستجو** → **کشف** → **ارتباط** با شماره‌گذاری و آیکون‌های زیبا.

### ۵.۲ آمار اعتماد (Trust Stats)
بخش تیره با گرادیان و ۴ کارت آماری: ۱۶+ شهر، ۹ دسته‌بندی، ۴ زبان، ۱۰۰٪ رایگان.

### ۵.۳ خبرنامه (Newsletter)
فرم اشتراک ایمیل با کارت گرادیان، انیمیشن ارسال موفق و متن عدم اسپم.

### ۵.۴ اپلیکیشن موبایل (App CTA)
بنر معرفی اپلیکیشن آینده با mockup گوشی، بَج‌های App Store و Google Play و برچسب «به‌زودی».

### ۵.۵ سوالات متداول (FAQ)
آکاردئون ۵ سوالی با انیمیشن باز/بسته شدن. سوالات درباره KurdMap، ثبت کسب‌وکار، هزینه، شهرها و گزارش خطا.

**ترتیب صفحه اصلی:**
Hero → How It Works → Categories → Cities → Featured Businesses → Trust Stats → FAQ → Newsletter → App CTA

**فایل‌های ایجاد شده:**
- `shared/components/how-it-works/how-it-works.component.ts`
- `shared/components/trust-stats/trust-stats.component.ts`
- `shared/components/newsletter/newsletter.component.ts`
- `shared/components/app-cta/app-cta.component.ts`
- `shared/components/faq/faq.component.ts`

**فایل‌های تغییر یافته:**
- `home.component.ts` (import و template)
- هر ۴ فایل i18n (کلیدهای ترجمه howItWorks, trustStats, newsletter, appCta, faq)

---

## خلاصه فنی

| # | تغییر | وضعیت |
|---|-------|-------|
| ۱ | رفع خطای جستجو (Redis deserialization) | ✅ |
| ۲ | گسترش به کل آلمان | ✅ |
| ۳ | صفحه حریم خصوصی GDPR | ✅ |
| ۴ | بهبود فونت و ظاهر دسته‌بندی | ✅ |
| ۵ | ۵ ویژگی جدید صفحه اصلی | ✅ |
| ۶ | ترجمه ۴ زبانه همه ویژگی‌ها | ✅ |
| ۷ | بیلد و تست موفق | ✅ |
| ۸ | سیستم تخفیف و پیشنهاد بهترین‌ها (Backend, Admin, Frontend, Mobile) | ✅ |
| ۹ | ۳۰۵ تست کل پروژه (۱۰۴+۶۳+۲۹+۱۰۹) | ✅ |
| ۱۰ | ممیزی امنیت اندپوینت‌های تخفیف | ✅ |
| ۱۱ | مایگریشن EF: AddBusinessDiscounts | ✅ |
| ۱۲ | ۳۰ ایده پیشرفته برای آینده | ✅ |

---

> تمام تغییرات تست شده و در Docker مستقر شده‌اند.

---

## ۸. سیستم تخفیف و پیشنهاد بهترین‌ها (Discount & Recommended)

**تاریخ:** آوریل ۲۰۲۶

**توضیح:** پیاده‌سازی کامل سیستم تخفیف و پیشنهاد بهترین کسب‌وکارها در هر ۴ بخش پروژه با کنترل کامل ادمین.

### Backend (ASP.NET Core):
- متد‌های `SetDiscount()`, `ClearDiscount()`, `HasActiveDiscount` در Domain Entity
- ۳ اندپوینت: `POST/DELETE {id}/discount` (ادمین), `GET recommended` (عمومی)
- کش Redis ۵ دقیقه‌ای، FluentValidation، مایگریشن EF (۷ ستون جدید)
- **۱۴ تست جدید → ۱۰۴ تست کل**

### Admin Panel (Angular 21):
- تب هشتم در فرم کسب‌وکار: مدیریت تخفیف (درصد، توضیحات ۴ زبانه، تاریخ شروع/پایان)
- نشان تخفیف در لیست کسب‌وکارها
- بروزرسانی کامپوننت Roadmap
- **۴ تست جدید → ۶۳ تست کل**

### Frontend (Angular 21 + SSR):
- Badge تخفیف صورتی روی کارت کسب‌وکار با آیکون pricetag
- بنر تخفیف فعال در صفحه جزئیات
- بازنویسی کامپوننت featured-businesses با بخش تخفیف‌دار
- ترجمه ۴ زبانه (ku, kmr, de, en)
- **۲ تست جدید → ۲۹ تست کل**

### Mobile (React Native + Expo):
- Badge تخفیف روی BusinessCard
- بخش تخفیف‌دار در صفحه اصلی
- React Query برای recommended businesses
- ترجمه ۴ زبانه
- **۱۰۹ تست بدون رگرسیون**

### امنیت:
- احراز هویت SuperAdmin/Admin برای اندپوینت‌های تخفیف
- اعتبارسنجی: درصد ۱-۱۰۰، تاریخ پایان > شروع
- maxlength(500) توضیحات، پارامتری بودن کوئری‌ها
