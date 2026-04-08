import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
}

export interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
  geometry: [number, number][]; // [lat, lng] pairs
  steps: RouteStep[];
}

@Injectable({ providedIn: 'root' })
export class DirectionsService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly route = signal<RouteInfo | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async calculateRoute(
    fromLat: number, fromLng: number,
    toLat: number, toLng: number
  ): Promise<RouteInfo | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
      const response = await firstValueFrom(
        this.http.get<any>(url)
      );

      if (response?.code !== 'Ok' || !response.routes?.length) {
        this.error.set('noRoute');
        this.route.set(null);
        this.loading.set(false);
        return null;
      }

      const osrmRoute = response.routes[0];
      const coords: [number, number][] = osrmRoute.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] // GeoJSON is [lng, lat], Leaflet needs [lat, lng]
      );

      const steps: RouteStep[] = [];
      for (const leg of osrmRoute.legs) {
        for (const step of leg.steps) {
          if (step.maneuver && step.distance > 0) {
            steps.push({
              instruction: this.buildInstruction(step),
              distance: Math.round(step.distance),
              duration: Math.round(step.duration),
            });
          }
        }
      }

      const routeInfo: RouteInfo = {
        distance: Math.round(osrmRoute.distance),
        duration: Math.round(osrmRoute.duration),
        geometry: coords,
        steps,
      };

      this.route.set(routeInfo);
      this.loading.set(false);
      return routeInfo;
    } catch {
      this.error.set('noRoute');
      this.route.set(null);
      this.loading.set(false);
      return null;
    }
  }

  clearRoute(): void {
    this.route.set(null);
    this.error.set(null);
  }

  private buildInstruction(step: any): string {
    const maneuver = step.maneuver;
    const name = step.name || '';
    const type = maneuver.type;
    const modifier = maneuver.modifier || '';

    if (type === 'depart') return `Start on ${name || 'the road'}`;
    if (type === 'arrive') return 'You have arrived';
    if (type === 'turn') return `Turn ${modifier}${name ? ` onto ${name}` : ''}`;
    if (type === 'merge') return `Merge ${modifier}${name ? ` onto ${name}` : ''}`;
    if (type === 'roundabout' || type === 'rotary') {
      return `At the roundabout, take exit${name ? ` onto ${name}` : ''}`;
    }
    if (type === 'fork') return `Keep ${modifier}${name ? ` onto ${name}` : ''}`;
    if (type === 'end of road') return `Turn ${modifier}${name ? ` onto ${name}` : ''}`;
    if (type === 'new name') return `Continue onto ${name}`;
    if (type === 'continue') return `Continue${name ? ` on ${name}` : ''}`;

    return `${type} ${modifier}${name ? ` – ${name}` : ''}`.trim();
  }
}
