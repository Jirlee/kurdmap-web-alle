import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, NotificationService } from '../../core/services';
import { AuthStore } from '../../core/auth';
import type { User } from '../../core/models';
import { AppRoles } from '../../core/models';
import { getRoleLabel, getRoleColor } from '../../core/utils';
import {
  ButtonComponent,
  InputComponent,
  PaginationComponent,
  ModalComponent,
  ConfirmDialogComponent,
  LoadingComponent,
} from '../../shared/components';

@Component({
  selector: 'admin-users',
  imports: [
    FormsModule,
    ButtonComponent,
    InputComponent,
    PaginationComponent,
    ModalComponent,
    ConfirmDialogComponent,
    LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-text">بەکارهێنەران</h1>
        <p class="mt-1 text-sm text-text-secondary">بەڕێوەبردنی بەکارهێنەرانی سیستەم</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-5 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <admin-input
          placeholder="گەڕان (ناو یان ئیمەیڵ)"
          icon="search"
          [(ngModel)]="searchText"
          (ngModelChange)="onSearchChanged()"
        />
        <div>
          <label for="role-filter" class="sr-only">فیلتەری ڕۆڵ</label>
          <select
            id="role-filter"
            class="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
            [(ngModel)]="roleFilter"
            (ngModelChange)="onFilterChanged()"
          >
            <option value="">هەمووی</option>
            @for (role of allRoles; track role) {
              <option [value]="role">{{ getRoleLabel(role) }}</option>
            }
          </select>
        </div>
        <admin-button variant="secondary" (clicked)="loadUsers()">
          <span class="material-icons me-1 text-base align-middle">refresh</span>
          نوێکردنەوە
        </admin-button>
      </div>
    </div>

    <!-- Table -->
    @if (loading()) {
      <admin-loading />
    } @else {
      <div class="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <!-- Mobile card view -->
        <div class="divide-y divide-border md:hidden">
          @for (user of users(); track user.id) {
            <div class="p-4 space-y-2">
              <div class="flex items-center justify-between">
                <div class="min-w-0">
                  <p class="font-medium text-text truncate">{{ user.fullName }}</p>
                  <p class="text-xs text-text-secondary truncate" dir="ltr">{{ user.email }}</p>
                </div>
                @if (user.isActive) {
                  <span class="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 shrink-0">
                    <span class="h-1.5 w-1.5 rounded-full bg-success-500" aria-hidden="true"></span>چالاک
                  </span>
                } @else {
                  <span class="inline-flex items-center gap-1 rounded-full bg-danger-50 px-2.5 py-0.5 text-xs font-medium text-danger-700 shrink-0">
                    <span class="h-1.5 w-1.5 rounded-full bg-danger-500" aria-hidden="true"></span>ناچالاک
                  </span>
                }
              </div>
              <div class="flex flex-wrap gap-1">
                @for (role of user.roles; track role) {
                  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="getRoleColor(role)">{{ getRoleLabel(role) }}</span>
                }
              </div>
              <div class="flex gap-1 pt-1">
                <button type="button" (click)="openStatusConfirm(user)" class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center transition-colors" [class]="user.isActive ? 'text-warning-600 hover:bg-warning-50' : 'text-success-600 hover:bg-success-50'" [attr.aria-label]="user.isActive ? 'ناچالاککردن' : 'چالاککردن'">{{ user.isActive ? 'person_off' : 'person_add' }}</button>
                <button type="button" (click)="openDetailDialog(user)" class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-primary-500 hover:bg-primary-50 transition-colors" aria-label="وردەکاری">visibility</button>
              </div>
            </div>
          } @empty {
            <div class="px-5 py-16 text-center">
              <p class="text-sm font-medium text-text-secondary">هیچ بەکارهێنەرێک نەدۆزرایەوە</p>
            </div>
          }
        </div>

        <!-- Desktop table view -->
        <div class="overflow-x-auto hidden md:block">
          <table class="w-full text-sm">
            <caption class="sr-only">لیستی بەکارهێنەران</caption>
            <thead>
              <tr class="bg-surface-alt/50">
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">ناو</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">ئیمەیڵ</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">ڕۆڵ</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">بارودۆخ</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">پشتڕاستکردنی ئیمەیڵ</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">بەروار</th>
                <th scope="col" class="px-5 py-3.5 text-start text-xs font-semibold uppercase tracking-wider text-text-secondary">کردارەکان</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (user of users(); track user.id) {
                <tr class="transition-colors hover:bg-primary-50/50 dark:hover:bg-primary-900/10">
                  <td class="px-5 py-3.5 font-medium text-text">{{ user.fullName }}</td>
                  <td class="px-5 py-3.5 text-text-secondary" dir="ltr">{{ user.email }}</td>
                  <td class="px-5 py-3.5">
                    @for (role of user.roles; track role) {
                      <span class="me-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                            [class]="getRoleColor(role)">
                        {{ getRoleLabel(role) }}
                      </span>
                    }
                  </td>
                  <td class="px-5 py-3.5">
                    @if (user.isActive) {
                      <span class="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-900/30 dark:text-success-400">
                        <span class="h-1.5 w-1.5 rounded-full bg-success-500" aria-hidden="true"></span>
                        چالاک
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1 rounded-full bg-danger-50 px-2.5 py-0.5 text-xs font-medium text-danger-700 dark:bg-danger-900/30 dark:text-danger-400">
                        <span class="h-1.5 w-1.5 rounded-full bg-danger-500" aria-hidden="true"></span>
                        ناچالاک
                      </span>
                    }
                  </td>
                  <td class="px-5 py-3.5">
                    @if (user.emailConfirmed) {
                      <span class="inline-flex items-center gap-1 text-xs font-medium text-success-600"><span class="material-icons text-base" aria-hidden="true">verified</span> پشتڕاستکراوە</span>
                    } @else {
                      <span class="inline-flex items-center gap-1 text-xs font-medium text-danger-600"><span class="material-icons text-base" aria-hidden="true">cancel</span> نەکراوە</span>
                    }
                  </td>
                  <td class="px-5 py-3.5 text-text-secondary" dir="ltr">{{ formatDate(user.createdAt) }}</td>
                  <td class="px-5 py-3.5">
                    <div class="flex gap-1">
                      @if (isSuperAdmin()) {
                        <button
                          type="button"
                          (click)="openRoleDialog(user)"
                          class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-primary-600 hover:bg-primary-50 transition-colors"
                          title="گۆڕینی ڕۆڵ"
                          aria-label="گۆڕینی ڕۆڵ"
                        >admin_panel_settings</button>
                      }
                      <button
                        type="button"
                        (click)="openStatusConfirm(user)"
                        class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center transition-colors"
                        [class]="user.isActive ? 'text-warning-600 hover:bg-warning-50' : 'text-success-600 hover:bg-success-50'"
                        [title]="user.isActive ? 'ناچالاککردن' : 'چالاککردن'"
                        [attr.aria-label]="user.isActive ? 'ناچالاککردن' : 'چالاککردن'"
                      >{{ user.isActive ? 'person_off' : 'person_add' }}</button>
                      <button
                        type="button"
                        (click)="openDetailDialog(user)"
                        class="material-icons rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center text-primary-500 hover:bg-primary-50 transition-colors"
                        title="وردەکاری"
                        aria-label="وردەکاری"
                      >visibility</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-5 py-12 text-center text-text-secondary">
                    <span class="material-icons mb-2 block text-4xl opacity-30" aria-hidden="true">person_search</span>
                    هیچ بەکارهێنەرێک نەدۆزرایەوە
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
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

    <!-- Detail Dialog -->
    <admin-modal [open]="detailOpen()" [title]="'وردەکاریی بەکارهێنەر'" size="md" (closed)="detailOpen.set(false)">
      @if (selectedUser()) {
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
              {{ selectedUser()!.fullName.charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="font-semibold text-text">{{ selectedUser()!.fullName }}</p>
              <p class="text-sm text-text-secondary">{{ selectedUser()!.email }}</p>
            </div>
          </div>
          <hr class="border-border" />
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b border-border">
                <td class="py-2 font-medium text-text-secondary">ناسنامە</td>
                <td class="py-2 text-text" dir="ltr">{{ selectedUser()!.id }}</td>
              </tr>
              <tr class="border-b border-border">
                <td class="py-2 font-medium text-text-secondary">ڕۆڵەکان</td>
                <td class="py-2">
                  @for (role of selectedUser()!.roles; track role) {
                    <span class="me-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="getRoleColor(role)">
                      {{ getRoleLabel(role) }}
                    </span>
                  }
                </td>
              </tr>
              <tr class="border-b border-border">
                <td class="py-2 font-medium text-text-secondary">بارودۆخ</td>
                <td class="py-2">
                  @if (selectedUser()!.isActive) {
                    <span class="inline-block rounded-full bg-success-500 px-2.5 py-0.5 text-xs font-medium text-white">چالاک</span>
                  } @else {
                    <span class="inline-block rounded-full bg-danger-500 px-2.5 py-0.5 text-xs font-medium text-white">ناچالاک</span>
                  }
                </td>
              </tr>
              <tr class="border-b border-border">
                <td class="py-2 font-medium text-text-secondary">پشتڕاستکردنی ئیمەیڵ</td>
                <td class="py-2">
                  @if (selectedUser()!.emailConfirmed) {
                    <span class="text-success-600">پشتڕاستکراوە</span>
                  } @else {
                    <span class="text-danger-600">پشتڕاستنەکراوە</span>
                  }
                </td>
              </tr>
              <tr class="border-b border-border">
                <td class="py-2 font-medium text-text-secondary">بەرواری ئەندامبوون</td>
                <td class="py-2" dir="ltr">{{ formatDateTime(selectedUser()!.createdAt) }}</td>
              </tr>
              <tr>
                <td class="py-2 font-medium text-text-secondary">دوایین نوێکردنەوە</td>
                <td class="py-2" dir="ltr">{{ formatDateTime(selectedUser()!.updatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      }
    </admin-modal>

    <!-- Role Change Dialog -->
    <admin-modal [open]="roleDialogOpen()" title="گۆڕینی ڕۆڵی بەکارهێنەر" size="sm" (closed)="roleDialogOpen.set(false)">
      @if (selectedUser()) {
        <div class="space-y-4">
          <p class="text-text-secondary">
            گۆڕینی ڕۆڵی بەکارهێنەر <strong>{{ selectedUser()!.fullName }}</strong>
          </p>
          <select
            class="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
            [(ngModel)]="selectedRole"
          >
            @for (role of allRoles; track role) {
              <option [value]="role">{{ getRoleLabel(role) }}</option>
            }
          </select>
          <div class="flex justify-end gap-3 border-t border-border pt-4">
            <admin-button variant="secondary" (clicked)="roleDialogOpen.set(false)">پاشگەزبوونەوە</admin-button>
            <admin-button (clicked)="changeRole()">پاشەکەوتکردن</admin-button>
          </div>
        </div>
      }
    </admin-modal>

    <!-- Confirm Status -->
    <admin-confirm-dialog
      [open]="statusConfirmOpen()"
      [title]="(statusConfirmUser()?.isActive ? 'ناچالاک' : 'چالاک') + 'کردنی بەکارهێنەر'"
      [message]="'ئایا دڵنیایی لە ' + (statusConfirmUser()?.isActive ? 'ناچالاک' : 'چالاک') + 'کردنی «' + (statusConfirmUser()?.fullName ?? '') + '»؟'"
      [confirmText]="'بەڵێ، ' + (statusConfirmUser()?.isActive ? 'ناچالاک' : 'چالاک') + ' بکە'"
      cancelText="پاشگەزبوونەوە"
      (confirmed)="toggleUserStatus()"
      (cancelled)="statusConfirmOpen.set(false)"
    />
  `,
})
export class UsersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly getRoleLabel = getRoleLabel;
  protected readonly getRoleColor = getRoleColor;
  protected readonly allRoles = AppRoles.All;
  protected readonly isSuperAdmin = this.authStore.isSuperAdmin;

  protected readonly loading = signal(true);
  protected readonly users = signal<User[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly totalCount = signal(0);
  protected readonly hasPreviousPage = signal(false);
  protected readonly hasNextPage = signal(false);

  protected searchText = '';
  protected roleFilter = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // Detail dialog
  protected readonly detailOpen = signal(false);
  protected readonly selectedUser = signal<User | null>(null);

  // Role dialog
  protected readonly roleDialogOpen = signal(false);
  protected selectedRole = '';

  // Status confirm
  protected readonly statusConfirmOpen = signal(false);
  protected readonly statusConfirmUser = signal<User | null>(null);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page = 1): void {
    this.loading.set(true);
    this.api.getUsers(page, 10, this.searchText || null, this.roleFilter || null).subscribe({
      next: (data) => {
        this.users.set(data.items);
        this.currentPage.set(data.pageNumber);
        this.totalPages.set(data.totalPages);
        this.totalCount.set(data.totalCount);
        this.hasPreviousPage.set(data.hasPreviousPage);
        this.hasNextPage.set(data.hasNextPage);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error('هەڵە لە بارکردنی بەکارهێنەران');
        this.loading.set(false);
      },
    });
  }

  onSearchChanged(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadUsers(), 400);
  }

  onFilterChanged(): void {
    this.loadUsers();
  }

  onPageChanged(page: number): void {
    this.loadUsers(page);
  }

  openDetailDialog(user: User): void {
    this.selectedUser.set(user);
    this.detailOpen.set(true);
  }

  openRoleDialog(user: User): void {
    this.selectedUser.set(user);
    this.selectedRole = user.roles[0] ?? 'User';
    this.roleDialogOpen.set(true);
  }

  changeRole(): void {
    const user = this.selectedUser();
    if (!user) return;
    this.api.changeUserRole(user.id, this.selectedRole).subscribe({
      next: () => {
        this.notifications.success('ڕۆڵی بەکارهێنەر بە سەرکەوتوویی گۆڕا');
        this.roleDialogOpen.set(false);
        this.loadUsers(this.currentPage());
      },
      error: () => this.notifications.error('هەڵە لە گۆڕینی ڕۆڵ'),
    });
  }

  openStatusConfirm(user: User): void {
    this.statusConfirmUser.set(user);
    this.statusConfirmOpen.set(true);
  }

  toggleUserStatus(): void {
    const user = this.statusConfirmUser();
    if (!user) return;
    this.api.changeUserStatus(user.id, !user.isActive).subscribe({
      next: () => {
        const action = user.isActive ? 'ناچالاک' : 'چالاک';
        this.notifications.success(`بەکارهێنەر بە سەرکەوتوویی ${action} کرا`);
        this.statusConfirmOpen.set(false);
        this.loadUsers(this.currentPage());
      },
      error: () => this.notifications.error('هەڵە لە گۆڕینی بارودۆخی بەکارهێنەر'),
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-CA');
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('en-CA', { dateStyle: 'short', timeStyle: 'short' });
  }
}
