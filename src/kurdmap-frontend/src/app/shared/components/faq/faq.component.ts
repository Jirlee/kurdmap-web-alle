import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

interface FaqItem {
  key: string;
}

@Component({
  selector: 'app-faq',
  imports: [TranslateModule],
  template: `
    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="text-center mb-12">
        <p class="text-xs font-semibold text-primary-600 tracking-widest uppercase mb-3">FAQ</p>
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 text-balance">
          {{ 'faq.title' | translate }}
        </h2>
      </div>

      <div class="space-y-3">
        @for (item of faqItems; track item.key; let i = $index) {
          <div class="rounded-2xl border border-gray-100/80 bg-white shadow-card overflow-hidden transition-all duration-300"
               [class.shadow-card-hover]="openIndex() === i">
            <button
              (click)="toggle(i)"
              class="w-full flex items-center justify-between gap-4 px-6 py-5 text-start cursor-pointer hover:bg-gray-50/50 transition-colors"
            >
              <span class="text-sm font-medium text-gray-900">{{ 'faq.' + item.key + '.q' | translate }}</span>
              <svg class="size-5 shrink-0 text-gray-400 transition-transform duration-300"
                   [class.rotate-180]="openIndex() === i"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            @if (openIndex() === i) {
              <div class="px-6 pb-5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed animate-slide-down border-t border-gray-50">
                <p class="pt-3">{{ 'faq.' + item.key + '.a' | translate }}</p>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .animate-slide-down {
      animation: slide-down-faq 0.25s ease-out;
    }
    @keyframes slide-down-faq {
      from { opacity: 0; max-height: 0; }
      to { opacity: 1; max-height: 200px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqComponent {
  protected readonly openIndex = signal<number | null>(null);

  readonly faqItems: FaqItem[] = [
    { key: 'q1' },
    { key: 'q2' },
    { key: 'q3' },
    { key: 'q4' },
    { key: 'q5' },
  ];

  protected toggle(index: number): void {
    this.openIndex.set(this.openIndex() === index ? null : index);
  }
}
