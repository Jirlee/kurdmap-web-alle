import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
  input,
  PLATFORM_ID,
  ElementRef,
  viewChild,
  afterRenderEffect,
  DestroyRef,
} from '@angular/core';
import { isPlatformBrowser, DecimalPipe, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BusinessService } from '../../core/services/business.service';
import { CategoryService } from '../../core/services/category.service';
import { CityService } from '../../core/services/city.service';
import { LanguageService } from '../../core/services/language.service';
import { SeoService } from '../../core/services/seo.service';
import { ModalService } from '../../core/services/modal.service';
import { BusinessDetail } from '../../core/models';
import { ImageCarouselComponent } from '../../shared/components/image-carousel/image-carousel.component';
import { OpeningHoursComponent } from '../../shared/components/opening-hours/opening-hours.component';
import { ShareButtonsComponent } from '../../shared/components/share-buttons/share-buttons.component';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { DirectionsPanelComponent } from '../../shared/components/directions-panel/directions-panel.component';
import { ReviewService } from '../../core/services/review.service';
import { BrowserStorageService } from '../../core/services/browser-storage.service';

@Component({
  selector: 'app-business-detail',
  imports: [
    TranslateModule,
    DecimalPipe,
    DatePipe,
    ImageCarouselComponent,
    OpeningHoursComponent,
    ShareButtonsComponent,
    StarRatingComponent,
    DirectionsPanelComponent,
  ],
  template: `
    <!-- Loading skeleton -->
    @if (loading()) {
      <div class="px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-pulse">
        <div class="shimmer-bg animate-shimmer aspect-[16/9] sm:aspect-[21/9] rounded-3xl"></div>
        <div class="flex items-center gap-4">
          <div class="shimmer-bg animate-shimmer h-16 w-16 rounded-2xl"></div>
          <div class="flex-1 space-y-2">
            <div class="shimmer-bg animate-shimmer h-7 w-2/3 rounded-xl"></div>
            <div class="shimmer-bg animate-shimmer h-4 w-1/3 rounded-lg"></div>
          </div>
        </div>
        <div class="flex gap-3">
          <div class="shimmer-bg animate-shimmer h-12 w-28 rounded-2xl"></div>
          <div class="shimmer-bg animate-shimmer h-12 w-28 rounded-2xl"></div>
          <div class="shimmer-bg animate-shimmer h-12 w-28 rounded-2xl"></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-4">
            <div class="shimmer-bg animate-shimmer h-32 rounded-2xl"></div>
            <div class="shimmer-bg animate-shimmer h-48 rounded-2xl"></div>
          </div>
          <div class="space-y-4">
            <div class="shimmer-bg animate-shimmer h-52 rounded-2xl"></div>
            <div class="shimmer-bg animate-shimmer h-40 rounded-2xl"></div>
          </div>
        </div>
      </div>
    }

    <!-- Not found -->
    @if (notFound()) {
      <div class="px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div class="size-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center shadow-inner">
          <svg class="size-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{{ 'business.notFound' | translate }}</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">{{ 'business.notFoundHint' | translate }}</p>
        <button (click)="goToSearch()" class="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-primary-500/25 active:scale-[0.97] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 outline-none cursor-pointer">
          <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          {{ 'business.backToSearch' | translate }}
        </button>
      </div>
    }

    <!-- Business detail -->
    @if (business()) {
      <div class="pb-12">
        <!-- Hero image — cinematic aspect -->
        <div class="sm:px-6 lg:px-8 sm:pt-4">
          <div class="relative rounded-none sm:rounded-3xl overflow-hidden shadow-elevated group">
            <app-image-carousel [images]="business()!.images" />
            <!-- Gradient overlay on hero -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
            <!-- Floating badges on hero -->
            <div class="absolute top-4 start-4 flex flex-wrap gap-2">
              @if (business()!.isVerified) {
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/95 dark:bg-gray-900/90 backdrop-blur-sm text-primary-700 dark:text-primary-400 shadow-lg">
                  <svg class="size-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                  {{ 'business.verified' | translate }}
                </span>
              }
              @if (categoryName()) {
                <span class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 shadow-lg">
                  {{ categoryName() }}
                </span>
              }
            </div>
          </div>
        </div>

        <div class="px-4 sm:px-6 lg:px-8">
          <!-- Business header card — overlapping hero -->
          <div class="relative -mt-10 sm:-mt-14 z-10 mx-auto max-w-4xl">
            <div class="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-elevated p-5 sm:p-6">
              <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                <div class="flex-1 min-w-0">
                  <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight text-balance leading-tight">{{ businessName() }}</h1>
                  <div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    @if (cityName()) {
                      <span class="inline-flex items-center gap-1">
                        <svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {{ cityName() }}
                      </span>
                    }
                    @if (reviewService.reviews().length > 0) {
                      <span class="inline-flex items-center gap-1">
                        <svg class="size-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        {{ reviewService.reviews().length }} {{ (reviewService.reviews().length === 1 ? 'Review' : 'Reviews') }}
                      </span>
                    }
                  </div>
                </div>
                <!-- Favorite button — prominent -->
                <button type="button" (click)="toggleFavorite()"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500 outline-none"
                  [class]="isFavorited() ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-red-300 hover:text-red-500'">
                  <svg class="size-5" [class]="isFavorited() ? 'fill-red-500 text-red-500' : ''" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  {{ isFavorited() ? ('business.favorited' | translate) : ('business.favorite' | translate) }}
                </button>
              </div>
            </div>
          </div>

          <!-- Quick actions — pill buttons -->
          <div class="flex gap-2.5 mt-6 overflow-x-auto scrollbar-hidden -mx-1 px-1 pb-1 max-w-4xl mx-auto">
            @if (business()!.phone) {
              <a [href]="'tel:' + business()!.phone" class="quick-action-btn">
                <svg class="size-4.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{{ 'business.phone' | translate }}</span>
              </a>
            }
            @if (business()!.latitude && business()!.longitude) {
              <a [href]="googleMapsUrl()" target="_blank" rel="noopener noreferrer" class="quick-action-btn">
                <svg class="size-4.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{{ 'business.openInMaps' | translate }}</span>
              </a>
            }
            @if (business()!.website) {
              <a [href]="business()!.website!" target="_blank" rel="noopener noreferrer" class="quick-action-btn">
                <svg class="size-4.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>{{ 'business.website' | translate }}</span>
              </a>
            }
            @if (business()!.email) {
              <a [href]="'mailto:' + business()!.email" class="quick-action-btn">
                <svg class="size-4.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{{ 'business.email' | translate }}</span>
              </a>
            }
          </div>

          <!-- Main content grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 max-w-6xl mx-auto">
            <!-- Main content -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Active discount banner -->
              @if (business()!.hasActiveDiscount) {
                <div class="content-card border-rose-200 dark:border-rose-800 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20">
                  <div class="flex items-center gap-4">
                    <div class="flex-shrink-0 size-14 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
                      <svg class="size-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{{ business()!.discountPercentage }}%</span>
                        <span class="text-sm font-semibold text-rose-700 dark:text-rose-300">{{ 'business.discount' | translate }}</span>
                      </div>
                      @if (business()!.discountDescription) {
                        <p class="text-sm text-rose-600/80 dark:text-rose-400/80 mt-0.5">{{ lang.getLocalized(business()!.discountDescription!) }}</p>
                      }
                    </div>
                  </div>
                </div>
              }

              <!-- Description card -->
              @if (businessDescription()) {
                <div class="content-card">
                  <h2 class="section-heading">
                    <svg class="size-5 text-primary-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                    {{ 'business.description' | translate }}
                  </h2>
                  <p class="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line text-[0.9375rem]">{{ businessDescription() }}</p>
                </div>
              }

              <!-- Services card -->
              @if (business()!.services.length > 0) {
                <div class="content-card">
                  <h2 class="section-heading">
                    <svg class="size-5 text-primary-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17l-5.1-3.26m0 0l-.72-4.47a.75.75 0 01.93-.82l4.96 1.24a.75.75 0 01.49.39l2.16 4.42m-7.82-.81l5.1 3.26m0 0a2.995 2.995 0 003.83 1.136l.72-.36A2.25 2.25 0 0017 13.125V10.5a2.25 2.25 0 00-2.25-2.25H12.5"/></svg>
                    {{ 'business.services' | translate }}
                  </h2>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    @for (svc of business()!.services; track svc.id) {
                      <div class="group p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-transparent hover:border-primary-200 dark:hover:border-primary-700 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200">
                        <div class="flex items-start justify-between gap-2">
                          <h3 class="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors text-sm">{{ lang.getLocalized(svc.name) }}</h3>
                          @if (svc.price !== null) {
                            <span class="text-primary-600 font-bold whitespace-nowrap text-sm bg-primary-100/80 dark:bg-primary-900/40 px-3 py-0.5 rounded-xl">€{{ svc.price | number:'1.2-2' }}</span>
                          }
                        </div>
                        @if (svc.description) {
                          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{{ lang.getLocalized(svc.description!) }}</p>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Menu card -->
              @if (business()!.menuItems.length > 0) {
                <div class="content-card">
                  <h2 class="section-heading">
                    <svg class="size-5 text-primary-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
                    {{ 'business.menu' | translate }}
                  </h2>
                  <div class="space-y-1">
                    @for (item of business()!.menuItems; track item.id) {
                      <div class="flex items-center gap-4 py-3.5 px-3 -mx-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        @if (item.imageUrl) {
                          <img [src]="item.imageUrl" [alt]="lang.getLocalized(item.name)" class="size-14 sm:size-16 rounded-xl object-cover flex-shrink-0 ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm" loading="lazy" />
                        } @else {
                          <div class="size-14 sm:size-16 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-gray-800 flex items-center justify-center flex-shrink-0">
                            <span class="text-2xl opacity-50">🍽️</span>
                          </div>
                        }
                        <div class="flex-1 min-w-0">
                          <div class="flex items-start justify-between gap-2">
                            <h3 class="font-semibold text-gray-900 dark:text-gray-100 text-sm">{{ lang.getLocalized(item.name) }}</h3>
                            @if (item.price !== null) {
                              <span class="text-primary-600 font-bold whitespace-nowrap text-sm bg-primary-100/80 dark:bg-primary-900/40 px-3 py-0.5 rounded-xl">€{{ item.price | number:'1.2-2' }}</span>
                            }
                          </div>
                          @if (item.description) {
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{{ lang.getLocalized(item.description) }}</p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Location map card -->
              @if (business()!.latitude && business()!.longitude) {
                <div class="content-card">
                  <h2 class="section-heading">
                    <svg class="size-5 text-primary-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {{ 'business.location' | translate }}
                  </h2>
                  @if (showDirections()) {
                    <div class="w-full h-[340px] sm:h-[420px]">
                      <app-directions-panel
                        [destinationLat]="business()!.latitude"
                        [destinationLng]="business()!.longitude"
                        [destinationName]="businessName()"
                      />
                    </div>
                  } @else {
                    <div #mapContainer class="w-full h-[260px] sm:h-[340px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700"></div>
                  }
                  <div class="flex items-center gap-4 mt-3">
                    <a [href]="googleMapsUrl()" target="_blank" rel="noopener noreferrer"
                       class="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                      {{ 'business.openInMaps' | translate }}
                      <svg class="size-3.5 rtl:rotate-180" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </a>
                    <button
                      (click)="showDirections.set(!showDirections())"
                      class="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer transition-colors"
                    >
                      <svg class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/></svg>
                      {{ (showDirections() ? 'directions.close' : 'directions.getDirections') | translate }}
                    </button>
                  </div>
                </div>
              }

              <!-- Reviews card -->
              @if (reviewService.reviews().length > 0) {
                <div class="content-card">
                  <h2 class="section-heading">
                    <svg class="size-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    {{ 'business.reviews' | translate }}
                    <span class="ms-auto text-xs font-normal text-gray-400">({{ reviewService.reviews().length }})</span>
                  </h2>
                  <div class="space-y-3">
                    @for (review of reviewService.reviews(); track review.id) {
                      <div class="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50">
                        <div class="flex items-center justify-between mb-2">
                          <app-star-rating [rating]="review.rating" />
                          <span class="text-xs text-gray-400 tabular-nums">{{ review.createdAt | date:'MMM d, yyyy' }}</span>
                        </div>
                        @if (review.comment) {
                          <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{{ review.comment }}</p>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Sidebar -->
            <div class="space-y-5">
              <!-- Contact info card -->
              <div class="sidebar-card">
                <h2 class="sidebar-card-title">
                  <svg class="size-4.5 text-primary-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
                  {{ 'business.contact' | translate }}
                </h2>
                <div class="space-y-4">
                  <div class="flex items-start gap-3">
                    <div class="sidebar-icon-box">
                      <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{{ 'business.address' | translate }}</p>
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ business()!.street }}, {{ business()!.postalCode }}</p>
                      @if (cityName()) { <p class="text-sm text-gray-500 dark:text-gray-400">{{ cityName() }}</p> }
                    </div>
                  </div>

                  @if (business()!.phone) {
                    <div class="flex items-start gap-3">
                      <div class="sidebar-icon-box">
                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <p class="text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{{ 'business.phone' | translate }}</p>
                        <a [href]="'tel:' + business()!.phone" class="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 transition-colors">{{ business()!.phone }}</a>
                      </div>
                    </div>
                  }

                  @if (business()!.email) {
                    <div class="flex items-start gap-3">
                      <div class="sidebar-icon-box">
                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{{ 'business.email' | translate }}</p>
                        <a [href]="'mailto:' + business()!.email" class="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 transition-colors break-all">{{ business()!.email }}</a>
                      </div>
                    </div>
                  }

                  @if (business()!.website) {
                    <div class="flex items-start gap-3">
                      <div class="sidebar-icon-box">
                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{{ 'business.website' | translate }}</p>
                        <a [href]="business()!.website!" target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors break-all">{{ business()!.website }}</a>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Opening hours card -->
              @if (business()!.hours) {
                <div class="sidebar-card">
                  <h2 class="sidebar-card-title">
                    <svg class="size-4.5 text-primary-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    {{ 'business.openingHours' | translate }}
                  </h2>
                  <app-opening-hours [hours]="business()!.hours" />
                </div>
              }

              <!-- Share card -->
              <div class="sidebar-card">
                <h2 class="sidebar-card-title">
                  <svg class="size-4.5 text-primary-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"/></svg>
                  {{ 'business.share' | translate }}
                </h2>
                <app-share-buttons [businessName]="businessName()" [businessSlug]="business()!.slug" />
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .quick-action-btn {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.125rem;
      background: var(--color-gray-50, #f9fafb);
      border: 1px solid var(--color-gray-200, #e5e7eb);
      border-radius: 1.25rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-gray-700, #374151);
      text-decoration: none;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .quick-action-btn:hover {
      border-color: var(--color-primary-300);
      color: var(--color-primary-700);
      background: var(--color-primary-50);
    }
    .quick-action-btn:active {
      transform: scale(0.95);
    }
    .quick-action-btn svg {
      color: var(--color-primary-500);
    }
    .quick-action-btn:focus-visible {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }
    :host-context(.dark) .quick-action-btn {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
      color: var(--color-gray-300);
    }
    :host-context(.dark) .quick-action-btn:hover {
      background: rgba(var(--color-primary-500), 0.1);
      border-color: rgba(var(--color-primary-500), 0.3);
    }

    .content-card {
      background: var(--color-surface-bright, #fff);
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 1.5rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    :host-context(.dark) .content-card {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.06);
    }

    .section-heading {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--color-gray-900, #111);
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    :host-context(.dark) .section-heading {
      color: var(--color-gray-100);
    }

    .sidebar-card {
      background: var(--color-surface-bright, #fff);
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 1.5rem;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    :host-context(.dark) .sidebar-card {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.06);
    }

    .sidebar-card-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-gray-900, #111);
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    :host-context(.dark) .sidebar-card-title {
      color: var(--color-gray-100);
    }

    .sidebar-icon-box {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.75rem;
      background: var(--color-primary-50, #eff6ff);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--color-primary-500);
    }
    :host-context(.dark) .sidebar-icon-box {
      background: rgba(var(--color-primary-500), 0.1);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BusinessDetailComponent implements OnInit {
  private readonly businessService = inject(BusinessService);
  private readonly categoryService = inject(CategoryService);
  private readonly cityService = inject(CityService);
  protected readonly lang = inject(LanguageService);
  private readonly seo = inject(SeoService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(ModalService);
  protected readonly reviewService = inject(ReviewService);
  private readonly storage = inject(BrowserStorageService);

  /** Slug passed from modal overlay */
  readonly modalSlug = input<string | undefined>(undefined);

  readonly mapContainer = viewChild<ElementRef>('mapContainer');

  protected readonly business = signal<BusinessDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly isFavorited = signal(false);
  protected readonly showDirections = signal(false);

  private map: any;

  protected readonly businessName = computed(() => {
    const b = this.business();
    return b ? this.lang.getLocalized(b.name) : '';
  });

  protected readonly businessDescription = computed(() => {
    const b = this.business();
    return b ? this.lang.getLocalized(b.description) : '';
  });

  protected readonly categoryName = computed(() => {
    const b = this.business();
    if (!b) return '';
    const cat = this.categoryService.categories().find(c => c.id === b.categoryId);
    return cat ? this.lang.getLocalizedField(cat) : '';
  });

  protected readonly cityName = computed(() => {
    const b = this.business();
    if (!b) return '';
    const city = this.cityService.cities().find(c => c.id === b.cityId);
    return city ? this.lang.getLocalizedField(city) : '';
  });

  constructor() {
    // Initialize map reactively when business data and container are available
    afterRenderEffect(() => {
      const b = this.business();
      const container = this.mapContainer();
      if (b && container && b.latitude && b.longitude && !this.map) {
        this.initMap();
      }
    });

    // Cleanup map on destroy
    this.destroyRef.onDestroy(() => {
      if (this.map) {
        this.map.remove();
      }
    });
  }

  ngOnInit(): void {
    const slug = this.modalSlug();
    if (!slug) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }

    // Ensure categories/cities are loaded for name resolution
    if (this.categoryService.categories().length === 0) {
      this.categoryService.getAll().subscribe();
    }
    if (this.cityService.cities().length === 0) {
      this.cityService.getAll().subscribe();
    }

    this.businessService.getBySlug(slug).subscribe({
      next: (detail) => {
        this.business.set(detail);
        this.loading.set(false);
        this.updateSeo(detail);
        this.reviewService.loadByBusiness(detail.id);
        // Check localStorage favorites
        if (isPlatformBrowser(this.platformId)) {
          try {
            const stored = JSON.parse(this.storage.getItem('kurdmap_favorites') ?? '[]') as string[];
            this.isFavorited.set(stored.includes(detail.id));
          } catch { /* ignore */ }
        }
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }

  protected googleMapsUrl(): string {
    const b = this.business();
    if (!b) return '';
    return `https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`;
  }

  protected goHome(): void {
    this.modalService.close();
  }

  protected goToSearch(): void {
    this.modalService.openSearch();
  }

  protected toggleFavorite(): void {
    this.isFavorited.update(v => !v);
    // Persist to localStorage for anonymous users
    if (isPlatformBrowser(this.platformId)) {
      const b = this.business();
      if (!b) return;
      try {
        const key = 'kurdmap_favorites';
        const stored = JSON.parse(this.storage.getItem(key) ?? '[]') as string[];
        const idx = stored.indexOf(b.id);
        if (idx >= 0) stored.splice(idx, 1);
        else stored.push(b.id);
        this.storage.setItem(key, JSON.stringify(stored));
      } catch { /* storage unavailable */ }
    }
  }

  private async initMap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const b = this.business();
    const container = this.mapContainer();
    if (!b || !container || !b.latitude || !b.longitude) return;

    const leafletMod = await import('leaflet');
    // Unwrap CommonJS/ESM interop so `L.map` is always available.
    const L = ((leafletMod as any).default ?? leafletMod) as typeof import('leaflet');

    this.map = L.map(container.nativeElement, {
      center: [b.latitude, b.longitude],
      zoom: 15,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    L.marker([b.latitude, b.longitude], {
      icon: L.divIcon({
        className: 'kurdmap-marker',
        html: `<div class="w-10 h-10 bg-emerald-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-bold">
          ${b.isVerified ? '✓' : '●'}
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
    }).addTo(this.map);
  }

  private updateSeo(b: BusinessDetail): void {
    const name = this.lang.getLocalized(b.name);
    const desc = this.lang.getLocalized(b.description);
    const image = b.images.find(i => i.isPrimary)?.url ?? b.images[0]?.url;
    this.seo.updateMeta({
      title: name,
      description: desc || undefined,
      url: `/business/${b.slug}`,
      image,
      type: 'business.business',
    });
    this.seo.setBusinessJsonLd({
      name,
      description: desc || undefined,
      address: b.street ? `${b.street}, ${b.postalCode}` : undefined,
      phone: b.phone ?? undefined,
      url: b.website ?? undefined,
      image,
      latitude: b.latitude,
      longitude: b.longitude,
    });
  }
}
