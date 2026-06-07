import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-privacy',
  imports: [TranslateModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <div class="flex items-center gap-4">
            <a href="/"
               class="size-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors"
               [attr.aria-label]="'common.back' | translate">
              <svg class="size-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </a>
            <div>
              <h1 class="text-xl font-bold text-gray-900">{{ 'policy.title' | translate }}</h1>
              <p class="text-sm text-gray-500">KurdMap — kurdmap.eu</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Content -->
      <article class="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 space-y-8">

          <!-- Intro -->
          <section>
            <div class="flex items-center gap-3 mb-4">
              <span class="size-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <svg class="size-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </span>
              <h2 class="text-xl font-bold text-gray-900">{{ 'policy.intro.title' | translate }}</h2>
            </div>
            <p class="text-gray-600 leading-relaxed">{{ 'policy.intro.text' | translate }}</p>
          </section>

          <hr class="border-gray-100" />

          <!-- Data Collection -->
          <section>
            <h2 class="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg class="size-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
              </svg>
              {{ 'policy.dataCollection.title' | translate }}
            </h2>
            <p class="text-gray-600 leading-relaxed">{{ 'policy.dataCollection.text' | translate }}</p>
          </section>

          <!-- Location Data -->
          <section>
            <h2 class="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg class="size-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {{ 'policy.location.title' | translate }}
            </h2>
            <p class="text-gray-600 leading-relaxed">{{ 'policy.location.text' | translate }}</p>
          </section>

          <!-- Cookies -->
          <section>
            <h2 class="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg class="size-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              {{ 'policy.cookies.title' | translate }}
            </h2>
            <p class="text-gray-600 leading-relaxed">{{ 'policy.cookies.text' | translate }}</p>
          </section>

          <!-- Third Party -->
          <section>
            <h2 class="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg class="size-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
              </svg>
              {{ 'policy.thirdParty.title' | translate }}
            </h2>
            <p class="text-gray-600 leading-relaxed">{{ 'policy.thirdParty.text' | translate }}</p>
          </section>

          <!-- User Rights (GDPR) -->
          <section>
            <h2 class="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg class="size-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              {{ 'policy.rights.title' | translate }}
            </h2>
            <p class="text-gray-600 leading-relaxed">{{ 'policy.rights.text' | translate }}</p>
          </section>

          <!-- Account Deletion -->
          <section>
            <h2 class="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg class="size-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              {{ 'policy.accountDeletion.title' | translate }}
            </h2>
            <p class="text-gray-600 leading-relaxed">{{ 'policy.accountDeletion.text' | translate }}</p>
          </section>

          <!-- Contact -->
          <section>
            <h2 class="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg class="size-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              {{ 'policy.contact.title' | translate }}
            </h2>
            <p class="text-gray-600 leading-relaxed">{{ 'policy.contact.text' | translate }}</p>
          </section>

          <!-- Last Updated -->
          <div class="pt-6 border-t border-gray-100 text-sm text-gray-400 text-center">
            {{ 'policy.lastUpdated' | translate }}: April 2026
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center text-xs text-gray-400">
          &copy; 2026 KurdMap — kurdmap.eu
        </div>
      </article>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PrivacyComponent implements OnInit {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  ngOnInit(): void {
    this.title.setTitle('Privacy Policy — KurdMap');
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    this.meta.updateTag({ name: 'description', content: 'KurdMap Privacy Policy — Data protection, cookies, and your rights under GDPR.' });
  }
}
