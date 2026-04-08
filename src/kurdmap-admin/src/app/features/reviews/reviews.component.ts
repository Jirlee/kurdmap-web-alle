import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService, NotificationService } from '../../core/services';
import type { Review } from '../../core/models';
import {
  ButtonComponent,
  ConfirmDialogComponent,
  LoadingComponent,
} from '../../shared/components';

@Component({
  selector: 'admin-reviews',
  imports: [DatePipe, ButtonComponent, ConfirmDialogComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-text">هەڵسەنگاندنەکان</h1>
        <p class="mt-1 text-sm text-text-secondary">بەڕێوەبردنی هەڵسەنگاندنەکانی بەکارهێنەران (Bewertungen)</p>
      </div>
      <div class="flex gap-2">
        <admin-button variant="secondary" (clicked)="filterApproved = null; loadReviews()">
          <span class="material-icons me-1 text-base align-middle">list</span>
          هەموو
        </admin-button>
        <admin-button variant="secondary" (clicked)="filterApproved = false; loadReviews()">
          <span class="material-icons me-1 text-base align-middle">pending</span>
          چاوەڕوانی
        </admin-button>
      </div>
    </div>

    @if (loading()) {
      <!-- Skeleton Loading -->
      <div class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm animate-pulse">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-surface-alt/50">
                @for (_ of skeletonCols; track $index) {
                  <th class="px-5 py-3.5"><div class="h-3 w-16 rounded bg-border/60"></div></th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (_ of skeletonRows; track $index) {
                <tr>
                  <td class="px-5 py-3.5"><div class="h-3 w-6 rounded bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-16 rounded bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="flex gap-0.5">@for (_ of [1,2,3,4,5]; track $index) {<div class="h-4 w-4 rounded bg-border/30"></div>}</div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-32 rounded bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-20 rounded bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="h-5 w-16 rounded-full bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="flex gap-1"><div class="h-7 w-7 rounded-lg bg-border/40"></div><div class="h-7 w-7 rounded-lg bg-border/40"></div></div></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    } @else {
      <div class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <!-- Mobile card view -->
        <div class="divide-y divide-border md:hidden">
          @for (review of reviews(); track review.id) {
            <div class="p-4 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex gap-0.5">
                  @for (star of [1,2,3,4,5]; track star) {
                    <span class="text-base" [class]="star <= review.rating ? 'text-amber-500' : 'text-gray-300'">★</span>
                  }
                </div>
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      [class]="review.isApproved ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'">
                  {{ review.isApproved ? 'پەسەندکراو' : 'چاوەڕوان' }}
                </span>
              </div>
              @if (review.comment) {
                <p class="text-sm text-text line-clamp-2">{{ review.comment }}</p>
              }
              <p class="text-xs text-text-secondary" dir="ltr">{{ review.createdAt | date:'yyyy-MM-dd' }}</p>
              <div class="flex gap-1 pt-1">
                @if (!review.isApproved) {
                  <button type="button" (click)="approveReview(review)" class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-success-600 hover:bg-success-50 transition-colors" aria-label="پەسەندکردن">check_circle</button>
                }
                <button type="button" (click)="openDeleteConfirm(review)" class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-danger-600 hover:bg-danger-50 transition-colors" aria-label="سڕینەوە">delete</button>
              </div>
            </div>
          } @empty {
            <div class="px-5 py-16 text-center">
              <p class="text-sm font-medium text-text-secondary">هیچ هەڵسەنگاندنێک نەدۆزرایەوە</p>
            </div>
          }
        </div>

        <!-- Desktop table view -->
        <div class="overflow-x-auto hidden md:block">
          <table class="w-full text-sm">
            <caption class="sr-only">لیستی هەڵسەنگاندنەکان</caption>
            <thead>
              <tr class="bg-surface-alt/50">
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">#</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">ئایدی بازرگانی</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">نمرە</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">لێدوان</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">بەروار</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">بارودۆخ</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">کردارەکان</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (review of reviews(); track review.id; let i = $index) {
                <tr class="transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-900/10">
                  <td class="px-5 py-3.5 text-text-secondary">{{ i + 1 }}</td>
                  <td class="px-5 py-3.5 text-text font-mono text-xs" dir="ltr">{{ review.businessId.substring(0, 8) }}…</td>
                  <td class="px-5 py-3.5">
                    <div class="flex gap-0.5">
                      @for (star of [1,2,3,4,5]; track star) {
                        <span
                          class="text-base"
                          [class]="star <= review.rating ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'"
                        >★</span>
                      }
                    </div>
                  </td>
                  <td class="px-5 py-3.5 text-text max-w-xs truncate">{{ review.comment || '—' }}</td>
                  <td class="px-5 py-3.5 text-text-secondary" dir="ltr">{{ review.createdAt | date:'yyyy-MM-dd' }}</td>
                  <td class="px-5 py-3.5">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      [class]="review.isApproved
                        ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                        : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'"
                    >
                      {{ review.isApproved ? 'پەسەندکراو' : 'چاوەڕوان' }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="flex gap-1">
                      @if (!review.isApproved) {
                        <button
                          type="button"
                          (click)="approveReview(review)"
                        class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors"
                        title="پەسەندکردن"
                        aria-label="پەسەندکردن"
                        >check_circle</button>
                      }
                      <button
                        type="button"
                        (click)="openDeleteConfirm(review)"
                        class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                        title="سڕینەوە"
                        aria-label="سڕینەوە"
                      >delete</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-5 py-16 text-center">
                    <svg class="mx-auto mb-4 h-20 w-20 text-border" fill="none" viewBox="0 0 80 80" aria-hidden="true">
                      <path d="M40 12l8.5 17.2 19 2.8-13.75 13.4 3.25 18.9L40 54.4l-17 8.9 3.25-18.9L12.5 31l19-2.8z" stroke="currentColor" stroke-width="2" opacity="0.4"/>
                      <path d="M40 22l5 10.2 11.3 1.6-8.15 7.9 1.9 11.2L40 47.5l-10.05 5.4 1.9-11.2-8.15-7.9 11.3-1.6z" fill="currentColor" opacity="0.1"/>
                    </svg>
                    <p class="text-sm font-medium text-text-secondary">هیچ هەڵسەنگاندنێک نەدۆزرایەوە</p>
                    <p class="mt-1 text-xs text-text-secondary/60">هەڵسەنگاندنەکان لێرە دەردەکەون</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Delete Confirm -->
    <admin-confirm-dialog
      [open]="deleteConfirmOpen()"
      title="سڕینەوەی هەڵسەنگاندن"
      message="ئایا دڵنیایی لە سڕینەوەی ئەم هەڵسەنگاندنە؟"
      confirmText="بەڵێ، بیسڕێنەوە"
      cancelText="پاشگەزبوونەوە"
      variant="danger"
      (confirmed)="deleteReview()"
      (cancelled)="deleteConfirmOpen.set(false)"
    />
  `,
})
export class ReviewsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notifications = inject(NotificationService);

  readonly skeletonRows = Array(5);
  readonly skeletonCols = Array(7);

  readonly loading = signal(true);
  readonly reviews = signal<Review[]>([]);
  readonly deleteConfirmOpen = signal(false);
  readonly deleteTarget = signal<Review | null>(null);

  filterApproved: boolean | null = null;

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading.set(true);
    this.api.getReviews(this.filterApproved ?? undefined).subscribe({
      next: (data) => {
        this.reviews.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error('هەڵە لە بارکردنی هەڵسەنگاندنەکان');
        this.loading.set(false);
      },
    });
  }

  approveReview(review: Review): void {
    this.api.approveReview(review.id).subscribe({
      next: () => {
        this.notifications.success('هەڵسەنگاندن پەسەندکرا');
        this.loadReviews();
      },
      error: () => this.notifications.error('هەڵە لە پەسەندکردن'),
    });
  }

  openDeleteConfirm(review: Review): void {
    this.deleteTarget.set(review);
    this.deleteConfirmOpen.set(true);
  }

  deleteReview(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleteConfirmOpen.set(false);
    this.api.deleteReview(target.id).subscribe({
      next: () => {
        this.notifications.success('هەڵسەنگاندن سڕایەوە');
        this.loadReviews();
      },
      error: () => this.notifications.error('هەڵە لە سڕینەوە'),
    });
  }
}
