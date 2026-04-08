import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CityService } from '../../../core/services/city.service';
import { LanguageService } from '../../../core/services/language.service';
import { ModalService } from '../../../core/services/modal.service';
import { City } from '../../../core/models';

@Component({
  selector: 'app-city-selector',
  imports: [TranslateModule],
  template: `
    <section class="relative py-20 overflow-hidden">
      <!-- Subtle background -->
      <div class="absolute inset-0 bg-gradient-to-b from-surface via-primary-50/30 to-surface"></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <p class="text-xs font-semibold text-primary-600 tracking-widest uppercase mb-3">{{ 'home.exploreCities' | translate }}</p>
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-balance">
            {{ 'home.exploreCities' | translate }}
          </h2>
        </div>

        @if (loading()) {
          <div class="flex justify-center gap-6">
            <div class="shimmer-bg animate-shimmer rounded-3xl h-56 w-72"></div>
            <div class="shimmer-bg animate-shimmer rounded-3xl h-56 w-72"></div>
          </div>
        } @else {
          <div class="flex flex-col sm:flex-row justify-center gap-6">
            @for (city of cities(); track city.id; let i = $index) {
              <button
                (click)="onCityClick(city)"
                class="group relative overflow-hidden rounded-3xl shadow-card hover:shadow-elevated transition-all duration-500 cursor-pointer w-full sm:w-80 focus-visible:ring-2 focus-visible:ring-primary-500 outline-none motion-reduce:transition-none hover:-translate-y-1"
                [style.animation-delay]="(i * 100) + 'ms'"
                style="animation: fade-in-up 0.5s ease-out both;"
              >
                <!-- City card content -->
                <div class="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-10 text-center h-56 flex flex-col items-center justify-center">
                  <!-- Decorative circles -->
                  <div class="absolute top-4 end-4 size-24 rounded-full bg-white/5 motion-safe:group-hover:scale-150 transition-transform duration-700"></div>
                  <div class="absolute bottom-4 start-4 size-16 rounded-full bg-white/5 motion-safe:group-hover:scale-150 transition-transform duration-700 delay-100"></div>

                  <span class="text-5xl mb-4 block motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-6 transition-transform duration-500">🏙️</span>
                  <h3 class="text-2xl font-bold text-white mb-2 relative">
                    {{ langService.getLocalizedField(city) }}
                  </h3>
                  <p class="text-primary-200 text-sm flex items-center gap-1.5 relative">
                    {{ 'home.viewAllBusinesses' | translate }}
                    <svg class="size-4 motion-safe:group-hover:translate-x-1 rtl:motion-safe:group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                  </p>
                </div>
                <!-- Hover overlay -->
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
              </button>
            }
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CitySelectorComponent implements OnInit {
  private readonly cityService = inject(CityService);
  private readonly modalService = inject(ModalService);
  protected readonly langService = inject(LanguageService);
  protected readonly cities = this.cityService.cities;
  protected readonly loading = signal(true);

  ngOnInit(): void {
    if (this.cities().length > 0) {
      this.loading.set(false);
      return;
    }
    this.cityService.getAll().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  protected onCityClick(city: City): void {
    this.modalService.openSearch({ city: city.slug });
  }
}
