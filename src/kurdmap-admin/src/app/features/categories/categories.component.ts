import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, NotificationService } from '../../core/services';
import type { Category } from '../../core/models';
import {
  ButtonComponent,
  ModalComponent,
  InputComponent,
  ConfirmDialogComponent,
  LoadingComponent,
} from '../../shared/components';

@Component({
  selector: 'admin-categories',
  imports: [FormsModule, ButtonComponent, ModalComponent, InputComponent, ConfirmDialogComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-text">پۆلەکان</h1>
        <p class="mt-1 text-sm text-text-secondary">بەڕێوەبردنی پۆلەکانی بازرگانییەکان</p>
      </div>
      <admin-button (clicked)="openCreateDialog()">
        <span class="material-icons me-1 text-base align-middle">add</span>
        زیادکردنی پۆل
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
                  <td class="px-5 py-3.5"><div class="h-5 w-5 rounded bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-24 rounded bg-border/50"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-20 rounded bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-20 rounded bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-16 rounded bg-border/30"></div></td>
                  <td class="px-5 py-3.5"><div class="h-5 w-5 rounded bg-border/40"></div></td>
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
          @for (cat of categories(); track cat.id; let i = $index) {
            <div class="p-4 space-y-2">
              <div class="flex items-center gap-3">
                <span class="text-lg">{{ cat.icon ?? '' }}</span>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-text truncate">{{ cat.nameDe }}</p>
                  <p class="text-xs text-text-secondary truncate">{{ cat.nameKu }}</p>
                </div>
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-surface-alt text-xs font-medium text-text-secondary">{{ cat.sortOrder }}</span>
              </div>
              <div class="flex gap-1 pt-1">
                <button type="button" (click)="openEditDialog(cat)" class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-colors" aria-label="دەستکاری">edit</button>
                <button type="button" (click)="openDeleteConfirm(cat)" class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-danger-600 hover:bg-danger-50 transition-colors" aria-label="سڕینەوە">delete</button>
              </div>
            </div>
          } @empty {
            <div class="px-5 py-16 text-center">
              <p class="text-sm font-medium text-text-secondary">هیچ پۆلێک نەدۆزرایەوە</p>
            </div>
          }
        </div>

        <!-- Desktop table view -->
        <div class="overflow-x-auto hidden md:block">
          <table class="w-full text-sm">
            <caption class="sr-only">لیستی پۆلەکان</caption>
            <thead>
              <tr class="bg-surface-alt/50">
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">#</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">آیکۆن</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">ناو (ئەڵمانی)</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">ناو (کوردی)</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">ناو (ئینگلیزی)</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">Slug</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">ریزبەندی</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">کردارەکان</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (cat of categories(); track cat.id; let i = $index) {
                <tr class="transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-900/10">
                  <td class="px-5 py-3.5 text-text-secondary">{{ i + 1 }}</td>
                  <td class="px-5 py-3.5 text-lg">{{ cat.icon ?? '' }}</td>
                  <td class="px-5 py-3.5 font-medium text-text">{{ cat.nameDe }}</td>
                  <td class="px-5 py-3.5 text-text">{{ cat.nameKu }}</td>
                  <td class="px-5 py-3.5 text-text-secondary">{{ cat.nameEn ?? '—' }}</td>
                  <td class="px-5 py-3.5 font-mono text-xs text-text-secondary" dir="ltr">{{ cat.slug }}</td>
                  <td class="px-5 py-3.5">
                    <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-surface-alt text-xs font-medium text-text-secondary">{{ cat.sortOrder }}</span>
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="flex gap-1">
                      <button
                        type="button"
                        (click)="openEditDialog(cat)"
                        class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        title="دەستکاری"
                        aria-label="دەستکاری"
                      >edit</button>
                      <button
                        type="button"
                        (click)="openDeleteConfirm(cat)"
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
                      <rect x="12" y="12" width="22" height="22" rx="4" stroke="currentColor" stroke-width="2" opacity="0.5"/>
                      <rect x="46" y="12" width="22" height="22" rx="4" stroke="currentColor" stroke-width="2" opacity="0.4"/>
                      <rect x="12" y="46" width="22" height="22" rx="4" stroke="currentColor" stroke-width="2" opacity="0.4"/>
                      <rect x="46" y="46" width="22" height="22" rx="4" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                    </svg>
                    <p class="text-sm font-medium text-text-secondary">هیچ پۆلێک نەدۆزرایەوە</p>
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
    <admin-modal [open]="formOpen()" [title]="isEdit() ? 'دەستکاریکردنی پۆل' : 'زیادکردنی پۆل'" size="md" (closed)="formOpen.set(false)">
      <form (ngSubmit)="handleSubmit()" #catForm="ngForm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <admin-input label="ناو (کوردی)" [required]="true" [(ngModel)]="formData.nameKu" name="nameKu" />
          <admin-input label="ناو (کورمانجی)" [(ngModel)]="formData.nameKmr" name="nameKmr" />
          <admin-input label="ناو (ئەڵمانی)" [required]="true" [(ngModel)]="formData.nameDe" name="nameDe" />
          <admin-input label="ناو (ئینگلیزی)" [(ngModel)]="formData.nameEn" name="nameEn" />
          <admin-input label="آیکۆن" [(ngModel)]="formData.icon" name="icon" />
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
      title="سڕینەوەی پۆل"
      [message]="'ئایا دڵنیایی لە سڕینەوەی «' + (deleteTarget()?.nameDe ?? '') + '»؟'"
      confirmText="بەڵێ، بیسڕێنەوە"
      cancelText="پاشگەزبوونەوە"
      variant="danger"
      (confirmed)="deleteCategory()"
      (cancelled)="deleteConfirmOpen.set(false)"
    />
  `,
})
export class CategoriesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notifications = inject(NotificationService);

  readonly skeletonRows = Array(5);
  readonly skeletonCols = Array(8);

  readonly loading = signal(true);
  readonly categories = signal<Category[]>([]);
  readonly formOpen = signal(false);
  readonly isEdit = signal(false);
  readonly saving = signal(false);

  readonly deleteConfirmOpen = signal(false);
  readonly deleteTarget = signal<Category | null>(null);

  private editId: string | null = null;

  formData = {
    nameKu: '',
    nameKmr: '',
    nameDe: '',
    nameEn: '',
    icon: '',
    sortOrder: '0',
  };

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.api.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error('هەڵە لە بارکردنی پۆلەکان');
        this.loading.set(false);
      },
    });
  }

  openCreateDialog(): void {
    this.isEdit.set(false);
    this.editId = null;
    this.formData = { nameKu: '', nameKmr: '', nameDe: '', nameEn: '', icon: '', sortOrder: '0' };
    this.formOpen.set(true);
  }

  openEditDialog(cat: Category): void {
    this.isEdit.set(true);
    this.editId = cat.id;
    this.formData = {
      nameKu: cat.nameKu,
      nameKmr: cat.nameKmr ?? '',
      nameDe: cat.nameDe,
      nameEn: cat.nameEn ?? '',
      icon: cat.icon ?? '',
      sortOrder: String(cat.sortOrder),
    };
    this.formOpen.set(true);
  }

  handleSubmit(): void {
    if (!this.formData.nameKu || !this.formData.nameDe) {
      this.notifications.warning('تکایە خانە پێویستەکان پڕبکەرەوە');
      return;
    }

    this.saving.set(true);
    const payload = {
      name: {
        ku: this.formData.nameKu,
        kmr: this.formData.nameKmr || null,
        de: this.formData.nameDe,
        en: this.formData.nameEn || null,
      },
      icon: this.formData.icon || null,
      sortOrder: parseInt(this.formData.sortOrder, 10) || 0,
    };

    const request$ = this.isEdit() && this.editId
      ? this.api.updateCategory(this.editId, payload)
      : this.api.createCategory(payload);

    request$.subscribe({
      next: () => {
        this.notifications.success(this.isEdit() ? 'پۆل نوێکرایەوە' : 'پۆل زیادکرا');
        this.saving.set(false);
        this.formOpen.set(false);
        this.loadCategories();
      },
      error: () => {
        this.notifications.error('هەڵە لە پاشەکەوتکردن');
        this.saving.set(false);
      },
    });
  }

  openDeleteConfirm(cat: Category): void {
    this.deleteTarget.set(cat);
    this.deleteConfirmOpen.set(true);
  }

  deleteCategory(): void {
    const cat = this.deleteTarget();
    if (!cat) return;
    this.api.deleteCategory(cat.id).subscribe({
      next: () => {
        this.notifications.success('پۆل بە سەرکەوتوویی سڕایەوە');
        this.deleteConfirmOpen.set(false);
        this.loadCategories();
      },
      error: () => this.notifications.error('هەڵە لە سڕینەوەی پۆل'),
    });
  }
}
