import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, NotificationService } from '../../core/services';
import type { City } from '../../core/models';
import {
  ButtonComponent,
  ModalComponent,
  InputComponent,
  ConfirmDialogComponent,
  LoadingComponent,
} from '../../shared/components';

@Component({
  selector: 'admin-cities',
  imports: [FormsModule, ButtonComponent, ModalComponent, InputComponent, ConfirmDialogComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-text">شارەکان</h1>
        <p class="mt-1 text-sm text-text-secondary">بەڕێوەبردنی شارەکانی پرۆژەکە</p>
      </div>
      <admin-button (clicked)="openCreateDialog()">
        <span class="material-icons me-1 text-base align-middle">add</span>
        زیادکردنی شار
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
                  <td class="px-5 py-3.5"><div class="h-3 w-24 rounded bg-border/50"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-20 rounded bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-16 rounded bg-border/30"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-14 rounded bg-border/40"></div></td>
                  <td class="px-5 py-3.5"><div class="h-3 w-14 rounded bg-border/40"></div></td>
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
          @for (city of cities(); track city.id; let i = $index) {
            <div class="p-4 space-y-2">
              <div class="flex items-center gap-3">
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-text truncate">{{ city.nameDe }}</p>
                  <p class="text-xs text-text-secondary truncate">{{ city.nameKu }}</p>
                </div>
              </div>
              <div class="text-xs text-text-secondary" dir="ltr">{{ city.latitude }}, {{ city.longitude }}</div>
              <div class="flex gap-1 pt-1">
                <button type="button" (click)="openEditDialog(city)" class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-colors" aria-label="دەستکاری">edit</button>
                <button type="button" (click)="openDeleteConfirm(city)" class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-danger-600 hover:bg-danger-50 transition-colors" aria-label="سڕینەوە">delete</button>
              </div>
            </div>
          } @empty {
            <div class="px-5 py-16 text-center">
              <p class="text-sm font-medium text-text-secondary">هیچ شارێک نەدۆزرایەوە</p>
            </div>
          }
        </div>

        <!-- Desktop table view -->
        <div class="overflow-x-auto hidden md:block">
          <table class="w-full text-sm">
            <caption class="sr-only">لیستی شارەکان</caption>
            <thead>
              <tr class="bg-surface-alt/50">
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">#</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">ناو (ئەڵمانی)</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">ناو (کوردی)</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">Slug</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">پانی جوغرافی</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">درێژی جوغرافی</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">کردارەکان</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (city of cities(); track city.id; let i = $index) {
                <tr class="transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-900/10">
                  <td class="px-5 py-3.5 text-text-secondary">{{ i + 1 }}</td>
                  <td class="px-5 py-3.5 font-medium text-text">{{ city.nameDe }}</td>
                  <td class="px-5 py-3.5 text-text">{{ city.nameKu }}</td>
                  <td class="px-5 py-3.5 font-mono text-xs text-text-secondary" dir="ltr">{{ city.slug }}</td>
                  <td class="px-5 py-3.5 font-mono text-xs text-text-secondary" dir="ltr">{{ city.latitude }}</td>
                  <td class="px-5 py-3.5 font-mono text-xs text-text-secondary" dir="ltr">{{ city.longitude }}</td>
                  <td class="px-5 py-3.5">
                    <div class="flex gap-1">
                      <button
                        type="button"
                        (click)="openEditDialog(city)"
                        class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        title="دەستکاری"
                        aria-label="دەستکاری"
                      >edit</button>
                      <button
                        type="button"
                        (click)="openDeleteConfirm(city)"
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
                      <rect x="15" y="30" width="14" height="30" rx="2" stroke="currentColor" stroke-width="2" opacity="0.5"/>
                      <rect x="33" y="18" width="14" height="42" rx="2" stroke="currentColor" stroke-width="2" opacity="0.4"/>
                      <rect x="51" y="24" width="14" height="36" rx="2" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                      <line x1="8" y1="60" x2="72" y2="60" stroke="currentColor" stroke-width="2" opacity="0.5"/>
                    </svg>
                    <p class="text-sm font-medium text-text-secondary">هیچ شارێک نەدۆزرایەوە</p>
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
    <admin-modal [open]="formOpen()" [title]="isEdit() ? 'دەستکاریکردنی شار' : 'زیادکردنی شار'" size="md" (closed)="formOpen.set(false)">
      <form (ngSubmit)="handleSubmit()" #cityForm="ngForm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <admin-input label="ناو (کوردی)" [required]="true" [(ngModel)]="formData.nameKu" name="nameKu" />
          <admin-input label="ناو (کورمانجی)" [(ngModel)]="formData.nameKmr" name="nameKmr" />
          <admin-input label="ناو (ئەڵمانی)" [required]="true" [(ngModel)]="formData.nameDe" name="nameDe" />
          <admin-input label="ناو (ئینگلیزی)" [(ngModel)]="formData.nameEn" name="nameEn" />
          @if (!isEdit()) {
            <admin-input label="Slug" [required]="true" [(ngModel)]="formData.slug" name="slug" dir="ltr" />
          }
          <admin-input label="پانی جوغرافی" type="number" [(ngModel)]="formData.latitude" name="lat" />
          <admin-input label="درێژی جوغرافی" type="number" [(ngModel)]="formData.longitude" name="lng" />
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
      title="سڕینەوەی شار"
      [message]="'ئایا دڵنیایی لە سڕینەوەی «' + (deleteTarget()?.nameDe ?? '') + '»؟'"
      confirmText="بەڵێ، بیسڕێنەوە"
      cancelText="پاشگەزبوونەوە"
      variant="danger"
      (confirmed)="deleteCity()"
      (cancelled)="deleteConfirmOpen.set(false)"
    />
  `,
})
export class CitiesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly notifications = inject(NotificationService);

  readonly skeletonRows = Array(4);
  readonly skeletonCols = Array(7);

  readonly loading = signal(true);
  readonly cities = signal<City[]>([]);
  readonly formOpen = signal(false);
  readonly isEdit = signal(false);
  readonly saving = signal(false);

  readonly deleteConfirmOpen = signal(false);
  readonly deleteTarget = signal<City | null>(null);

  private editId: string | null = null;

  formData = {
    nameKu: '',
    nameKmr: '',
    nameDe: '',
    nameEn: '',
    slug: '',
    latitude: '0',
    longitude: '0',
  };

  ngOnInit(): void {
    this.loadCities();
  }

  loadCities(): void {
    this.loading.set(true);
    this.api.getCities().subscribe({
      next: (data) => {
        this.cities.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error('هەڵە لە بارکردنی شارەکان');
        this.loading.set(false);
      },
    });
  }

  openCreateDialog(): void {
    this.isEdit.set(false);
    this.editId = null;
    this.formData = { nameKu: '', nameKmr: '', nameDe: '', nameEn: '', slug: '', latitude: '0', longitude: '0' };
    this.formOpen.set(true);
  }

  openEditDialog(city: City): void {
    this.isEdit.set(true);
    this.editId = city.id;
    this.formData = {
      nameKu: city.nameKu,
      nameKmr: city.nameKmr ?? '',
      nameDe: city.nameDe,
      nameEn: city.nameEn ?? '',
      slug: city.slug,
      latitude: String(city.latitude),
      longitude: String(city.longitude),
    };
    this.formOpen.set(true);
  }

  handleSubmit(): void {
    if (!this.formData.nameKu || !this.formData.nameDe) {
      this.notifications.warning('تکایە خانە پێویستەکان پڕبکەرەوە');
      return;
    }

    if (!this.isEdit() && !this.formData.slug) {
      this.notifications.warning('تکایە Slug پڕبکەرەوە');
      return;
    }

    this.saving.set(true);

    const name = {
      ku: this.formData.nameKu,
      kmr: this.formData.nameKmr || null,
      de: this.formData.nameDe,
      en: this.formData.nameEn || null,
    };

    const lat = parseFloat(this.formData.latitude) || 0;
    const lng = parseFloat(this.formData.longitude) || 0;

    const request$ = this.isEdit() && this.editId
      ? this.api.updateCity(this.editId, { id: this.editId, name, latitude: lat, longitude: lng })
      : this.api.createCity({ name, slug: this.formData.slug, latitude: lat, longitude: lng });

    request$.subscribe({
      next: () => {
        this.notifications.success(this.isEdit() ? 'شار نوێکرایەوە' : 'شار زیادکرا');
        this.saving.set(false);
        this.formOpen.set(false);
        this.loadCities();
      },
      error: () => {
        this.notifications.error('هەڵە لە پاشەکەوتکردن');
        this.saving.set(false);
      },
    });
  }

  openDeleteConfirm(city: City): void {
    this.deleteTarget.set(city);
    this.deleteConfirmOpen.set(true);
  }

  deleteCity(): void {
    const city = this.deleteTarget();
    if (!city) return;
    this.api.deleteCity(city.id).subscribe({
      next: () => {
        this.notifications.success('شار بە سەرکەوتوویی سڕایەوە');
        this.deleteConfirmOpen.set(false);
        this.loadCities();
      },
      error: () => this.notifications.error('هەڵە لە سڕینەوەی شار'),
    });
  }
}
