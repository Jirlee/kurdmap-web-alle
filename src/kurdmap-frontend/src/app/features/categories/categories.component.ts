import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SeoService } from '../../core/services/seo.service';
import { CategoryService } from '../../core/services/category.service';
import { LanguageService } from '../../core/services/language.service';
import { ModalService } from '../../core/services/modal.service';
import { Category } from '../../core/models';

@Component({
  selector: 'app-categories',
  imports: [TranslateModule],
  template: `
    <section class="min-h-[60vh] py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-sm font-medium mb-6">
            <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
            {{ 'categories.badge' | translate }}
          </div>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 text-balance">
            {{ 'categories.title' | translate }}
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-balance">
            {{ 'categories.subtitle' | translate }}
          </p>
        </div>

        @if (loading()) {
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (_ of [1, 2, 3, 4, 5, 6]; track $index) {
              <div class="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
            }
          </div>
        } @else {
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (category of categories(); track category.id) {
              <button
                (click)="onCategoryClick(category)"
                class="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200 text-start cursor-pointer"
              >
                <div class="flex items-start gap-4">
                  @if (category.icon) {
                    <div class="size-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                      {{ category.icon }}
                    </div>
                  } @else {
                    <div class="size-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <svg class="size-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                      </svg>
                    </div>
                  }
                  <div class="min-w-0">
                    <h3 class="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                      {{ getLocalizedName(category) }}
                    </h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {{ 'categories.explore' | translate }}
                    </p>
                  </div>
                  <svg class="size-5 text-gray-400 group-hover:text-primary-500 shrink-0 ms-auto group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </button>
            }
          </div>

          @if (categories().length === 0) {
            <div class="text-center py-16">
              <div class="size-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <svg class="size-8 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                </svg>
              </div>
              <p class="text-gray-500 dark:text-gray-400">{{ 'categories.empty' | translate }}</p>
            </div>
          }
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CategoriesComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly categoryService = inject(CategoryService);
  private readonly languageService = inject(LanguageService);
  private readonly modalService = inject(ModalService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.seo.updateMeta({
      title: this.translate.instant('categories.title'),
      description: this.translate.instant('categories.subtitle'),
    });

    this.categoryService.getAll().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected getLocalizedName(category: Category): string {
    return this.languageService.getLocalizedField(category);
  }

  protected onCategoryClick(category: Category): void {
    this.modalService.openSearch({ category: category.slug ?? category.id });
  }
}
