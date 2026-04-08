import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, NotificationService } from '../../core/services';
import type { BusinessSummary } from '../../core/models';
import { BusinessStatus } from '../../core/models';
import { getLocalized, getStatusLabel, getStatusColor } from '../../core/utils';
import {
  ButtonComponent,
  InputComponent,
  PaginationComponent,
  ConfirmDialogComponent,
  LoadingComponent,
} from '../../shared/components';
import { BusinessFormDialogComponent } from './business-form-dialog.component';

@Component({
  selector: 'admin-businesses',
  imports: [
    FormsModule,
    ButtonComponent,
    InputComponent,
    PaginationComponent,
    ConfirmDialogComponent,
    LoadingComponent,
    BusinessFormDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-text">بازرگانییەکان</h1>
        <p class="mt-1 text-sm text-text-secondary">بەڕێوەبردنی بازرگانییەکان</p>
      </div>
      <admin-button (clicked)="openCreateDialog()">
        <span class="material-icons me-1 text-base align-middle">add</span>
        زیادکردنی بازرگانی
      </admin-button>
      <admin-button variant="secondary" (clicked)="exportCsv()" class="ms-2">
        <span class="material-icons me-1 text-base align-middle">download</span>
        CSV
      </admin-button>
    </div>

    <!-- Filters -->
    <div class="mb-5 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <admin-input
          placeholder="گەڕان"
          icon="search"
          [(ngModel)]="searchText"
          (ngModelChange)="onSearchChanged()"
        />
        <div>
          <label for="status-filter" class="sr-only">فیلتەری بارودۆخ</label>
          <select
            id="status-filter"
            class="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 focus:outline-none"
            [(ngModel)]="statusFilter"
            (ngModelChange)="onFilterChanged()"
          >
            <option value="">هەمووی</option>
            <option value="0">چاوەڕوانی پشتڕاستکردنەوە</option>
            <option value="1">چالاک</option>
            <option value="2">ڕەتکراوە</option>
            <option value="3">ناچالاک</option>
          </select>
        </div>
        <admin-button variant="secondary" (clicked)="loadBusinesses()">
          <span class="material-icons me-1 text-base align-middle">refresh</span>
          نوێکردنەوە
        </admin-button>
      </div>
    </div>

    <!-- Table -->
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
                  <td class="px-5 py-3.5"><div class="h-10 w-10 rounded-xl bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="space-y-1.5"><div class="h-3 w-28 rounded bg-border/50"></div><div class="h-2.5 w-20 rounded bg-border/30"></div></div></td>
                  <td class="px-5 py-3.5"><div class="h-5 w-16 rounded-full bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-20 rounded bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-24 rounded bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="space-y-1.5"><div class="h-3 w-20 rounded bg-border/40"></div><div class="h-2.5 w-14 rounded bg-border/30"></div></div></td>
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
          @for (biz of businesses(); track biz.id) {
            <div class="p-4 space-y-3">
              <div class="flex items-start gap-3">
                @if (biz.primaryImageUrl) {
                  <img [src]="biz.primaryImageUrl" [alt]="biz.name.de" class="h-12 w-12 rounded-xl object-cover shadow-sm" />
                } @else {
                  <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-400 dark:bg-primary-900/20">
                    <span class="material-icons">business</span>
                  </div>
                }
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-text truncate">{{ biz.name.de }}</p>
                  <p class="text-xs text-text-secondary truncate">{{ biz.name.ku }}</p>
                </div>
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0" [class]="getStatusColor(biz.status)">
                  {{ getStatusLabel(biz.status) }}
                </span>
              </div>
              <div class="flex flex-wrap gap-2 text-xs text-text-secondary">
                @if (biz.isVerified) {
                  <span class="inline-flex items-center gap-1 text-success-600"><span class="material-icons text-sm" aria-hidden="true">verified</span> پشتڕاستکراوە</span>
                }
                @if (biz.hasActiveDiscount) {
                  <span class="inline-flex items-center gap-1 font-bold text-emerald-600"><span class="material-icons text-sm" aria-hidden="true">local_offer</span> {{ biz.discountPercentage }}% داشکاندن</span>
                }
                @if (biz.phone) {
                  <span dir="ltr">{{ biz.phone }}</span>
                }
              </div>
              <div class="flex gap-1 pt-1">
                @if (!biz.isVerified && biz.status === BusinessStatus.Pending) {
                  <button type="button" (click)="openVerifyConfirm(biz)" class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-success-600 hover:bg-success-50 transition-colors" aria-label="پشتڕاستکردنەوە">check_circle</button>
                }
                <button type="button" (click)="openEditDialog(biz)" class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-colors" aria-label="دەستکاری">edit</button>
                <button type="button" (click)="openDeleteConfirm(biz)" class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-danger-600 hover:bg-danger-50 transition-colors" aria-label="سڕینەوە">delete</button>
              </div>
            </div>
          } @empty {
            <div class="px-5 py-16 text-center">
              <p class="text-sm font-medium text-text-secondary">هیچ بازرگانییەک نەدۆزرایەوە</p>
            </div>
          }
        </div>

        <!-- Desktop table view -->
        <div class="overflow-x-auto hidden md:block">
          <table class="w-full text-sm">
            <caption class="sr-only">لیستی بازرگانییەکان</caption>
            <thead>
              <tr class="bg-surface-alt/50">
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">وێنە</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary cursor-pointer select-none hover:text-text" (click)="toggleSort('name')" [attr.aria-sort]="sortColumn() === 'name' ? (sortDir() === 'asc' ? 'ascending' : 'descending') : null">
                  ناو
                  @if (sortColumn() === 'name') {
                    <span class="material-icons text-sm align-middle" aria-hidden="true">{{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                  }
                </th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary cursor-pointer select-none hover:text-text" (click)="toggleSort('status')" [attr.aria-sort]="sortColumn() === 'status' ? (sortDir() === 'asc' ? 'ascending' : 'descending') : null">
                  بارودۆخ
                  @if (sortColumn() === 'status') {
                    <span class="material-icons text-sm align-middle" aria-hidden="true">{{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                  }
                </th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">پشتڕاستکردنەوە</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">پیشنیارکراو</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">داشکاندن</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary cursor-pointer select-none hover:text-text" (click)="toggleSort('phone')" [attr.aria-sort]="sortColumn() === 'phone' ? (sortDir() === 'asc' ? 'ascending' : 'descending') : null">
                  تەلەفۆن
                  @if (sortColumn() === 'phone') {
                    <span class="material-icons text-sm align-middle" aria-hidden="true">{{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
                  }
                </th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">ناونیشان</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">کردارەکان</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (biz of businesses(); track biz.id) {
                <tr class="transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-900/10">
                  <td class="px-5 py-3.5">
                    @if (biz.primaryImageUrl) {
                      <img [src]="biz.primaryImageUrl" [alt]="biz.name.de"
                           class="h-10 w-10 rounded-xl object-cover shadow-sm" />
                    } @else {
                      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-400 dark:bg-primary-900/20">
                        <span class="material-icons">business</span>
                      </div>
                    }
                  </td>
                  <td class="px-5 py-3.5">
                    <p class="font-medium text-text">{{ biz.name.de }}</p>
                    <p class="text-xs text-text-secondary">{{ biz.name.ku }}</p>
                  </td>
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
                  <td class="px-5 py-3.5">
                    <button
                      type="button"
                      (click)="toggleFeatured(biz)"
                      class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors"
                      [class]="biz.isFeatured
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700'"
                      [title]="biz.isFeatured ? 'لابردنی پیشنیار' : 'پیشنیار کردن'"
                    >
                      <span class="material-icons text-base" aria-hidden="true">{{ biz.isFeatured ? 'star' : 'star_border' }}</span>
                      {{ biz.isFeatured ? 'پیشنیارکراو' : 'ئاسایی' }}
                    </button>
                  </td>
                  <td class="px-5 py-3.5">
                    @if (biz.hasActiveDiscount) {
                      <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                        <span class="material-icons text-sm" aria-hidden="true">local_offer</span>
                        {{ biz.discountPercentage }}%
                      </span>
                    } @else {
                      <span class="text-xs text-text-secondary/50">—</span>
                    }
                  </td>
                  <td class="px-5 py-3.5 text-text-secondary" dir="ltr">{{ biz.phone ?? '—' }}</td>
                  <td class="px-5 py-3.5">
                    <p class="text-text">{{ biz.street }}</p>
                    <p class="text-xs text-text-secondary">{{ biz.postalCode }}</p>
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="flex gap-1">
                      @if (!biz.isVerified && biz.status === BusinessStatus.Pending) {
                        <button
                          type="button"
                          (click)="openVerifyConfirm(biz)"
                        class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors"
                        title="پشتڕاستکردنەوە"
                        aria-label="پشتڕاستکردنەوە"
                      >check_circle</button>
                      }
                      <button
                        type="button"
                        (click)="openEditDialog(biz)"
                        class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        title="دەستکاری"
                        aria-label="دەستکاری"
                      >edit</button>
                      <button
                        type="button"
                        (click)="openDeleteConfirm(biz)"
                        class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                        title="سڕینەوە"
                        aria-label="سڕینەوە"
                      >delete</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="px-5 py-16 text-center">
                    <svg class="mx-auto mb-4 h-20 w-20 text-border" fill="none" viewBox="0 0 80 80" aria-hidden="true">
                      <rect x="10" y="18" width="60" height="44" rx="6" stroke="currentColor" stroke-width="2" fill="none"/>
                      <path d="M10 30h60M30 30v32" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
                      <circle cx="20" cy="42" r="4" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
                      <rect x="36" y="38" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.2"/>
                      <rect x="36" y="46" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.15"/>
                      <circle cx="20" cy="54" r="4" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
                      <rect x="36" y="50" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.2"/>
                    </svg>
                    <p class="text-sm font-medium text-text-secondary">هیچ بازرگانییەک نەدۆزرایەوە</p>
                    <p class="mt-1 text-xs text-text-secondary/60">دەتوانیت یەکێکی نوێ زیادبکەیت</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <admin-pagination
          [currentPage]="currentPage()"
          [totalPages]="totalPages()"
          [totalCount]="totalCount()"
          [hasPreviousPage]="hasPreviousPage()"
          [hasNextPage]="hasNextPage()"
          (pageChanged)="onPageChanged($event)"
        />
      </div>
    }

    <!-- Form Dialog -->
    <admin-business-form-dialog
      [open]="formOpen()"
      [businessSlug]="editSlug()"
      (closed)="formOpen.set(false)"
      (saved)="onFormSaved()"
    />

    <!-- Verify Confirm -->
    <admin-confirm-dialog
      [open]="verifyConfirmOpen()"
      title="پشتڕاستکردنی بازرگانی"
      [message]="'ئایا دڵنیایی لە پشتڕاستکردنی «' + (verifyTarget()?.name?.de ?? '') + '»؟'"
      confirmText="بەڵێ، پشتڕاستبکە"
      cancelText="پاشگەزبوونەوە"
      (confirmed)="verifyBusiness()"
      (cancelled)="verifyConfirmOpen.set(false)"
    />

    <!-- Delete Confirm -->
    <admin-confirm-dialog
      [open]="deleteConfirmOpen()"
      title="سڕینەوەی بازرگانی"
      [message]="'ئایا دڵنیایی لە سڕینەوەی «' + (deleteTarget()?.name?.de ?? '') + '»؟ ئەم کردارە ناگەڕێتەوە.'"
      confirmText="بەڵێ، بیسڕێنەوە"
      cancelText="پاشگەزبوونەوە"
      variant="danger"
      (confirmed)="deleteBusiness()"
      (cancelled)="deleteConfirmOpen.set(false)"
    />
  `,
})
export class BusinessesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly BusinessStatus = BusinessStatus;
  protected readonly getLocalized = getLocalized;
  protected readonly getStatusLabel = getStatusLabel;
  protected readonly getStatusColor = getStatusColor;

  protected readonly skeletonRows = Array(5);
  protected readonly skeletonCols = Array(9);

  protected readonly loading = signal(true);
  protected readonly businesses = signal<BusinessSummary[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly totalCount = signal(0);
  protected readonly hasPreviousPage = signal(false);
  protected readonly hasNextPage = signal(false);

  protected searchText = '';
  protected statusFilter = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // Sorting
  protected readonly sortColumn = signal<string | null>(null);
  protected readonly sortDir = signal<'asc' | 'desc'>('asc');

  protected toggleSort(col: string): void {
    if (this.sortColumn() === col) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(col);
      this.sortDir.set('asc');
    }
    this.applySort();
  }

  private applySort(): void {
    const col = this.sortColumn();
    const dir = this.sortDir();
    if (!col) return;
    const sorted = [...this.businesses()].sort((a, b) => {
      let va: unknown, vb: unknown;
      switch (col) {
        case 'name': va = a.name.de; vb = b.name.de; break;
        case 'status': va = a.status; vb = b.status; break;
        case 'phone': va = a.phone ?? ''; vb = b.phone ?? ''; break;
        default: return 0;
      }
      if (typeof va === 'string') return dir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return dir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    this.businesses.set(sorted);
  }

  // Form dialog
  protected readonly formOpen = signal(false);
  protected readonly editSlug = signal<string | null>(null);

  // Verify confirm
  protected readonly verifyConfirmOpen = signal(false);
  protected readonly verifyTarget = signal<BusinessSummary | null>(null);

  // Delete confirm
  protected readonly deleteConfirmOpen = signal(false);
  protected readonly deleteTarget = signal<BusinessSummary | null>(null);

  ngOnInit(): void {
    this.loadBusinesses();
  }

  loadBusinesses(page = 1): void {
    this.loading.set(true);
    const status = this.statusFilter ? parseInt(this.statusFilter, 10) : null;
    this.api.getBusinesses(page, 10, status, this.searchText || null).subscribe({
      next: (data) => {
        this.businesses.set(data.items);
        this.currentPage.set(data.pageNumber);
        this.totalPages.set(data.totalPages);
        this.totalCount.set(data.totalCount);
        this.hasPreviousPage.set(data.hasPreviousPage);
        this.hasNextPage.set(data.hasNextPage);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error('هەڵە لە بارکردنی داتاکان');
        this.loading.set(false);
      },
    });
  }

  onSearchChanged(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadBusinesses(), 400);
  }

  onFilterChanged(): void {
    this.loadBusinesses();
  }

  onPageChanged(page: number): void {
    this.loadBusinesses(page);
  }

  openCreateDialog(): void {
    this.editSlug.set(null);
    this.formOpen.set(true);
  }

  openEditDialog(biz: BusinessSummary): void {
    this.editSlug.set(biz.slug);
    this.formOpen.set(true);
  }

  onFormSaved(): void {
    this.formOpen.set(false);
    this.loadBusinesses(this.currentPage());
  }

  openVerifyConfirm(biz: BusinessSummary): void {
    this.verifyTarget.set(biz);
    this.verifyConfirmOpen.set(true);
  }

  verifyBusiness(): void {
    const biz = this.verifyTarget();
    if (!biz) return;
    this.api.verifyBusiness(biz.id).subscribe({
      next: () => {
        this.notifications.success('بازرگانی بە سەرکەوتوویی پشتڕاستکرا');
        this.verifyConfirmOpen.set(false);
        this.loadBusinesses(this.currentPage());
      },
      error: () => this.notifications.error('هەڵە لە پشتڕاستکردنی بازرگانی'),
    });
  }

  openDeleteConfirm(biz: BusinessSummary): void {
    this.deleteTarget.set(biz);
    this.deleteConfirmOpen.set(true);
  }

  toggleFeatured(biz: BusinessSummary): void {
    this.api.toggleFeatured(biz.id).subscribe({
      next: () => {
        const label = biz.isFeatured ? 'لابرا لە پیشنیارەکان' : 'وەک پیشنیار دیاریکرا';
        this.notifications.success(label);
        this.loadBusinesses(this.currentPage());
      },
      error: () => this.notifications.error('هەڵە لە گۆڕینی پیشنیار'),
    });
  }

  deleteBusiness(): void {
    const biz = this.deleteTarget();
    if (!biz) return;
    this.api.deleteBusiness(biz.id).subscribe({
      next: () => {
        this.notifications.success('بازرگانی بە سەرکەوتوویی سڕایەوە');
        this.deleteConfirmOpen.set(false);
        this.loadBusinesses(this.currentPage());
      },
      error: () => this.notifications.error('هەڵە لە سڕینەوەی بازرگانی'),
    });
  }

  exportCsv(): void {
    const rows = this.businesses();
    if (!rows.length) return;

    const headers = ['Name (DE)', 'Name (KU)', 'Slug', 'Status', 'Verified', 'Phone', 'Street', 'PostalCode'];
    const csvRows = rows.map(b =>
      [b.name.de, b.name.ku, b.slug, this.getStatusLabel(b.status), b.isVerified ? 'Yes' : 'No', b.phone ?? '', b.street ?? '', b.postalCode ?? '']
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );

    const csv = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `businesses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
