import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  PLATFORM_ID,
  DestroyRef,
  ElementRef,
  viewChild,
  effect,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BusinessService, SearchParams } from '../../../core/services/business.service';
import { CategoryService } from '../../../core/services/category.service';
import { CityService } from '../../../core/services/city.service';
import { LanguageService } from '../../../core/services/language.service';
import { ModalService } from '../../../core/services/modal.service';
import { BrowserStorageService } from '../../../core/services/browser-storage.service';
import { BusinessSummary, Category, City } from '../../../core/models';

interface RecentSearch {
  text: string;
  timestamp: number;
}

@Component({
  selector: 'app-command-palette',
  imports: [FormsModule, TranslateModule],
  template: `
    @if (isOpen()) {
      <div class="cp-backdrop" (click)="close()" role="presentation">
        <div class="cp-container" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <!-- Search input -->
          <div class="cp-input-row">
            <svg class="size-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              #searchInput
              type="text"
              [placeholder]="'commandPalette.placeholder' | translate"
              class="cp-input"
              [ngModel]="query()"
              (ngModelChange)="onInput($event)"
              (keydown.escape)="close()"
              (keydown.arrowDown)="onArrowDown($event)"
              (keydown.arrowUp)="onArrowUp($event)"
              (keydown.enter)="onEnter()"
            />
            <kbd class="cp-kbd hidden sm:flex">Esc</kbd>
          </div>

          <!-- Results area -->
          <div class="cp-results" #resultsContainer>
            @if (!query()) {
              <!-- Recent searches -->
              @if (recentSearches().length > 0) {
                <div class="cp-section">
                  <div class="cp-section-header">
                    <span>{{ 'commandPalette.recentSearches' | translate }}</span>
                    <button (click)="clearRecent()" class="cp-clear-btn">
                      {{ 'commandPalette.clearRecent' | translate }}
                    </button>
                  </div>
                  @for (recent of recentSearches(); track recent.timestamp; let i = $index) {
                    <button
                      class="cp-item"
                      [class.cp-item-active]="activeIndex() === i"
                      (click)="selectRecent(recent)"
                      (mouseenter)="activeIndex.set(i)"
                    >
                      <svg class="size-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span class="truncate">{{ recent.text }}</span>
                    </button>
                  }
                </div>
              } @else {
                <div class="cp-empty">
                  <svg class="size-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <span>{{ 'commandPalette.typeToSearch' | translate }}</span>
                </div>
              }
            } @else if (searching()) {
              <div class="cp-loading">
                <div class="cp-spinner"></div>
              </div>
            } @else {
              @if (allResults().length === 0) {
                <div class="cp-empty">
                  <span>{{ 'commandPalette.noResults' | translate }}</span>
                </div>
              }

              <!-- Matched categories -->
              @if (matchedCategories().length > 0) {
                <div class="cp-section">
                  <div class="cp-section-header">
                    <span>{{ 'commandPalette.categories' | translate }}</span>
                  </div>
                  @for (cat of matchedCategories(); track cat.id; let i = $index) {
                    <button
                      class="cp-item"
                      [class.cp-item-active]="activeIndex() === categoryStartIndex() + i"
                      (click)="selectCategory(cat)"
                      (mouseenter)="activeIndex.set(categoryStartIndex() + i)"
                    >
                      <svg class="size-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"/>
                      </svg>
                      <span class="truncate">{{ langService.getLocalizedField(cat) }}</span>
                      <span class="cp-badge">{{ 'commandPalette.categories' | translate }}</span>
                    </button>
                  }
                </div>
              }

              <!-- Matched cities -->
              @if (matchedCities().length > 0) {
                <div class="cp-section">
                  <div class="cp-section-header">
                    <span>{{ 'commandPalette.cities' | translate }}</span>
                  </div>
                  @for (city of matchedCities(); track city.id; let i = $index) {
                    <button
                      class="cp-item"
                      [class.cp-item-active]="activeIndex() === cityStartIndex() + i"
                      (click)="selectCity(city)"
                      (mouseenter)="activeIndex.set(cityStartIndex() + i)"
                    >
                      <svg class="size-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <span class="truncate">{{ langService.getLocalizedField(city) }}</span>
                      <span class="cp-badge">{{ 'commandPalette.cities' | translate }}</span>
                    </button>
                  }
                </div>
              }

              <!-- Matched businesses -->
              @if (matchedBusinesses().length > 0) {
                <div class="cp-section">
                  <div class="cp-section-header">
                    <span>{{ 'commandPalette.businesses' | translate }}</span>
                  </div>
                  @for (biz of matchedBusinesses(); track biz.id; let i = $index) {
                    <button
                      class="cp-item"
                      [class.cp-item-active]="activeIndex() === businessStartIndex() + i"
                      (click)="selectBusiness(biz)"
                      (mouseenter)="activeIndex.set(businessStartIndex() + i)"
                    >
                      @if (biz.primaryImageUrl) {
                        <img [src]="biz.primaryImageUrl" [alt]="langService.getLocalized(biz.name)" class="size-8 rounded-lg object-cover shrink-0" />
                      } @else {
                        <div class="size-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                          <svg class="size-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>
                          </svg>
                        </div>
                      }
                      <div class="min-w-0 flex-1 text-start">
                        <span class="block truncate text-sm">{{ langService.getLocalized(biz.name) }}</span>
                        <span class="block truncate text-xs text-gray-400">{{ biz.street }}, {{ biz.postalCode }}</span>
                      </div>
                      @if (biz.isVerified) {
                        <svg class="size-4 text-primary-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                      }
                    </button>
                  }
                </div>
              }
            }
          </div>

          <!-- Footer hint -->
          <div class="cp-footer">
            <div class="flex items-center gap-3 text-xs text-gray-400">
              <span class="inline-flex items-center gap-1"><kbd class="cp-kbd-sm">↑↓</kbd> navigate</span>
              <span class="inline-flex items-center gap-1"><kbd class="cp-kbd-sm">↵</kbd> select</span>
              <span class="inline-flex items-center gap-1"><kbd class="cp-kbd-sm">esc</kbd> close</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .cp-backdrop {
      position: fixed;
      inset: 0;
      z-index: 200;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 15vh;
      animation: cp-fade-in 0.15s ease-out;
    }

    .cp-container {
      width: 100%;
      max-width: 36rem;
      margin: 0 1rem;
      background: var(--color-surface, #fff);
      border-radius: 1rem;
      box-shadow:
        0 25px 50px -12px rgba(0, 0, 0, 0.25),
        0 0 0 1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      animation: cp-slide-down 0.2s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .cp-input-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .cp-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 1rem;
      color: var(--color-gray-900, #111);
      font-weight: 400;
    }
    .cp-input::placeholder {
      color: var(--color-gray-400, #9ca3af);
    }

    .cp-kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.125rem 0.5rem;
      border-radius: 0.375rem;
      border: 1px solid rgba(0, 0, 0, 0.1);
      background: rgba(0, 0, 0, 0.04);
      font-family: inherit;
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--color-gray-500, #6b7280);
      line-height: 1.5;
    }

    .cp-kbd-sm {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 0.25rem;
      border-radius: 0.25rem;
      border: 1px solid rgba(0, 0, 0, 0.08);
      background: rgba(0, 0, 0, 0.03);
      font-family: inherit;
      font-size: 0.625rem;
      line-height: 1.6;
    }

    .cp-results {
      max-height: 20rem;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .cp-section {
      padding: 0.25rem 0;
    }

    .cp-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.375rem 1rem;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-gray-400, #9ca3af);
    }

    .cp-clear-btn {
      font-size: 0.6875rem;
      font-weight: 500;
      text-transform: none;
      letter-spacing: normal;
      color: var(--color-primary-500);
      cursor: pointer;
      border: none;
      background: transparent;
      padding: 0;
    }
    .cp-clear-btn:hover {
      text-decoration: underline;
    }

    .cp-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--color-gray-700, #374151);
      transition: background 0.1s ease;
      text-align: start;
    }
    .cp-item:hover,
    .cp-item-active {
      background: var(--color-primary-50, rgba(59, 130, 246, 0.06));
    }

    .cp-badge {
      margin-inline-start: auto;
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--color-gray-400, #9ca3af);
      white-space: nowrap;
    }

    .cp-empty {
      padding: 2rem 1rem;
      text-align: center;
      font-size: 0.875rem;
      color: var(--color-gray-400, #9ca3af);
    }

    .cp-loading {
      padding: 2rem;
      display: flex;
      justify-content: center;
    }

    .cp-spinner {
      width: 1.5rem;
      height: 1.5rem;
      border: 2px solid rgba(0, 0, 0, 0.08);
      border-top-color: var(--color-primary-500);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    .cp-footer {
      padding: 0.5rem 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    /* Dark mode */
    :host-context(.dark) .cp-container {
      background: var(--color-surface, #0f172a);
      box-shadow:
        0 25px 50px -12px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.05);
    }
    :host-context(.dark) .cp-input {
      color: var(--color-gray-100, #f1f5f9);
    }
    :host-context(.dark) .cp-input-row,
    :host-context(.dark) .cp-footer {
      border-color: rgba(255, 255, 255, 0.06);
    }
    :host-context(.dark) .cp-item {
      color: var(--color-gray-300, #d1d5db);
    }
    :host-context(.dark) .cp-item:hover,
    :host-context(.dark) .cp-item-active {
      background: rgba(255, 255, 255, 0.05);
    }
    :host-context(.dark) .cp-kbd,
    :host-context(.dark) .cp-kbd-sm {
      border-color: rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: var(--color-gray-500);
    }

    @keyframes cp-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes cp-slide-down {
      from { opacity: 0; transform: translateY(-8px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .cp-backdrop,
      .cp-container {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent {
  private readonly businessService = inject(BusinessService);
  private readonly categoryService = inject(CategoryService);
  private readonly cityService = inject(CityService);
  private readonly modalService = inject(ModalService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly langService = inject(LanguageService);
  private readonly storage = inject(BrowserStorageService);

  private readonly searchInput = viewChild<ElementRef>('searchInput');
  private readonly resultsContainer = viewChild<ElementRef>('resultsContainer');

  readonly isOpen = signal(false);
  readonly query = signal('');
  readonly searching = signal(false);
  readonly activeIndex = signal(0);
  readonly matchedBusinesses = signal<BusinessSummary[]>([]);
  readonly matchedCategories = signal<Category[]>([]);
  readonly matchedCities = signal<City[]>([]);
  readonly recentSearches = signal<RecentSearch[]>([]);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly RECENT_KEY = 'kurdmap-recent-searches';
  private static readonly MAX_RECENT = 5;

  readonly categoryStartIndex = computed(() => 0);
  readonly cityStartIndex = computed(() => this.matchedCategories().length);
  readonly businessStartIndex = computed(() => this.matchedCategories().length + this.matchedCities().length);
  readonly allResults = computed(() => [
    ...this.matchedCategories(),
    ...this.matchedCities(),
    ...this.matchedBusinesses(),
  ]);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRecentSearches();

      const keyHandler = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          if (this.isOpen()) {
            this.close();
          } else {
            this.open();
          }
        }
      };
      document.addEventListener('keydown', keyHandler);
      this.destroyRef.onDestroy(() => document.removeEventListener('keydown', keyHandler));
    }

    // Auto-focus input when opened
    effect(() => {
      if (this.isOpen() && isPlatformBrowser(this.platformId)) {
        requestAnimationFrame(() => {
          this.searchInput()?.nativeElement.focus();
        });
      }
    });
  }

  open(): void {
    this.isOpen.set(true);
    this.query.set('');
    this.activeIndex.set(0);
    this.matchedBusinesses.set([]);
    this.matchedCategories.set([]);
    this.matchedCities.set([]);
    this.loadRecentSearches();
  }

  close(): void {
    this.isOpen.set(false);
    this.query.set('');
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }

  onInput(text: string): void {
    this.query.set(text);
    this.activeIndex.set(0);

    if (this.searchTimer) clearTimeout(this.searchTimer);

    if (!text.trim()) {
      this.matchedBusinesses.set([]);
      this.matchedCategories.set([]);
      this.matchedCities.set([]);
      return;
    }

    this.searching.set(true);
    this.searchTimer = setTimeout(() => this.executeSearch(text.trim()), 250);
  }

  onArrowDown(event: Event): void {
    event.preventDefault();
    const total = this.query() ? this.allResults().length : this.recentSearches().length;
    if (total > 0) {
      this.activeIndex.set((this.activeIndex() + 1) % total);
      this.scrollActiveIntoView();
    }
  }

  onArrowUp(event: Event): void {
    event.preventDefault();
    const total = this.query() ? this.allResults().length : this.recentSearches().length;
    if (total > 0) {
      this.activeIndex.set((this.activeIndex() - 1 + total) % total);
      this.scrollActiveIntoView();
    }
  }

  onEnter(): void {
    if (!this.query()) {
      const recents = this.recentSearches();
      if (recents.length > 0 && this.activeIndex() < recents.length) {
        this.selectRecent(recents[this.activeIndex()]);
      }
      return;
    }

    const idx = this.activeIndex();
    const cats = this.matchedCategories();
    const cities = this.matchedCities();
    const bizs = this.matchedBusinesses();

    if (idx < cats.length) {
      this.selectCategory(cats[idx]);
    } else if (idx < cats.length + cities.length) {
      this.selectCity(cities[idx - cats.length]);
    } else if (idx < cats.length + cities.length + bizs.length) {
      this.selectBusiness(bizs[idx - cats.length - cities.length]);
    } else {
      // No specific result selected — open search with text
      this.saveRecent(this.query());
      this.close();
      this.modalService.openSearch({ q: this.query() });
    }
  }

  selectCategory(cat: Category): void {
    this.saveRecent(this.langService.getLocalizedField(cat));
    this.close();
    this.modalService.openSearch({ category: cat.slug });
  }

  selectCity(city: City): void {
    this.saveRecent(this.langService.getLocalizedField(city));
    this.close();
    this.modalService.openSearch({ city: city.slug });
  }

  selectBusiness(biz: BusinessSummary): void {
    this.saveRecent(this.langService.getLocalized(biz.name));
    this.close();
    this.modalService.openBusinessDetail(biz.slug);
  }

  selectRecent(recent: RecentSearch): void {
    this.close();
    this.modalService.openSearch({ q: recent.text });
  }

  clearRecent(): void {
    this.recentSearches.set([]);
    this.storage.removeItem(CommandPaletteComponent.RECENT_KEY);
  }

  private executeSearch(text: string): void {
    // Filter categories and cities locally
    const lowerText = text.toLowerCase();
    const cats = this.categoryService.categories().filter(c =>
      this.langService.getLocalizedField(c).toLowerCase().includes(lowerText)
    );
    const cities = this.cityService.cities().filter(c =>
      this.langService.getLocalizedField(c).toLowerCase().includes(lowerText)
    );
    this.matchedCategories.set(cats.slice(0, 3));
    this.matchedCities.set(cities.slice(0, 3));

    // Search businesses via API
    this.businessService.search({ search: text, pageSize: 5 }).subscribe({
      next: (result) => {
        this.matchedBusinesses.set(result.items);
        this.searching.set(false);
      },
      error: () => {
        this.matchedBusinesses.set([]);
        this.searching.set(false);
      },
    });
  }

  private loadRecentSearches(): void {
    try {
      const stored = this.storage.getItem(CommandPaletteComponent.RECENT_KEY);
      this.recentSearches.set(stored ? JSON.parse(stored) : []);
    } catch {
      this.recentSearches.set([]);
    }
  }

  private saveRecent(text: string): void {
    if (!text.trim()) return;
    const recents = this.recentSearches().filter(r => r.text !== text);
    recents.unshift({ text, timestamp: Date.now() });
    const trimmed = recents.slice(0, CommandPaletteComponent.MAX_RECENT);
    this.recentSearches.set(trimmed);
    this.storage.setItem(CommandPaletteComponent.RECENT_KEY, JSON.stringify(trimmed));
  }

  private scrollActiveIntoView(): void {
    requestAnimationFrame(() => {
      const container = this.resultsContainer()?.nativeElement;
      const active = container?.querySelector('.cp-item-active');
      if (active) {
        active.scrollIntoView({ block: 'nearest' });
      }
    });
  }
}
