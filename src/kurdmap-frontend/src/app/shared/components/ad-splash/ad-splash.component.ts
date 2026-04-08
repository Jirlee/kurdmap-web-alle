import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AdvertisementService, AdvertisementItem } from '../../../core/services/advertisement.service';
import { LanguageService } from '../../../core/services/language.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-ad-splash',
  imports: [TranslateModule],
  template: `
    @if (visible() && currentAd(); as ad) {
      <div
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
        (click)="dismiss()"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="getTitle(ad)"
      >
        <div
          class="relative mx-4 w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl animate-scale-up"
          (click)="$event.stopPropagation()"
        >
          <!-- Close button -->
          <button
            (click)="dismiss()"
            class="absolute top-3 end-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 cursor-pointer"
            [attr.aria-label]="'aria.close' | translate"
          >
            <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <!-- Progress bar -->
          <div class="absolute top-0 inset-x-0 h-1 bg-gray-200/30 z-10">
            <div
              class="h-full bg-primary-500 transition-all ease-linear"
              [style.width.%]="progress()"
              [style.transition-duration]="countdownMs + 'ms'"
            ></div>
          </div>

          <!-- Ad content -->
          <a
            [href]="ad.linkUrl || '#'"
            [attr.target]="ad.linkUrl ? '_blank' : null"
            [attr.rel]="ad.linkUrl ? 'noopener noreferrer' : null"
            class="block"
          >
            <div class="relative aspect-[16/9] w-full overflow-hidden">
              <img
                [src]="ad.imageUrl"
                [alt]="getTitle(ad)"
                class="h-full w-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            </div>
            <div class="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <span class="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                </svg>
                {{ isRtl() ? 'ڕیکلام' : 'Anzeige' }}
              </span>
              <h3 class="text-lg font-bold text-white drop-shadow-lg sm:text-xl">{{ getTitle(ad) }}</h3>
              @if (getDescription(ad)) {
                <p class="mt-1 text-sm text-white/80 line-clamp-2">{{ getDescription(ad) }}</p>
              }
            </div>
          </a>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scale-up {
      from { opacity: 0; transform: scale(0.92) translateY(12px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-fade-in { animation: fade-in 0.25s ease-out; }
    .animate-scale-up { animation: scale-up 0.3s ease-out; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdSplashComponent implements OnInit, OnDestroy {
  private readonly adService = inject(AdvertisementService);
  private readonly langService = inject(LanguageService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly visible = signal(false);
  readonly progress = signal(0);
  readonly isRtl = this.langService.isRtl;
  readonly countdownMs = 4000;

  private timerId: ReturnType<typeof setTimeout> | null = null;

  readonly currentAd = computed<AdvertisementItem | null>(() => {
    const list = this.adService.ads();
    return list.length > 0 ? list[0] : null;
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Check sessionStorage so splash only shows once per session
    const shown = sessionStorage.getItem('kurdmap_ad_splash_shown');
    if (shown) return;

    // Wait for ads to load, then show splash
    const checkAds = setInterval(() => {
      if (this.adService.ads().length > 0) {
        clearInterval(checkAds);
        this.showSplash();
      }
    }, 100);

    // Stop checking after 5 seconds if no ads loaded
    setTimeout(() => clearInterval(checkAds), 5000);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearTimeout(this.timerId);
  }

  private showSplash(): void {
    sessionStorage.setItem('kurdmap_ad_splash_shown', '1');
    this.visible.set(true);

    // Start progress bar animation
    requestAnimationFrame(() => {
      this.progress.set(100);
    });

    // Auto dismiss after countdown
    this.timerId = setTimeout(() => this.dismiss(), this.countdownMs);
  }

  dismiss(): void {
    this.visible.set(false);
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  getTitle(ad: AdvertisementItem): string {
    const lang = this.langService.currentLang();
    switch (lang) {
      case 'ku': return ad.titleKu;
      case 'kmr': return ad.titleKmr ?? ad.titleKu;
      case 'en': return ad.titleEn ?? ad.titleDe;
      default: return ad.titleDe;
    }
  }

  getDescription(ad: AdvertisementItem): string | null {
    const lang = this.langService.currentLang();
    if (lang === 'ku' || lang === 'kmr') return ad.descriptionKu;
    return ad.descriptionDe;
  }
}
