import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'admin-modal',
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" [attr.aria-label]="title()" aria-modal="true">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          (click)="closed.emit()"
          aria-hidden="true"
        ></div>

        <!-- Dialog -->
        <div class="relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
             [class]="dialogSizeClass()">
          <!-- Header -->
          @if (title()) {
            <div class="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 class="text-lg font-semibold text-text">{{ title() }}</h2>
              <button
                type="button"
                (click)="closed.emit()"
                aria-label="داخستن"
                class="material-icons rounded-xl p-1.5 text-text-secondary hover:bg-surface-alt hover:text-text transition-colors"
              >
                close
              </button>
            </div>
          }

          <!-- Content -->
          <div class="px-6 py-4">
            <ng-content />
          </div>

          <!-- Footer -->
          <ng-content select="[modal-footer]" />
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');

  readonly closed = output<void>();

  protected readonly dialogSizeClass = computed(() => {
    const sizes: Record<string, string> = {
      sm: 'max-w-md mx-4',
      md: 'max-w-lg mx-4',
      lg: 'max-w-2xl mx-4',
      xl: 'max-w-4xl mx-4',
    };
    return sizes[this.size()] ?? sizes['md'];
  });
}
