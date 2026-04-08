import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService, NotificationService } from '../../core/services';
import type { Advertisement } from '../../core/models';
import {
  ButtonComponent,
  ModalComponent,
  InputComponent,
  ConfirmDialogComponent,
  LoadingComponent,
} from '../../shared/components';

@Component({
  selector: 'admin-advertisements',
  imports: [FormsModule, DatePipe, ButtonComponent, ModalComponent, InputComponent, ConfirmDialogComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-text">ڕیکلام</h1>
        <p class="mt-1 text-sm text-text-secondary">بەڕێوەبردنی ڕیکلامەکان (Werbung / Reklame)</p>
      </div>
      <admin-button (clicked)="openCreateDialog()">
        <span class="material-icons me-1 text-base align-middle">add</span>
        زیادکردنی ڕیکلام
      </admin-button>
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
                  <td class="px-5 py-3.5"><div class="h-10 w-16 rounded-lg bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-24 rounded bg-border/50"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-20 rounded bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-20 rounded bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-20 rounded bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="h-5 w-14 rounded-full bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="flex gap-1"><div class="h-7 w-7 rounded-lg bg-border/40"></div><div class="h-7 w-7 rounded-lg bg-border/40"></div><div class="h-7 w-7 rounded-lg bg-border/40"></div></div></td>
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
          @for (ad of advertisements(); track ad.id) {
            <div class="p-4 space-y-2">
              <div class="flex items-start gap-3">
                @if (ad.imageUrl) {
                  <img [src]="ad.imageUrl" [alt]="ad.titleDe" class="h-12 w-20 rounded-lg object-cover shrink-0" />
                }
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-text truncate">{{ ad.titleDe }}</p>
                  <p class="text-xs text-text-secondary truncate">{{ ad.titleKu }}</p>
                </div>
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0"
                      [class]="ad.isActive ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'">
                  {{ ad.isActive ? 'چالاک' : 'ناچالاک' }}
                </span>
              </div>
              <p class="text-xs text-text-secondary" dir="ltr">{{ ad.startDate | date:'yyyy-MM-dd' }} → {{ ad.endDate | date:'yyyy-MM-dd' }}</p>
              <div class="flex gap-1 pt-1">
                <button type="button" (click)="toggleAd(ad)" class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center transition-colors" [class]="ad.isActive ? 'text-warning-600 hover:bg-warning-50' : 'text-success-600 hover:bg-success-50'" [attr.aria-label]="ad.isActive ? 'ناچالاککردن' : 'چالاککردن'">{{ ad.isActive ? 'pause_circle' : 'play_circle' }}</button>
                <button type="button" (click)="openEditDialog(ad)" class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-colors" aria-label="دەستکاری">edit</button>
                <button type="button" (click)="openDeleteConfirm(ad)" class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-danger-600 hover:bg-danger-50 transition-colors" aria-label="سڕینەوە">delete</button>
              </div>
            </div>
          } @empty {
            <div class="px-5 py-16 text-center">
              <p class="text-sm font-medium text-text-secondary">هیچ ڕیکلامێک نەدۆزرایەوە</p>
            </div>
          }
        </div>

        <!-- Desktop table view -->
        <div class="overflow-x-auto hidden md:block">
          <table class="w-full text-sm">
            <caption class="sr-only">لیستی ڕیکلامەکان</caption>
            <thead>
              <tr class="bg-surface-alt/50">
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">#</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">وێنە</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">ناونیشان (ئەڵمانی)</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">ناونیشان (کوردی)</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">دەستپێکردن</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">کۆتایی</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">بارودۆخ</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">کردارەکان</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (ad of advertisements(); track ad.id; let i = $index) {
                <tr class="transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-900/10">
                  <td class="px-5 py-3.5 text-text-secondary">{{ i + 1 }}</td>
                  <td class="px-5 py-3.5">
                    @if (ad.imageUrl) {
                      <img [src]="ad.imageUrl" [alt]="ad.titleDe" class="h-10 w-16 rounded-lg object-cover" />
                    } @else {
                      <span class="material-icons text-2xl text-text-secondary">image</span>
                    }
                  </td>
                  <td class="px-5 py-3.5 font-medium text-text">{{ ad.titleDe }}</td>
                  <td class="px-5 py-3.5 text-text">{{ ad.titleKu }}</td>
                  <td class="px-5 py-3.5 text-text-secondary" dir="ltr">{{ ad.startDate | date:'yyyy-MM-dd' }}</td>
                  <td class="px-5 py-3.5 text-text-secondary" dir="ltr">{{ ad.endDate | date:'yyyy-MM-dd' }}</td>
                  <td class="px-5 py-3.5">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      [class]="ad.isActive
                        ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                        : 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300'"
                    >
                      {{ ad.isActive ? 'چالاک' : 'ناچالاک' }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="flex gap-1">
                      <button
                        type="button"
                        (click)="toggleAd(ad)"
                        class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center transition-colors"
                        [class]="ad.isActive
                          ? 'text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20'
                          : 'text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20'"
                        [title]="ad.isActive ? 'ناچالاککردن' : 'چالاککردن'"
                        [attr.aria-label]="ad.isActive ? 'ناچالاککردن' : 'چالاککردن'"
                      >{{ ad.isActive ? 'pause_circle' : 'play_circle' }}</button>
                      <button
                        type="button"
                        (click)="openEditDialog(ad)"
                        class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        title="دەستکاری"
                        aria-label="دەستکاری"
                      >edit</button>
                      <button
                        type="button"
                        (click)="openDeleteConfirm(ad)"
                        class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                        title="سڕینەوە"
                        aria-label="سڕینەوە"
                      >delete</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="px-5 py-16 text-center">
                    <svg class="mx-auto mb-4 h-20 w-20 text-border" fill="none" viewBox="0 0 80 80" aria-hidden="true">
                      <rect x="10" y="20" width="60" height="35" rx="4" stroke="currentColor" stroke-width="2" opacity="0.4"/>
                      <circle cx="30" cy="37" r="8" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
                      <path d="M45 30h18M45 37h12M45 44h15" stroke="currentColor" stroke-width="1.5" opacity="0.25"/>
                      <path d="M24 60l8-10 6 4 12-14 14 10" stroke="currentColor" stroke-width="1.5" opacity="0.3" fill="none"/>
                    </svg>
                    <p class="text-sm font-medium text-text-secondary">هیچ ڕیکلامێک نەدۆزرایەوە</p>
                    <p class="mt-1 text-xs text-text-secondary/60">دەتوانیت یەکێکی نوێ زیادبکەیت</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Form Dialog -->
    <admin-modal [open]="formOpen()" [title]="isEdit() ? 'دەستکاریکردنی ڕیکلام' : 'زیادکردنی ڕیکلام'" size="lg" (closed)="formOpen.set(false)">
      <form (ngSubmit)="handleSubmit()" #adForm="ngForm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <admin-input label="ناونیشان (کوردی)" [required]="true" [(ngModel)]="formData.titleKu" name="titleKu" />
          <admin-input label="ناونیشان (کورمانجی)" [(ngModel)]="formData.titleKmr" name="titleKmr" />
          <admin-input label="ناونیشان (ئەڵمانی)" [required]="true" [(ngModel)]="formData.titleDe" name="titleDe" />
          <admin-input label="ناونیشان (ئینگلیزی)" [(ngModel)]="formData.titleEn" name="titleEn" />
          <admin-input label="وەسف (کوردی)" type="textarea" [(ngModel)]="formData.descriptionKu" name="descriptionKu" />
          <admin-input label="وەسف (ئەڵمانی)" type="textarea" [(ngModel)]="formData.descriptionDe" name="descriptionDe" />
          <admin-input label="لینکی وێنە (URL)" [required]="true" [(ngModel)]="formData.imageUrl" name="imageUrl" placeholder="https://..." />
          <admin-input label="لینکی تارگێت (URL)" [(ngModel)]="formData.linkUrl" name="linkUrl" placeholder="https://..." />
          <admin-input label="بەرواری دەستپێکردن" type="text" [required]="true" [(ngModel)]="formData.startDate" name="startDate" placeholder="2025-01-01" />
          <admin-input label="بەرواری کۆتایی" type="text" [required]="true" [(ngModel)]="formData.endDate" name="endDate" placeholder="2025-12-31" />
          <admin-input label="ریزبەندی" type="number" [(ngModel)]="formData.sortOrder" name="sortOrder" />
        </div>
      </form>
      <div modal-footer class="flex justify-end gap-3 border-t border-border px-6 py-4">
        <admin-button variant="secondary" (clicked)="formOpen.set(false)">پاشگەزبوونەوە</admin-button>
        <admin-button [loading]="saving()" (clicked)="handleSubmit()">
          {{ isEdit() ? 'نوێکردنەوە' : 'زیادکردن' }}
        </admin-button>
      </div>
    </admin-modal>

    <!-- Delete Confirm -->
    <admin-confirm-dialog
      [open]="deleteConfirmOpen()"
      title="سڕینەوەی ڕیکلام"
      [message]="'ئایا دڵنیایی لە سڕینەوەی «' + (deleteTarget()?.titleDe ?? '') + '»؟'"
      confirmText="بەڵێ، بیسڕێنەوە"
      cancelText="پاشگەزبوونەوە"
      variant="danger"
      (confirmed)="deleteAd()"
      (cancelled)="deleteConfirmOpen.set(false)"
    />
  `,
})
export class AdvertisementsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notifications = inject(NotificationService);

  readonly skeletonRows = Array(4);
  readonly skeletonCols = Array(8);

  readonly loading = signal(true);
  readonly advertisements = signal<Advertisement[]>([]);
  readonly formOpen = signal(false);
  readonly isEdit = signal(false);
  readonly saving = signal(false);

  readonly deleteConfirmOpen = signal(false);
  readonly deleteTarget = signal<Advertisement | null>(null);

  private editId: string | null = null;

  formData = {
    titleKu: '',
    titleKmr: '',
    titleDe: '',
    titleEn: '',
    descriptionKu: '',
    descriptionDe: '',
    imageUrl: '',
    linkUrl: '',
    startDate: '',
    endDate: '',
    sortOrder: '0',
  };

  ngOnInit(): void {
    this.loadAdvertisements();
  }

  loadAdvertisements(): void {
    this.loading.set(true);
    this.api.getAdvertisements().subscribe({
      next: (data) => {
        this.advertisements.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error('هەڵە لە بارکردنی ڕیکلامەکان');
        this.loading.set(false);
      },
    });
  }

  openCreateDialog(): void {
    this.isEdit.set(false);
    this.editId = null;
    this.formData = {
      titleKu: '', titleKmr: '', titleDe: '', titleEn: '',
      descriptionKu: '', descriptionDe: '',
      imageUrl: '', linkUrl: '',
      startDate: '', endDate: '', sortOrder: '0',
    };
    this.formOpen.set(true);
  }

  openEditDialog(ad: Advertisement): void {
    this.isEdit.set(true);
    this.editId = ad.id;
    this.formData = {
      titleKu: ad.titleKu,
      titleKmr: ad.titleKmr ?? '',
      titleDe: ad.titleDe,
      titleEn: ad.titleEn ?? '',
      descriptionKu: ad.descriptionKu ?? '',
      descriptionDe: ad.descriptionDe ?? '',
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl ?? '',
      startDate: ad.startDate?.substring(0, 10) ?? '',
      endDate: ad.endDate?.substring(0, 10) ?? '',
      sortOrder: String(ad.sortOrder),
    };
    this.formOpen.set(true);
  }

  handleSubmit(): void {
    if (!this.formData.titleKu || !this.formData.titleDe || !this.formData.imageUrl || !this.formData.startDate || !this.formData.endDate) {
      this.notifications.warning('تکایە خانە پێویستەکان پڕبکەرەوە');
      return;
    }

    this.saving.set(true);
    const payload = {
      title: {
        ku: this.formData.titleKu,
        kmr: this.formData.titleKmr || null,
        de: this.formData.titleDe,
        en: this.formData.titleEn || null,
      },
      description: this.formData.descriptionKu || this.formData.descriptionDe
        ? {
            ku: this.formData.descriptionKu || '',
            de: this.formData.descriptionDe || '',
            kmr: null,
            en: null,
          }
        : null,
      imageUrl: this.formData.imageUrl,
      linkUrl: this.formData.linkUrl || null,
      businessId: null,
      startDate: this.formData.startDate,
      endDate: this.formData.endDate,
      sortOrder: parseInt(this.formData.sortOrder, 10) || 0,
    };

    const request$ = this.isEdit() && this.editId
      ? this.api.updateAdvertisement(this.editId, { ...payload, id: this.editId } as unknown as typeof payload & { id: string })
      : this.api.createAdvertisement(payload);

    request$.subscribe({
      next: () => {
        this.notifications.success(this.isEdit() ? 'ڕیکلام نوێکرایەوە' : 'ڕیکلام زیادکرا');
        this.saving.set(false);
        this.formOpen.set(false);
        this.loadAdvertisements();
      },
      error: () => {
        this.notifications.error('هەڵە لە پاشەکەوتکردن');
        this.saving.set(false);
      },
    });
  }

  toggleAd(ad: Advertisement): void {
    this.api.toggleAdvertisement(ad.id, !ad.isActive).subscribe({
      next: () => {
        this.notifications.success(ad.isActive ? 'ڕیکلام ناچالاککرا' : 'ڕیکلام چالاککرا');
        this.loadAdvertisements();
      },
      error: () => this.notifications.error('هەڵە لە گۆڕینی بارودۆخ'),
    });
  }

  openDeleteConfirm(ad: Advertisement): void {
    this.deleteTarget.set(ad);
    this.deleteConfirmOpen.set(true);
  }

  deleteAd(): void {
    const ad = this.deleteTarget();
    if (!ad) return;
    this.api.deleteAdvertisement(ad.id).subscribe({
      next: () => {
        this.notifications.success('ڕیکلام بە سەرکەوتوویی سڕایەوە');
        this.deleteConfirmOpen.set(false);
        this.loadAdvertisements();
      },
      error: () => this.notifications.error('هەڵە لە سڕینەوەی ڕیکلام'),
    });
  }
}
