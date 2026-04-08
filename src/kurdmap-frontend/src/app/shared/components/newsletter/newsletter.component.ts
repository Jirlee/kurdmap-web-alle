import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-newsletter',
  imports: [TranslateModule],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-50 via-white to-accent-50 border border-primary-100/50 p-8 sm:p-12 lg:p-16">
        <!-- Decorative -->
        <div class="absolute top-0 end-0 size-64 rounded-full bg-primary-100/30 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div class="absolute bottom-0 start-0 size-48 rounded-full bg-accent-100/30 blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div class="relative max-w-2xl mx-auto text-center">
          <span class="text-4xl mb-4 block">📬</span>
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{{ 'newsletter.title' | translate }}</h2>
          <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto">{{ 'newsletter.subtitle' | translate }}</p>

          @if (submitted()) {
            <div class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium animate-scale-in">
              <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              {{ 'newsletter.success' | translate }}
            </div>
          } @else {
            <div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                [placeholder]="'newsletter.placeholder' | translate"
                [attr.aria-label]="'aria.emailInput' | translate"
                class="flex-1 px-5 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:border-primary-300 outline-none transition-all"
                [value]="email()"
                (input)="email.set($any($event.target).value)"
                (keyup.enter)="onSubmit()"
              />
              <button
                (click)="onSubmit()"
                class="px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-800 active:scale-[0.98] transition-all shadow-md shadow-primary-600/20 whitespace-nowrap cursor-pointer"
              >
                {{ 'newsletter.button' | translate }}
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-4">{{ 'newsletter.disclaimer' | translate }}</p>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsletterComponent {
  protected readonly email = signal('');
  protected readonly submitted = signal(false);

  protected onSubmit(): void {
    if (this.email().trim() && this.email().includes('@')) {
      this.submitted.set(true);
    }
  }
}
