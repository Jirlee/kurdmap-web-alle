import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'admin-confirm-dialog',
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center" role="alertdialog" [attr.aria-label]="title()" aria-modal="true">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" (click)="cancelled.emit()" aria-hidden="true"></div>
        <div class="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" [class]="variant() === 'danger' ? 'bg-danger-50 dark:bg-danger-900/30' : 'bg-primary-50 dark:bg-primary-900/30'">
            <span class="material-icons text-xl" [class]="variant() === 'danger' ? 'text-danger-600' : 'text-primary-600'" aria-hidden="true">
              {{ variant() === 'danger' ? 'warning' : 'help_outline' }}
            </span>
          </div>
          <h3 class="text-lg font-semibold text-text mb-2">{{ title() }}</h3>
          <p class="text-sm text-text-secondary mb-6">{{ message() }}</p>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              (click)="cancelled.emit()"
              class="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text shadow-sm hover:bg-surface-alt transition-all duration-200 active:scale-[0.98]"
            >
              {{ cancelText() }}
            </button>
            <button
              type="button"
              (click)="confirmed.emit()"
              [class]="confirmBtnClass()"
            >
              {{ confirmText() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly message = input('');
  readonly confirmText = input('بەڵێ');
  readonly cancelText = input('پاشگەزبوونەوە');
  readonly variant = input<'danger' | 'primary'>('primary');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected readonly confirmBtnClass = computed(() => {
    const base = 'rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 active:scale-[0.98]';
    return this.variant() === 'danger'
      ? `${base} bg-gradient-to-b from-danger-500 to-danger-600 shadow-danger-500/25 hover:from-danger-600 hover:to-danger-700`
      : `${base} bg-gradient-to-b from-primary-500 to-primary-600 shadow-primary-500/25 hover:from-primary-600 hover:to-primary-700`;
  });
}
