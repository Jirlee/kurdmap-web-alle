import { Component, inject, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AdvertisementService, AdvertisementItem } from '../../../core/services/advertisement.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-promotion-banner',
  template: `
    @if (ads().length > 0) {
      <section class="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div class="mb-6 text-center">
          <span class="inline-flex items-center gap-2 rounded-full bg-accent-100 px-4 py-1.5 text-sm font-semibold text-accent-800 dark:bg-accent-900/30 dark:text-accent-300">
            <span class="material-icons text-base">campaign</span>
            {{ isRtl() ? 'ڕیکلام' : 'Werbung' }}
          </span>
        </div>

        <div class="relative overflow-hidden rounded-3xl shadow-elevated">
          <!-- Current Ad -->
          @if (currentAd(); as ad) {
            <a
              [href]="ad.linkUrl || '#'"
              [attr.target]="ad.linkUrl ? '_blank' : null"
              [attr.rel]="ad.linkUrl ? 'noopener noreferrer' : null"
              class="group relative block overflow-hidden"
            >
              <div class="relative aspect-[21/9] w-full overflow-hidden sm:aspect-[3/1]">
                <img
                  [src]="ad.imageUrl"
                  [alt]="getTitle(ad)"
                  class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <!-- Gradient Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              </div>

              <!-- Text Overlay -->
              <div class="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <h3 class="text-xl font-bold text-white drop-shadow-lg sm:text-2xl lg:text-3xl">
                  {{ getTitle(ad) }}
                </h3>
                @if (getDescription(ad)) {
                  <p class="mt-2 max-w-2xl text-sm text-white/80 drop-shadow sm:text-base">
                    {{ getDescription(ad) }}
                  </p>
                }
                @if (ad.linkUrl) {
                  <span class="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors group-hover:bg-white/30">
                    {{ isRtl() ? 'زیاتر بزانە' : 'Mehr erfahren' }}
                    <span class="material-icons text-base" aria-hidden="true">arrow_forward</span>
                  </span>
                }
              </div>
            </a>
          }

          <!-- Navigation dots -->
          @if (ads().length > 1) {
            <div class="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
              @for (ad of ads(); track ad.id; let i = $index) {
                <button
                  type="button"
                  (click)="goToSlide(i)"
                  class="h-2 rounded-full transition-all duration-300"
                  [class]="i === currentIndex()
                    ? 'w-6 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'"
                  [attr.aria-label]="'Slide ' + (i + 1)"
                ></button>
              }
            </div>
          }
        </div>
      </section>
    }
  `,
})
export class PromotionBannerComponent implements OnInit {
  private readonly adService = inject(AdvertisementService);
  private readonly langService = inject(LanguageService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly ads = this.adService.ads;
  readonly currentIndex = signal(0);
  readonly isRtl = this.langService.isRtl;

  readonly currentAd = computed(() => {
    const list = this.ads();
    return list.length > 0 ? list[this.currentIndex()] : null;
  });

  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.adService.loadActiveAds();

    if (isPlatformBrowser(this.platformId)) {
      this.intervalId = setInterval(() => {
        const list = this.ads();
        if (list.length > 1) {
          this.currentIndex.update(i => (i + 1) % list.length);
        }
      }, 6000);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  goToSlide(index: number): void {
    this.currentIndex.set(index);
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
