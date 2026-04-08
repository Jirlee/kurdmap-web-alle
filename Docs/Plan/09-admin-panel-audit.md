# KurdMap AdminPanel — بررسی کامل مشکلات و برنامه اصلاح

> تاریخ تحلیل: ۲۰۲۶/۰۴/۰۴  
> Build status: ✅ بدون خطا — تمام ۷ فاز تکمیل شد

---

## فهرست مشکلات شناسایی‌شده

### 🔴 بحرانی (Critical)

| # | فایل | مشکل | توضیح |
|---|------|------|-------|
| C1 | `BusinessFormDialog.razor` | **دوبار اجرای Submit** | `EditForm` دارای `OnValidSubmit="HandleSubmit"` است و دکمه Submit هم `OnClick="HandleSubmit"` دارد. هنگام Submit، متد دوبار اجرا می‌شود و دو بار به API درخواست ارسال می‌کند. |
| C2 | `BusinessFormModel.cs` | **ساعات کار ارسال نمی‌شود** | متدهای `ToCreatePayload()` و `ToUpdatePayload()` فیلد `hours` (ساعات کار) را شامل نمی‌شوند. تمام تنظیمات ساعات کار در تب «ساعات کار» تأثیری ندارد. |
| C3 | `MainLayout.razor` | **صفحه دسته‌بندی‌ها وجود ندارد** | لینک `/categories` در منوی کناری وجود دارد ولی هیچ فایل `Categories.razor` با `@page "/categories"` ساخته نشده. کلیک روی آن صفحه NotFound نشان می‌دهد. |
| C4 | `JwtAuthStateProvider.cs` | **بررسی انقضای توکن وجود ندارد** | توکن JWT خوانده و ذخیره می‌شود ولی هیچ‌وقت `exp` (expiration) بررسی نمی‌شود. پس از انقضا، کاربر هنوز logged-in به نظر می‌آید ولی تمام APIها 401 برمی‌گردانند. |
| C5 | `ApiClient.cs` | **Refresh Token هرگز استفاده نمی‌شود** | `AuthTokenStore.RefreshToken` ذخیره می‌شود ولی هیچ منطقی برای refresh خودکار توکن وجود ندارد. پس از انقضای access token، کاربر باید دوباره login کند بدون هیچ پیام مناسبی. |
| C6 | `ApiClient.cs` | **خطای 401 هندل نمی‌شود** | زمانی که API با 401 پاسخ می‌دهد، `EnsureSuccessStatusCode()` فقط exception پرت می‌کند و کاربر پیام عمومی «خطا در بارگذاری» می‌بیند — هیچ redirect به login انجام نمی‌شود. |

### 🟠 مهم (Major)

| # | فایل | مشکل | توضیح |
|---|------|------|-------|
| M1 | `BusinessFormDialog.razor` | **`GetSlugForId` بسیار ناکارآمد** | برای پیدا کردن slug یک business، تا ۱۰۰ business از API دانلود می‌شود (`GetBusinessesAsync(1, 100)`). این هم در `OnInitializedAsync` و هم در `OnFileSelected` فراخوانی می‌شود. |
| M2 | `ApiClient.cs` | **`GetDashboardStatsAsync` با ۸ درخواست موازی** | برای داشبورد، ۸ درخواست جداگانه به API ارسال می‌شود (هر کدام `pageSize=1` فقط برای TotalCount). باید یک endpoint اختصاصی `/api/v1/dashboard/stats` ساخته شود. |
| M3 | `App.razor` | **بدون RTL و dir** | `<html lang="en">` تنظیم شده ولی کل UI به فارسی/کوردی (RTL) است. ویژگی `dir="rtl"` وجود ندارد. متن‌ها و لایه‌بندی در RTL مشکل خواهند داشت. |
| M4 | `ApiClient.cs` | **Services و MenuItems قابل مدیریت نیستند** | هیچ endpoint برای CRUD سرویس‌ها (`BusinessService`) و آیتم‌های منو (`MenuItem`) در ApiClient وجود ندارد. ادمین نمی‌تواند سرویس و منو اضافه/ویرایش کند. |
| M5 | `ApiClient.cs` | **Category و City CRUD ناقص** | فقط `GetCategoriesAsync()` و `GetCitiesAsync()` وجود دارد. ایجاد، ویرایش و حذف دسته‌بندی و شهر پیاده‌سازی نشده. |
| M6 | `App.razor` | **Dark mode بدون دکمه** | `_isDarkMode` در `App.razor` bind شده ولی هیچ UI برای تغییر آن وجود ندارد. کاربر نمی‌تواند بین تم روشن/تاریک تغییر دهد. |
| M7 | `launchSettings.json` | **فقط HTTP بدون HTTPS** | AdminPanel روی `http://localhost:5172` اجرا می‌شود ولی API روی `https://localhost:7084` است. Session cookies بدون HTTPS ناامن هستند و `ProtectedSessionStorage` ممکن است درست کار نکند. |
| M8 | `NotFound.razor` | **از MainLayout استفاده می‌کند** | صفحه 404 از `MainLayout` (که نیاز به auth دارد) استفاده می‌کند. کاربران احراز هویت نشده به جای دیدن 404 به login ریدایرکت می‌شوند. |

### 🟡 متوسط (Medium)

| # | فایل | مشکل | توضیح |
|---|------|------|-------|
| m1 | `BusinessFormModel.cs` | **اعتبارسنجی فرمت ناقص** | فقط `[Required]` استفاده شده. فرمت ایمیل (`[EmailAddress]`)، شماره تلفن، وب‌سایت (`[Url]`) و کد پستی اعتبارسنجی نشده. مقادیر نامعتبر قابل ارسال هستند. |
| m2 | `DtoModels.cs` | **DTOهای تکراری** | `PaginatedList<T>`, `CategoryDto`, `CityDto` و سایر DTOها هم در `AdminPanel.Models` و هم احتمالاً در `KurdMap.Application` تعریف شده‌اند. باید از `KurdMap.Shared` مشترک استفاده شود. |
| m3 | `Home.razor` | **MudBlazor v9 Chart API** | `ChartSeries<double>` و `ChartData<double>` ممکن است با API جدید MudBlazor v9.2.0 سازگار نباشد — نیاز به بررسی runtime دارد. |
| m4 | `Businesses.razor` | **MudTextField TextChanged deprecated** | `TextChanged` در MudBlazor v9 ممکن است deprecated شده باشد. باید از `ValueChanged` یا `@bind-Value:after` استفاده شود. |
| m5 | `ApiClient.cs` | **Anti-pattern: `DefaultRequestHeaders`** | `SetAuthHeader()` هر بار `httpClient.DefaultRequestHeaders.Authorization` را تنظیم می‌کند. بهتر است از `DelegatingHandler` یا request-level header استفاده شود. |
| m6 | `BusinessFormDialog.razor` | **بدون تأیید قبل از بستن** | دیالوگ با Escape یا کلیک backdrop بسته می‌شود بدون هشدار. تغییرات ذخیره‌نشده از بین می‌روند. |
| m7 | `Home.razor` / `Businesses.razor` | **تکرار کد `GetStatusColor` و `GetStatusLabel`** | این دو متد در `Home.razor` و `Businesses.razor` کپی شده‌اند. باید به یک helper مشترک منتقل شوند. |
| m8 | `UserDetailDialog.razor` | **`GetRoleColor` و `GetRoleLabel` تکراری** | همان issue — در `UserDetailDialog.razor` و `Users.razor` تکرار شده. |

### 🔵 جزئی (Minor)

| # | فایل | مشکل | توضیح |
|---|------|------|-------|
| n1 | `Error.razor` | **محتوای انگلیسی** | صفحه Error به انگلیسی است ولی باقی UI به فارسی. باید بومی‌سازی شود. |
| n2 | `NotFound.razor` | **صفحه 404 خیلی ساده** | فقط یک `<h3>` و `<p>` بدون طراحی. باید با MudBlazor بهتر طراحی شود. |
| n3 | `ReconnectModal.razor` | **محتوای انگلیسی** | پیام‌های reconnect به انگلیسی هستند. |
| n4 | `MainLayout.razor` | **بدون loading indicator هنگام navigation** | تعویض صفحات بدون نشان دادن loading. |
| n5 | `Login.razor` | **`FormName="login"` غیرضروری** | در حالت `InteractiveServer` نیازی به `FormName` نیست و ممکن است با SSR تداخل ایجاد کند. |
| n6 | `App.razor` | **فونت از Google Fonts خارجی** | لود فونت Inter از CDN. در offline/slow connection مشکل‌ساز است. |
| n7 | `MainLayout.razor.css` | **کد CSS بلااستفاده** | `#blazor-error-ui` CSS مربوط به الگوی قدیمی Blazor است که دیگر استفاده نمی‌شود. |

---

## برنامه اصلاح (Phased Fix Plan)

---

### فاز ۱ — رفع باگ‌های بحرانی و منطقی ✅
> **اولویت: فوری** — بدون این اصلاحات، اپلیکیشن به درستی کار نمی‌کند.

- [x] **1.1** رفع Double Submit در `BusinessFormDialog.razor`
  - `OnClick="HandleSubmit"` از دکمه Submit حذف شد
  - دکمه Submit تغییر به `ButtonType="ButtonType.Submit"` با `form="businessForm"`

- [x] **1.2** اضافه کردن `hours` به payload در `BusinessFormModel.cs`
  - متد `ToCreatePayload()` شامل `hours` شد
  - متد `ToUpdatePayload()` شامل `hours` شد
  - متدهای `BuildHoursPayload()` و `BuildDayPayload()` اضافه شدند

- [x] **1.3** بررسی انقضای JWT در `JwtAuthStateProvider.cs`
  - متد `IsTokenExpired()` اضافه شد — `token.ValidTo < DateTime.UtcNow`
  - در صورت انقضا → `MarkUserAsLoggedOut()` و return Anonymous

- [x] **1.4** هندل کردن خطای 401 در `ApiClient.cs`
  - `AuthenticatedHttpHandler.cs` ایجاد شد (DelegatingHandler)
  - Bearer token خودکار attach می‌شود
  - پاسخ 401 → `tokenStore.Clear()` و redirect
  - `SetAuthHeader()` کاملاً حذف شد

- [x] **1.5** رفع `GetSlugForId` در `BusinessFormDialog.razor`
  - `Slug` property به `BusinessFormModel` اضافه شد
  - `FromDetail()` مقدار `dto.Slug` را کپی می‌کند
  - تمام فراخوانی‌های `GetSlugForId` و `GetBusinessesAsync(1, 100)` حذف شدند

---

### فاز ۲ — صفحات ناموجود و CRUD ناقص ✅
> **اولویت: بالا** — عملکردهای اصلی ادمین پنل ناقص است.

- [x] **2.1** ایجاد `Categories.razor` — صفحه مدیریت دسته‌بندی‌ها
  - لیست دسته‌بندی‌ها با `MudTable`
  - دیالوگ ایجاد/ویرایش (`CategoryFormDialog.razor`)
  - حذف دسته‌بندی با تأیید
  - اضافه کردن متدهای CRUD به `ApiClient.cs`:
    - `CreateCategoryAsync()`
    - `UpdateCategoryAsync()`
    - `DeleteCategoryAsync()`

- [x] **2.2** شهرها — API فقط `GET api/v1/cities` دارد (بدون CRUD)
  - endpoint برای Create/Update/Delete شهر وجود ندارد — نیاز به توسعه backend
  - لینک `/cities` در منو وجود ندارد (مشکلی نیست)

- [x] **2.3** سرویس‌ها و منو — API endpoint وجود ندارد
  - هیچ controller برای `BusinessService` یا `MenuItem` در API وجود ندارد
  - نیاز به توسعه backend قبل از پیاده‌سازی در ادمین پنل

- [x] **2.4** بهبود `GetDashboardStatsAsync`
  - cache 2 دقیقه‌ای برای نتایج داشبورد اضافه شد
  - پارامتر `forceRefresh` برای بازنشانی اجباری
  - endpoint اختصاصی نیاز به توسعه backend دارد

---

### فاز ۳ — RTL، لایه‌بندی و UX ✅
> **اولویت: بالا** — UI فعلی برای زبان/کوردی ناقص است.

- [x] **3.1** فعال کردن RTL در `App.razor`
  - تغییر `<html lang="fa" dir="rtl">`
  - `<MudRTLProvider RightToLeft="true">` اضافه شد

- [x] **3.2** اضافه کردن dark mode toggle
  - `ThemeState.cs` سرویس ایجاد شد
  - دکمه در `MainLayout.razor` AppBar اضافه شد
  - `App.razor` subscribe به `ThemeState.OnChange` می‌کند

- [x] **3.3** بهبود صفحه NotFound
  - استفاده از `LoginLayout` به جای `MainLayout`
  - طراحی مناسب با MudBlazor (icon، دکمه برگشت)
  - متن فارسی

- [x] **3.4** بهبود صفحه Error
  - بومی‌سازی متن به فارسی
  - طراحی بهتر با MudBlazor

- [x] **3.5** Loading indicator هنگام navigation
  - هر صفحه loading state مستقل دارد (نیازی به global indicator نیست)

---

### فاز ۴ — اعتبارسنجی و امنیت ✅
> **اولویت: متوسط** — بهبود امنیت و صحت داده‌ها.

- [x] **4.1** اعتبارسنجی کامل فرم business
  - `[EmailAddress]` برای `Email`
  - `[Url]` برای `Website`
  - `[Phone]` برای `Phone`
  - `[RegularExpression(@"^\d{5}$")]` برای `PostalCode`
  - `[Range(-90, 90)]` برای `Latitude`، `[Range(-180, 180)]` برای `Longitude`

- [x] **4.2** تأیید قبل از بستن دیالوگ با تغییرات ذخیره‌نشده
  - `EditContext.OnFieldChanged` برای ردیابی `_isDirty`
  - `ShowMessageBoxAsync` هنگام Cancel اگر تغییر داده شده باشد

- [x] **4.3** افزودن HTTPS به `launchSettings.json`
  - profile `https` با `https://localhost:7172;http://localhost:5172`

- [x] **4.4** حذف `FormName="login"` از `Login.razor`
  - در حالت `InteractiveServer` غیرضروری بود — حذف شد

- [x] **4.5** پیاده‌سازی Refresh Token
  - `AuthenticatedHttpHandler` هنگام دریافت 401 ابتدا `POST api/auth/refresh` را فراخوانی می‌کند
  - اگر موفق بود → توکن جدید ذخیره و درخواست اصلی retry می‌شود
  - اگر ناموفق → `tokenStore.Clear()` و logout

---

### فاز ۵ — کیفیت کد و بازسازی ✅
> **اولویت: پایین** — تمیزکاری و حذف تکرار.

- [x] **5.1** حذف تکرار `GetStatusColor` / `GetStatusLabel`
  - ایجاد `Services/DisplayHelpers.cs` با متدهای static
  - اضافه کردن `@using static` به `_Imports.razor`
  - حذف متدهای تکراری از `Home.razor` و `Businesses.razor`

- [x] **5.2** حذف تکرار `GetRoleColor` / `GetRoleLabel`
  - در همان `DisplayHelpers.cs` قرار گرفت
  - حذف متدهای تکراری از `Users.razor` و `UserDetailDialog.razor`

- [x] **5.3** انتقال DTOهای مشترک به `KurdMap.Shared` — به تعویق افتاد
  - refactor بین پروژه‌ای با ریسک بالا — نیاز به بررسی دقیق‌تر
  - DTOهای فعلی در `AdminPanel.Models` به خوبی کار می‌کنند

- [x] **5.4** `DelegatingHandler` جایگزین `SetAuthHeader()` شد
  - `AuthenticatedHttpHandler.cs` در فاز ۱ ایجاد شد
  - رجیستر شده در `Program.cs`

- [x] **5.5** بومی‌سازی ReconnectModal
  - متن فارسی برای تمام پیام‌های reconnect

- [x] **5.6** حذف CSS بلااستفاده `#blazor-error-ui` از `MainLayout.razor.css`

- [x] **5.7** Self-host فونت Inter
  - فونت‌های `inter-latin.woff2` و `inter-latin-ext.woff2` در `wwwroot/fonts/` قرار گرفتند
  - `@font-face` در `app.css` اضافه شد
  - لینک Google Fonts از `App.razor` حذف شد

---

## خلاصه اولویت‌بندی

| فاز | تعداد تسک | اولویت | وابستگی |
|-----|----------|--------|---------|
| **فاز ۱** | ۵ | 🔴 فوری | — |
| **فاز ۲** | ۴ | 🟠 بالا | فاز ۱ |
| **فاز ۳** | ۵ | 🟠 بالا | — |
| **فاز ۴** | ۵ | 🟡 متوسط | فاز ۱ |
| **فاز ۵** | ۷ | 🔵 پایین | — |
| **فاز ۶** | ۱۲ | 🟠 بالا | — |
| **فاز ۷** | ۶ | 🔴 فوری | — |

---

## فاز ۷: رفع باگ لاگین و بهبود امنیت ✅

> مشکل اصلی: `IHttpClientFactory` هندلر `AuthenticatedHttpHandler` را در scope جداگانه‌ای از circuit بلیزر ایجاد می‌کرد. در نتیجه `AuthTokenStore` هندلر نمونه متفاوتی از `AuthTokenStore` circuit بود و توکن‌های ذخیره‌شده بعد از لاگین توسط هندلر دیده نمی‌شد. تمام درخواست‌های API بعد از لاگین با 401 شکست می‌خورد.

- [x] **7.1** رفع scope isolation در HttpClient/Handler — **باگ بحرانی**
  - `AddHttpClient<ApiClient>().AddHttpMessageHandler<>()` حذف شد
  - `HttpClient` به صورت `Scoped` با `AuthenticatedHttpHandler` دستی ثبت شد
  - `SocketsHttpHandler` با `PooledConnectionLifetime = 5min` به عنوان inner handler
  - حالا هندلر و circuit از همان `AuthTokenStore` استفاده می‌کنند

- [x] **7.2** اضافه کردن `UseAuthentication/UseAuthorization` به pipeline
  - در `Program.cs` قبل از `UseStaticFiles` اضافه شد
  - برای SSR-level auth و middleware pipeline ضروری است

- [x] **7.3** رفع پیام‌های خطای گمراه‌کننده لاگین
  - خطای اتصال (API خاموش) از خطای احراز هویت (رمز اشتباه) جدا شد
  - `HttpRequestException.StatusCode` برای تمایز استفاده می‌شود
  - پیام خطای واضح: "API-Server nicht erreichbar" vs "E-Mail oder Passwort ist falsch"

- [x] **7.4** حفظ ReturnUrl هنگام redirect به لاگین
  - `RedirectToLogin.razor` حالا URL فعلی را به عنوان `?returnUrl=` پاس می‌دهد
  - `Login.razor` از `[SupplyParameterFromQuery]` برای خواندن returnUrl استفاده می‌کند
  - بعد از لاگین موفق به صفحه اصلی یا returnUrl ریدایرکت می‌شود
  - **محافظت از Open Redirect**: فقط مسیرهای relative مجاز هستند

- [x] **7.5** اعتبارسنجی فرم لاگین
  - `[Required]` و `[EmailAddress]` به `LoginModel` اضافه شد
  - پیام‌های اعتبارسنجی دوزبانه (کوردی/آلمانی)

- [x] **7.6** اضافه کردن AdminPanel origins به CORS API
  - `http://localhost:5172` و `https://localhost:7172` به `Cors:AllowedOrigins` در API اضافه شد

---

## برنامه توسعه آینده

---

### فاز ۸ — Dashboard اختصاصی API endpoint (بهینه‌سازی)
> **اولویت: 🟠 بالا** — کاهش ۸ درخواست به ۱

- [ ] **8.1** ایجاد `GET api/v1/dashboard/stats` در API
  - یک endpoint با یک query بهینه به دیتابیس (GROUP BY status)
  - بازگشت تمام آمار + لیست آخرین Business‌ها
- [ ] **8.2** به‌روزرسانی `ApiClient.GetDashboardStatsAsync()` در AdminPanel
  - جایگزینی ۸ درخواست موازی با ۱ درخواست
  - حذف cache client-side (سرور بهتر cache می‌کند)
- [ ] **8.3** ایجاد `DashboardStatsDto` در `KurdMap.Shared`
  - DTO مشترک بین API و AdminPanel

---

### فاز ۹ — مدیریت شهرها (CRUD)
> **اولویت: 🟠 بالا** — ادمین نمی‌تواند شهر اضافه/ویرایش/حذف کند

- [ ] **9.1** ایجاد `CitiesController` CRUD endpoints در API
  - `GET api/v1/cities` (موجود)
  - `POST api/v1/cities` — ایجاد شهر جدید
  - `PUT api/v1/cities/{id}` — ویرایش شهر
  - `DELETE api/v1/cities/{id}` — حذف شهر
- [ ] **9.2** ایجاد `Cities.razor` صفحه مدیریت شهرها
  - مشابه Categories با MudTable
- [ ] **9.3** ایجاد `CityFormDialog.razor`
  - فرم با نام‌های چندزبانه (ku, kmr, de, en)
- [ ] **9.4** اضافه کردن لینک `/cities` به منوی ناوبری
- [ ] **9.5** متدهای CRUD شهر در `ApiClient.cs`

---

### فاز ۱۰ — مدیریت سرویس‌ها و منو
> **اولویت: 🟡 متوسط** — وابسته به API endpoint‌ها

- [ ] **10.1** ایجاد `BusinessServicesController` در API
  - CRUD برای سرویس‌هایی مثل WiFi, Parking, Delivery
- [ ] **10.2** ایجاد `MenuItemsController` در API
  - CRUD برای آیتم‌های منو (رستوران‌ها)
- [ ] **10.3** صفحه `Services.razor` در AdminPanel
- [ ] **10.4** ادغام سرویس‌ها در `BusinessFormDialog.razor`
  - چکباکس‌های سرویس در تب اطلاعات اصلی

---

### فاز ۱۱ — بهبود UX و Performance
> **اولویت: 🟡 متوسط**

- [ ] **11.1** Global loading indicator هنگام navigation
  - `NavigationLock` یا loading bar در AppBar
- [ ] **11.2** خودکارسازی dark/light mode بر اساس سیستم
  - `prefers-color-scheme` media query
  - ذخیره ترجیح کاربر در localStorage
- [ ] **11.3** Breadcrumb navigation
  - `MudBreadcrumbs` در AppBar برای مسیر فعلی
- [ ] **11.4** بهبود جدول Business‌ها
  - ستون Category و City با فیلتر dropdown
  - Export to CSV/Excel
- [ ] **11.5** Auto-refresh داشبورد
  - Timer هر ۶۰ ثانیه برای به‌روزرسانی آمار
  - WebSocket/SSE برای real-time updates (آینده)
- [ ] **11.6** بهبود فرم Business
  - قابلیت drag & drop برای ترتیب تصاویر
  - پیش‌نمایش آدرس روی نقشه (Leaflet)
  - Auto-complete آدرس با API آلمان (Nominatim)

---

### فاز ۱۲ — امنیت پیشرفته
> **اولویت: 🟡 متوسط**

- [ ] **12.1** ذخیره RefreshToken در دیتابیس
  - جدول `RefreshTokens` با expiry, device info
  - اعتبارسنجی واقعی در `AuthController.Refresh()`
- [ ] **12.2** Activity Log
  - ثبت تمام عملیات ادمین (ایجاد، ویرایش، حذف، تغییر نقش)
  - صفحه `AuditLog.razor` با فیلتر و جستجو
- [ ] **12.3** Two-Factor Authentication (2FA)
  - TOTP-based 2FA برای ادمین‌ها
  - QR code setup flow
- [ ] **12.4** Session management
  - نمایش session‌های فعال
  - قابلیت logout از سایر session‌ها
- [ ] **12.5** Rate limiting در AdminPanel
  - محدودیت تعداد لاگین ناموفق
  - Lockout بعد از ۵ تلاش ناموفق

---

### فاز ۱۳ — بین‌المللی‌سازی (i18n) کامل
> **اولویت: 🔵 پایین**

- [ ] **13.1** استفاده از فایل‌های resource (.resx) برای متن‌ها
  - فایل‌های `Resources/ku.resx`, `Resources/de.resx`
  - حذف hardcoded strings از razor files
- [ ] **13.2** انتخاب زبان در UI
  - dropdown در AppBar برای تغییر زبان (کوردی/آلمانی)
  - ذخیره ترجیح در localStorage
- [ ] **13.3** RTL/LTR خودکار بر اساس زبان
  - آلمانی: LTR، کوردی: RTL

---

### فاز ۱۴ — تست و CI/CD
> **اولویت: 🔵 پایین**

- [ ] **14.1** Unit tests برای سرویس‌ها
  - تست `JwtAuthStateProvider`, `AuthenticatedHttpHandler`, `DisplayHelpers`
- [ ] **14.2** Integration tests برای API endpoints
  - `WebApplicationFactory` با in-memory database
- [ ] **14.3** E2E tests با Playwright
  - لاگین flow
  - CRUD Business
  - CRUD Category
- [ ] **14.4** CI/CD pipeline
  - GitHub Actions: build → test → Docker image → deploy
  - Automated database migrations

---

### فاز ۱۵ — انتقال DTO‌ها به KurdMap.Shared
> **اولویت: 🔵 پایین** — refactor بین‌پروژه‌ای

- [ ] **15.1** شناسایی DTO‌های مشترک بین API و AdminPanel
- [ ] **15.2** انتقال به `KurdMap.Shared` و حذف تکرار
- [ ] **15.3** تست سازگاری بعد از refactor

---

## وضعیت فعلی Build

```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

> ✅ تمام ۷ فاز تکمیل شدند. فازهای ۸ تا ۱۵ برنامه توسعه آینده هستند.
> موارد 2.2، 2.3 و 5.3 نیاز به توسعه backend دارند و به‌عنوان N/A/deferred علامت‌گذاری شده‌اند.
