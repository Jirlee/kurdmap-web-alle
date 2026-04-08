import { ChangeDetectionStrategy, Component, input, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BusinessImage } from '../../../core/models';

@Component({
  selector: 'app-image-carousel',
  imports: [NgClass, TranslateModule],
  template: `
    <div class="relative w-full">
      <!-- Main image -->
      <div class="relative aspect-[16/9] bg-gray-100 rounded-card overflow-hidden">
        @if (sortedImages().length > 0) {
          <img
            [src]="sortedImages()[activeIndex()]?.url"
            [alt]="sortedImages()[activeIndex()]?.altText || 'Business image'"
            class="w-full h-full object-cover"
          />

          <!-- Prev / Next arrows -->
          @if (sortedImages().length > 1) {
            <button
              (click)="prev()"
              class="absolute top-1/2 start-3 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 outline-none"
              [attr.aria-label]="'aria.previousImage' | translate"
            >
              <svg class="w-5 h-5 text-gray-700 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              (click)="next()"
              class="absolute top-1/2 end-3 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 outline-none"
              [attr.aria-label]="'aria.nextImage' | translate"
            >
              <svg class="w-5 h-5 text-gray-700 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <!-- Counter badge -->
            <div class="absolute bottom-3 end-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {{ activeIndex() + 1 }} / {{ sortedImages().length }}
            </div>
          }
        } @else {
          <!-- Placeholder -->
          <div class="w-full h-full flex items-center justify-center bg-gray-200">
            <svg class="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        }
      </div>

      <!-- Thumbnail strip -->
      @if (sortedImages().length > 1) {
        <div class="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hidden">
          @for (img of sortedImages(); track img.id; let i = $index) {
            <button
              (click)="activeIndex.set(i)"
              class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all focus-visible:ring-2 focus-visible:ring-primary-500 outline-none"
              [ngClass]="i === activeIndex() ? 'border-primary-600 ring-1 ring-primary-600' : 'border-transparent opacity-70 hover:opacity-100'"
            >
              <img [src]="img.url" [alt]="img.altText || 'Thumbnail'" class="w-full h-full object-cover" loading="lazy" />
            </button>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageCarouselComponent {
  readonly images = input<BusinessImage[]>([]);
  protected readonly activeIndex = signal(0);

  protected readonly sortedImages = computed(() =>
    [...this.images()].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.sortOrder - b.sortOrder;
    })
  );

  protected prev(): void {
    const len = this.sortedImages().length;
    this.activeIndex.update(i => (i - 1 + len) % len);
  }

  protected next(): void {
    const len = this.sortedImages().length;
    this.activeIndex.update(i => (i + 1) % len);
  }
}
