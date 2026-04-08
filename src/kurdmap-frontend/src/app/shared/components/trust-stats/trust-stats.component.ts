import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-trust-stats',
  imports: [TranslateModule],
  template: `
    <section class="relative py-20 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900"></div>
      <div class="absolute inset-0 opacity-[0.04]" style="background-image: radial-gradient(circle, white 1px, transparent 1px); background-size: 32px 32px;"></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <h2 class="text-2xl sm:text-3xl font-bold text-white text-balance">{{ 'trustStats.title' | translate }}</h2>
          <p class="text-primary-200/80 mt-3 text-sm sm:text-base max-w-xl mx-auto">{{ 'trustStats.subtitle' | translate }}</p>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          @for (stat of stats; track stat.key) {
            <div class="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors duration-300">
              <span class="text-3xl mb-3 block">{{ stat.icon }}</span>
              <div class="text-2xl sm:text-3xl font-bold text-white tabular-nums mb-1">{{ stat.value }}</div>
              <div class="text-xs sm:text-sm text-primary-300">{{ 'trustStats.' + stat.key | translate }}</div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrustStatsComponent {
  readonly stats = [
    { key: 'cities', value: '16+', icon: '🏙️' },
    { key: 'categories', value: '9', icon: '📂' },
    { key: 'languages', value: '4', icon: '🌍' },
    { key: 'free', value: '100%', icon: '💚' },
  ];
}
