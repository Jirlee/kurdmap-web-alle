import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'admin-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="پەیجکردن" class="flex items-center justify-between border-t border-border px-5 py-3.5">
      <div class="text-sm text-text-secondary">
        <span class="font-medium text-text">{{ totalCount() }}</span> ئەنجام — لاپەڕەی <span class="font-medium text-text">{{ currentPage() }}</span> لە <span class="font-medium text-text">{{ totalPages() }}</span>
      </div>
      <div class="flex gap-1">
        <button
          type="button"
          [disabled]="!hasPreviousPage()"
          (click)="pageChanged.emit(currentPage() - 1)"
          aria-label="لاپەڕەی پێشوو"
          class="rounded-xl border border-border px-3 py-1.5 text-sm shadow-sm hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <span class="material-icons text-base align-middle" aria-hidden="true">chevron_right</span>
        </button>
        @for (p of visiblePages(); track p) {
          <button
            type="button"
            (click)="pageChanged.emit(p)"
            [attr.aria-current]="p === currentPage() ? 'page' : null"
            class="rounded-xl border px-3 py-1.5 text-sm font-medium transition-all duration-200"
            [class.bg-gradient-to-b]="p === currentPage()"
            [class.from-primary-500]="p === currentPage()"
            [class.to-primary-600]="p === currentPage()"
            [class.text-white]="p === currentPage()"
            [class.border-primary-600]="p === currentPage()"
            [class.shadow-sm]="p === currentPage()"
            [class.shadow-primary-500/25]="p === currentPage()"
            [class.border-border]="p !== currentPage()"
            [class.hover:bg-surface-alt]="p !== currentPage()"
          >
            {{ p }}
          </button>
        }
        <button
          type="button"
          [disabled]="!hasNextPage()"
          (click)="pageChanged.emit(currentPage() + 1)"
          aria-label="لاپەڕەی دواتر"
          class="rounded-xl border border-border px-3 py-1.5 text-sm shadow-sm hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <span class="material-icons text-base align-middle" aria-hidden="true">chevron_left</span>
        </button>
      </div>
    </nav>
  `,
})
export class PaginationComponent {
  readonly currentPage = input(1);
  readonly totalPages = input(1);
  readonly totalCount = input(0);
  readonly hasPreviousPage = input(false);
  readonly hasNextPage = input(false);

  readonly pageChanged = output<number>();

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });
}
