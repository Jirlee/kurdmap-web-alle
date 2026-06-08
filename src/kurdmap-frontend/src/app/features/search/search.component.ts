 import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed, effect, input, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
import { SearchHistoryService } from '../../core/services/search-history.service';
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
      <div class="filter-shell sticky top-0 z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pb-3.5 pt-3">
        <!-- Search input — large touch target -->
        <div class="relative mb-3">
          <span class="search-ico absolute start-2.5 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-xl">
            <svg class="size-4.5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </span>
          <input
            type="text"
            [placeholder]="'search.placeholder' | translate"
            [attr.aria-label]="'aria.searchInput' | translate"
            class="search-input w-full ps-13 pe-4 py-3.5 outline-none text-base"
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
            <label class="select-chip active">
              <svg class="lead size-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3.25"/>
                <circle cx="12" cy="12" r="8.5" stroke-dasharray="3 3"/>
              </svg>
              <select
                [ngModel]="selectedRadius()"
                (ngModelChange)="onRadiusChange($event)"
              >
                <option [value]="1">1 km</option>
                <option [value]="5">5 km</option>
                <option [value]="10">10 km</option>
                <option [value]="25">25 km</option>
                <option [value]="50">50 km</option>
              </select>
            </label>
          }

          <!-- Category filter -->
          <label class="select-chip" [class.active]="!!selectedCategory()">
            <svg class="lead size-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
            </svg>
            <select
              [ngModel]="selectedCategory()"
              (ngModelChange)="onCategoryChange($event)"
            >
              <option value="">{{ 'search.allCategories' | translate }}</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.slug">{{ langService.getLocalizedField(cat) }}</option>
              }
            </select>
          </label>

          <!-- City filter -->
          <label class="select-chip" [class.active]="!!selectedCity()">
            <svg class="lead size-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
            </svg>
            <select
              [ngModel]="selectedCity()"
              (ngModelChange)="onCityChange($event)"
            >
              <option value="">{{ 'search.allCities' | translate }}</option>
              @for (city of cities(); track city.id) {
                <option [value]="city.slug">{{ langService.getLocalizedField(city) }}</option>
              }
            </select>
          </label>

          <!-- Sort -->
          <label class="select-chip" [class.active]="selectedSort() !== 0">
            <svg class="lead size-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v18M21 16.5L16.5 21m0 0L12 16.5m4.5 4.5V3"/>
            </svg>
            <select
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
          </label>

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

      <!-- Predictive suggestions — recent searches + popular categories -->
      @if (showSuggestions()) {
        <div class="suggestions-panel">
          @if (recentSearches().length > 0) {
            <div class="mb-5">
              <div class="flex items-center justify-between mb-2.5">
                <h3 class="suggestions-heading">
                  <svg class="size-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ 'search.recentSearches' | translate }}
                </h3>
                <button (click)="clearSearchHistory()" class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium cursor-pointer">
                  {{ 'search.clearAll' | translate }}
                </button>
              </div>
              <div class="flex flex-wrap gap-2">
                @for (q of recentSearches(); track q) {
                  <button (click)="applyRecentSearch(q)" class="recent-chip">
                    <svg class="size-3.5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="truncate max-w-[12rem]">{{ q }}</span>
                    <span (click)="removeRecentSearch($event, q)" class="recent-chip-x" role="button" tabindex="-1" [attr.aria-label]="'common.remove' | translate">×</span>
                  </button>
                }
              </div>
            </div>
          }

          @if (popularCategories().length > 0) {
            <div>
              <h3 class="suggestions-heading mb-2.5">
                <svg class="size-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
                </svg>
                {{ 'search.browseCategories' | translate }}
              </h3>
              <div class="flex flex-wrap gap-2">
                @for (cat of popularCategories(); track cat.id) {
                  <button (click)="applyCategorySuggestion(cat.slug)" class="category-suggestion-chip">
                    @if (cat.icon) { <span aria-hidden="true">{{ cat.icon }}</span> }
                    <span>{{ langService.getLocalizedField(cat) }}</span>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

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
        @if (geoService.status() === 'approximate') {
          <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ 'search.locationApproximate' | translate }}
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
            @if (hasActiveFilters()) {
              <button (click)="clearAllFilters()" class="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 outline-none">
                <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                {{ 'search.clearAll' | translate }}
              </button>
            }
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
      width: 100%;
      max-width: 80rem;
      margin-inline: auto;
      box-sizing: border-box;
      /* Never let inner content force horizontal scrolling on mobile */
      overflow-x: clip;
    }
    @media (min-width: 640px) { .search-section { padding: 1.5rem 1.5rem 2.5rem; } }
    @media (min-width: 1024px) { .search-section { padding: 1.5rem 2rem 2.5rem; } }

    /* Allow grid/flex children to shrink instead of overflowing their track */
    .search-section :where(.grid, .flex) { min-width: 0; }
    .search-section app-business-card { display: block; min-width: 0; max-width: 100%; }

    /* ===== Filter shell — professional glass panel ===== */
    .filter-shell {
      background:
        linear-gradient(180deg, color-mix(in oklab, var(--color-primary-50) 70%, white) 0%, var(--color-surface) 100%);
      backdrop-filter: blur(18px) saturate(180%);
      -webkit-backdrop-filter: blur(18px) saturate(180%);
      border-bottom: 1px solid color-mix(in oklab, var(--color-primary-200) 60%, transparent);
      box-shadow: 0 10px 30px -20px color-mix(in oklab, var(--color-primary-500) 60%, transparent);
    }
    :host-context(.dark) .filter-shell {
      background: linear-gradient(180deg, rgba(45, 27, 61, 0.55) 0%, var(--color-surface) 100%);
      border-bottom-color: rgba(181, 126, 220, 0.2);
    }

    /* Search input — premium pill with gradient icon */
    .search-ico {
      background: linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500));
      box-shadow: 0 4px 12px -4px color-mix(in oklab, var(--color-primary-500) 70%, transparent);
    }
    .search-input {
      background: rgba(255, 255, 255, 0.75);
      border: 1px solid color-mix(in oklab, var(--color-primary-200) 70%, transparent);
      border-radius: 1rem;
      color: var(--color-gray-800);
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }
    .search-input::placeholder { color: var(--color-gray-400); }
    .search-input:focus-visible {
      background: #fff;
      border-color: var(--color-primary-400);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary-500) 18%, transparent);
    }
    :host-context(.dark) .search-input {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(181, 126, 220, 0.25);
      color: var(--color-gray-200);
    }
    :host-context(.dark) .search-input:focus-visible {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--color-primary-400);
    }

    /* ===== Select chips with leading icons ===== */
    .select-chip {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
      padding-inline: 0.875rem 0.75rem;
      min-height: 2.875rem;
      border-radius: 1rem;
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid color-mix(in oklab, var(--color-primary-200) 65%, transparent);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
      cursor: pointer;
      transition: transform 0.18s var(--ease-spring), border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
    }
    .select-chip .lead {
      color: var(--color-primary-500);
      flex-shrink: 0;
      transition: color 0.18s ease;
    }
    .select-chip select {
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      border: none;
      outline: none;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-gray-700);
      cursor: pointer;
      min-width: 0;
      padding-inline-end: 1.25rem;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right center;
    }
    :host-context([dir="rtl"]) .select-chip select {
      padding-inline-end: 0;
      padding-inline-start: 1.25rem;
      background-position: left center;
    }
    .select-chip:hover {
      transform: translateY(-1px);
      border-color: var(--color-primary-300);
      box-shadow: var(--shadow-card-hover);
    }
    .select-chip.active {
      background: linear-gradient(135deg, var(--color-primary-50), color-mix(in oklab, var(--color-accent-100) 60%, white));
      border-color: var(--color-primary-400);
      box-shadow: 0 6px 18px -10px color-mix(in oklab, var(--color-primary-500) 70%, transparent);
    }
    .select-chip.active .lead { color: var(--color-primary-600); }
    .select-chip.active select { color: var(--color-primary-700); }
    .select-chip:focus-within {
      border-color: var(--color-primary-400);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary-500) 16%, transparent);
    }
    :host-context(.dark) .select-chip {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(181, 126, 220, 0.22);
    }
    :host-context(.dark) .select-chip select { color: var(--color-gray-300); }
    :host-context(.dark) .select-chip.active {
      background: rgba(181, 126, 220, 0.16);
      border-color: var(--color-primary-500);
    }
    :host-context(.dark) .select-chip.active .lead,
    :host-context(.dark) .select-chip.active select { color: var(--color-primary-300); }

    .filter-chip-btn {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.95rem;
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid color-mix(in oklab, var(--color-primary-200) 65%, transparent);
      border-radius: 1rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-gray-700, #374151);
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
      transition: transform 0.18s var(--ease-spring), border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      white-space: nowrap;
      min-height: 2.875rem;
    }
    .filter-chip-btn:hover {
      transform: translateY(-1px);
      border-color: var(--color-primary-300);
      box-shadow: var(--shadow-card-hover);
    }
    .filter-chip-btn:active {
      transform: scale(0.96);
    }
    .filter-chip-btn.active {
      background: linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500));
      border-color: transparent;
      color: #fff;
      box-shadow: 0 8px 20px -8px color-mix(in oklab, var(--color-primary-500) 75%, transparent);
    }
    .filter-chip-btn:focus-visible {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }
    .filter-chip-btn.loading {
      opacity: 0.7;
      cursor: wait;
    }

    :host-context(.dark) .filter-chip-btn {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(181, 126, 220, 0.22);
      color: var(--color-gray-300);
    }
    :host-context(.dark) .filter-chip-btn.active {
      color: #fff;
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

    /* Suggestions panel */
    .suggestions-panel {
      padding: 0.75rem 0 0.5rem;
      animation: suggestions-fade 0.25s ease-out;
    }
    @keyframes suggestions-fade {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .suggestions-heading {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-gray-500, #6b7280);
    }
    :host-context(.dark) .suggestions-heading {
      color: var(--color-gray-400, #9ca3af);
    }
    .recent-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.5rem 0.5rem 0.75rem;
      background: var(--color-gray-50, #f9fafb);
      border: 1px solid var(--color-gray-200, #e5e7eb);
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-gray-700, #374151);
      cursor: pointer;
      transition: all 0.15s ease;
      max-width: 18rem;
    }
    .recent-chip:hover {
      background: var(--color-gray-100, #f3f4f6);
      border-color: var(--color-gray-300, #d1d5db);
    }
    .recent-chip:focus-visible {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }
    .recent-chip-x {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.125rem;
      height: 1.125rem;
      border-radius: 50%;
      color: var(--color-gray-400, #9ca3af);
      font-size: 1rem;
      line-height: 1;
      transition: all 0.15s ease;
    }
    .recent-chip-x:hover {
      background: var(--color-gray-300, #d1d5db);
      color: var(--color-gray-700, #374151);
    }
    .category-suggestion-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.875rem;
      background: var(--color-primary-50, rgba(16, 185, 129, 0.08));
      border: 1px solid var(--color-primary-100, rgba(16, 185, 129, 0.15));
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-primary-700, #047857);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .category-suggestion-chip:hover {
      background: var(--color-primary-100, rgba(16, 185, 129, 0.15));
      border-color: var(--color-primary-300);
      transform: translateY(-1px);
    }
    .category-suggestion-chip:active {
      transform: scale(0.96);
    }
    .category-suggestion-chip:focus-visible {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }
    :host-context(.dark) .recent-chip {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
      color: var(--color-gray-300);
    }
    :host-context(.dark) .recent-chip:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    :host-context(.dark) .category-suggestion-chip {
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.2);
      color: var(--color-primary-400);
    }

    /* Split view layout — stacks to single column on smaller viewports */
    .split-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      height: 65vh;
      min-height: 28rem;
    }
    @media (min-width: 1024px) {
      .split-container { grid-template-columns: 1fr 1fr; }
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
  protected readonly searchHistory = inject(SearchHistoryService);
  private readonly route = inject(ActivatedRoute);

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

  /** Predictive suggestions surface: shown only when nothing is typed/filtered. */
  protected readonly showSuggestions = computed(() => !this.hasActiveFilters());
  protected readonly recentSearches = this.searchHistory.recent;
  /** Top categories to surface as quick "trending" chips. */
  protected readonly popularCategories = computed(() => this.categories().slice(0, 8));

  constructor() {
    // Debounced search input
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(text => {
      this.searchText.set(text);
      this.currentPage.set(1);
      this.searchHistory.add(text);
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
    } else {
      // Standalone /search route — hydrate from query params for deep links.
      const qp = this.route.snapshot.queryParamMap;
      this.searchText.set(qp.get('q') ?? '');
      this.selectedCategory.set(qp.get('category') ?? '');
      this.selectedCity.set(qp.get('city') ?? '');
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

  /** Apply a recent search query from the suggestions panel. */
  protected applyRecentSearch(query: string): void {
    this.searchText.set(query);
    this.searchSubject.next(query);
    this.currentPage.set(1);
    this.searchHistory.add(query);
    this.executeSearch();
  }

  protected removeRecentSearch(event: Event, query: string): void {
    event.stopPropagation();
    this.searchHistory.remove(query);
  }

  protected clearSearchHistory(): void {
    this.searchHistory.clear();
  }

  /** Apply a category chip from the suggestions panel. */
  protected applyCategorySuggestion(slug: string): void {
    this.onCategoryChange(slug);
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
