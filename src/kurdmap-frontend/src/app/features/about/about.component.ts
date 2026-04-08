import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-about',
  imports: [TranslateModule],
  template: `
    <section class="min-h-[60vh] py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-sm font-medium mb-6">
            <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ 'about.badge' | translate }}
          </div>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 text-balance">
            {{ 'about.title' | translate }}
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-balance">
            {{ 'about.subtitle' | translate }}
          </p>
        </div>

        <!-- Mission -->
        <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 sm:p-10 mb-8 shadow-sm">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <div class="size-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <svg class="size-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            {{ 'about.mission.title' | translate }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
            {{ 'about.mission.text' | translate }}
          </p>
        </div>

        <!-- Features grid -->
        <div class="grid sm:grid-cols-2 gap-6 mb-8">
          <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
            <div class="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <svg class="size-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ 'about.features.multilingual.title' | translate }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ 'about.features.multilingual.text' | translate }}</p>
          </div>

          <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
            <div class="size-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <svg class="size-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ 'about.features.map.title' | translate }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ 'about.features.map.text' | translate }}</p>
          </div>

          <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
            <div class="size-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <svg class="size-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ 'about.features.mobile.title' | translate }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ 'about.features.mobile.text' | translate }}</p>
          </div>

          <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
            <div class="size-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
              <svg class="size-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ 'about.features.verified.title' | translate }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ 'about.features.verified.text' | translate }}</p>
          </div>
        </div>

        <!-- Open Source -->
        <div class="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 rounded-2xl border border-primary-200/50 dark:border-primary-800/30 p-8 sm:p-10 text-center">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">{{ 'about.openSource.title' | translate }}</h2>
          <p class="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            {{ 'about.openSource.text' | translate }}
          </p>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AboutComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);

  ngOnInit(): void {
    this.seo.updateMeta({
      title: this.translate.instant('about.title'),
      description: this.translate.instant('about.subtitle'),
    });
  }
}
