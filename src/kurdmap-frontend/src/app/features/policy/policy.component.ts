import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ModalService } from '../../core/services/modal.service';

@Component({
  selector: 'app-policy',
  imports: [TranslateModule],
  template: `
    <div class="min-h-screen bg-surface">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200/60">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            (click)="modalService.close()"
            class="size-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            [attr.aria-label]="'common.back' | translate"
          >
            <svg class="size-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <h1 class="text-lg font-semibold text-gray-900">{{ 'policy.title' | translate }}</h1>
        </div>
      </div>

      <!-- Content -->
      <article class="max-w-4xl mx-auto px-4 sm:px-6 py-10 prose prose-gray max-w-none">
        <div class="bg-white rounded-2xl shadow-card p-8 sm:p-12 space-y-8">
          <!-- Intro -->
          <section>
            <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span class="size-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <svg class="size-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </span>
              {{ 'policy.intro.title' | translate }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">{{ 'policy.intro.text' | translate }}</p>
          </section>

          <hr class="border-gray-100" />

          <!-- Data Collection -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-3">{{ 'policy.dataCollection.title' | translate }}</h2>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">{{ 'policy.dataCollection.text' | translate }}</p>
          </section>

          <!-- Cookies -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-3">{{ 'policy.cookies.title' | translate }}</h2>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">{{ 'policy.cookies.text' | translate }}</p>
          </section>

          <!-- Third Party -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-3">{{ 'policy.thirdParty.title' | translate }}</h2>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">{{ 'policy.thirdParty.text' | translate }}</p>
          </section>

          <!-- User Rights -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-3">{{ 'policy.rights.title' | translate }}</h2>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">{{ 'policy.rights.text' | translate }}</p>
          </section>

          <!-- Contact -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-3">{{ 'policy.contact.title' | translate }}</h2>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">{{ 'policy.contact.text' | translate }}</p>
          </section>

          <!-- Last Updated -->
          <div class="pt-6 border-t border-gray-100 text-sm text-gray-400">
            {{ 'policy.lastUpdated' | translate }}: April 2026
          </div>
        </div>
      </article>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolicyComponent {
  protected readonly modalService = inject(ModalService);
}
