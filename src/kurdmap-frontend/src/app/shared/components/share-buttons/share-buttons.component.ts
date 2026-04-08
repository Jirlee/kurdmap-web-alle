import { ChangeDetectionStrategy, Component, input, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-share-buttons',
  imports: [TranslateModule],
  template: `
    <div class="flex flex-wrap gap-2">
      <!-- WhatsApp -->
      <a
        [href]="whatsappUrl()"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-button bg-[#25D366] text-white text-sm font-medium hover:bg-[#1da851] active:bg-[#1a9447] transition-colors focus-visible:ring-2 focus-visible:ring-[#25D366]/50 outline-none"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.496A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.327 0-4.542-.69-6.42-1.988l-.448-.314-2.648.888.889-2.648-.314-.448A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
        </svg>
        {{ 'business.shareOnWhatsApp' | translate }}
      </a>

      <!-- Telegram -->
      <a
        [href]="telegramUrl()"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-button bg-[#0088cc] text-white text-sm font-medium hover:bg-[#006daa] active:bg-[#005a8c] transition-colors focus-visible:ring-2 focus-visible:ring-[#0088cc]/50 outline-none"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.064-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        {{ 'business.shareOnTelegram' | translate }}
      </a>

      <!-- Copy Link -->
      <button
        (click)="copyLink()"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-button bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 outline-none"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        @if (copied()) {
          {{ 'business.linkCopied' | translate }}
        } @else {
          {{ 'business.copyLink' | translate }}
        }
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareButtonsComponent {
  private readonly platformId = inject(PLATFORM_ID);

  readonly businessName = input.required<string>();
  readonly businessSlug = input.required<string>();

  readonly copied = signal(false);

  whatsappUrl(): string {
    const url = this.getBusinessUrl();
    const text = encodeURIComponent(`${this.businessName()} - ${url}`);
    return `https://wa.me/?text=${text}`;
  }

  telegramUrl(): string {
    const url = encodeURIComponent(this.getBusinessUrl());
    const text = encodeURIComponent(this.businessName());
    return `https://t.me/share/url?url=${url}&text=${text}`;
  }

  async copyLink(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      await navigator.clipboard.writeText(this.getBusinessUrl());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = this.getBusinessUrl();
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  private getBusinessUrl(): string {
    if (isPlatformBrowser(this.platformId)) {
      return `${window.location.origin}/business/${this.businessSlug()}`;
    }
    return `/business/${this.businessSlug()}`;
  }
}
