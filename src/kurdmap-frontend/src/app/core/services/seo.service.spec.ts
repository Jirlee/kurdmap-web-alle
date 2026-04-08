import { TestBed } from '@angular/core/testing';
import { SeoService } from './seo.service';
import { Meta, Title } from '@angular/platform-browser';

describe('SeoService', () => {
  let service: SeoService;
  let titleService: Title;
  let metaService: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoService);
    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set page title with KurdMap suffix', () => {
    service.updateMeta({ title: 'Test Page' });
    expect(titleService.getTitle()).toBe('Test Page | KurdMap');
  });

  it('should set meta description', () => {
    service.updateMeta({ title: 'Test', description: 'Test description' });
    const descTag = metaService.getTag('name="description"');
    expect(descTag?.content).toBe('Test description');
  });

  it('should set OG tags', () => {
    service.updateMeta({
      title: 'OG Test',
      description: 'OG Description',
      url: 'https://kurdmap.de/test',
      image: 'https://kurdmap.de/img.jpg',
      type: 'article',
    });
    expect(metaService.getTag('property="og:title"')?.content).toBe('OG Test');
    expect(metaService.getTag('property="og:type"')?.content).toBe('article');
    expect(metaService.getTag('property="og:url"')?.content).toBe('https://kurdmap.de/test');
    expect(metaService.getTag('property="og:image"')?.content).toBe('https://kurdmap.de/img.jpg');
  });

  it('should default OG type to website', () => {
    service.updateMeta({ title: 'Default Type' });
    expect(metaService.getTag('property="og:type"')?.content).toBe('website');
  });

  it('should set business JSON-LD', () => {
    service.setBusinessJsonLd({
      name: 'Test Business',
      description: 'A test',
      address: 'Venloer Str. 1',
      phone: '0221-123',
      latitude: 50.9375,
      longitude: 6.9603,
    });

    const script = document.getElementById('structured-data');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent || '{}');
    expect(data['@type']).toBe('LocalBusiness');
    expect(data.name).toBe('Test Business');
    expect(data.telephone).toBe('0221-123');
    expect(data.geo.latitude).toBe(50.9375);
  });
});
