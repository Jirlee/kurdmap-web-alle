import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'approximate' | 'denied' | 'unavailable';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly location = signal<UserLocation | null>(null);
  readonly status = signal<GeoStatus>('idle');

  /** True when the active location came from an IP lookup rather than the GPS sensor. */
  readonly isApproximate = signal<boolean>(false);

  /** Selected radius in kilometers */
  readonly radiusKm = signal<number>(5);

  /** Whether geolocation is available in this browser */
  get isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'geolocation' in navigator;
  }

  /**
   * Request the user's current position.
   * Tries the precise browser sensor first; if that is denied or unavailable it
   * falls back to a coarse IP-based estimate so "near me" still returns useful
   * results instead of failing outright.
   */
  async requestLocation(): Promise<UserLocation | null> {
    if (!isPlatformBrowser(this.platformId)) {
      this.status.set('unavailable');
      return null;
    }

    const precise = this.isSupported ? await this.requestBrowserLocation() : null;
    if (precise) {
      return precise;
    }

    // Browser sensor denied/unavailable → try a coarse IP estimate.
    const approx = await this.locateByIp();
    if (approx) {
      this.location.set(approx);
      this.isApproximate.set(true);
      this.status.set('approximate');
      return approx;
    }

    // Keep the more specific status set by requestBrowserLocation (denied/unavailable).
    if (this.status() === 'loading') {
      this.status.set('unavailable');
    }
    return null;
  }

  /** Precise location from the browser Geolocation API. */
  private requestBrowserLocation(): Promise<UserLocation | null> {
    if (!this.isSupported) {
      this.status.set('unavailable');
      return Promise.resolve(null);
    }

    this.status.set('loading');

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          this.location.set(loc);
          this.isApproximate.set(false);
          this.status.set('granted');
          resolve(loc);
        },
        (error) => {
          this.status.set(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 min cache
        },
      );
    });
  }

  /** Coarse location estimate from the client's IP address (city-level accuracy). */
  private async locateByIp(): Promise<UserLocation | null> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timer);
      if (!res.ok) return null;

      const data = await res.json() as { latitude?: number; longitude?: number };
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return { latitude: data.latitude, longitude: data.longitude };
      }
      return null;
    } catch {
      return null;
    }
  }

  /** Clear location and reset to idle */
  clearLocation(): void {
    this.location.set(null);
    this.isApproximate.set(false);
    this.status.set('idle');
  }
}
