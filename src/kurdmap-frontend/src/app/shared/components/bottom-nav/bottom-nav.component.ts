import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  template: `
    <nav class="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 md:hidden print:hidden"
         aria-label="Mobile navigation">
      <div class="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        <a routerLink="/"
           routerLinkActive="!text-primary-600 dark:!text-primary-400"
           [routerLinkActiveOptions]="{ exact: true }"
           class="flex flex-col items-center gap-0.5 px-3 py-1.5 text-gray-500 dark:text-gray-400 transition-colors min-w-[3rem]">
          <svg class="size-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span class="text-[10px] font-medium">{{ 'nav.home' | translate }}</span>
        </a>

        <button
          (click)="openSearch()"
          class="flex flex-col items-center gap-0.5 px-3 py-1.5 text-gray-500 dark:text-gray-400 transition-colors min-w-[3rem] cursor-pointer">
          <svg class="size-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <span class="text-[10px] font-medium">{{ 'nav.search' | translate }}</span>
        </button>

        <a routerLink="/categories"
           routerLinkActive="!text-primary-600 dark:!text-primary-400"
           class="flex flex-col items-center gap-0.5 px-3 py-1.5 text-gray-500 dark:text-gray-400 transition-colors min-w-[3rem]">
          <svg class="size-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
          </svg>
          <span class="text-[10px] font-medium">{{ 'nav.categories' | translate }}</span>
        </a>

        <a routerLink="/about"
           routerLinkActive="!text-primary-600 dark:!text-primary-400"
           class="flex flex-col items-center gap-0.5 px-3 py-1.5 text-gray-500 dark:text-gray-400 transition-colors min-w-[3rem]">
          <svg class="size-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
          </svg>
          <span class="text-[10px] font-medium">{{ 'nav.about' | translate }}</span>
        </a>
      </div>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  private readonly modalService = inject(ModalService);

  protected openSearch(): void {
    this.modalService.openSearch();
  }
}
