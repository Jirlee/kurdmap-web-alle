import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  computed,
  PLATFORM_ID,
  afterRenderEffect,
  ElementRef,
  viewChild,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DirectionsService, RouteInfo } from '../../../core/services/directions.service';
import { GeolocationService } from '../../../core/services/geolocation.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-directions-panel',
  imports: [TranslateModule],
  template: `
    <div class="dp-wrapper">
      <!-- Map container -->
      <div #mapContainer class="dp-map"></div>

      <!-- Floating panel -->
      @if (showPanel()) {
        <div class="dp-panel">
          @if (directionsService.loading()) {
            <div class="dp-status">
              <div class="dp-spinner"></div>
              <span>{{ 'directions.calculating' | translate }}</span>
            </div>
          } @else if (directionsService.error()) {
            <div class="dp-status dp-error">
              <svg class="size-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
              </svg>
              <span>{{ 'directions.noRoute' | translate }}</span>
            </div>
          } @else if (directionsService.route()) {
            <!-- Route summary -->
            <div class="dp-summary">
              <div class="dp-stat">
                <span class="dp-stat-value">{{ formatDistance(directionsService.route()!.distance) }}</span>
                <span class="dp-stat-label">{{ 'directions.distance' | translate }}</span>
              </div>
              <div class="dp-divider"></div>
              <div class="dp-stat">
                <span class="dp-stat-value">{{ formatDuration(directionsService.route()!.duration) }}</span>
                <span class="dp-stat-label">{{ 'directions.duration' | translate }}</span>
              </div>
            </div>

            <!-- Steps -->
            @if (showSteps()) {
              <div class="dp-steps">
                @for (step of directionsService.route()!.steps; track $index; let last = $last) {
                  <div class="dp-step" [class.dp-step-last]="last">
                    <div class="dp-step-dot" [class.dp-step-dot-last]="last">
                      @if (last) {
                        <svg class="size-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>
                      } @else {
                        <div class="size-2 rounded-full bg-current"></div>
                      }
                    </div>
                    <div class="dp-step-content">
                      <span class="dp-step-text">{{ step.instruction }}</span>
                      <span class="dp-step-meta">{{ formatDistance(step.distance) }} · {{ formatDuration(step.duration) }}</span>
                    </div>
                  </div>
                }
              </div>
            }

            <button (click)="showSteps.set(!showSteps())" class="dp-toggle-steps">
              {{ showSteps() ? 'Hide steps' : ('directions.steps' | translate) + ' (' + directionsService.route()!.steps.length + ')' }}
              <svg class="size-4 transition-transform" [class.rotate-180]="showSteps()" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          }

          <!-- Close button -->
          <button (click)="closeDirections()" class="dp-close">
            {{ 'directions.close' | translate }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .dp-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 20rem;
      border-radius: 1rem;
      overflow: hidden;
    }

    .dp-map {
      width: 100%;
      height: 100%;
    }

    .dp-panel {
      position: absolute;
      bottom: 1rem;
      inset-inline-start: 1rem;
      z-index: 1000;
      background: var(--color-surface, #fff);
      border-radius: 0.75rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
      padding: 0.75rem;
      max-width: 22rem;
      min-width: 16rem;
      max-height: 50%;
      overflow-y: auto;
      animation: dp-slide-up 0.25s ease-out;
    }

    .dp-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      font-size: 0.875rem;
      color: var(--color-gray-500);
    }
    .dp-error { color: #ef4444; }

    .dp-spinner {
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid rgba(0, 0, 0, 0.08);
      border-top-color: var(--color-primary-500);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    .dp-summary {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem;
    }
    .dp-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.125rem;
    }
    .dp-stat-value {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-gray-900, #111);
    }
    .dp-stat-label {
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--color-gray-400);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .dp-divider {
      width: 1px;
      height: 2rem;
      background: rgba(0, 0, 0, 0.08);
    }

    .dp-steps {
      padding: 0.25rem 0.5rem 0;
      max-height: 12rem;
      overflow-y: auto;
    }
    .dp-step {
      display: flex;
      gap: 0.625rem;
      padding: 0.375rem 0;
    }
    .dp-step-dot {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
      color: var(--color-primary-500);
    }
    .dp-step-dot-last { color: #ef4444; }
    .dp-step-content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
    }
    .dp-step-text {
      font-size: 0.8125rem;
      color: var(--color-gray-700, #374151);
      line-height: 1.4;
    }
    .dp-step-meta {
      font-size: 0.6875rem;
      color: var(--color-gray-400);
    }

    .dp-toggle-steps {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      width: 100%;
      padding: 0.5rem;
      border: none;
      background: transparent;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-primary-600);
      cursor: pointer;
      border-radius: 0.5rem;
    }
    .dp-toggle-steps:hover { background: rgba(0, 0, 0, 0.03); }

    .dp-close {
      width: 100%;
      padding: 0.5rem;
      margin-top: 0.25rem;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 0.5rem;
      background: transparent;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-gray-500);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .dp-close:hover {
      background: rgba(0, 0, 0, 0.03);
      color: var(--color-gray-700);
    }

    :host-context(.dark) .dp-panel {
      background: var(--color-surface, #1e293b);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
    }
    :host-context(.dark) .dp-stat-value { color: var(--color-gray-100); }
    :host-context(.dark) .dp-step-text { color: var(--color-gray-300); }
    :host-context(.dark) .dp-divider { background: rgba(255, 255, 255, 0.08); }
    :host-context(.dark) .dp-close {
      border-color: rgba(255, 255, 255, 0.08);
      color: var(--color-gray-400);
    }
    :host-context(.dark) .dp-close:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    @keyframes dp-slide-up {
      from { opacity: 0; transform: translateY(0.5rem); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectionsPanelComponent implements OnDestroy {
  protected readonly directionsService = inject(DirectionsService);
  private readonly geoService = inject(GeolocationService);
  private readonly toastService = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly mapContainer = viewChild<ElementRef>('mapContainer');

  readonly destinationLat = input.required<number>();
  readonly destinationLng = input.required<number>();
  readonly destinationName = input<string>('');

  protected readonly showPanel = signal(true);
  protected readonly showSteps = signal(false);

  private map: any = null;
  private routeLayer: any = null;
  private L: any = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      afterRenderEffect(async () => {
        const container = this.mapContainer()?.nativeElement;
        const destLat = this.destinationLat();
        const destLng = this.destinationLng();
        if (!container || !destLat || !destLng) return;

        await this.initMap(container, destLat, destLng);
      });
    }
  }

  ngOnDestroy(): void {
    this.directionsService.clearRoute();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private async initMap(container: HTMLElement, destLat: number, destLng: number): Promise<void> {
    if (this.map) return;

    const leafletMod = await import('leaflet');
    // Unwrap CommonJS/ESM interop so `leaflet.map` is always available.
    const leaflet = ((leafletMod as any).default ?? leafletMod) as typeof import('leaflet');
    this.L = leaflet;

    this.map = leaflet.map(container, { zoomControl: true }).setView([destLat, destLng], 14);
    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Destination marker
    const destIcon = leaflet.divIcon({
      html: '<div style="width:16px;height:16px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      className: '',
    });
    leaflet.marker([destLat, destLng], { icon: destIcon })
      .addTo(this.map)
      .bindPopup(this.destinationName() || 'Destination');

    // Try to get user location and calculate route
    const loc = await this.geoService.requestLocation();
    if (loc) {
      // User marker
      const userIcon = leaflet.divIcon({
        html: '<div style="width:14px;height:14px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.2);"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        className: '',
      });
      leaflet.marker([loc.latitude, loc.longitude], { icon: userIcon })
        .addTo(this.map);

      // Calculate route
      const route = await this.directionsService.calculateRoute(
        loc.latitude, loc.longitude, destLat, destLng
      );

      if (route) {
        this.drawRoute(route);
        this.toastService.success(this.toastService.constructor.name ? 'Route calculated' : 'Route calculated');
      }
    } else {
      this.toastService.warning('Allow location access for directions');
    }
  }

  private drawRoute(route: RouteInfo): void {
    if (!this.map || !this.L) return;

    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
    }

    this.routeLayer = this.L.polyline(route.geometry, {
      color: '#3b82f6',
      weight: 5,
      opacity: 0.8,
      smoothFactor: 1,
    }).addTo(this.map);

    // Fit bounds to show entire route
    this.map.fitBounds(this.routeLayer.getBounds(), { padding: [40, 40] });
  }

  protected closeDirections(): void {
    this.directionsService.clearRoute();
    this.showPanel.set(false);
  }

  protected formatDistance(meters: number): string {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  }

  protected formatDuration(seconds: number): string {
    if (seconds < 60) return `< 1 min`;
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
}
