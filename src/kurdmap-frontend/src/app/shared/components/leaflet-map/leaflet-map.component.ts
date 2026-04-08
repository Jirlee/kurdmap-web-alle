import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  viewChild,
  afterRenderEffect,
  DestroyRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BusinessSummary } from '../../../core/models';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-leaflet-map',
  template: `
    <div #mapContainer class="w-full rounded-card overflow-hidden border border-gray-200" [style.height]="height()"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeafletMapComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly langService = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);
  private map: any;
  private markersLayer: any;
  private L: any;
  private initialized = false;

  readonly mapContainer = viewChild.required<ElementRef>('mapContainer');
  readonly businesses = input<BusinessSummary[]>([]);
  readonly height = input('400px');
  readonly center = input<[number, number]>([51.1657, 10.4515]); // Germany center
  readonly zoom = input(12);
  readonly markerClick = output<BusinessSummary>();

  constructor() {
    // Initialize map after render when in browser
    afterRenderEffect(() => {
      const container = this.mapContainer();
      if (!this.initialized && container && isPlatformBrowser(this.platformId)) {
        this.initialized = true;
        this.initMap();
      }
    });

    // React to business data changes
    afterRenderEffect(() => {
      const _ = this.businesses();
      if (this.map && this.L) {
        this.updateMarkers();
      }
    });

    // React to center/zoom changes
    afterRenderEffect(() => {
      const c = this.center();
      const z = this.zoom();
      if (this.map) {
        this.map.setView(c, z);
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.map) {
        this.map.remove();
      }
    });
  }

  private async initMap(): Promise<void> {
    const L = await import('leaflet');
    this.L = L;

    this.map = L.map(this.mapContainer().nativeElement, {
      center: this.center(),
      zoom: this.zoom(),
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);
    this.updateMarkers();
  }

  private updateMarkers(): void {
    if (!this.markersLayer || !this.L) return;

    this.markersLayer.clearLayers();
    const L = this.L;
    const bounds: [number, number][] = [];

    for (const biz of this.businesses()) {
      if (!biz.latitude || !biz.longitude) continue;
      const pos: [number, number] = [biz.latitude, biz.longitude];
      bounds.push(pos);

      const name = this.langService.getLocalized(biz.name);

      const marker = L.marker(pos, {
        icon: L.divIcon({
          className: 'kurdmap-marker',
          html: `<div class="w-8 h-8 bg-emerald-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
            ${biz.isVerified ? '✓' : '●'}
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      });

      marker.bindPopup(`
        <div style="min-width: 180px; font-family: system-ui, sans-serif;">
          <strong style="font-size: 14px;">${this.escapeHtml(name)}</strong>
          <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">${this.escapeHtml(biz.street)}</div>
          ${biz.isVerified ? '<span style="color: #10b981; font-size: 11px; font-weight: 600;">✓ Verifiziert</span>' : ''}
        </div>
      `);

      marker.on('click', () => this.markerClick.emit(biz));
      marker.addTo(this.markersLayer);
    }

    if (bounds.length > 1) {
      this.map.fitBounds(bounds, { padding: [40, 40] });
    } else if (bounds.length === 1) {
      this.map.setView(bounds[0], 14);
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
