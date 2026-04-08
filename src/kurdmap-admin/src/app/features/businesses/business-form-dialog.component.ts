import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, NotificationService } from '../../core/services';
import type { BusinessDetail, Category, City, BusinessPayload, MenuItem, BusinessService, MenuItemPayload, BusinessServicePayload, DiscountPayload } from '../../core/models';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

interface DayScheduleForm {
  open: string;
  close: string;
  closed: boolean;
}

interface BusinessForm {
  nameKu: string;
  nameKmr: string;
  nameDe: string;
  nameEn: string;
  descriptionKu: string;
  descriptionKmr: string;
  descriptionDe: string;
  descriptionEn: string;
  categoryId: string;
  cityId: string;
  street: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  website: string;
  monday: DayScheduleForm;
  tuesday: DayScheduleForm;
  wednesday: DayScheduleForm;
  thursday: DayScheduleForm;
  friday: DayScheduleForm;
  saturday: DayScheduleForm;
  sunday: DayScheduleForm;
}

@Component({
  selector: 'admin-business-form-dialog',
  imports: [FormsModule, ModalComponent, InputComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <admin-modal [open]="open()" [title]="businessSlug() ? 'دەستکاریکردنی بازرگانی' : 'زیادکردنی بازرگانی'" size="xl" (closed)="closed.emit()">
      @if (formLoading()) {
        <div class="flex items-center justify-center py-12">
          <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      } @else {
        <!-- Tabs -->
        <div class="mb-4 flex gap-1 overflow-x-auto border-b border-border">
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              (click)="activeTab.set(tab.id)"
              class="flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors"
              [class.border-primary-600]="activeTab() === tab.id"
              [class.text-primary-600]="activeTab() === tab.id"
              [class.border-transparent]="activeTab() !== tab.id"
              [class.text-text-secondary]="activeTab() !== tab.id"
              [class.hover:text-text]="activeTab() !== tab.id"
            >
              <span class="material-icons text-base">{{ tab.icon }}</span>
              {{ tab.label }}
            </button>
          }
        </div>

        <form (ngSubmit)="handleSubmit()" #bizForm="ngForm">
          <!-- Tab 1: Basic Info -->
          @if (activeTab() === 'info') {
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <admin-input label="ناو (ئەڵمانی)" [required]="true" [(ngModel)]="form.nameDe" name="nameDe" />
              <admin-input label="ناو (کوردی)" [required]="true" [(ngModel)]="form.nameKu" name="nameKu" />
              <admin-input label="ناو (ئینگلیزی)" [(ngModel)]="form.nameEn" name="nameEn" />
              <admin-input label="ناو (کورمانجی)" [(ngModel)]="form.nameKmr" name="nameKmr" />
              <admin-input label="وەسف (ئەڵمانی)" type="textarea" [required]="true" [(ngModel)]="form.descriptionDe" name="descDe" />
              <admin-input label="وەسف (کوردی)" type="textarea" [required]="true" [(ngModel)]="form.descriptionKu" name="descKu" />
              <admin-input label="وەسف (ئینگلیزی)" type="textarea" [(ngModel)]="form.descriptionEn" name="descEn" />
              <admin-input label="وەسف (کورمانجی)" type="textarea" [(ngModel)]="form.descriptionKmr" name="descKmr" />
            </div>
          }

          <!-- Tab 2: Location -->
          @if (activeTab() === 'location') {
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label for="categoryId" class="mb-1 block text-sm font-medium text-text">پۆل <span class="text-danger-500">*</span></label>
                <select
                  id="categoryId"
                  class="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                  [(ngModel)]="form.categoryId"
                  name="categoryId"
                  required
                >
                  <option value="">هەڵبژاردن...</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.nameDe }} ({{ cat.nameKu }})</option>
                  }
                </select>
              </div>
              <div>
                <label for="cityId" class="mb-1 block text-sm font-medium text-text">شار <span class="text-danger-500">*</span></label>
                <select
                  id="cityId"
                  class="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                  [(ngModel)]="form.cityId"
                  name="cityId"
                  required
                >
                  <option value="">هەڵبژاردن...</option>
                  @for (city of cities(); track city.id) {
                    <option [value]="city.id">{{ city.nameDe }} ({{ city.nameKu }})</option>
                  }
                </select>
              </div>
              <admin-input label="شەقام" [required]="true" [(ngModel)]="form.street" name="street" />
              <admin-input label="کۆدی پۆست" [required]="true" [(ngModel)]="form.postalCode" name="postalCode" />
              <admin-input label="پانی جوغرافی" type="number" [(ngModel)]="form.latitude" name="lat" />
              <admin-input label="درێژی جوغرافی" type="number" [(ngModel)]="form.longitude" name="lng" />
            </div>
          }

          <!-- Tab 3: Contact -->
          @if (activeTab() === 'contact') {
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <admin-input label="تەلەفۆن" icon="phone" [(ngModel)]="form.phone" name="phone" />
              <admin-input label="ئیمەیڵ" type="email" icon="email" [(ngModel)]="form.email" name="bizEmail" />
              <admin-input label="ماڵپەڕ" type="url" icon="language" [(ngModel)]="form.website" name="website" />
            </div>
          }

          <!-- Tab 4: Hours -->
          @if (activeTab() === 'hours') {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border">
                    <th class="px-3 py-2 text-start font-medium text-text-secondary">ڕۆژ</th>
                    <th class="px-3 py-2 text-start font-medium text-text-secondary">پشوو</th>
                    <th class="px-3 py-2 text-start font-medium text-text-secondary">کاتی دەستپێکردن</th>
                    <th class="px-3 py-2 text-start font-medium text-text-secondary">کاتی کۆتایی</th>
                  </tr>
                </thead>
                <tbody>
                  @for (day of dayEntries; track day.key) {
                    <tr class="border-b border-border last:border-b-0">
                      <td class="px-3 py-2 font-medium text-text">{{ day.label }}</td>
                      <td class="px-3 py-2">
                        <input
                          type="checkbox"
                          [(ngModel)]="form[day.key].closed"
                          [name]="day.key + '_closed'"
                          class="h-4 w-4 rounded border-border text-danger-600 focus:ring-danger-500"
                        />
                      </td>
                      <td class="px-3 py-2">
                        <input
                          type="text"
                          [(ngModel)]="form[day.key].open"
                          [name]="day.key + '_open'"
                          [disabled]="form[day.key].closed"
                          placeholder="09:00"
                          class="w-24 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text disabled:opacity-50"
                        />
                      </td>
                      <td class="px-3 py-2">
                        <input
                          type="text"
                          [(ngModel)]="form[day.key].close"
                          [name]="day.key + '_close'"
                          [disabled]="form[day.key].closed"
                          placeholder="18:00"
                          class="w-24 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- Tab 5: Menu Items (edit mode) -->
          @if (activeTab() === 'menu' && businessSlug()) {
            <div class="space-y-4">
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <admin-input label="ناو (کوردی)" [required]="true" [(ngModel)]="menuForm.nameKu" name="menuNameKu" />
                <admin-input label="ناو (ئەڵمانی)" [required]="true" [(ngModel)]="menuForm.nameDe" name="menuNameDe" />
                <admin-input label="نرخ" type="number" [(ngModel)]="menuForm.price" name="menuPrice" />
                <admin-input label="ریزبەندی" type="number" [(ngModel)]="menuForm.sortOrder" name="menuSort" />
              </div>
              <admin-button [loading]="menuSaving()" (clicked)="addMenuItem()">
                <span class="material-icons me-1 text-base align-middle">add</span>
                زیادکردن
              </admin-button>

              @if (menuItems().length > 0) {
                <div class="overflow-hidden rounded-xl border border-border">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="bg-surface-alt/50">
                        <th class="px-4 py-2.5 text-start text-xs font-semibold text-text-secondary">ناو</th>
                        <th class="px-4 py-2.5 text-start text-xs font-semibold text-text-secondary">نرخ</th>
                        <th class="px-4 py-2.5 text-start text-xs font-semibold text-text-secondary">ریزبەندی</th>
                        <th class="px-4 py-2.5 text-start text-xs font-semibold text-text-secondary">کردار</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-border">
                      @for (item of menuItems(); track item.id) {
                        <tr>
                          <td class="px-4 py-2.5 text-text">{{ item.name.de }} ({{ item.name.ku }})</td>
                          <td class="px-4 py-2.5 text-text-secondary">{{ item.price !== null && item.price !== undefined ? (item.price + ' €') : '—' }}</td>
                          <td class="px-4 py-2.5 text-text-secondary">{{ item.sortOrder }}</td>
                          <td class="px-4 py-2.5">
                            <button type="button" (click)="removeMenuItem(item.id)" class="material-icons text-danger-600 hover:text-danger-700" title="سڕینەوە">delete</button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="py-4 text-center text-sm text-text-secondary">هیچ بڕگەیەکی مینیو نییە</p>
              }
            </div>
          }

          <!-- Tab 6: Services (edit mode) -->
          @if (activeTab() === 'services' && businessSlug()) {
            <div class="space-y-4">
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <admin-input label="ناو (کوردی)" [required]="true" [(ngModel)]="serviceForm.nameKu" name="svcNameKu" />
                <admin-input label="ناو (ئەڵمانی)" [required]="true" [(ngModel)]="serviceForm.nameDe" name="svcNameDe" />
                <admin-input label="نرخ" type="number" [(ngModel)]="serviceForm.price" name="svcPrice" />
                <admin-input label="ریزبەندی" type="number" [(ngModel)]="serviceForm.sortOrder" name="svcSort" />
              </div>
              <admin-button [loading]="serviceSaving()" (clicked)="addService()">
                <span class="material-icons me-1 text-base align-middle">add</span>
                زیادکردن
              </admin-button>

              @if (services().length > 0) {
                <div class="overflow-hidden rounded-xl border border-border">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="bg-surface-alt/50">
                        <th class="px-4 py-2.5 text-start text-xs font-semibold text-text-secondary">ناو</th>
                        <th class="px-4 py-2.5 text-start text-xs font-semibold text-text-secondary">نرخ</th>
                        <th class="px-4 py-2.5 text-start text-xs font-semibold text-text-secondary">ریزبەندی</th>
                        <th class="px-4 py-2.5 text-start text-xs font-semibold text-text-secondary">کردار</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-border">
                      @for (svc of services(); track svc.id) {
                        <tr>
                          <td class="px-4 py-2.5 text-text">{{ svc.name.de }} ({{ svc.name.ku }})</td>
                          <td class="px-4 py-2.5 text-text-secondary">{{ svc.price !== null && svc.price !== undefined ? (svc.price + ' €') : '—' }}</td>
                          <td class="px-4 py-2.5 text-text-secondary">{{ svc.sortOrder }}</td>
                          <td class="px-4 py-2.5">
                            <button type="button" (click)="removeService(svc.id)" class="material-icons text-danger-600 hover:text-danger-700" title="سڕینەوە">delete</button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="py-4 text-center text-sm text-text-secondary">هیچ خزمەتگوزارییەک نییە</p>
              }
            </div>
          }

          <!-- Tab 7: Discount (edit mode) -->
          @if (activeTab() === 'discount' && businessSlug()) {
            <div class="space-y-5">
              @if (discountActive()) {
                <div class="flex items-center gap-3 rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-800 dark:bg-success-900/20">
                  <span class="material-icons text-2xl text-success-600">local_offer</span>
                  <div class="flex-1">
                    <p class="font-semibold text-success-800 dark:text-success-300">داشکاندنی چالاک: {{ discountForm.percentage }}%</p>
                    <p class="text-xs text-success-600 dark:text-success-400">{{ discountForm.descDe || 'بێ وەسف' }}</p>
                  </div>
                  <admin-button variant="secondary" (clicked)="removeDiscount()">
                    <span class="material-icons me-1 text-base align-middle text-danger-600">delete</span>
                    لابردن
                  </admin-button>
                </div>
              }
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <admin-input label="ڕێژەی داشکاندن (%)" type="number" [required]="true" [(ngModel)]="discountForm.percentage" name="discPercent" />
                <div></div>
                <admin-input label="وەسف (ئەڵمانی)" [(ngModel)]="discountForm.descDe" name="discDescDe" />
                <admin-input label="وەسف (کوردی)" [(ngModel)]="discountForm.descKu" name="discDescKu" />
                <admin-input label="وەسف (ئینگلیزی)" [(ngModel)]="discountForm.descEn" name="discDescEn" />
                <admin-input label="وەسف (کورمانجی)" [(ngModel)]="discountForm.descKmr" name="discDescKmr" />
                <div>
                  <label class="mb-1 block text-sm font-medium text-text">بەرواری دەستپێکردن</label>
                  <input type="datetime-local" class="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none" [(ngModel)]="discountForm.startDate" name="discStart" />
                </div>
                <div>
                  <label class="mb-1 block text-sm font-medium text-text">بەرواری کۆتایی</label>
                  <input type="datetime-local" class="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none" [(ngModel)]="discountForm.endDate" name="discEnd" />
                </div>
              </div>
              <admin-button [loading]="discountSaving()" (clicked)="saveDiscount()">
                <span class="material-icons me-1 text-base align-middle">save</span>
                {{ discountActive() ? 'نوێکردنەوەی داشکاندن' : 'چالاککردنی داشکاندن' }}
              </admin-button>
            </div>
          }

          <!-- Tab 8: Images (edit mode) -->
          @if (activeTab() === 'images' && businessSlug()) {
            <div class="space-y-4">
              <div>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  (change)="onFileSelected($event)"
                  class="block text-sm text-text-secondary file:me-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
              @if (uploading()) {
                <div class="h-1 overflow-hidden rounded-full bg-primary-100">
                  <div class="h-full animate-pulse rounded-full bg-primary-500" style="width: 60%"></div>
                </div>
              }
              @if (images().length > 0) {
                <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  @for (img of images(); track img.id) {
                    <div class="overflow-hidden rounded-lg border border-border">
                      <img [src]="img.url" [alt]="img.altText ?? ''" class="h-32 w-full object-cover" />
                      <div class="flex items-center justify-between p-2">
                        @if (!img.isPrimary) {
                          <button
                            type="button"
                            (click)="setPrimary(img.id)"
                            class="material-icons text-warning-500 text-lg hover:text-warning-600"
                            title="وێنەی سەرەکی"
                          >star</button>
                        } @else {
                          <span class="material-icons text-warning-500 text-lg">star</span>
                        }
                        <button
                          type="button"
                          (click)="deleteImage(img.id)"
                          class="material-icons text-danger-500 text-lg hover:text-danger-600"
                          title="سڕینەوە"
                        >delete</button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </form>
      }

      <div modal-footer class="flex justify-end gap-3 border-t border-border px-6 py-4">
        <admin-button variant="secondary" (clicked)="closed.emit()">پاشگەزبوونەوە</admin-button>
        <admin-button [loading]="saving()" (clicked)="handleSubmit()">
          {{ businessSlug() ? 'نوێکردنەوە' : 'زیادکردن' }}
        </admin-button>
      </div>
    </admin-modal>
  `,
})
export class BusinessFormDialogComponent {
  private readonly api = inject(ApiService);
  private readonly notifications = inject(NotificationService);

  readonly open = input(false);
  readonly businessSlug = input<string | null>(null);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly formLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly activeTab = signal('info');
  protected readonly categories = signal<Category[]>([]);
  protected readonly cities = signal<City[]>([]);
  protected readonly images = signal<{ id: string; url: string; altText?: string | null; isPrimary: boolean }[]>([]);
  protected readonly menuItems = signal<MenuItem[]>([]);
  protected readonly services = signal<BusinessService[]>([]);
  protected readonly menuSaving = signal(false);
  protected readonly serviceSaving = signal(false);
  protected readonly discountSaving = signal(false);
  protected readonly discountActive = signal(false);

  private editId: string | null = null;

  protected menuForm = { nameKu: '', nameDe: '', price: '', sortOrder: '0' };
  protected serviceForm = { nameKu: '', nameDe: '', price: '', sortOrder: '0' };
  protected discountForm = { percentage: '', descKu: '', descKmr: '', descDe: '', descEn: '', startDate: '', endDate: '' };

  protected readonly tabs = [
    { id: 'info', icon: 'info', label: 'زانیاریی سەرەکی' },
    { id: 'location', icon: 'place', label: 'شوێن و پۆل' },
    { id: 'contact', icon: 'contact_phone', label: 'پەیوەندی' },
    { id: 'hours', icon: 'schedule', label: 'کاتژمێری کار' },
    { id: 'menu', icon: 'restaurant_menu', label: 'مینیو' },
    { id: 'services', icon: 'miscellaneous_services', label: 'خزمەتگوزارییەکان' },
    { id: 'discount', icon: 'local_offer', label: 'داشکاندن' },
    { id: 'images', icon: 'image', label: 'وێنەکان' },
  ];

  readonly dayEntries: { key: keyof Pick<BusinessForm, 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>; label: string }[] = [
    { key: 'monday', label: 'دووشەممە' },
    { key: 'tuesday', label: 'سێشەممە' },
    { key: 'wednesday', label: 'چوارشەممە' },
    { key: 'thursday', label: 'پێنجشەممە' },
    { key: 'friday', label: 'هەینی' },
    { key: 'saturday', label: 'شەممە' },
    { key: 'sunday', label: 'یەکشەممە' },
  ];

  form: BusinessForm = this.createEmptyForm();

  constructor() {
    this.loadLookups();

    effect(() => {
      if (this.open()) {
        this.activeTab.set('info');
        if (this.businessSlug()) {
          this.loadBusiness();
        } else {
          this.editId = null;
          this.form = this.createEmptyForm();
          this.images.set([]);
          this.menuItems.set([]);
          this.services.set([]);
        }
      }
    });
  }

  private loadLookups(): void {
    this.api.getCategories().subscribe(cats => this.categories.set(cats));
    this.api.getCities().subscribe(cities => this.cities.set(cities));
  }

  private loadBusiness(): void {
    this.formLoading.set(true);
    this.api.getBusinessBySlug(this.businessSlug()!).subscribe({
      next: (detail) => {
        this.editId = detail.id;
        this.form = this.mapDetailToForm(detail);
        this.images.set(detail.images);
        this.menuItems.set(detail.menuItems ?? []);
        this.services.set(detail.services ?? []);
        this.mapDiscountFromDetail(detail);
        this.formLoading.set(false);
      },
      error: () => {
        this.notifications.error('هەڵە لە بارکردنی زانیاری');
        this.formLoading.set(false);
        this.closed.emit();
      },
    });
  }

  handleSubmit(): void {
    if (!this.form.nameDe || !this.form.nameKu || !this.form.descriptionDe || !this.form.descriptionKu) {
      this.notifications.warning('تکایە خانە پێویستەکان پڕبکەرەوە');
      return;
    }
    if (!this.form.categoryId) {
      this.notifications.warning('تکایە پۆلێک هەڵبژێرە');
      this.activeTab.set('location');
      return;
    }
    if (!this.form.cityId) {
      this.notifications.warning('تکایە شارێک هەڵبژێرە');
      this.activeTab.set('location');
      return;
    }
    if (!this.form.street) {
      this.notifications.warning('تکایە شەقام پڕبکەرەوە');
      this.activeTab.set('location');
      return;
    }
    if (!this.form.postalCode) {
      this.notifications.warning('تکایە کۆدی پۆست پڕبکەرەوە');
      this.activeTab.set('location');
      return;
    }

    this.saving.set(true);
    const payload = this.buildPayload();

    const request$ = this.editId
      ? this.api.updateBusiness(this.editId, payload)
      : this.api.createBusiness(payload);

    request$.subscribe({
      next: () => {
        this.notifications.success(this.editId ? 'بازرگانی بە سەرکەوتوویی نوێکرایەوە' : 'بازرگانی بە سەرکەوتوویی زیادکرا');
        this.saving.set(false);
        this.saved.emit();
      },
      error: () => {
        this.notifications.error('هەڵە لە پاشەکەوتکردن');
        this.saving.set(false);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.editId) return;

    this.uploading.set(true);
    this.api.uploadBusinessImage(this.editId, file).subscribe({
      next: () => {
        this.notifications.success('وێنە بارکرا');
        this.uploading.set(false);
        this.loadBusiness();
      },
      error: () => {
        this.notifications.error('هەڵە لە بارکردنی وێنە');
        this.uploading.set(false);
      },
    });
  }

  setPrimary(imageId: string): void {
    if (!this.editId) return;
    this.api.setPrimaryImage(this.editId, imageId).subscribe({
      next: () => {
        this.notifications.success('وێنەی سەرەکی گۆڕا');
        this.loadBusiness();
      },
      error: () => this.notifications.error('هەڵە'),
    });
  }

  deleteImage(imageId: string): void {
    if (!this.editId) return;
    this.api.deleteBusinessImage(this.editId, imageId).subscribe({
      next: () => {
        this.notifications.success('وێنە سڕایەوە');
        this.loadBusiness();
      },
      error: () => this.notifications.error('هەڵە لە سڕینەوەی وێنە'),
    });
  }

  private createEmptyForm(): BusinessForm {
    return {
      nameKu: '', nameKmr: '', nameDe: '', nameEn: '',
      descriptionKu: '', descriptionKmr: '', descriptionDe: '', descriptionEn: '',
      categoryId: '', cityId: '',
      street: '', postalCode: '',
      latitude: 50.9375, longitude: 6.9603,
      phone: '', email: '', website: '',
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: true },
      sunday: { open: '09:00', close: '18:00', closed: true },
    };
  }

  private mapDetailToForm(d: BusinessDetail): BusinessForm {
    return {
      nameKu: d.name.ku, nameKmr: d.name.kmr ?? '', nameDe: d.name.de, nameEn: d.name.en ?? '',
      descriptionKu: d.description.ku, descriptionKmr: d.description.kmr ?? '', descriptionDe: d.description.de, descriptionEn: d.description.en ?? '',
      categoryId: d.categoryId, cityId: d.cityId,
      street: d.street, postalCode: d.postalCode,
      latitude: d.latitude, longitude: d.longitude,
      phone: d.phone ?? '', email: d.email ?? '', website: d.website ?? '',
      monday: this.mapDay(d.hours?.monday),
      tuesday: this.mapDay(d.hours?.tuesday),
      wednesday: this.mapDay(d.hours?.wednesday),
      thursday: this.mapDay(d.hours?.thursday),
      friday: this.mapDay(d.hours?.friday),
      saturday: this.mapDay(d.hours?.saturday),
      sunday: this.mapDay(d.hours?.sunday),
    };
  }

  private mapDay(day?: { open?: string | null; close?: string | null; closed: boolean } | null): DayScheduleForm {
    if (!day) return { open: '09:00', close: '18:00', closed: true };
    return { open: day.open ?? '09:00', close: day.close ?? '18:00', closed: day.closed };
  }

  private buildDayPayload(day: DayScheduleForm) {
    return { open: day.closed ? null : day.open, close: day.closed ? null : day.close, closed: day.closed };
  }

  // === Menu Items ===
  addMenuItem(): void {
    if (!this.menuForm.nameKu || !this.menuForm.nameDe || !this.editId) {
      this.notifications.warning('تکایە ناوی کوردی و ئەڵمانی پڕبکەرەوە');
      return;
    }
    this.menuSaving.set(true);
    const payload: MenuItemPayload = {
      name: { ku: this.menuForm.nameKu, de: this.menuForm.nameDe },
      price: this.menuForm.price ? parseFloat(this.menuForm.price) : null,
      sortOrder: parseInt(this.menuForm.sortOrder, 10) || 0,
    };
    this.api.createMenuItem(this.editId, payload).subscribe({
      next: () => {
        this.notifications.success('بڕگەی مینیو زیادکرا');
        this.menuSaving.set(false);
        this.menuForm = { nameKu: '', nameDe: '', price: '', sortOrder: '0' };
        this.loadBusiness();
      },
      error: () => {
        this.notifications.error('هەڵە لە زیادکردنی بڕگەی مینیو');
        this.menuSaving.set(false);
      },
    });
  }

  removeMenuItem(menuItemId: string): void {
    if (!this.editId) return;
    this.api.deleteMenuItem(this.editId, menuItemId).subscribe({
      next: () => {
        this.notifications.success('بڕگەی مینیو سڕایەوە');
        this.loadBusiness();
      },
      error: () => this.notifications.error('هەڵە لە سڕینەوە'),
    });
  }

  // === Business Services ===
  addService(): void {
    if (!this.serviceForm.nameKu || !this.serviceForm.nameDe || !this.editId) {
      this.notifications.warning('تکایە ناوی کوردی و ئەڵمانی پڕبکەرەوە');
      return;
    }
    this.serviceSaving.set(true);
    const payload: BusinessServicePayload = {
      name: { ku: this.serviceForm.nameKu, de: this.serviceForm.nameDe },
      price: this.serviceForm.price ? parseFloat(this.serviceForm.price) : null,
      sortOrder: parseInt(this.serviceForm.sortOrder, 10) || 0,
    };
    this.api.createBusinessService(this.editId, payload).subscribe({
      next: () => {
        this.notifications.success('خزمەتگوزاری زیادکرا');
        this.serviceSaving.set(false);
        this.serviceForm = { nameKu: '', nameDe: '', price: '', sortOrder: '0' };
        this.loadBusiness();
      },
      error: () => {
        this.notifications.error('هەڵە لە زیادکردنی خزمەتگوزاری');
        this.serviceSaving.set(false);
      },
    });
  }

  removeService(serviceId: string): void {
    if (!this.editId) return;
    this.api.deleteBusinessService(this.editId, serviceId).subscribe({
      next: () => {
        this.notifications.success('خزمەتگوزاری سڕایەوە');
        this.loadBusiness();
      },
      error: () => this.notifications.error('هەڵە لە سڕینەوە'),
    });
  }

  // === Discount ===
  private mapDiscountFromDetail(d: BusinessDetail): void {
    if (d.discountPercentage && d.discountPercentage > 0) {
      this.discountActive.set(true);
      this.discountForm = {
        percentage: String(d.discountPercentage),
        descKu: d.discountDescription?.ku ?? '',
        descKmr: d.discountDescription?.kmr ?? '',
        descDe: d.discountDescription?.de ?? '',
        descEn: d.discountDescription?.en ?? '',
        startDate: d.discountStartDate ? d.discountStartDate.slice(0, 16) : '',
        endDate: d.discountEndDate ? d.discountEndDate.slice(0, 16) : '',
      };
    } else {
      this.discountActive.set(false);
      this.discountForm = { percentage: '', descKu: '', descKmr: '', descDe: '', descEn: '', startDate: '', endDate: '' };
    }
  }

  saveDiscount(): void {
    if (!this.editId) return;
    const pct = parseInt(this.discountForm.percentage, 10);
    if (!pct || pct < 1 || pct > 100) {
      this.notifications.warning('ڕێژەی داشکاندن دەبێت لە ١ تا ١٠٠ بێت');
      return;
    }
    this.discountSaving.set(true);
    const payload: DiscountPayload = {
      id: this.editId,
      percentage: pct,
      description: this.discountForm.descDe || this.discountForm.descKu
        ? { ku: this.discountForm.descKu, de: this.discountForm.descDe, kmr: this.discountForm.descKmr || null, en: this.discountForm.descEn || null }
        : null,
      startDate: this.discountForm.startDate ? new Date(this.discountForm.startDate).toISOString() : null,
      endDate: this.discountForm.endDate ? new Date(this.discountForm.endDate).toISOString() : null,
    };
    this.api.setDiscount(this.editId, payload).subscribe({
      next: () => {
        this.notifications.success('داشکاندن بە سەرکەوتوویی تۆمارکرا');
        this.discountSaving.set(false);
        this.discountActive.set(true);
        this.loadBusiness();
      },
      error: () => {
        this.notifications.error('هەڵە لە تۆمارکردنی داشکاندن');
        this.discountSaving.set(false);
      },
    });
  }

  removeDiscount(): void {
    if (!this.editId) return;
    this.discountSaving.set(true);
    this.api.clearDiscount(this.editId).subscribe({
      next: () => {
        this.notifications.success('داشکاندن لابرا');
        this.discountSaving.set(false);
        this.discountActive.set(false);
        this.discountForm = { percentage: '', descKu: '', descKmr: '', descDe: '', descEn: '', startDate: '', endDate: '' };
      },
      error: () => {
        this.notifications.error('هەڵە لە لابردنی داشکاندن');
        this.discountSaving.set(false);
      },
    });
  }

  private buildPayload(): BusinessPayload {
    return {
      name: { ku: this.form.nameKu, kmr: this.form.nameKmr || null, de: this.form.nameDe, en: this.form.nameEn || null },
      description: { ku: this.form.descriptionKu, kmr: this.form.descriptionKmr || null, de: this.form.descriptionDe, en: this.form.descriptionEn || null },
      categoryId: this.form.categoryId,
      street: this.form.street,
      postalCode: this.form.postalCode,
      cityId: this.form.cityId,
      latitude: this.form.latitude,
      longitude: this.form.longitude,
      phone: this.form.phone || null,
      email: this.form.email || null,
      website: this.form.website || null,
      hours: {
        monday: this.buildDayPayload(this.form.monday),
        tuesday: this.buildDayPayload(this.form.tuesday),
        wednesday: this.buildDayPayload(this.form.wednesday),
        thursday: this.buildDayPayload(this.form.thursday),
        friday: this.buildDayPayload(this.form.friday),
        saturday: this.buildDayPayload(this.form.saturday),
        sunday: this.buildDayPayload(this.form.sunday),
      },
    };
  }
}
