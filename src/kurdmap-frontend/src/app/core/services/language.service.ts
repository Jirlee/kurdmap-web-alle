import { Injectable, signal, computed, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { MultilingualText } from '../models';
import { BrowserStorageService } from './browser-storage.service';

export type SupportedLanguage = 'ku' | 'kmr' | 'de' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storage = inject(BrowserStorageService);
  readonly currentLang = signal<SupportedLanguage>(environment.defaultLanguage as SupportedLanguage);
  readonly isRtl = computed(() => environment.rtlLanguages.includes(this.currentLang()));

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = this.storage.getItem('kurdmap-lang') as SupportedLanguage | null;
      if (saved && environment.supportedLanguages.includes(saved)) {
        this.currentLang.set(saved);
      } else {
        const browserLang = navigator.language.split('-')[0];
        if (environment.supportedLanguages.includes(browserLang)) {
          this.currentLang.set(browserLang as SupportedLanguage);
        }
      }
    }

    // Keep <html lang> and <html dir> in sync with the active language.
    // Runs on init and on every change, preventing an initial LTR→RTL flip.
    effect(() => {
      const lang = this.currentLang();
      const rtl = this.isRtl();
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.lang = lang;
        document.documentElement.dir = rtl ? 'rtl' : 'ltr';
      }
    });
  }

  setLanguage(lang: SupportedLanguage): void {
    this.currentLang.set(lang);
    if (isPlatformBrowser(this.platformId)) {
      this.storage.setItem('kurdmap-lang', lang);
    }
  }

  getLocalized(text: MultilingualText): string {
    const lang = this.currentLang();
    switch (lang) {
      case 'ku': return text.ku;
      case 'kmr': return text.kmr || text.ku;
      case 'de': return text.de;
      case 'en': return text.en || text.de;
      default: return text.de;
    }
  }

  getLocalizedField(obj: { nameKu: string; nameKmr: string | null; nameDe: string; nameEn: string | null }): string {
    const lang = this.currentLang();
    switch (lang) {
      case 'ku': return obj.nameKu;
      case 'kmr': return obj.nameKmr || obj.nameKu;
      case 'de': return obj.nameDe;
      case 'en': return obj.nameEn || obj.nameDe;
      default: return obj.nameDe;
    }
  }
}
