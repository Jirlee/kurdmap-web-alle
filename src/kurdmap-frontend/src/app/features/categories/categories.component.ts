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
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            @for (_ of [1, 2, 3, 4, 5, 6]; track $index) {
              <div class="h-[5.5rem] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
            }
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            @for (category of categories(); track category.id; let i = $index) {
              <button
                (click)="onCategoryClick(category)"
                class="cat-card group"
                [style.--cat-delay.ms]="i * 45"
              >
                <span class="cat-card__icon" aria-hidden="true">
                  @if (category.icon) {
                    <span class="text-2xl leading-none">{{ category.icon }}</span>
                  } @else {
                    <svg class="size-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                  }
                </span>

                <span class="cat-card__body">
                  <span class="cat-card__name">{{ getLocalizedName(category) }}</span>
                  <span class="cat-card__meta">{{ 'categories.explore' | translate }}</span>
                </span>

                <svg class="cat-card__arrow" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
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
  styles: [`
    .cat-card {
      position: relative;
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
      padding: 1.125rem 1.25rem;
      text-align: start;
      background: #ffffff;
      border: 1px solid var(--color-gray-100, #f3f4f6);
      border-radius: 1.25rem;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06);
      cursor: pointer;
      overflow: hidden;
      isolation: isolate;
      transition: transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1),
                  box-shadow 0.28s ease, border-color 0.28s ease;
      animation: cat-in 0.5s ease-out both;
      animation-delay: var(--cat-delay, 0ms);
    }

    @keyframes cat-in {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Soft gradient wash that fades in on hover */
    .cat-card::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: -1;
      background: linear-gradient(135deg,
        color-mix(in oklch, var(--color-primary-500) 9%, transparent),
        transparent 62%);
      opacity: 0;
      transition: opacity 0.28s ease;
    }

    .cat-card:hover,
    .cat-card:focus-visible {
      transform: translateY(-4px);
      border-color: var(--color-primary-200, #a7f3d0);
      box-shadow: 0 14px 30px -10px rgba(16, 24, 40, 0.18),
                  0 6px 12px -8px rgba(16, 24, 40, 0.1);
    }
    .cat-card:hover::before,
    .cat-card:focus-visible::before { opacity: 1; }
    .cat-card:active { transform: translateY(-1px) scale(0.99); }
    .cat-card:focus-visible {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }

    .cat-card__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      flex-shrink: 0;
      border-radius: 0.9rem;
      color: var(--color-primary-600, #9B5FC0);
      background: linear-gradient(135deg,
        color-mix(in oklch, var(--color-primary-500) 16%, transparent),
        color-mix(in oklch, var(--color-accent-400) 16%, transparent));
      transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .cat-card:hover .cat-card__icon { transform: scale(1.08) rotate(-4deg); }

    .cat-card__body {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
      flex: 1;
    }
    .cat-card__name {
      font-weight: 600;
      font-size: 0.975rem;
      color: var(--color-gray-900, #111827);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color 0.2s ease;
    }
    .cat-card:hover .cat-card__name { color: var(--color-primary-600, #9B5FC0); }
    .cat-card__meta {
      font-size: 0.75rem;
      color: var(--color-gray-500, #6b7280);
    }

    .cat-card__arrow {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
      color: var(--color-gray-300, #d1d5db);
      transition: transform 0.28s ease, color 0.28s ease;
    }
    .cat-card:hover .cat-card__arrow {
      color: var(--color-primary-500, #B57EDC);
      transform: translateX(4px);
    }
    :host-context([dir="rtl"]) .cat-card__arrow { transform: scaleX(-1); }
    :host-context([dir="rtl"]) .cat-card:hover .cat-card__arrow { transform: scaleX(-1) translateX(4px); }

    /* Dark mode — soft surfaces, no pure black */
    :host-context(.dark) .cat-card {
      background: #1f2937;             /* card token */
      border-color: #374151;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    :host-context(.dark) .cat-card:hover,
    :host-context(.dark) .cat-card:focus-visible {
      border-color: var(--color-primary-700, #047857);
      box-shadow: 0 16px 32px -12px rgba(0, 0, 0, 0.55);
    }
    :host-context(.dark) .cat-card__name { color: #e5e7eb; }
    :host-context(.dark) .cat-card:hover .cat-card__name { color: var(--color-primary-400, #34d399); }
    :host-context(.dark) .cat-card__meta { color: #9ca3af; }
    :host-context(.dark) .cat-card__arrow { color: #4b5563; }

    @media (prefers-reduced-motion: reduce) {
      .cat-card { animation: none; }
      .cat-card, .cat-card__icon, .cat-card__arrow { transition: none; }
    }
  `],
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
