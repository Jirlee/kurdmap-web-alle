import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SeoService } from '../../core/services/seo.service';
import { ContactService } from '../../core/services/contact.service';

@Component({
  selector: 'app-contact',
  imports: [TranslateModule, FormsModule],
  template: `
    <section class="min-h-[60vh] py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-sm font-medium mb-6">
            <svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            {{ 'contact.badge' | translate }}
          </div>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 text-balance">
            {{ 'contact.title' | translate }}
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-balance">
            {{ 'contact.subtitle' | translate }}
          </p>
        </div>

        <div class="grid lg:grid-cols-5 gap-8">
          <!-- Contact Info -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div class="flex items-start gap-4">
                <div class="size-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <svg class="size-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white mb-1">{{ 'contact.email.title' | translate }}</h3>
                  <a href="mailto:info@kurdmap.eu" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">info&#64;kurdmap.de</a>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div class="flex items-start gap-4">
                <div class="size-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <svg class="size-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white mb-1">{{ 'contact.location.title' | translate }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ 'contact.location.text' | translate }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div class="flex items-start gap-4">
                <div class="size-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <svg class="size-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white mb-1">{{ 'contact.response.title' | translate }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ 'contact.response.text' | translate }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Form -->
          <div class="lg:col-span-3">
            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
              @if (submitted()) {
                <div class="text-center py-8">
                  <div class="size-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
                    <svg class="size-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ 'contact.form.success' | translate }}</h3>
                  <p class="text-gray-600 dark:text-gray-400">{{ 'contact.form.successText' | translate }}</p>
                </div>
              } @else {
                <form (ngSubmit)="onSubmit()" class="space-y-5">
                  @if (error()) {
                    <div class="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
                      {{ error() }}
                    </div>
                  }
                  <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{ 'contact.form.name' | translate }}</label>
                    <input id="name" type="text" [(ngModel)]="name" name="name" required
                      class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{ 'contact.form.email' | translate }}</label>
                    <input id="email" type="email" [(ngModel)]="email" name="email" required
                      class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" />
                  </div>
                  <div>
                    <label for="message" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{{ 'contact.form.message' | translate }}</label>
                    <textarea id="message" [(ngModel)]="message" name="message" required rows="5"
                      class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"></textarea>
                  </div>
                  <button type="submit" [disabled]="submitting()"
                    class="w-full px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    @if (submitting()) {
                      <span class="inline-flex items-center gap-2">
                        <svg class="animate-spin size-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        {{ 'contact.form.sending' | translate }}
                      </span>
                    } @else {
                      {{ 'contact.form.send' | translate }}
                    }
                  </button>
                </form>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ContactComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly contactService = inject(ContactService);

  protected name = '';
  protected email = '';
  protected message = '';
  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.seo.updateMeta({
      title: this.translate.instant('contact.title'),
      description: this.translate.instant('contact.subtitle'),
    });
  }

  protected onSubmit(): void {
    if (this.name && this.email && this.message) {
      this.submitting.set(true);
      this.error.set(null);
      this.contactService.submit({ name: this.name, email: this.email, message: this.message }).subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
        },
        error: () => {
          this.submitting.set(false);
          this.error.set(this.translate.instant('contact.form.error'));
        },
      });
    }
  }
}
