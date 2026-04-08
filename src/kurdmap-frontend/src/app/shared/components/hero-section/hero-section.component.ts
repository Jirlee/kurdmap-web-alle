import { ChangeDetectionStrategy, Component, inject, signal, PLATFORM_ID, ElementRef, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CategoryService } from '../../../core/services/category.service';
import { CityService } from '../../../core/services/city.service';
import { LanguageService } from '../../../core/services/language.service';
import { ModalService } from '../../../core/services/modal.service';
import { GeolocationService } from '../../../core/services/geolocation.service';
import { Category, City } from '../../../core/models';

@Component({
  selector: 'app-hero-section',
  imports: [TranslateModule],
  template: `
    <section class="relative min-h-[85vh] flex items-center overflow-hidden -mt-16 lg:-mt-18">
      <!-- Animated gradient background -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950"></div>

      <!-- Decorative elements -->
      <div class="absolute inset-0 overflow-hidden">
        <!-- Floating orbs -->
        <div class="absolute top-1/4 -start-20 size-80 rounded-full bg-primary-500/10 blur-3xl animate-float"></div>
        <div class="absolute bottom-1/4 -end-20 size-96 rounded-full bg-accent-400/10 blur-3xl animate-float" style="animation-delay: -3s;"></div>
        <div class="absolute top-1/2 start-1/3 size-64 rounded-full bg-primary-400/5 blur-3xl animate-float" style="animation-delay: -1.5s;"></div>

        <!-- Grid pattern overlay -->
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 40px 40px;"></div>

        <!-- Noise grain texture (Idea 8) -->
        <svg class="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none mix-blend-overlay" aria-hidden="true">
          <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/></filter>
          <rect width="100%" height="100%" filter="url(#noise)"/>
        </svg>

        <!-- Bottom gradient fade -->
        <div class="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-surface to-transparent"></div>
      </div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 w-full">
        <div class="text-center max-w-4xl mx-auto">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-primary-200 text-sm font-medium mb-8 animate-fade-in">
            <span class="size-2 rounded-full bg-accent-400 animate-pulse"></span>
            {{ 'home.heroText' | translate }}
          </div>

          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight text-balance animate-fade-in-up">
            {{ 'home.title' | translate }}
          </h1>

          <p class="text-lg sm:text-xl text-primary-200/90 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style="animation-delay: 0.1s;">
            {{ 'home.subtitle' | translate }}
          </p>

          <!-- Search bar — glass card -->
          <div class="relative max-w-2xl mx-auto animate-slide-up" style="animation-delay: 0.2s;">
            <div class="bg-white rounded-2xl shadow-elevated p-2 ring-1 ring-black/5">
              <div class="flex flex-col sm:flex-row gap-2">
                <div class="relative flex-1">
                  <svg class="absolute start-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <input
                    type="text"
                    [placeholder]="'home.searchPlaceholder' | translate"
                    [attr.aria-label]="'aria.searchInput' | translate"
                    class="w-full ps-12 pe-4 py-3.5 text-gray-800 rounded-xl border-0 focus-visible:ring-2 focus-visible:ring-primary-500/50 outline-none text-base bg-gray-50/50 placeholder:text-gray-400 transition-all"
                    (keyup.enter)="onSearch()"
                    [value]="searchQuery()"
                    (input)="searchQuery.set($any($event.target).value)"
                  />
                </div>
                <button
                  (click)="onSearch()"
                  class="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 active:scale-[0.98] transition-all duration-200 shadow-md shadow-primary-600/25 whitespace-nowrap motion-reduce:transition-none"
                >
                  {{ 'home.searchButton' | translate }}
                </button>
              </div>
            </div>

            <!-- Near Me quick action -->
            <div class="flex justify-center mt-4 animate-fade-in" style="animation-delay: 0.3s;">
              <button
                (click)="onNearMe()"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 text-white text-sm font-medium transition-all duration-200 active:scale-[0.97]"
                [disabled]="geoLoading()"
              >
                @if (geoLoading()) {
                  <svg class="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                } @else {
                  <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                  </svg>
                }
                {{ 'home.nearMe' | translate }}
              </button>
            </div>
            <!-- Subtle glow under search -->
            <div class="absolute -bottom-4 inset-x-8 h-8 bg-primary-500/10 blur-2xl rounded-full"></div>
          </div>

          <!-- Quick stats — animated count-up (Idea 6) -->
          <div class="flex justify-center gap-8 sm:gap-12 mt-16 animate-fade-in" style="animation-delay: 0.4s;" #statsSection>
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-white tabular-nums">{{ animCities() }}</div>
              <div class="text-sm text-primary-300 mt-1">{{ 'home.exploreCities' | translate }}</div>
            </div>
            <div class="w-px h-12 bg-white/10"></div>
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-white tabular-nums">{{ animCategories() }}</div>
              <div class="text-sm text-primary-300 mt-1">{{ 'home.categoriesTitle' | translate }}</div>
            </div>
            <div class="w-px h-12 bg-white/10"></div>
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-white tabular-nums">{{ animBusinesses() }}+</div>
              <div class="text-sm text-primary-300 mt-1">{{ 'home.featuredTitle' | translate }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSectionComponent implements AfterViewInit {
  private readonly modalService = inject(ModalService);
  private readonly geoService = inject(GeolocationService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly el = inject(ElementRef);
  protected readonly searchQuery = signal('');
  protected readonly geoLoading = signal(false);

  // Animated counter values (Idea 6)
  protected readonly animCities = signal(0);
  protected readonly animCategories = signal(0);
  protected readonly animBusinesses = signal(0);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // SSR: show final values immediately
      this.animCities.set(16);
      this.animCategories.set(9);
      this.animBusinesses.set(50);
      return;
    }

    const statsEl = this.el.nativeElement.querySelector('[data-reveal-stats], .animate-fade-in:last-child') ??
                     this.el.nativeElement.querySelector('[class*="mt-16"]');
    // Fallback: just animate immediately
    this.countUp(this.animCities, 16, 600);
    this.countUp(this.animCategories, 9, 900);
    this.countUp(this.animBusinesses, 50, 800);
  }

  private countUp(sig: ReturnType<typeof signal<number>>, target: number, durationMs: number): void {
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      sig.set(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  protected onSearch(): void {
    if (this.searchQuery().trim()) {
      this.modalService.openSearch({ q: this.searchQuery().trim() });
    }
  }

  protected async onNearMe(): Promise<void> {
    this.geoLoading.set(true);
    const loc = await this.geoService.requestLocation();
    this.geoLoading.set(false);
    if (loc) {
      this.modalService.openSearch({ nearMe: true });
    }
  }
}
