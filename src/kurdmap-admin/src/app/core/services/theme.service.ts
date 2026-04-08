import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'kurdmap_theme';
  readonly isDarkMode = signal(this.loadTheme());

  constructor() {
    effect(() => {
      const dark = this.isDarkMode();
      document.documentElement.classList.toggle('dark', dark);
      try {
        localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light');
      } catch { /* Storage unavailable */ }
    });
  }

  init(): void {
    // Trigger the effect on first run
    this.isDarkMode();
  }

  toggle(): void {
    this.isDarkMode.update(v => !v);
  }

  private loadTheme(): boolean {
    try {
      return localStorage.getItem(this.STORAGE_KEY) === 'dark';
    } catch {
      return false;
    }
  }
}
