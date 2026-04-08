import { ChangeDetectionStrategy, Component, inject, ElementRef, signal, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { LanguageService, SupportedLanguage } from '../../../core/services/language.service';
import { TranslateModule } from '@ngx-translate/core';

interface LangOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

@Component({
  selector: 'app-language-switcher',
  imports: [TranslateModule],
  template: `
    <div class="relative inline-block">
      <button
        (click)="toggleDropdown()"
        class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-button border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 outline-none"
        [attr.aria-label]="'common.language' | translate"
        [attr.aria-expanded]="isOpen()"
        aria-haspopup="listbox"
      >
        <span class="text-base leading-none" [innerHTML]="currentFlag()"></span>
        <span class="hidden sm:inline">{{ currentLabel() }}</span>
        <svg class="w-3.5 h-3.5 transition-transform motion-reduce:transition-none" [class.rotate-180]="isOpen()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      @if (isOpen()) {
        <div class="absolute end-0 top-full mt-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-elevated border border-gray-100 py-1 z-50 min-w-[180px] animate-scale-in" role="listbox">
          @for (lang of languages; track lang.code) {
            <button
              (click)="selectLanguage(lang.code)"
              class="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 outline-none"
              [class.bg-primary-50]="lang.code === languageService.currentLang()"
              [class.font-semibold]="lang.code === languageService.currentLang()"
              role="option"
              [attr.aria-selected]="lang.code === languageService.currentLang()"
            >
              <span class="text-base leading-none" [innerHTML]="lang.flag"></span>
              <span class="flex flex-col items-start">
                <span>{{ lang.nativeLabel }}</span>
                @if (lang.label !== lang.nativeLabel) {
                  <span class="text-xs text-gray-400">{{ lang.label }}</span>
                }
              </span>
              @if (lang.code === languageService.currentLang()) {
                <svg class="w-4 h-4 text-primary-600 ms-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  protected readonly languageService = inject(LanguageService);
  private readonly elRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly isOpen = signal(false);

  protected readonly languages: LangOption[] = [
    { code: 'ku', nativeLabel: 'کوردی سۆرانی', label: 'Kurdish (Sorani)', flag: '☀️' },
    { code: 'kmr', nativeLabel: 'Kurmancî', label: 'Kurdish (Kurmanji)', flag: '☀️' },
    { code: 'de', nativeLabel: 'Deutsch', label: 'German', flag: '🇩🇪' },
    { code: 'en', nativeLabel: 'English', label: 'English', flag: '🇬🇧' },
  ];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      fromEvent<MouseEvent>(document, 'click').pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(event => {
        if (!this.elRef.nativeElement.contains(event.target)) {
          this.isOpen.set(false);
        }
      });
    }
  }

  protected currentFlag(): string {
    return this.languages.find(l => l.code === this.languageService.currentLang())?.flag ?? '';
  }

  protected currentLabel(): string {
    return this.languages.find(l => l.code === this.languageService.currentLang())?.nativeLabel ?? '';
  }

  protected toggleDropdown(): void {
    this.isOpen.update(v => !v);
  }

  protected selectLanguage(code: SupportedLanguage): void {
    this.languageService.setLanguage(code);
    this.isOpen.set(false);
  }
}
