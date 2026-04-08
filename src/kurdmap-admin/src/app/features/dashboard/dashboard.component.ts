import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services';
import type { DashboardStats } from '../../core/models';
import { getLocalized, getStatusLabel, getStatusColor } from '../../core/utils';
import { StatCardComponent, LoadingComponent } from '../../shared/components';

@Component({
  selector: 'admin-dashboard',
  imports: [StatCardComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-text">داشبۆڕد</h1>
        <p class="mt-1 text-sm text-text-secondary">بینینی گشتی لە سیستەمی بازرگانییەکان</p>
      </div>
      <div class="flex h-10 items-center gap-2 rounded-xl bg-surface-alt px-4 text-sm text-text-secondary">
        <span class="material-icons text-base" aria-hidden="true">schedule</span>
        <span>نوێکردنەوەی خۆکار</span>
      </div>
    </div>

    @if (loading()) {
      <admin-loading />
    } @else if (stats()) {
      <!-- Status Cards -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <admin-stat-card
          icon="business"
          [value]="stats()!.totalBusinesses"
          label="کۆی بازرگانییەکان"
          color="primary"
          link="/businesses"
        />
        <admin-stat-card
          icon="check_circle"
          [value]="stats()!.activeBusinesses"
          label="چالاک"
          color="success"
          link="/businesses"
        />
        <admin-stat-card
          icon="hourglass_top"
          [value]="stats()!.pendingBusinesses"
          label="چاوەڕوانی پشتڕاستکردنەوە"
          color="warning"
          link="/businesses"
        />
        <admin-stat-card
          icon="cancel"
          [value]="stats()!.rejectedBusinesses"
          label="ڕەتکراوە"
          color="danger"
          link="/businesses"
        />
      </div>

      <!-- Secondary Cards -->
      <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <admin-stat-card
          icon="do_not_disturb"
          [value]="stats()!.deactivatedBusinesses"
          label="ناچالاک"
          color="info"
          link="/businesses"
        />
        <admin-stat-card
          icon="category"
          [value]="stats()!.totalCategories"
          label="پۆلەکان"
          color="info"
          link="/categories"
        />
        <admin-stat-card
          icon="location_city"
          [value]="stats()!.totalCities"
          label="شارەکان"
          color="info"
          link="/cities"
        />
      </div>

      <!-- Charts & Table Section -->
      <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Status Chart -->
        <div class="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div class="mb-6 flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <span class="material-icons text-lg text-primary-600 dark:text-primary-400" aria-hidden="true">bar_chart</span>
            </div>
            <h2 class="text-lg font-semibold text-text">دابەشبوونی بارودۆخ</h2>
          </div>

          <!-- Donut Chart (SVG-based trend visual) -->
          <div class="flex items-center justify-center mb-6">
            <svg viewBox="0 0 120 120" class="w-32 h-32" aria-hidden="true">
              <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" stroke-width="12" class="text-surface-alt" />
              @for (item of chartItems(); track item.label; let i = $index) {
                <circle cx="60" cy="60" r="50" fill="none"
                        [attr.stroke-width]="12"
                        [attr.stroke-dasharray]="item.percentage * 3.14 + ' ' + (314 - item.percentage * 3.14)"
                        [attr.stroke-dashoffset]="getDonutOffset(i)"
                        [class]="item.strokeClass"
                        stroke-linecap="round" />
              }
              <text x="60" y="56" text-anchor="middle" class="fill-text text-lg font-bold" style="font-size:18px">{{ stats()!.totalBusinesses }}</text>
              <text x="60" y="72" text-anchor="middle" class="fill-text-secondary" style="font-size:9px">کۆی گشتی</text>
            </svg>
          </div>

          <div class="space-y-4">
            @for (item of chartItems(); track item.label) {
              <div>
                <div class="mb-1.5 flex justify-between text-sm">
                  <span class="text-text-secondary">{{ item.label }}</span>
                  <span class="font-semibold tabular-nums text-text">{{ item.value }}</span>
                </div>
                <div class="h-2.5 overflow-hidden rounded-full bg-surface-alt">
                  <div
                    class="h-full rounded-full transition-all duration-700 ease-out"
                    [class]="item.barClass"
                    [style.width.%]="item.percentage"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Recent Businesses Table -->
        <div class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div class="flex items-center gap-3 border-b border-border px-6 py-4">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <span class="material-icons text-lg text-primary-600 dark:text-primary-400" aria-hidden="true">storefront</span>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-text">دوایین بازرگانییەکان</h2>
              <p class="text-xs text-text-secondary">دوایین تۆمارکراوەکان</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <caption class="sr-only">دوایین بازرگانییەکان</caption>
              <thead>
                <tr class="bg-surface-alt/50">
                  <th scope="col" class="px-5 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">ناو</th>
                  <th scope="col" class="px-5 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">بارودۆخ</th>
                  <th scope="col" class="px-5 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">پشتڕاستکردنەوە</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                @for (biz of stats()!.recentBusinesses; track biz.id) {
                  <tr
                    class="cursor-pointer transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-900/10"
                    (click)="goToBusinesses()"
                  >
                    <td class="px-5 py-3.5 font-medium text-text">{{ getLocalized(biz.name, 'ku') }}</td>
                    <td class="px-5 py-3.5">
                      <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                            [class]="getStatusColor(biz.status)">
                        {{ getStatusLabel(biz.status) }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5">
                      @if (biz.isVerified) {
                        <span class="inline-flex items-center gap-1 text-xs font-medium text-success-600">
                          <span class="material-icons text-base" aria-hidden="true">verified</span>
                          پشتڕاستکراوە
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1 text-xs font-medium text-warning-600">
                          <span class="material-icons text-base" aria-hidden="true">pending</span>
                          چاوەڕوان
                        </span>
                      }
                    </td>
                  </tr>
                }
                @if (stats()!.recentBusinesses.length === 0) {
                  <tr>
                    <td colspan="3" class="px-5 py-10 text-center text-text-secondary">
                      <span class="material-icons mb-2 block text-4xl opacity-30" aria-hidden="true">inventory_2</span>
                      هیچ بازرگانییەک نییە
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    } @else {
      <div class="flex items-center gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-5 text-danger-700 dark:border-danger-800 dark:bg-danger-900/20 dark:text-danger-400">
        <span class="material-icons text-xl" aria-hidden="true">error_outline</span>
        <span>هەڵە لە بارکردنی داتاکان</span>
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly stats = signal<DashboardStats | null>(null);
  protected readonly error = signal(false);

  protected readonly getLocalized = getLocalized;
  protected readonly getStatusLabel = getStatusLabel;
  protected readonly getStatusColor = getStatusColor;

  protected readonly chartItems = signal<{ label: string; value: number; percentage: number; barClass: string; strokeClass: string }[]>([]);

  ngOnInit(): void {
    this.api.getDashboardStats().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.buildChart(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  protected goToBusinesses(): void {
    this.router.navigate(['/businesses']);
  }

  protected getDonutOffset(index: number): number {
    let offset = 0;
    const items = this.chartItems();
    for (let i = 0; i < index; i++) {
      offset += items[i].percentage * 3.14;
    }
    return -offset;
  }

  private buildChart(data: DashboardStats): void {
    const total = data.totalBusinesses || 1;
    this.chartItems.set([
      { label: 'چالاک', value: data.activeBusinesses, percentage: (data.activeBusinesses / total) * 100, barClass: 'bg-success-500', strokeClass: 'stroke-success-500' },
      { label: 'چاوەڕوانی', value: data.pendingBusinesses, percentage: (data.pendingBusinesses / total) * 100, barClass: 'bg-warning-500', strokeClass: 'stroke-warning-500' },
      { label: 'ڕەتکراوە', value: data.rejectedBusinesses, percentage: (data.rejectedBusinesses / total) * 100, barClass: 'bg-danger-500', strokeClass: 'stroke-danger-500' },
      { label: 'ناچالاک', value: data.deactivatedBusinesses, percentage: (data.deactivatedBusinesses / total) * 100, barClass: 'bg-gray-500', strokeClass: 'stroke-gray-500' },
    ]);
  }
}
