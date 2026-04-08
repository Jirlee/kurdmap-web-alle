import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed, effect, input, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { BusinessService, SearchParams } from '../../core/services/business.service';
import { CategoryService } from '../../core/services/category.service';
import { CityService } from '../../core/services/city.service';
import { LanguageService } from '../../core/services/language.service';
import { SeoService } from '../../core/services/seo.service';
import { ModalService, SearchModalParams } from '../../core/services/modal.service';
import { GeolocationService, GeoStatus } from '../../core/services/geolocation.service';
import { BusinessSummary, BusinessSortOption, Category, City, PaginatedList } from '../../core/models';
import { BusinessCardComponent } from '../../shared/components/business-card/business-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { LeafletMapComponent } from '../../shared/components/leaflet-map/leaflet-map.component';

type ViewMode = 'list' | 'split' | 'map';

@Component({
  selector: 'app-search',
  imports: [
    FormsModule,
    TranslateModule,
    BusinessCardComponent,
    PaginationComponent,
    LeafletMapComponent,
  ],
  template: `
    <section class="search-section">
      <!-- Search & Filters — sticky on mobile -->
      <div class="sticky top-0 z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pb-3 pt-2 bg-surface/95 backdrop-blur-md">
        <!-- Search input — large touch target -->
        <div class="relative mb-3">
          <svg class="absolute start-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            [placeholder]="'search.placeholder' | translate"
            [attr.aria-label]="'aria.searchInput' | translate"
            class="w-full ps-12 pe-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:border-primary-400 focus-visible:bg-white dark:focus-visible:bg-gray-900 outline-none text-base transition-all duration-200"
            [ngModel]="searchText()"
            (ngModelChange)="onSearchInput($event)"
          />
          @if (searchText()) {
            <button (click)="clearSearch()" class="absolute end-4 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer">
              <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          }
        </div>

        <!-- Filters row -->
        <div class="flex gap-2 overflow-x-auto scrollbar-hidden -mx-1 px-1 pb-1">
          <!-- Near Me button -->
          @if (isBrowser) {
            <button
              (click)="onNearMeToggle()"
              class="filter-chip-btn"
              [class.active]="nearMeActive()"
              [class.loading]="geoService.status() === 'loading'"
              [disabled]="geoService.status() === 'loading'"
            >
              @if (geoService.status() === 'loading') {
                <svg class="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              } @else {
                <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                </svg>
              }
              {{ 'search.nearMe' | translate }}
            </button>
          }

          <!-- Radius selector (only when near-me is active) -->
          @if (nearMeActive()) {
            <select
              class="filter-chip"
              [ngModel]="selectedRadius()"
              (ngModelChange)="onRadiusChange($event)"
            >
              <option [value]="1">1 km</option>
              <option [value]="5">5 km</option>
              <option [value]="10">10 km</option>
              <option [value]="25">25 km</option>
              <option [value]="50">50 km</option>
            </select>
          }

          <!-- Category filter -->
          <select
            class="filter-chip"
            [ngModel]="selectedCategory()"
            (ngModelChange)="onCategoryChange($event)"
          >
            <option value="">{{ 'search.allCategories' | translate }}</option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.slug">{{ langService.getLocalizedField(cat) }}</option>
            }
          </select>

          <!-- City filter -->
          <select
            class="filter-chip"
            [ngModel]="selectedCity()"
            (ngModelChange)="onCityChange($event)"
          >
            <option value="">{{ 'search.allCities' | translate }}</option>
            @for (city of cities(); track city.id) {
              <option [value]="city.slug">{{ langService.getLocalizedField(city) }}</option>
            }
          </select>

          <!-- Sort -->
          <select
            class="filter-chip"
            [ngModel]="selectedSort()"
            (ngModelChange)="onSortChange($event)"
          >
            <option [value]="0">{{ 'search.relevance' | translate }}</option>
            <option [value]="1">{{ 'search.name' | translate }}</option>
            <option [value]="2">{{ 'search.newest' | translate }}</option>
            <option [value]="3">{{ 'search.verifiedFirst' | translate }}</option>
            <option [value]="5">{{ 'search.featuredFirst' | translate }}</option>
            @if (nearMeActive()) {
              <option [value]="4">{{ 'search.nearestFirst' | translate }}</option>
            }
          </select>

          <!-- Spacer -->
          <div class="flex-1"></div>

          <!-- View mode toggles -->
          <div class="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 shrink-0">
            <button
              (click)="viewMode.set('list')"
              class="view-toggle"
              [class.active]="viewMode() === 'list'"
              [attr.aria-label]="'search.listView' | translate"
            >
              <svg class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
              </svg>
            </button>
            <button
              (click)="viewMode.set('split')"
              class="view-toggle hidden lg:flex"
              [class.active]="viewMode() === 'split'"
              [attr.aria-label]="'search.splitView' | translate"
            >
              <svg class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 4.5v15m6-15v15M4.5 19.5h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5z"/>
              </svg>
            </button>
            <button
              (click)="viewMode.set('map')"
              class="view-toggle"
              [class.active]="viewMode() === 'map'"
              [attr.aria-label]="'search.mapView' | translate"
            >
              <svg class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Active filters bar -->
        @if (hasActiveFilters()) {
          <div class="flex items-center gap-2 mt-2 flex-wrap">
            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ 'search.activeFilters' | translate }}:</span>
            @if (searchText()) {
              <span class="active-chip">
                "{{ searchText() }}"
                <button (click)="clearSearch()" class="active-chip-x">×</button>
              </span>
            }
            @if (selectedCategory()) {
              <span class="active-chip">
                {{ selectedCategoryName() }}
                <button (click)="onCategoryChange('')" class="active-chip-x">×</button>
              </span>
            }
            @if (selectedCity()) {
              <span class="active-chip">
                {{ selectedCityName() }}
                <button (click)="onCityChange('')" class="active-chip-x">×</button>
              </span>
            }
            @if (nearMeActive()) {
              <span class="active-chip">
                {{ 'search.nearMe' | translate }} ({{ selectedRadius() }} km)
                <button (click)="onNearMeToggle()" class="active-chip-x">×</button>
              </span>
            }
            <button (click)="clearAllFilters()" class="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline cursor-pointer">
              {{ 'search.clearAll' | translate }}
            </button>
          </div>
        }
      </div>

      <!-- Results count & location status -->
      <div class="flex items-center justify-between mb-4 mt-2" aria-live="polite" aria-atomic="true">
        <div class="text-sm text-gray-500 dark:text-gray-400 font-medium">
          @if (!loading()) {
            {{ 'search.resultsCount' | translate: { count: totalCount() } }}
          }
        </div>
        @if (geoService.status() === 'denied') {
          <div class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
            </svg>
            {{ 'search.locationDenied' | translate }}
          </div>
        }
      </div>

      <!-- Content: list / split / map views -->
      @if (viewMode() === 'split' && isBrowser) {
        <!-- Split view: list + map side by side -->
        <div class="split-container">
          <div class="split-list">
            @if (loading()) {
              <div class="grid grid-cols-1 gap-4">
                @for (i of skeletonItems; track i) {
                  <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-card overflow-hidden">
                    <div class="flex gap-3 p-3">
                      <div class="shimmer-bg animate-shimmer w-24 h-20 rounded-xl shrink-0"></div>
                      <div class="flex-1 space-y-2 py-1">
                        <div class="shimmer-bg animate-shimmer h-4 w-3/4 rounded-lg"></div>
                        <div class="shimmer-bg animate-shimmer h-3 w-1/2 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else if (businesses().length === 0) {
              <div class="py-12 text-center">
                <div class="size-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg class="size-8 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">{{ 'search.noResults' | translate }}</h3>
                <p class="text-gray-500 dark:text-gray-400 text-sm">{{ 'search.noResultsHint' | translate }}</p>
              </div>
            } @else {
              <div class="grid grid-cols-1 gap-4">
                @for (business of businesses(); track business.id) {
                  <app-business-card [business]="business" [searchTerm]="searchText()" />
                }
              </div>
              <div class="mt-6">
                <app-pagination [currentPage]="currentPage()" [totalPages]="totalPages()" (pageChange)="onPageChange($event)" />
              </div>
            }
          </div>
          <div class="split-map">
            <app-leaflet-map
              [businesses]="businesses()"
              height="100%"
              (markerClick)="onMarkerClick($event)"
            />
          </div>
        </div>
      } @else if (viewMode() === 'map' && isBrowser) {
        <!-- Full map view -->
        <div class="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-card" style="height: 60vh; min-height: 24rem;">
          <app-leaflet-map
            [businesses]="businesses()"
            height="100%"
            (markerClick)="onMarkerClick($event)"
          />
        </div>
      } @else {
        <!-- List view (default) -->

        <!-- Standalone map toggle (list mode) -->
        @if (showMap() && isBrowser) {
          <div class="mb-6 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-card">
            <app-leaflet-map
              [businesses]="businesses()"
              height="280px"
              (markerClick)="onMarkerClick($event)"
            />
          </div>
        }

        @if (loading()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            @for (i of skeletonItems; track i) {
              <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-card overflow-hidden">
                <div class="shimmer-bg animate-shimmer aspect-[4/3]"></div>
                <div class="p-4 space-y-3">
                  <div class="shimmer-bg animate-shimmer h-5 w-3/4 rounded-lg"></div>
                  <div class="shimmer-bg animate-shimmer h-4 w-1/2 rounded-lg"></div>
                </div>
              </div>
            }
          </div>
        } @else if (businesses().length === 0) {
          <div class="text-center py-16">
            <div class="size-20 mx-auto mb-6 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg class="size-10 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              {{ 'search.noResults' | translate }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
              {{ 'search.noResultsHint' | translate }}
            </p>
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            @for (business of businesses(); track business.id) {
              <app-business-card [business]="business" [searchTerm]="searchText()" />
            }
          </div>

          <div class="mt-8">
            <app-pagination
              [currentPage]="currentPage()"
              [totalPages]="totalPages()"
              (pageChange)="onPageChange($event)"
            />
          </div>
        }
      }
    </section>
  `,
  styles: [`
    .search-section {
      padding: 1rem 1rem 2.5rem;
    }
    @media (min-width: 640px) { .search-section { padding: 1.5rem 1.5rem 2.5rem; } }
    @media (min-width: 1024px) { .search-section { padding: 1.5rem 2rem 2.5rem; } }

    .filter-chip {
      flex-shrink: 0;
      padding: 0.5rem 0.875rem;
      background: var(--color-gray-50, #f9fafb);
      border: 1px solid var(--color-gray-200, #e5e7eb);
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-gray-700, #374151);
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
      min-height: 2.5rem;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
      padding-inline-end: 1.75rem;
    }
    :host-context([dir="rtl"]) .filter-chip {
      background-position: left 0.5rem center;
      padding-inline-end: 0.875rem;
      padding-inline-start: 1.75rem;
    }
    .filter-chip:focus-visible {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }

    .filter-chip-btn {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      background: var(--color-gray-50, #f9fafb);
      border: 1px solid var(--color-gray-200, #e5e7eb);
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-gray-700, #374151);
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
      min-height: 2.5rem;
    }
    .filter-chip-btn:active {
      transform: scale(0.95);
    }
    .filter-chip-btn.active {
      background: var(--color-primary-50);
      border-color: var(--color-primary-300);
      color: var(--color-primary-700);
    }
    .filter-chip-btn:focus-visible {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }
    .filter-chip-btn.loading {
      opacity: 0.7;
      cursor: wait;
    }

    :host-context(.dark) .filter-chip,
    :host-context(.dark) .filter-chip-btn {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
      color: var(--color-gray-300);
    }

    /* View mode toggles */
    .view-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.375rem;
      border-radius: 0.5rem;
      border: none;
      background: transparent;
      color: var(--color-gray-400, #9ca3af);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .view-toggle.active {
      background: white;
      color: var(--color-gray-700, #374151);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    :host-context(.dark) .view-toggle.active {
      background: var(--color-gray-700);
      color: var(--color-gray-200);
    }

    /* Active filter chips */
    .active-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: var(--color-primary-50, rgba(59, 130, 246, 0.06));
      border: 1px solid var(--color-primary-200, rgba(59, 130, 246, 0.2));
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-primary-700);
      white-space: nowrap;
    }
    .active-chip-x {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: var(--color-primary-400);
      cursor: pointer;
      font-size: 0.875rem;
      line-height: 1;
    }
    .active-chip-x:hover {
      background: var(--color-primary-100);
      color: var(--color-primary-700);
    }
    :host-context(.dark) .active-chip {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.2);
      color: var(--color-primary-400);
    }

    /* Split view layout */
    .split-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      height: 65vh;
      min-height: 28rem;
    }
    .split-list {
      overflow-y: auto;
      overscroll-behavior: contain;
      padding-inline-end: 0.5rem;
    }
    .split-map {
      border-radius: 1rem;
      overflow: hidden;
      border: 1px solid var(--color-gray-200, #e5e7eb);
    }
    :host-context(.dark) .split-map {
      border-color: rgba(255, 255, 255, 0.1);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SearchComponent implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly categoryService = inject(CategoryService);
  private readonly cityService = inject(CityService);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(ModalService);
  protected readonly langService = inject(LanguageService);
  protected readonly geoService = inject(GeolocationService);

  /** Modal input params from ModalService */
  readonly modalParams = input<SearchModalParams | undefined>(undefined);

  protected readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly searchSubject = new Subject<string>();

  protected readonly searchText = signal('');
  protected readonly selectedCategory = signal('');
  protected readonly selectedCity = signal('');
  protected readonly selectedSort = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly businesses = signal<BusinessSummary[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly loading = signal(true);
  protected readonly showMap = signal(false);
  protected readonly nearMeActive = signal(false);
  protected readonly selectedRadius = signal(5);
  protected readonly viewMode = signal<ViewMode>('list');
  protected readonly categories = this.categoryService.categories;
  protected readonly cities = this.cityService.cities;
  protected readonly skeletonItems = Array(6).fill(0);

  protected readonly hasActiveFilters = computed(() =>
    !!this.searchText() || !!this.selectedCategory() || !!this.selectedCity() || this.nearMeActive()
  );

  protected readonly selectedCategoryName = computed(() => {
    const slug = this.selectedCategory();
    if (!slug) return '';
    const cat = this.categories().find(c => c.slug === slug);
    return cat ? this.langService.getLocalizedField(cat) : slug;
  });

  protected readonly selectedCityName = computed(() => {
    const slug = this.selectedCity();
    if (!slug) return '';
    const city = this.cities().find(c => c.slug === slug);
    return city ? this.langService.getLocalizedField(city) : slug;
  });

  constructor() {
    // Debounced search input
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(text => {
      this.searchText.set(text);
      this.currentPage.set(1);
      this.executeSearch();
    });
  }

  ngOnInit(): void {
    // Load categories/cities if not already cached
    if (this.categories().length === 0) {
      this.categoryService.getAll().subscribe();
    }
    if (this.cities().length === 0) {
      this.cityService.getAll().subscribe();
    }

    // Read modal params
    const params = this.modalParams();
    if (params) {
      this.searchText.set(params.q ?? '');
      this.selectedCategory.set(params.category ?? '');
      this.selectedCity.set(params.city ?? '');
      if (params.nearMe) {
        this.activateNearMe();
        return; // search triggered after location acquired
      }
    }
    this.executeSearch();

    this.seo.updateMeta({
      title: this.translate.instant('search.title'),
      description: this.translate.instant('home.subtitle'),
    });
  }

  protected onSearchInput(text: string): void {
    this.searchSubject.next(text);
  }

  protected onCategoryChange(slug: string): void {
    this.selectedCategory.set(slug);
    this.currentPage.set(1);
    this.executeSearch();
  }

  protected onCityChange(slug: string): void {
    this.selectedCity.set(slug);
    this.currentPage.set(1);
    this.executeSearch();
  }

  protected onSortChange(sort: string): void {
    this.selectedSort.set(+sort);
    this.currentPage.set(1);
    this.executeSearch();
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.executeSearch();
  }

  protected onMarkerClick(business: BusinessSummary): void {
    this.modalService.openBusinessDetail(business.slug);
  }

  protected async onNearMeToggle(): Promise<void> {
    if (this.nearMeActive()) {
      // Deactivate near-me
      this.nearMeActive.set(false);
      this.geoService.clearLocation();
      if (this.selectedSort() === 4) this.selectedSort.set(0);
      this.currentPage.set(1);
      this.executeSearch();
    } else {
      await this.activateNearMe();
    }
  }

  protected onRadiusChange(radius: string): void {
    this.selectedRadius.set(+radius);
    this.geoService.radiusKm.set(+radius);
    this.currentPage.set(1);
    this.executeSearch();
  }

  private async activateNearMe(): Promise<void> {
    const loc = await this.geoService.requestLocation();
    if (loc) {
      this.nearMeActive.set(true);
      this.selectedSort.set(4); // NearestFirst
      this.viewMode.set('split');
      this.currentPage.set(1);
      this.executeSearch();
    }
  }

  protected clearSearch(): void {
    this.searchText.set('');
    this.searchSubject.next('');
    this.currentPage.set(1);
    this.executeSearch();
  }

  protected clearAllFilters(): void {
    this.searchText.set('');
    this.searchSubject.next('');
    this.selectedCategory.set('');
    this.selectedCity.set('');
    this.selectedSort.set(0);
    if (this.nearMeActive()) {
      this.nearMeActive.set(false);
      this.geoService.clearLocation();
    }
    this.currentPage.set(1);
    this.executeSearch();
  }

  private executeSearch(): void {
    this.loading.set(true);
    const loc = this.geoService.location();
    const params: SearchParams = {
      search: this.searchText() || undefined,
      category: this.selectedCategory() || undefined,
      city: this.selectedCity() || undefined,
      sort: this.selectedSort() as BusinessSortOption,
      page: this.currentPage(),
      pageSize: 12,
      latitude: this.nearMeActive() && loc ? loc.latitude : undefined,
      longitude: this.nearMeActive() && loc ? loc.longitude : undefined,
      radiusKm: this.nearMeActive() && loc ? this.selectedRadius() : undefined,
    };

    this.businessService.search(params).subscribe({
      next: (result) => {
        this.businesses.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.businesses.set([]);
        this.totalCount.set(0);
        this.totalPages.set(0);
        this.loading.set(false);
      },
    });
  }
}
