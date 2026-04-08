import { ChangeDetectionStrategy, Component, inject, effect, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ModalOverlayComponent } from './shared/components/modal-overlay/modal-overlay.component';
import { AdSplashComponent } from './shared/components/ad-splash/ad-splash.component';
import { CommandPaletteComponent } from './shared/components/command-palette/command-palette.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ModalOverlayComponent, AdSplashComponent, CommandPaletteComponent, ToastComponent, TranslateModule, BottomNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);
  private readonly platformId = inject(PLATFORM_ID);

  /** Scroll progress 0-100 */
  protected readonly scrollProgress = signal(0);
  /** Show back-to-top button after 400px */
  protected readonly showBackToTop = signal(false);

  constructor() {
    this.translate.addLangs(['ku', 'kmr', 'de', 'en']);
    this.translate.setDefaultLang('de');
    this.translate.use(this.languageService.currentLang());

    effect(() => {
      const lang = this.languageService.currentLang();
      this.translate.use(lang);
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.lang = lang;
        document.documentElement.dir = this.languageService.isRtl() ? 'rtl' : 'ltr';
      }
    });

    // Scroll listener for progress bar + back-to-top
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('scroll', () => {
        const h = document.documentElement;
        const scrollTop = h.scrollTop;
        const scrollHeight = h.scrollHeight - h.clientHeight;
        this.scrollProgress.set(scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0);
        this.showBackToTop.set(scrollTop > 400);
      }, { passive: true });
    }
  }

  protected scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
