import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { BusinessService } from '../../../core/services/business.service';
import { LanguageService } from '../../../core/services/language.service';
import { ModalService } from '../../../core/services/modal.service';
import { BusinessSummary } from '../../../core/models';
import { BusinessCardComponent } from '../business-card/business-card.component';

@Component({
  selector: 'app-featured-businesses',
  imports: [TranslateModule, BusinessCardComponent],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <!-- Featured businesses -->
      <div class="flex items-end justify-between mb-12">
        <div>
          <p class="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-3">{{ 'home.featuredTitle' | translate }}</p>
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 text-balance">
            {{ 'home.featuredTitle' | translate }}
          </h2>
        </div>
        <button (click)="openSearch()" class="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 outline-none group cursor-pointer">
          {{ 'common.viewAll' | translate }}
          <svg class="size-4 rtl:rotate-180 motion-safe:group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (i of skeletonItems; track i) {
            <div class="bg-white rounded-2xl overflow-hidden border border-gray-100/80">
              <div class="shimmer-bg animate-shimmer aspect-[4/3]"></div>
              <div class="p-5 space-y-3">
                <div class="shimmer-bg animate-shimmer h-5 w-3/4 rounded-lg"></div>
                <div class="shimmer-bg animate-shimmer h-4 w-1/2 rounded-lg"></div>
                <div class="shimmer-bg animate-shimmer h-4 w-full rounded-lg"></div>
              </div>
            </div>
          }
        </div>
      } @else if (featured().length === 0 && discounted().length === 0) {
        <div class="text-center py-16">
          <span class="text-6xl mb-4 block">🔍</span>
          <p class="text-gray-500 dark:text-gray-400">{{ 'search.noResults' | translate }}</p>
        </div>
      } @else {
        @if (featured().length > 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (business of featured(); track business.id; let i = $index) {
              <div [class]="i === 0 ? 'sm:col-span-2 lg:col-span-1' : ''">
                <app-business-card [business]="business" />
              </div>
            }
          </div>
        }

        <!-- Discounted businesses -->
        @if (discounted().length > 0) {
          <div class="mt-16">
            <div class="flex items-end justify-between mb-10">
              <div>
                <p class="text-sm font-semibold text-rose-500 tracking-wide uppercase mb-3 flex items-center gap-1.5">
                  <svg class="size-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>
                  {{ 'home.discountedTitle' | translate }}
                </p>
                <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 text-balance">
                  {{ 'home.discountedTitle' | translate }}
                </h2>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (business of discounted(); track business.id) {
                <app-business-card [business]="business" />
              }
            </div>
          </div>
        }

        <!-- Mobile view all -->
        <div class="sm:hidden mt-8 text-center">
          <button (click)="openSearch()" class="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-primary-600 border border-primary-200 rounded-xl hover:bg-primary-50 transition-all cursor-pointer">
            {{ 'common.viewAll' | translate }}
            <svg class="size-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedBusinessesComponent implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly modalService = inject(ModalService);
  protected readonly langService = inject(LanguageService);
  protected readonly featured = signal<BusinessSummary[]>([]);
  protected readonly discounted = signal<BusinessSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly skeletonItems = Array(6).fill(0);

  ngOnInit(): void {
    this.businessService.getRecommended(6).subscribe({
      next: (result) => {
        this.featured.set(result.featured);
        this.discounted.set(result.discounted);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected openSearch(): void {
    this.modalService.openSearch();
  }
}
