import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pagination',
  imports: [TranslateModule],
  template: `
    @if (totalPages() > 1) {
      <nav class="flex items-center justify-center gap-1.5 mt-10" [attr.aria-label]="'aria.pagination' | translate">
        <!-- Previous -->
        <button
          (click)="pageChange.emit(currentPage() - 1)"
          [disabled]="currentPage() <= 1"
          class="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 outline-none"
          [attr.aria-label]="'aria.previousPage' | translate"
        >
          <svg class="size-5 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <!-- Page numbers -->
        @for (page of visiblePages(); track page) {
          @if (page === -1) {
            <span class="px-1.5 text-gray-400 select-none">…</span>
          } @else {
            <button
              (click)="pageChange.emit(page)"
              class="min-w-[40px] h-10 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 outline-none"
              [class]="page === currentPage()
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md shadow-primary-600/25'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-800 hover:text-primary-600 hover:border-primary-200'"
              [attr.aria-current]="page === currentPage() ? 'page' : null"
            >
              {{ page }}
            </button>
          }
        }

        <!-- Next -->
        <button
          (click)="pageChange.emit(currentPage() + 1)"
          [disabled]="currentPage() >= totalPages()"
          class="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 outline-none"
          [attr.aria-label]="'aria.nextPage' | translate"
        >
          <svg class="size-5 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </nav>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly visiblePages = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  });
}
