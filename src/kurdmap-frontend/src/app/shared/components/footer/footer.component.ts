import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslateModule],
  template: `
    <footer class="relative bg-gray-950 dark:bg-black text-gray-400 mt-auto print:hidden overflow-hidden">
      <!-- Decorative top gradient -->
      <div class="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent"></div>

      <!-- Subtle glow -->
      <div class="absolute top-0 start-1/4 size-96 bg-primary-600/5 rounded-full blur-3xl"></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          <!-- Brand -->
          <div class="md:col-span-5">
            <div class="flex items-center gap-2.5 mb-4">
              <div class="size-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <svg class="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <span class="text-xl font-bold text-white">Kurd<span class="text-primary-400">Map</span></span>
            </div>
            <p class="text-sm leading-relaxed text-gray-500 dark:text-gray-400 max-w-sm text-balance">{{ 'footer.description' | translate }}</p>
          </div>

          <!-- Links -->
          <div class="md:col-span-3">
            <h4 class="text-white text-sm font-semibold mb-4 tracking-wide">{{ 'footer.quickLinks' | translate }}</h4>
            <ul class="space-y-3 text-sm">
              <li>
                <a routerLink="/" class="hover:text-primary-400 transition-colors duration-200 flex items-center gap-2">
                  <span class="size-1 rounded-full bg-gray-700"></span>
                  {{ 'nav.home' | translate }}
                </a>
              </li>
              <li>
                <a routerLink="/search" class="hover:text-primary-400 transition-colors duration-200 flex items-center gap-2">
                  <span class="size-1 rounded-full bg-gray-700"></span>
                  {{ 'nav.search' | translate }}
                </a>
              </li>
              <li>
                <a routerLink="/categories" class="hover:text-primary-400 transition-colors duration-200 flex items-center gap-2">
                  <span class="size-1 rounded-full bg-gray-700"></span>
                  {{ 'nav.categories' | translate }}
                </a>
              </li>
              <li>
                <a routerLink="/about" class="hover:text-primary-400 transition-colors duration-200 flex items-center gap-2">
                  <span class="size-1 rounded-full bg-gray-700"></span>
                  {{ 'nav.about' | translate }}
                </a>
              </li>
              <li>
                <a routerLink="/contact" class="hover:text-primary-400 transition-colors duration-200 flex items-center gap-2">
                  <span class="size-1 rounded-full bg-gray-700"></span>
                  {{ 'footer.contact' | translate }}
                </a>
              </li>
              <li>
                <button (click)="openPolicy()" class="hover:text-primary-400 transition-colors duration-200 flex items-center gap-2 cursor-pointer">
                  <span class="size-1 rounded-full bg-gray-700"></span>
                  {{ 'policy.title' | translate }}
                </button>
              </li>
            </ul>
          </div>

          <!-- Contact -->
          <div class="md:col-span-4">
            <h4 class="text-white text-sm font-semibold mb-4 tracking-wide">{{ 'footer.contact' | translate }}</h4>
            <div class="space-y-3 text-sm">
              <a href="mailto:info@kurdmap.eu" class="flex items-center gap-2.5 hover:text-primary-400 transition-colors duration-200">
                <svg class="size-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                info&#64;kurdmap.de
              </a>
              <div class="flex items-center gap-2.5">
                <svg class="size-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                Bundesweit, Deutschland
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-800/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; {{ currentYear }} KurdMap. {{ 'footer.rights' | translate }}</p>
          <div class="flex items-center gap-4">
            <button (click)="openPolicy()" class="hover:text-primary-400 transition-colors cursor-pointer">{{ 'policy.title' | translate }}</button>
            <span class="text-gray-700">|</span>
            <p class="flex items-center gap-1.5">
            Made with
            <svg class="size-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
            </svg>
            in Germany
          </p>
          </div>
        </div>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private readonly modalService = inject(ModalService);
  readonly currentYear = new Date().getFullYear();

  protected openPolicy(): void {
    this.modalService.openPolicy();
  }
}
