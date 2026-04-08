import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-app-cta',
  imports: [TranslateModule],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="relative overflow-hidden rounded-3xl bg-gray-950 p-8 sm:p-12 lg:p-16">
        <!-- Decorative -->
        <div class="absolute top-0 end-0 size-80 rounded-full bg-primary-500/10 blur-3xl"></div>
        <div class="absolute bottom-0 start-0 size-64 rounded-full bg-accent-400/10 blur-3xl"></div>
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 40px 40px;"></div>

        <div class="relative flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <!-- Text -->
          <div class="flex-1 text-center lg:text-start">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-medium mb-5">
              <span class="size-1.5 rounded-full bg-primary-400 animate-pulse"></span>
              {{ 'appCta.badge' | translate }}
            </div>
            <h2 class="text-2xl sm:text-3xl font-bold text-white mb-4 text-balance">{{ 'appCta.title' | translate }}</h2>
            <p class="text-sm sm:text-base text-gray-400 mb-8 max-w-lg leading-relaxed">{{ 'appCta.subtitle' | translate }}</p>

            <div class="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <div class="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white">
                <svg class="size-7" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.36-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.36C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                <div>
                  <div class="text-[10px] text-gray-400 leading-none">{{ 'appCta.downloadOn' | translate }}</div>
                  <div class="text-sm font-semibold leading-tight">App Store</div>
                </div>
              </div>
              <div class="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white">
                <svg class="size-7" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 1.328a1 1 0 010 1.73L17.698 14l-2.5-2.5 2.5-2.5zM5.864 2.658L16.8 8.991l-2.302 2.302L5.864 2.658z"/></svg>
                <div>
                  <div class="text-[10px] text-gray-400 leading-none">{{ 'appCta.getItOn' | translate }}</div>
                  <div class="text-sm font-semibold leading-tight">Google Play</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Phone mockup -->
          <div class="shrink-0">
            <div class="relative w-48 h-80 rounded-[2rem] bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700/50 shadow-2xl p-2">
              <div class="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-primary-600 to-primary-800 flex flex-col items-center justify-center gap-3 overflow-hidden">
                <div class="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <svg class="size-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <span class="text-white font-bold text-lg">KurdMap</span>
                <span class="text-white/70 text-[10px]">{{ 'appCta.comingSoon' | translate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCtaComponent {}
