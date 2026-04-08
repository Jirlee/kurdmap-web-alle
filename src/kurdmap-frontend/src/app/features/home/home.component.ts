import { Component, inject, OnInit, AfterViewInit, PLATFORM_ID, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HeroSectionComponent } from '../../shared/components/hero-section/hero-section.component';
import { CategoryCardsComponent } from '../../shared/components/category-cards/category-cards.component';
import { CitySelectorComponent } from '../../shared/components/city-selector/city-selector.component';
import { FeaturedBusinessesComponent } from '../../shared/components/featured-businesses/featured-businesses.component';
import { HowItWorksComponent } from '../../shared/components/how-it-works/how-it-works.component';
import { TrustStatsComponent } from '../../shared/components/trust-stats/trust-stats.component';
import { NewsletterComponent } from '../../shared/components/newsletter/newsletter.component';
import { AppCtaComponent } from '../../shared/components/app-cta/app-cta.component';
import { FaqComponent } from '../../shared/components/faq/faq.component';
import { PromotionBannerComponent } from '../../shared/components/promotion-banner/promotion-banner.component';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-home',
  imports: [
    TranslateModule,
    HeroSectionComponent,
    CategoryCardsComponent,
    CitySelectorComponent,
    FeaturedBusinessesComponent,
    HowItWorksComponent,
    TrustStatsComponent,
    NewsletterComponent,
    AppCtaComponent,
    FaqComponent,
    PromotionBannerComponent,
  ],
  template: `
    <app-hero-section />
    <div class="reveal-section" data-reveal>
      <app-category-cards />
    </div>
    <div class="reveal-section" data-reveal>
      <app-city-selector />
    </div>
    <div class="reveal-section" data-reveal>
      <app-featured-businesses />
    </div>
    <div class="reveal-section" data-reveal>
      <app-promotion-banner />
    </div>
    <div class="reveal-section" data-reveal>
      <app-trust-stats />
    </div>
    <div class="reveal-section" data-reveal>
      <app-faq />
    </div>
    <div class="reveal-section" data-reveal>
      <app-how-it-works />
    </div>
    <div class="reveal-section" data-reveal>
      <app-newsletter />
    </div>
    <div class="reveal-section" data-reveal>
      <app-app-cta />
    </div>
  `,
})
export default class HomeComponent implements OnInit, AfterViewInit {
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly el = inject(ElementRef);

  ngOnInit(): void {
    const title = this.translate.instant('home.title');
    const desc = this.translate.instant('home.subtitle');
    this.seo.updateMeta({ title, description: desc });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const sections = this.el.nativeElement.querySelectorAll('[data-reveal]');
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    sections.forEach((s: Element) => observer.observe(s));
  }
}
