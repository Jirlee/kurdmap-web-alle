import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../core/services/language.service';
import { ModalService } from '../../../core/services/modal.service';
import { BusinessSummary } from '../../../core/models';
import { HighlightPipe } from '../../pipes/highlight.pipe';

@Component({
  selector: 'app-business-card',
  imports: [TranslateModule, HighlightPipe],
  template: `
    <button
      (click)="openDetail()"
      class="card-btn group block w-full text-start bg-white dark:bg-gray-900 rounded-2xl border border-gray-100/80 dark:border-gray-800 overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary-200 dark:hover:border-primary-700 active:scale-[0.97] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 outline-none motion-reduce:transition-none cursor-pointer"
    >
      <!-- Image -->
      <div class="relative aspect-[4/3] overflow-hidden">
        @if (business().primaryImageUrl) {
          <img
            [src]="business().primaryImageUrl"
            [alt]="langService.getLocalized(business().name)"
            class="w-full h-full object-cover motion-safe:group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
          />
        } @else {
          <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 via-primary-100/50 to-accent-50 dark:from-primary-900/20 dark:via-gray-900 dark:to-gray-900">
            <span class="text-5xl opacity-40 motion-safe:group-hover:scale-110 transition-transform duration-300">🏪</span>
          </div>
        }
        <!-- Gradient overlay at bottom -->
        <div class="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent"></div>
        @if (business().isVerified) {
          <span class="absolute top-3 start-3 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm text-primary-700 dark:text-primary-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <svg class="size-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            {{ 'business.verified' | translate }}
          </span>
        }
        @if (business().isFeatured) {
          <span class="absolute top-3 end-3 bg-amber-500/90 dark:bg-amber-600/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <svg class="size-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            {{ 'business.featured' | translate }}
          </span>
        }
        @if (business().hasActiveDiscount) {
          <span class="absolute bottom-3 start-3 bg-rose-500/90 dark:bg-rose-600/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
            <svg class="size-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
            </svg>
            {{ business().discountPercentage }}%
          </span>
        }
      </div>

      <!-- Content -->
      <div class="p-4 sm:p-5">
        <h3 class="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg mb-1.5 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200"
            [innerHTML]="langService.getLocalized(business().name) | highlight : searchTerm()">
        </h3>
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg class="size-3.5 shrink-0 text-gray-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span class="line-clamp-1 text-[0.8125rem]">{{ business().street }}, {{ business().postalCode }}</span>
          </div>
          @if (business().phone) {
            <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <svg class="size-3.5 shrink-0 text-gray-400 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              <span class="text-[0.8125rem]">{{ business().phone }}</span>
            </div>
          }
        </div>
      </div>
    </button>
  `,
  styles: [`
    .card-btn {
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    @media (hover: none) {
      .card-btn:active {
        transition-duration: 100ms;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessCardComponent {
  protected readonly langService = inject(LanguageService);
  private readonly modalService = inject(ModalService);
  readonly business = input.required<BusinessSummary>();
  readonly searchTerm = input<string>('');

  protected openDetail(): void {
    this.modalService.openBusinessDetail(this.business().slug);
  }
}
