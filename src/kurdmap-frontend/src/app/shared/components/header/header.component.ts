import { ChangeDetectionStrategy, Component, signal, PLATFORM_ID, inject, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { ModalService } from '../../../core/services/modal.service';
import { BrowserStorageService } from '../../../core/services/browser-storage.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, TranslateModule, LanguageSwitcherComponent],
  template: `
    <header class="fixed top-0 inset-x-0 z-50 transition-all duration-300"
            [class]="solidHeader() ? 'glass shadow-lg shadow-black/[0.03] border-b border-white/60 dark:border-gray-800/60' : 'bg-transparent'">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-14 sm:h-16 lg:h-18">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2 group" (click)="closeModal()">
            <div class="size-8 sm:size-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
              <svg class="size-4 sm:size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <span class="text-lg sm:text-xl font-bold tracking-tight" [class]="solidHeader() ? 'text-gray-900 dark:text-gray-100' : 'text-white'">
              Kurd<span class="text-primary-500">Map</span>
            </span>
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-1">
            <a routerLink="/" routerLinkActive #rlaHome="routerLinkActive" [routerLinkActiveOptions]="{exact: true}"
               class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
               [class]="navLinkClass(rlaHome.isActive)"
               (click)="closeModal()">
              {{ 'nav.home' | translate }}
            </a>
            <a routerLink="/categories" routerLinkActive #rlaCat="routerLinkActive"
               class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
               [class]="navLinkClass(rlaCat.isActive)"
               (click)="closeModal()">
              {{ 'nav.categories' | translate }}
            </a>
            <button
               class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer inline-flex items-center gap-2"
               [class]="navLinkClass(false)"
               (click)="openSearch()">
              {{ 'nav.search' | translate }}
              <kbd class="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium border transition-colors"
                   [class]="solidHeader() ? 'border-gray-200 dark:border-gray-700 text-gray-400 bg-gray-50 dark:bg-gray-800' : 'border-white/20 text-white/50 bg-white/5'">
                <span class="text-[10px]">⌘</span>K
              </kbd>
            </button>
            <a routerLink="/about" routerLinkActive #rlaAbout="routerLinkActive"
               class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
               [class]="navLinkClass(rlaAbout.isActive)"
               (click)="closeModal()">
              {{ 'nav.about' | translate }}
            </a>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <button
              (click)="toggleDarkMode()"
              class="p-2 rounded-xl transition-all duration-200"
              [class]="solidHeader() ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200' : 'text-white/70 hover:bg-white/10 hover:text-white'"
              [attr.aria-label]="darkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              @if (darkMode()) {
                <svg class="size-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
                </svg>
              } @else {
                <svg class="size-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
                </svg>
              }
            </button>
            <app-language-switcher />
            <!-- Mobile hamburger -->
            <button
              (click)="mobileMenuOpen.set(!mobileMenuOpen())"
              class="md:hidden p-2 rounded-xl transition-all duration-200"
              [class]="solidHeader() ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-white/80 hover:bg-white/10'"
              [attr.aria-label]="'nav.menu' | translate"
              [attr.aria-expanded]="mobileMenuOpen()"
              aria-controls="mobile-drawer"
            >
              @if (mobileMenuOpen()) {
                <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              } @else {
                <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              }
            </button>
          </div>
        </div>
      </nav>
    </header>

    <!-- Mobile drawer backdrop -->
    @if (mobileMenuOpen()) {
      <div class="drawer-backdrop md:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
           (click)="mobileMenuOpen.set(false)"
           role="presentation"></div>
    }

    <!-- Mobile drawer -->
    <div id="mobile-drawer"
         class="drawer-panel md:hidden fixed inset-y-0 end-0 z-[61] w-[280px] max-w-[85vw] bg-white dark:bg-gray-950 shadow-2xl"
         [class.drawer-open]="mobileMenuOpen()"
         role="dialog"
         [attr.aria-hidden]="!mobileMenuOpen()"
         aria-label="Navigation menu">
      <div class="flex flex-col h-full">
        <!-- Drawer header -->
        <div class="flex items-center justify-between px-5 h-14 border-b border-gray-100 dark:border-gray-800">
          <span class="text-lg font-bold text-gray-900 dark:text-gray-100">
            Kurd<span class="text-primary-500">Map</span>
          </span>
          <button (click)="mobileMenuOpen.set(false)"
                  class="p-2 -me-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  [attr.aria-label]="'aria.closeMenu' | translate">
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Drawer nav links -->
        <nav class="flex-1 overflow-y-auto py-4 px-3">
          <div class="space-y-1">
            <a routerLink="/"
               (click)="mobileMenuOpen.set(false); closeModal()"
               class="drawer-link">
              <div class="drawer-link-icon">
                <svg class="size-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
              </div>
              <span>{{ 'nav.home' | translate }}</span>
            </a>
            <button
               (click)="mobileMenuOpen.set(false); openSearch()"
               class="drawer-link w-full cursor-pointer">
              <div class="drawer-link-icon">
                <svg class="size-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <span>{{ 'nav.search' | translate }}</span>
            </button>
            <a routerLink="/categories"
               (click)="mobileMenuOpen.set(false); closeModal()"
               class="drawer-link">
              <div class="drawer-link-icon">
                <svg class="size-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
              </div>
              <span>{{ 'nav.categories' | translate }}</span>
            </a>
            <a routerLink="/about"
               (click)="mobileMenuOpen.set(false); closeModal()"
               class="drawer-link">
              <div class="drawer-link-icon">
                <svg class="size-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span>{{ 'nav.about' | translate }}</span>
            </a>
            <a routerLink="/contact"
               (click)="mobileMenuOpen.set(false); closeModal()"
               class="drawer-link">
              <div class="drawer-link-icon">
                <svg class="size-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <span>{{ 'footer.contact' | translate }}</span>
            </a>
          </div>
        </nav>
      </div>
    </div>

    <!-- Spacer for fixed header -->
    <div class="h-14 sm:h-16 lg:h-18"></div>
  `,
  styles: [`
    .drawer-backdrop {
      animation: drawer-fade-in 0.2s ease-out;
    }
    .drawer-panel {
      transform: translateX(100%);
      transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
      will-change: transform;
    }
    :host-context([dir="rtl"]) .drawer-panel,
    :host-context(.rtl) .drawer-panel {
      transform: translateX(-100%);
    }
    .drawer-panel.drawer-open {
      transform: translateX(0);
    }

    .drawer-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--color-gray-700, #374151);
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .drawer-link:active {
      background: var(--color-primary-50);
      color: var(--color-primary-700);
      transform: scale(0.98);
    }
    :host-context(.dark) .drawer-link {
      color: var(--color-gray-300);
    }
    :host-context(.dark) .drawer-link:active {
      background: rgba(var(--color-primary-500), 0.1);
      color: var(--color-primary-400);
    }

    .drawer-link-icon {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.625rem;
      background: var(--color-gray-50, #f9fafb);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--color-gray-500);
    }
    :host-context(.dark) .drawer-link-icon {
      background: rgba(255, 255, 255, 0.05);
      color: var(--color-gray-400);
    }

    @keyframes drawer-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly modalService = inject(ModalService);
  private readonly router = inject(Router);
  private readonly storage = inject(BrowserStorageService);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly scrolled = signal(false);
  protected readonly darkMode = signal(false);
  protected readonly isHomePage = signal(true);

  /** Solid header when scrolled OR on non-home pages */
  protected readonly solidHeader = computed(() => this.scrolled() || !this.isHomePage());

  constructor() {
    // Track route changes to detect home page
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    ).subscribe(e => {
      this.isHomePage.set(e.urlAfterRedirects === '/' || e.urlAfterRedirects === '');
      // Defensive: always close the mobile drawer after a navigation completes.
      this.mobileMenuOpen.set(false);
    });

    if (isPlatformBrowser(this.platformId)) {
      // Restore dark mode preference
      const stored = this.storage.getItem('kurdmap-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = stored === 'dark' || (!stored && prefersDark);
      this.darkMode.set(isDark);
      if (isDark) document.documentElement.classList.add('dark');

      window.addEventListener('scroll', () => {
        this.scrolled.set(window.scrollY > 20);
      }, { passive: true });
    }
  }

  /** Context-aware classes for desktop nav items so active/idle styling stays
   * readable on both the transparent (over-hero) and solid header states. */
  protected navLinkClass(active: boolean): string {
    if (active) {
      return this.solidHeader()
        ? 'bg-primary-500/10 text-primary-700 dark:text-primary-400'
        : 'bg-white/15 text-white';
    }
    return this.solidHeader()
      ? 'text-gray-600 dark:text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
      : 'text-white/80 hover:text-white hover:bg-white/10';
  }

  protected toggleDarkMode(): void {
    const next = !this.darkMode();
    this.darkMode.set(next);
    document.documentElement.classList.toggle('dark', next);
    this.storage.setItem('kurdmap-theme', next ? 'dark' : 'light');
  }

  protected openSearch(): void {
    this.modalService.openSearch();
  }

  protected closeModal(): void {
    this.modalService.close();
  }
}
