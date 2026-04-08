import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthStore } from '../../core/auth';
import { ThemeService } from '../../core/services';
import { SessionService } from '../../core/services/session.service';
import { ToastComponent, BreadcrumbComponent } from '../../shared/components';

@Component({
  selector: 'admin-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, BreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <admin-toast />

    <div class="flex h-screen overflow-hidden bg-bg">
      <!-- Mobile backdrop -->
      @if (sidebarOpen()) {
        <div
          class="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity md:hidden"
          (click)="sidebarOpen.set(false)"
          aria-hidden="true"
        ></div>
      }

      <!-- Sidebar -->
      <aside
        aria-label="نەویگەیشنی سەرەکی"
        class="flex flex-col bg-surface shadow-sm transition-all duration-300 ease-in-out
               fixed inset-y-0 start-0 z-40 md:relative md:z-auto"
        [class.w-64]="sidebarOpen()"
        [class.w-16]="!sidebarOpen()"
        [class.-translate-x-full]="!sidebarOpen()"
        [class.translate-x-0]="sidebarOpen()"
        [class.md:translate-x-0]="true"
      >
        <!-- Logo -->
        <div class="flex h-16 items-center px-4">
          @if (sidebarOpen()) {
            <div class="flex items-center gap-2.5">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl
                          bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-500/25">
                <span class="material-icons text-lg text-white" aria-hidden="true">map</span>
              </div>
              <div>
                <h1 class="text-base font-bold leading-none text-text">KurdMap</h1>
                <span class="text-[10px] font-medium uppercase tracking-wider text-text-secondary">Admin Panel</span>
              </div>
            </div>
          } @else {
            <div class="mx-auto flex h-9 w-9 items-center justify-center rounded-xl
                        bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-500/25">
              <span class="material-icons text-lg text-white" aria-hidden="true">map</span>
            </div>
          }
        </div>

        <!-- Separator -->
        <div class="mx-3 border-b border-border"></div>

        <!-- Nav -->
        <nav aria-label="مێنیوی سەرەکی" class="flex-1 overflow-y-auto px-2 py-4">
          <div class="space-y-1">
            @for (item of navItems; track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="!bg-primary-50 !text-primary-700 dark:!bg-primary-900/30 dark:!text-primary-300 font-semibold"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                #rla="routerLinkActive"
                class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary
                       transition-all duration-150 hover:bg-surface-alt hover:text-text"
                [attr.aria-current]="rla.isActive ? 'page' : null"
                [attr.aria-label]="!sidebarOpen() ? item.label : null"
                [title]="item.label"
              >
                <span class="material-icons text-xl transition-colors group-hover:text-primary-500" aria-hidden="true">{{ item.icon }}</span>
                @if (sidebarOpen()) {
                  <span>{{ item.label }}</span>
                }
              </a>
            }
          </div>
        </nav>

        <!-- Sidebar toggle -->
        <div class="mx-3 border-t border-border"></div>
        <button
          type="button"
          (click)="sidebarOpen.update(v => !v)"
          [attr.aria-expanded]="sidebarOpen()"
          aria-controls="sidebar"
          aria-label="گۆڕینی لاتەنیشت"
          class="flex items-center justify-center py-3 text-text-secondary transition-colors hover:text-text"
        >
          <span class="material-icons text-xl" aria-hidden="true">{{ sidebarOpen() ? 'chevron_right' : 'chevron_left' }}</span>
        </button>
      </aside>

      <!-- Main -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Top bar -->
        <header class="flex h-16 items-center justify-between bg-surface px-6 shadow-sm">
          <button
            type="button"
            (click)="sidebarOpen.update(v => !v)"
            aria-label="کردنەوەی مێنیو"
            class="material-icons rounded-lg p-2 text-text-secondary hover:bg-surface-alt hover:text-text transition-colors md:hidden"
          >
            menu
          </button>

          <div class="flex-1"></div>

          <div class="flex items-center gap-2">
            <!-- Theme toggle -->
            <button
              type="button"
              (click)="theme.toggle()"
              class="flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary transition-all
                     hover:bg-surface-alt hover:text-text"
              [attr.aria-label]="theme.isDarkMode() ? 'تێمی ڕووناک' : 'تێمی تاریک'"
            >
              <span class="material-icons text-xl" aria-hidden="true">{{ theme.isDarkMode() ? 'light_mode' : 'dark_mode' }}</span>
            </button>

            <!-- Divider -->
            <div class="mx-1 h-8 w-px bg-border"></div>

            <!-- User info -->
            <div class="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-alt">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg
                          bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-bold text-white shadow-sm"
                   aria-hidden="true">
                {{ authStore.fullName().charAt(0).toUpperCase() }}
              </div>
              <div class="hidden md:block">
                <p class="text-sm font-semibold leading-tight text-text">{{ authStore.fullName() }}</p>
                <p class="text-[11px] leading-tight text-text-secondary">{{ authStore.roles()[0] || '' }}</p>
              </div>
            </div>

            <!-- Logout -->
            <button
              type="button"
              (click)="logout()"
              class="flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary transition-all
                     hover:bg-danger-50 hover:text-danger-600"
              aria-label="چوونەدەرەوە"
            >
              <span class="material-icons text-xl" aria-hidden="true">logout</span>
            </button>
          </div>
        </header>

        <!-- Content -->
        <main id="main-content" class="flex-1 overflow-y-auto bg-bg p-6">
          <admin-breadcrumb />
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  protected readonly theme = inject(ThemeService);
  protected readonly sidebarOpen = signal(true);

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly session = inject(SessionService);

  ngOnInit(): void {
    this.session.init();
  }

  constructor() {
    // Auto-close sidebar on route change (mobile)
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      if (window.innerWidth < 768) {
        this.sidebarOpen.set(false);
      }
    });
  }

  protected readonly navItems = [
    { route: '/', icon: 'dashboard', label: 'داشبۆڕد', exact: true },
    { route: '/businesses', icon: 'business', label: 'بازرگانییەکان', exact: false },
    { route: '/categories', icon: 'category', label: 'پۆلەکان', exact: false },
    { route: '/cities', icon: 'location_city', label: 'شارەکان', exact: false },
    { route: '/advertisements', icon: 'campaign', label: 'ڕیکلام', exact: false },
    { route: '/reviews', icon: 'rate_review', label: 'هەڵسەنگاندن', exact: false },
    { route: '/reports', icon: 'analytics', label: 'ڕاپۆرتەکان', exact: false },
    { route: '/users', icon: 'people', label: 'بەکارهێنەران', exact: false },
    { route: '/settings', icon: 'settings', label: 'ڕێکخستنەکان', exact: false },
    { route: '/roadmap', icon: 'route', label: 'نەخشەی ڕێگا', exact: false },
  ];

  protected logout(): void {
    this.authStore.clear();
    this.router.navigateByUrl('/login');
  }
}
