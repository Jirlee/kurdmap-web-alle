import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Phase {
  id: string;
  title: string;
  titleKu: string;
  percentage: number;
  status: 'completed' | 'in-progress' | 'pending';
  items: { label: string; done: boolean }[];
}

interface ProjectPart {
  name: string;
  nameKu: string;
  icon: string;
  color: string;
  percentage: number;
  phases: Phase[];
}

@Component({
  selector: 'admin-roadmap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25">
          <span class="material-icons text-xl text-white" aria-hidden="true">route</span>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-text">نەخشەی ڕێگا — Project Roadmap</h1>
          <p class="text-sm text-text-secondary">بینینی گشتی لە پێشکەوتنی پڕۆژەکە — ٤ بەشی سەرەکی</p>
        </div>
      </div>
    </div>

    <!-- Overall Progress -->
    <div class="mb-8 rounded-2xl border border-border bg-gradient-to-br from-primary-50 to-surface dark:from-primary-900/20 dark:to-surface p-6 shadow-sm">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold text-text mb-1">پێشکەوتنی گشتی پڕۆژە</h2>
          <p class="text-sm text-text-secondary">Overall Project Completion</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="relative w-20 h-20">
            <svg viewBox="0 0 36 36" class="w-20 h-20 -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="3" class="text-surface-alt" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="3"
                      class="text-primary-500"
                      stroke-dasharray="100.53"
                      [attr.stroke-dashoffset]="100.53 - (100.53 * 96 / 100)"
                      stroke-linecap="round" />
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-xl font-bold text-text">96%</span>
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <span class="text-text-secondary">تێست:</span>
            <span class="font-bold text-success-600">305 ✅</span>
            <span class="text-text-secondary">ئاسایش:</span>
            <span class="font-bold text-success-600">Enterprise ✅</span>
            <span class="text-text-secondary">API:</span>
            <span class="font-bold text-text">40+ endpoint</span>
            <span class="text-text-secondary">2FA/TOTP:</span>
            <span class="font-bold text-success-600">چالاک ✅</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tech Stack Badges -->
    <div class="mb-8 flex flex-wrap gap-2 justify-center">
      @for (badge of techStack; track badge.label) {
        <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-border bg-surface shadow-sm">
          <span class="h-2 w-2 rounded-full" [class]="badge.dot"></span>
          {{ badge.label }}
        </span>
      }
    </div>

    <!-- Deployment Readiness Card -->
    <div class="mb-8 rounded-2xl border border-success-200 dark:border-success-800 bg-gradient-to-r from-success-50 to-emerald-50 dark:from-success-900/20 dark:to-emerald-900/20 p-6 shadow-sm">
      <div class="flex items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/40">
          <span class="material-icons text-2xl text-success-600 dark:text-success-400" aria-hidden="true">rocket_launch</span>
        </div>
        <div class="flex-1">
          <h3 class="text-base font-bold text-success-800 dark:text-success-300 mb-2">ئامادەی بڵاوکردنەوە — Production Ready</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            @for (item of deploymentChecklist; track item.label) {
              <div class="flex items-center gap-1.5">
                <span class="material-icons text-sm" [class]="item.done ? 'text-success-500' : 'text-warning-500'" aria-hidden="true">
                  {{ item.done ? 'check_circle' : 'pending' }}
                </span>
                <span class="text-text-secondary">{{ item.label }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    <!-- 4 Parts Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      @for (part of parts; track part.name) {
        <div class="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          <!-- Part Header -->
          <div class="px-6 py-4 border-b border-border flex items-center justify-between"
               [class]="'bg-gradient-to-r ' + part.color">
            <div class="flex items-center gap-3">
              <span class="material-icons text-2xl text-white" aria-hidden="true">{{ part.icon }}</span>
              <div>
                <h3 class="text-base font-bold text-white">{{ part.nameKu }}</h3>
                <p class="text-xs text-white/80">{{ part.name }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="relative w-12 h-12">
                <svg viewBox="0 0 36 36" class="w-12 h-12 -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="white" stroke-opacity="0.3" stroke-width="3" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="white" stroke-width="3"
                          [attr.stroke-dasharray]="100.53"
                          [attr.stroke-dashoffset]="100.53 - (100.53 * part.percentage / 100)"
                          stroke-linecap="round" />
                </svg>
                <span class="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{{ part.percentage }}%</span>
              </div>
            </div>
          </div>

          <!-- Phases Timeline -->
          <div class="p-5">
            <div class="relative">
              @for (phase of part.phases; track phase.id; let isLast = $last) {
                <!-- Timeline connector -->
                <div class="flex gap-4 mb-4">
                  <div class="flex flex-col items-center">
                    <!-- Node -->
                    @if (phase.status === 'completed') {
                      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30 ring-2 ring-success-500 shrink-0">
                        <span class="material-icons text-base text-success-600 dark:text-success-400" aria-hidden="true">check</span>
                      </div>
                    } @else if (phase.status === 'in-progress') {
                      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/30 ring-2 ring-warning-500 shrink-0 animate-pulse">
                        <span class="material-icons text-base text-warning-600 dark:text-warning-400" aria-hidden="true">autorenew</span>
                      </div>
                    } @else {
                      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt ring-2 ring-border shrink-0">
                        <span class="material-icons text-base text-text-secondary" aria-hidden="true">radio_button_unchecked</span>
                      </div>
                    }
                    <!-- Line -->
                    @if (!isLast) {
                      <div class="w-0.5 flex-1 min-h-[16px]"
                           [class]="phase.status === 'completed' ? 'bg-success-300 dark:bg-success-700' : 'bg-border'"></div>
                    }
                  </div>

                  <!-- Content -->
                  <div class="flex-1 pb-2">
                    <div class="flex items-center justify-between mb-1">
                      <h4 class="text-sm font-semibold text-text">{{ phase.titleKu }}</h4>
                      <span class="text-xs font-medium tabular-nums px-2 py-0.5 rounded-full"
                            [class]="{
                              'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400': phase.status === 'completed',
                              'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400': phase.status === 'in-progress',
                              'bg-surface-alt text-text-secondary': phase.status === 'pending'
                            }">
                        {{ phase.percentage }}%
                      </span>
                    </div>
                    <p class="text-xs text-text-secondary mb-2">{{ phase.title }}</p>

                    <!-- Mini progress bar -->
                    <div class="h-1.5 w-full rounded-full bg-surface-alt overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-700"
                           [class]="{
                             'bg-success-500': phase.status === 'completed',
                             'bg-warning-500': phase.status === 'in-progress',
                             'bg-border': phase.status === 'pending'
                           }"
                           [style.width.%]="phase.percentage"></div>
                    </div>

                    <!-- Task list (collapsed by default, expanded on click) -->
                    @if (phase.items.length > 0 && (phase.status !== 'completed')) {
                      <details class="mt-2">
                        <summary class="text-xs text-primary-600 dark:text-primary-400 cursor-pointer hover:underline">
                          {{ phase.items.length }} کار — {{ phase.items.filter(i => i.done).length }} تەواو
                        </summary>
                        <ul class="mt-1.5 space-y-1">
                          @for (item of phase.items; track item.label) {
                            <li class="flex items-start gap-2 text-xs" [class.text-text-secondary]="item.done" [class.text-text]="!item.done">
                              <span class="material-icons text-sm mt-0.5 shrink-0" aria-hidden="true"
                                    [class.text-success-500]="item.done"
                                    [class.text-border]="!item.done">
                                {{ item.done ? 'check_circle' : 'radio_button_unchecked' }}
                              </span>
                              <span [class.line-through]="item.done">{{ item.label }}</span>
                            </li>
                          }
                        </ul>
                      </details>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Test Summary -->
    <div class="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden mb-8">
      <div class="flex items-center gap-3 border-b border-border px-6 py-4">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-success-100 dark:bg-success-900/30">
          <span class="material-icons text-lg text-success-600 dark:text-success-400" aria-hidden="true">science</span>
        </div>
        <h2 class="text-lg font-semibold text-text">تێست — Test Coverage</h2>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
        @for (t of testSummary; track t.part) {
          <div class="bg-surface p-5 text-center">
            <p class="text-2xl font-bold tabular-nums" [class]="t.color">{{ t.total }}</p>
            <p class="text-xs text-text-secondary mt-1">{{ t.part }}</p>
            <p class="text-[10px] text-success-600 mt-0.5">✅ همووی تێپەڕین</p>
          </div>
        }
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap gap-6 items-center justify-center text-xs text-text-secondary mb-4">
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-3 w-3 rounded-full bg-success-500"></span> تەواو — Completed
      </span>
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-3 w-3 rounded-full bg-warning-500 animate-pulse"></span> لە کاردایە — In Progress
      </span>
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-3 w-3 rounded-full bg-surface-alt ring-1 ring-border"></span> چاوەڕوان — Pending
      </span>
    </div>

    <!-- Infrastructure & DevOps -->
    <div class="mb-8 rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b border-border bg-gradient-to-r from-amber-600 to-amber-800 flex items-center gap-3">
        <span class="material-icons text-2xl text-white" aria-hidden="true">cloud_upload</span>
        <div>
          <h3 class="text-base font-bold text-white">ژێرخان و DevOps</h3>
          <p class="text-xs text-white/80">Infrastructure & DevOps</p>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 p-5">
        @for (infra of infraItems; track infra.label) {
          <div class="flex items-start gap-2.5 rounded-lg border border-border bg-surface-alt/50 p-3">
            <span class="material-icons text-lg shrink-0" [class]="infra.done ? 'text-success-500' : 'text-warning-500'" aria-hidden="true">
              {{ infra.done ? 'check_circle' : 'pending' }}
            </span>
            <div>
              <p class="text-sm font-medium text-text">{{ infra.label }}</p>
              <p class="text-xs text-text-secondary">{{ infra.desc }}</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class RoadmapComponent {
  protected readonly parts: ProjectPart[] = [
    // ─────────────────────── Backend ───────────────────────
    {
      name: 'KurdMap.API — ASP.NET Core 10',
      nameKu: 'باکێند — API',
      icon: 'dns',
      color: 'from-violet-600 to-violet-800',
      percentage: 98,
      phases: [
        {
          id: 'be-arch', title: 'Clean Architecture + CQRS + MediatR', titleKu: 'تەلارسازی پاک',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'be-auth', title: 'JWT Auth, Refresh Token, Roles', titleKu: 'ناسینەوە — JWT',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'be-api', title: '12 Controllers · 40+ Endpoints + Contact API', titleKu: 'API ئێندپۆینتەکان',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'be-sec', title: 'Rate Limiting, CSP, Security Headers', titleKu: 'ئاسایش',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'be-db', title: 'PostgreSQL + Redis + Migrations', titleKu: 'بنکەی داتا',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'be-discount', title: 'Discount & Recommended Businesses', titleKu: 'داشکاندن و پیشنیارکراو',
          percentage: 100, status: 'completed',
          items: [
            { label: 'SetDiscount / ClearDiscount commands', done: true },
            { label: 'GetRecommendedBusinesses query + cache', done: true },
            { label: 'Search sorting boost (featured+discounted)', done: true },
            { label: 'EF Migration — AddBusinessDiscounts', done: true },
          ],
        },
        {
          id: 'be-test', title: '104 Tests (91 Unit + 13 Integration)', titleKu: 'تێست',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'be-enterprise-sec', title: 'Enterprise Security Hardening (14 Components)', titleKu: 'ئاسایشی تایبەت',
          percentage: 100, status: 'completed',
          items: [
            { label: 'Refresh Token family-based rotation + Redis JTI blacklist', done: true },
            { label: 'Brute force protection middleware + structured security logger', done: true },
            { label: 'Request size limit + hardened security headers (CSP, HSTS)', done: true },
            { label: 'JWT HS512 + replay attack detection', done: true },
            { label: 'Multi-tier rate limiting (IP + global)', done: true },
            { label: 'Startup validation (JWT key, Redis, DB)', done: true },
          ],
        },
        {
          id: 'be-totp', title: 'TOTP/2FA for Admin Panel', titleKu: 'TOTP/2FA',
          percentage: 100, status: 'completed',
          items: [
            { label: 'TOTP setup / enable / disable / verify endpoints', done: true },
            { label: 'ASP.NET Identity authenticator integration', done: true },
            { label: 'Login flow → 2FA redirect', done: true },
          ],
        },
        {
          id: 'be-future', title: 'OAuth, Email Service, Push Notifications', titleKu: 'داهاتوو',
          percentage: 0, status: 'pending',
          items: [
            { label: 'OAuth (Google / Apple)', done: false },
            { label: 'SMTP Email Service', done: false },
            { label: 'Push notification backend', done: false },
          ],
        },
      ],
    },

    // ─────────────────────── Admin Panel ───────────────────────
    {
      name: 'kurdmap-admin — Angular 21',
      nameKu: 'پانێلی ئەدمین',
      icon: 'admin_panel_settings',
      color: 'from-emerald-600 to-emerald-800',
      percentage: 98,
      phases: [
        {
          id: 'ad-pages', title: '10 Pages (Dashboard, CRUD, Reports, Settings)', titleKu: 'لاپەڕەکان — ١٠',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'ad-auth', title: 'JWT Guards, Role-based Access, Token Refresh', titleKu: 'ناسینەوە و ڕۆڵ',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'ad-ui', title: 'Dark Mode, RTL, WCAG 2.2 AA, Responsive Tables', titleKu: 'UI/UX و دەستگەیشتن',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'ad-discount', title: 'Discount Management (Set/Clear/View)', titleKu: 'بەڕێوەبردنی داشکاندن',
          percentage: 100, status: 'completed',
          items: [
            { label: 'Discount tab in business form dialog', done: true },
            { label: 'Set percentage + multilingual description', done: true },
            { label: 'Start/end date range picker', done: true },
            { label: 'Active discount badge in business list', done: true },
          ],
        },
        {
          id: 'ad-test', title: '63 Vitest + 12 Playwright E2E', titleKu: 'تێست',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'ad-polish', title: 'Bulk Actions, Keyboard Shortcuts, aria-sort', titleKu: 'پۆلیش',
          percentage: 50, status: 'in-progress',
          items: [
            { label: 'Bulk actions (checkbox + toolbar)', done: false },
            { label: 'aria-sort لەسەر ستوونەکان', done: true },
            { label: 'aria-current="page" لە sidebar', done: true },
            { label: 'aria-expanded لە hamburger', done: true },
            { label: 'Keyboard shortcuts (Ctrl+K, N)', done: false },
            { label: 'Roadmap page ✨', done: true },
          ],
        },
        {
          id: 'ad-security', title: 'Admin Security Hardening', titleKu: 'ئاسایشی پانێڵ',
          percentage: 100, status: 'completed',
          items: [
            { label: 'Session idle timeout (15 min)', done: true },
            { label: 'Login attempt lockout (5 tries / 15 min)', done: true },
            { label: 'Session expiry detection + redirect', done: true },
            { label: 'Failed attempts remaining counter', done: true },
          ],
        },
        {
          id: 'ad-totp', title: 'TOTP/2FA Authentication', titleKu: 'TOTP/2FA — دوو هەنگاو',
          percentage: 100, status: 'completed',
          items: [
            { label: 'TOTP setup page (QR code + manual key)', done: true },
            { label: 'TOTP verify page (6-digit code input)', done: true },
            { label: 'Enable / Disable 2FA from settings', done: true },
            { label: 'Login redirect → TOTP verify', done: true },
          ],
        },
      ],
    },

    // ─────────────────────── Frontend ───────────────────────
    {
      name: 'kurdmap-frontend — Angular 21',
      nameKu: 'وێبسایتی گشتی',
      icon: 'language',
      color: 'from-sky-600 to-sky-800',
      percentage: 92,
      phases: [
        {
          id: 'fe-pages', title: '7 Pages (Home, Search, Detail, Categories, About, Contact, Policy)', titleKu: 'لاپەڕەکان — ٧',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'fe-ssr', title: 'SSR + SEO (JSON-LD, OG, hreflang, sitemap)', titleKu: 'SSR و SEO',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'fe-i18n', title: '4 Languages, RTL Support, WCAG 2.2 AA', titleKu: 'زمان و دەستگەیشتن',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'fe-comps', title: '26 Shared Components + Dark Mode + Leaflet Maps', titleKu: 'کۆمپۆنێنتەکان',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'fe-discount', title: 'Discount Badges + Recommended Section', titleKu: 'داشکاندن و پیشنیارکراو',
          percentage: 100, status: 'completed',
          items: [
            { label: 'Discount badge on business cards', done: true },
            { label: 'Discount banner on business detail', done: true },
            { label: 'Recommended API (featured + discounted)', done: true },
            { label: 'Special Offers section on home', done: true },
          ],
        },
        {
          id: 'fe-test', title: '29 Vitest Tests', titleKu: 'تێست',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'fe-remaining', title: 'Contact Form API, Search Highlight, Profile', titleKu: 'ماوە',
          percentage: 60, status: 'in-progress',
          items: [
            { label: 'Contact form → API وەسڵ', done: true },
            { label: 'Search result highlighting', done: true },
            { label: 'Radius picker UI پۆلیش', done: true },
            { label: 'Privacy page (standalone URL for Google Play)', done: true },
            { label: 'User profile / password change', done: false },
            { label: 'Business owner claim listing', done: false },
          ],
        },
      ],
    },

    // ─────────────────────── Mobile ───────────────────────
    {
      name: 'kurdmap-mobile — React Native + Expo',
      nameKu: 'ئەپی مۆبایل',
      icon: 'phone_android',
      color: 'from-rose-600 to-rose-800',
      percentage: 87,
      phases: [
        {
          id: 'mo-core', title: 'Phases 1-8: Setup, Auth, Screens, i18n, Maps', titleKu: 'بنەڕەت — فەیز ١-٨',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'mo-ux', title: 'Phases 9-12: Onboarding, Password Reset, Privacy, Search', titleKu: 'ئەزموونی بەکارهێنەر',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'mo-discount', title: 'Discount Badges + Recommended Section', titleKu: 'داشکاندن و پیشنیارکراو',
          percentage: 100, status: 'completed',
          items: [
            { label: 'Discount badge on BusinessCard', done: true },
            { label: 'Recommended API (featured + discounted)', done: true },
            { label: 'Special Offers section on home screen', done: true },
          ],
        },
        {
          id: 'mo-test', title: 'Phase 15-16: 109 Tests + CI/CD + EAS Config', titleKu: 'تێست و CI/CD',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'mo-perf', title: 'Phase 17: Performance, Haptics, Splash, Icons', titleKu: 'ئەدا و پۆلیش',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'mo-sec', title: 'Phase 18: Security Hardening (JWT, Validation, Env)', titleKu: 'ئاسایشی ئەپ',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'mo-build', title: 'AAB (44MB) + APK (84MB) Built & Signed', titleKu: 'بیلد — Google Play',
          percentage: 100, status: 'completed',
          items: [],
        },
        {
          id: 'mo-notif', title: 'Phase 14: Push Notifications', titleKu: 'ئاگادارکردنەوە',
          percentage: 70, status: 'in-progress',
          items: [
            { label: 'Request permissions + register token', done: true },
            { label: 'useNotifications hook + deep linking', done: true },
            { label: 'Android notification channels (4)', done: true },
            { label: 'Send token to backend', done: false },
            { label: 'Notification preferences UI', done: false },
          ],
        },
        {
          id: 'mo-owner', title: 'Phase 13: Business Owner Portal', titleKu: 'پۆرتاڵی خاوەن کاروبار',
          percentage: 0, status: 'pending',
          items: [
            { label: 'My Business dashboard', done: false },
            { label: 'Create/edit business form (5 steps)', done: false },
            { label: 'Image management (camera/gallery)', done: false },
            { label: 'Menu & services management', done: false },
          ],
        },
        {
          id: 'mo-publish', title: 'Phase 19: Google Play Publishing', titleKu: 'بڵاوکردنەوە',
          percentage: 50, status: 'in-progress',
          items: [
            { label: 'Identity verification', done: false },
            { label: 'Set up your app (Policy, Ads, Safety)', done: false },
            { label: 'Store Listing + Screenshots', done: false },
            { label: 'Internal Testing → AAB آپلود', done: false },
            { label: 'Closed Testing (12 tester · 14 day)', done: false },
            { label: 'Production release', done: false },
          ],
        },
      ],
    },
  ];

  protected readonly testSummary = [
    { part: 'Backend (.NET)', total: 104, color: 'text-violet-600 dark:text-violet-400' },
    { part: 'Admin (Angular)', total: 63, color: 'text-emerald-600 dark:text-emerald-400' },
    { part: 'Frontend (Angular)', total: 29, color: 'text-sky-600 dark:text-sky-400' },
    { part: 'Mobile (React Native)', total: 109, color: 'text-rose-600 dark:text-rose-400' },
  ];

  protected readonly techStack = [
    { label: '.NET 10', dot: 'bg-violet-500' },
    { label: 'Angular 21', dot: 'bg-red-500' },
    { label: 'React Native', dot: 'bg-sky-500' },
    { label: 'PostgreSQL 17', dot: 'bg-blue-600' },
    { label: 'Redis 7', dot: 'bg-red-600' },
    { label: 'Tailwind CSS 4', dot: 'bg-teal-500' },
    { label: 'Docker / Podman', dot: 'bg-blue-400' },
    { label: 'Caddy HTTPS', dot: 'bg-green-500' },
    { label: 'GitHub Actions CI/CD', dot: 'bg-gray-600' },
    { label: 'TOTP / 2FA', dot: 'bg-amber-500' },
    { label: 'Leaflet Maps', dot: 'bg-emerald-600' },
    { label: 'Expo SDK 52', dot: 'bg-gray-800' },
  ];

  protected readonly deploymentChecklist = [
    { label: 'Docker Compose', done: true },
    { label: 'Prod Overlay', done: true },
    { label: 'CI/CD Pipeline', done: true },
    { label: 'Caddyfile HTTPS', done: true },
    { label: '.env.production', done: true },
    { label: 'Security Scan', done: true },
    { label: 'Health Checks', done: true },
    { label: 'Backup Script', done: true },
  ];

  protected readonly infraItems = [
    { label: 'Docker Compose', desc: '5 services + Caddy proxy', done: true },
    { label: 'Production Overlay', desc: 'Read-only FS, cap_drop, resource limits', done: true },
    { label: 'CI/CD Pipeline', desc: '4-stage: Build → Scan → Push → Deploy', done: true },
    { label: 'Caddy Reverse Proxy', desc: 'Auto HTTPS, 3 subdomains, rate limiting', done: true },
    { label: 'Security Scanning', desc: 'Trivy image scanning in CI', done: true },
    { label: 'Database Backup', desc: 'Daily pg_dump, 30-day retention', done: true },
    { label: 'Multi-stage Dockerfiles', desc: 'Non-root users, minimal images', done: true },
    { label: 'Network Isolation', desc: 'frontend-net + backend-net (internal)', done: true },
    { label: 'Monitoring / Alerting', desc: 'Prometheus + Grafana', done: false },
  ];
}
