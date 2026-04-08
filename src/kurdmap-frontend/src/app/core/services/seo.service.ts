import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoOptions {
  title: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
}

export interface BusinessJsonLd {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  url?: string;
  image?: string;
  latitude?: number;
  longitude?: number;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  updateMeta(options: SeoOptions): void {
    this.title.setTitle(`${options.title} | KurdMap`);

    if (options.description) {
      this.meta.updateTag({ name: 'description', content: options.description });
      this.meta.updateTag({ property: 'og:description', content: options.description });
      this.meta.updateTag({ name: 'twitter:description', content: options.description });
    }

    this.meta.updateTag({ property: 'og:title', content: options.title });
    this.meta.updateTag({ property: 'og:type', content: options.type ?? 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'KurdMap' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: options.title });

    if (options.url) {
      this.meta.updateTag({ property: 'og:url', content: options.url });
      this.meta.updateTag({ rel: 'canonical', href: options.url });
    }

    if (options.image) {
      this.meta.updateTag({ property: 'og:image', content: options.image });
      this.meta.updateTag({ name: 'twitter:image', content: options.image });
    }
  }

  setBusinessJsonLd(business: BusinessJsonLd): void {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: business.name,
      ...(business.description && { description: business.description }),
      ...(business.phone && { telephone: business.phone }),
      ...(business.url && { url: business.url }),
      ...(business.image && { image: business.image }),
      ...(business.address && {
        address: {
          '@type': 'PostalAddress',
          streetAddress: business.address,
        },
      }),
      ...(business.latitude && business.longitude && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: business.latitude,
          longitude: business.longitude,
        },
      }),
    };
    this.setJsonLd(jsonLd);
  }

  private setJsonLd(data: object): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let script = this.document.getElementById('structured-data') as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.id = 'structured-data';
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }
}
