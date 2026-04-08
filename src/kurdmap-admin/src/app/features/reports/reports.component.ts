import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService, NotificationService } from '../../core/services';
import type { DashboardStats, Review } from '../../core/models';
import { StatCardComponent, LoadingComponent } from '../../shared/components';

@Component({
  selector: 'admin-reports',
  imports: [DatePipe, StatCardComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-text">ڕاپۆرتەکان</h1>
      <p class="mt-1 text-sm text-text-secondary">ئامارەکانی سیستەم و تەحلیلی داتاکان (Berichte & Analysen)</p>
    </div>

    @if (loading()) {
      <admin-loading />
    } @else if (stats()) {
      <!-- Overview Stats -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <admin-stat-card icon="business" [value]="stats()!.totalBusinesses" label="کۆی بازرگانییەکان" color="primary" />
        <admin-stat-card icon="category" [value]="stats()!.totalCategories" label="پۆلەکان" color="info" />
        <admin-stat-card icon="location_city" [value]="stats()!.totalCities" label="شارەکان" color="info" />
        <admin-stat-card icon="rate_review" [value]="totalReviews()" label="هەڵسەنگاندنەکان" color="warning" />
      </div>

      <!-- Status Distribution -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <!-- Business Status Chart -->
        <div class="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div class="mb-6 flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <span class="material-icons text-lg text-primary-600 dark:text-primary-400" aria-hidden="true">pie_chart</span>
            </div>
            <h2 class="text-lg font-semibold text-text">بارودۆخی بازرگانییەکان</h2>
          </div>
          <div class="grid grid-cols-2 gap-4">
            @for (item of statusItems(); track item.label) {
              <div class="rounded-xl border border-border p-4 text-center">
                <div class="text-2xl font-bold tabular-nums" [class]="item.textColor">{{ item.value }}</div>
                <div class="mt-1 text-xs text-text-secondary">{{ item.label }}</div>
                <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-alt">
                  <div class="h-full rounded-full" [class]="item.barClass" [style.width.%]="item.percentage"></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Review Stats -->
        <div class="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div class="mb-6 flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <span class="material-icons text-lg text-amber-600 dark:text-amber-400" aria-hidden="true">star</span>
            </div>
            <h2 class="text-lg font-semibold text-text">ئامارەکانی هەڵسەنگاندن</h2>
          </div>
          <div class="space-y-3">
            @for (star of [5,4,3,2,1]; track star) {
              <div class="flex items-center gap-3">
                <span class="w-6 text-end text-sm font-semibold text-text">{{ star }}★</span>
                <div class="flex-1 h-2.5 overflow-hidden rounded-full bg-surface-alt">
                  <div class="h-full rounded-full bg-amber-500 transition-all duration-700"
                    [style.width.%]="getRatingPercentage(star)"></div>
                </div>
                <span class="w-8 text-end text-xs tabular-nums text-text-secondary">{{ getRatingCount(star) }}</span>
              </div>
            }
            <div class="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span class="text-sm text-text-secondary">تێکڕای نمرە</span>
              <div class="flex items-center gap-2">
                <span class="text-2xl font-bold text-amber-600">{{ averageRating() }}</span>
                <span class="text-sm text-text-secondary">/ 5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Reviews -->
      <div class="rounded-2xl border border-border bg-surface shadow-sm">
        <div class="flex items-center gap-3 border-b border-border px-6 py-4">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <span class="material-icons text-lg text-primary-600 dark:text-primary-400" aria-hidden="true">comment</span>
          </div>
          <h2 class="text-lg font-semibold text-text">دوایین هەڵسەنگاندنەکان</h2>
        </div>
        <div class="divide-y divide-border">
          @for (review of recentReviews(); track review.id) {
            <div class="px-6 py-4 flex items-start gap-4">
              <div class="flex gap-0.5 pt-0.5">
                @for (star of [1,2,3,4,5]; track star) {
                  <span class="text-sm" [class]="star <= review.rating ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'">★</span>
                }
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-text">{{ review.comment || '—' }}</p>
                <div class="mt-1 flex items-center gap-3 text-xs text-text-secondary">
                  <span dir="ltr">{{ review.createdAt | date:'yyyy-MM-dd' }}</span>
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    [class]="review.isApproved
                      ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                      : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'">
                    {{ review.isApproved ? 'پەسەندکراو' : 'چاوەڕوان' }}
                  </span>
                </div>
              </div>
            </div>
          } @empty {
            <div class="px-6 py-10 text-center text-text-secondary">
              <span class="material-icons mb-2 block text-4xl opacity-30" aria-hidden="true">reviews</span>
              هیچ هەڵسەنگاندنێک نییە
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class ReportsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly stats = signal<DashboardStats | null>(null);
  readonly reviews = signal<Review[]>([]);
  readonly totalReviews = signal(0);
  readonly recentReviews = signal<Review[]>([]);
  readonly averageRating = signal('0.0');
  readonly statusItems = signal<{ label: string; value: number; percentage: number; barClass: string; textColor: string }[]>([]);

  ngOnInit(): void {
    this.api.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.buildStatusItems(data);
      },
      error: () => this.notifications.error('هەڵە لە بارکردنی ئامارەکان'),
    });

    this.api.getReviews().subscribe({
      next: (data) => {
        this.reviews.set(data);
        this.totalReviews.set(data.length);
        this.recentReviews.set(data.slice(0, 10));
        this.calculateAverage(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  getRatingCount(star: number): number {
    return this.reviews().filter(r => r.rating === star).length;
  }

  getRatingPercentage(star: number): number {
    const total = this.reviews().length || 1;
    return (this.getRatingCount(star) / total) * 100;
  }

  private calculateAverage(reviews: Review[]): void {
    if (reviews.length === 0) {
      this.averageRating.set('0.0');
      return;
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    this.averageRating.set((sum / reviews.length).toFixed(1));
  }

  private buildStatusItems(data: DashboardStats): void {
    const total = data.totalBusinesses || 1;
    this.statusItems.set([
      { label: 'چالاک', value: data.activeBusinesses, percentage: (data.activeBusinesses / total) * 100, barClass: 'bg-success-500', textColor: 'text-success-600' },
      { label: 'چاوەڕوانی', value: data.pendingBusinesses, percentage: (data.pendingBusinesses / total) * 100, barClass: 'bg-warning-500', textColor: 'text-warning-600' },
      { label: 'ڕەتکراوە', value: data.rejectedBusinesses, percentage: (data.rejectedBusinesses / total) * 100, barClass: 'bg-danger-500', textColor: 'text-danger-600' },
      { label: 'ناچالاک', value: data.deactivatedBusinesses, percentage: (data.deactivatedBusinesses / total) * 100, barClass: 'bg-gray-500', textColor: 'text-gray-600' },
    ]);
  }
}
