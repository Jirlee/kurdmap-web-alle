import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-how-it-works',
  imports: [TranslateModule],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="text-center mb-14">
        <p class="text-xs font-semibold text-primary-600 tracking-widest uppercase mb-3">{{ 'howItWorks.subtitle' | translate }}</p>
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-balance">
          {{ 'howItWorks.title' | translate }}
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        <!-- Step 1 -->
        <div class="relative text-center group" style="animation: fade-in-up 0.5s ease-out both;">
          <div class="size-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary-200 transition-colors duration-300">
            <span class="text-2xl">🔍</span>
          </div>
          <div class="absolute -top-2 -end-2 size-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shadow-md hidden md:flex">1</div>
          <h3 class="text-base font-semibold text-gray-900 mb-2">{{ 'howItWorks.step1Title' | translate }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{{ 'howItWorks.step1Desc' | translate }}</p>
        </div>

        <!-- Connector line (desktop) -->
        <div class="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200"></div>

        <!-- Step 2 -->
        <div class="relative text-center group" style="animation: fade-in-up 0.5s ease-out both; animation-delay: 0.15s;">
          <div class="size-16 rounded-2xl bg-accent-100 flex items-center justify-center mx-auto mb-5 group-hover:bg-accent-200 transition-colors duration-300">
            <span class="text-2xl">📋</span>
          </div>
          <div class="absolute -top-2 -end-2 size-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shadow-md hidden md:flex">2</div>
          <h3 class="text-base font-semibold text-gray-900 mb-2">{{ 'howItWorks.step2Title' | translate }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{{ 'howItWorks.step2Desc' | translate }}</p>
        </div>

        <!-- Step 3 -->
        <div class="relative text-center group" style="animation: fade-in-up 0.5s ease-out both; animation-delay: 0.3s;">
          <div class="size-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-5 group-hover:bg-green-200 transition-colors duration-300">
            <span class="text-2xl">🤝</span>
          </div>
          <div class="absolute -top-2 -end-2 size-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shadow-md hidden md:flex">3</div>
          <h3 class="text-base font-semibold text-gray-900 mb-2">{{ 'howItWorks.step3Title' | translate }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{{ 'howItWorks.step3Desc' | translate }}</p>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorksComponent {}
