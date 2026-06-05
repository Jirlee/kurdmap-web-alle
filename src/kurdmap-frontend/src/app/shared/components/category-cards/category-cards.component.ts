import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CategoryService } from '../../../core/services/category.service';
import { LanguageService } from '../../../core/services/language.service';
import { ModalService } from '../../../core/services/modal.service';
import { Category } from '../../../core/models';

@Component({
  selector: 'app-category-cards',
  imports: [TranslateModule],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="text-center mb-12">
        <p class="text-xs font-semibold text-primary-600 dark:text-primary-400 tracking-widest uppercase mb-3">{{ 'home.categoriesTitle' | translate }}</p>
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 text-balance">
          {{ 'home.categoriesTitle' | translate }}
        </h2>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          @for (i of skeletonItems; track i) {
            <div class="shimmer-bg animate-shimmer rounded-2xl h-28"></div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          @for (category of categories(); track category.id; let i = $index) {
            <button
              (click)="onCategoryClick(category)"
              class="group relative flex flex-col items-center justify-center gap-2.5 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100/80 dark:border-gray-700 shadow-card hover:shadow-card-hover hover:-translate-y-1 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500 outline-none overflow-hidden motion-reduce:transition-none"
              [style.animation-delay]="(i * 60) + 'ms'"
              style="animation: fade-in-up 0.5s ease-out both;"
            >
              <!-- Subtle gradient on hover -->
              <div class="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-100/0 group-hover:from-primary-50 group-hover:to-primary-100/50 dark:group-hover:from-primary-900/25 dark:group-hover:to-primary-800/10 transition-all duration-300 rounded-2xl"></div>
              <div class="relative size-10 rounded-xl bg-primary-50 dark:bg-primary-900/25 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 flex items-center justify-center transition-colors duration-300">
                <span class="text-xl motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 transition-transform duration-300">{{ getEmoji(category.icon) }}</span>
              </div>
              <span class="relative text-[13px] font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors text-center leading-snug line-clamp-2">
                {{ langService.getLocalizedField(category) }}
              </span>
            </button>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryCardsComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly modalService = inject(ModalService);
  protected readonly langService = inject(LanguageService);
  protected readonly categories = this.categoryService.categories;
  protected readonly loading = signal(true);
  protected readonly skeletonItems = Array(8).fill(0);

  ngOnInit(): void {
    if (this.categories().length > 0) {
      this.loading.set(false);
      return;
    }
    this.categoryService.getAll().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  protected onCategoryClick(category: Category): void {
    this.modalService.openSearch({ category: category.slug });
  }

  /** Map material-symbols icon names to emoji for display */
  protected getEmoji(icon: string | null | undefined): string {
    if (!icon) return '📁';
    const map: Record<string, string> = {
      'material-symbols:restaurant': '🍽️',
      'material-symbols:local-grocery-store': '🛒',
      'material-symbols:content-cut': '✂️',
      'material-symbols:bakery-dining': '🥐',
      'material-symbols:flight': '✈️',
      'material-symbols:medical-services': '🏥',
      'material-symbols:gavel': '⚖️',
      'material-symbols:house': '🏠',
      'material-symbols:more-horiz': '📋',
    };
    return map[icon] ?? '📁';
  }
}
