import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'admin-button',
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="btnClass()"
      [attr.aria-busy]="loading() || null"
      [attr.aria-disabled]="disabled() || null"
      (click)="clicked.emit($event)"
    >
      @if (loading()) {
        <svg class="inline-block h-4 w-4 animate-spin me-2" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      }
      <ng-content />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly variant = input<'primary' | 'secondary' | 'danger' | 'ghost'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly fullWidth = input(false);

  readonly clicked = output<MouseEvent>();

  protected readonly btnClass = computed(() => {
    const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
    const variants: Record<string, string> = {
      primary: 'bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-sm shadow-primary-500/25 hover:from-primary-600 hover:to-primary-700 focus-visible:ring-primary-500',
      secondary: 'bg-surface border border-border text-text shadow-sm hover:bg-surface-alt focus-visible:ring-primary-500',
      danger: 'bg-gradient-to-b from-danger-500 to-danger-600 text-white shadow-sm shadow-danger-500/25 hover:from-danger-600 hover:to-danger-700 focus-visible:ring-danger-500',
      ghost: 'text-text-secondary hover:bg-surface-alt hover:text-text focus-visible:ring-primary-500',
    };
    const sizes: Record<string, string> = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    const parts = [base, variants[this.variant()] ?? '', sizes[this.size()] ?? ''];
    if (this.fullWidth()) parts.push('w-full');
    return parts.join(' ');
  });
}
