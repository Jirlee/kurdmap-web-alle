import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly location = signal<UserLocation | null>(null);
  readonly status = signal<GeoStatus>('idle');

  /** Selected radius in kilometers */
  readonly radiusKm = signal<number>(5);

  /** Whether geolocation is available in this browser */
  get isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'geolocation' in navigator;
  }

  /** Request the user's current position */
  requestLocation(): Promise<UserLocation | null> {
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
          this.status.set('granted');
          resolve(loc);
        },
        (error) => {
          this.status.set(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
          this.location.set(null);
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

  /** Clear location and reset to idle */
  clearLocation(): void {
    this.location.set(null);
    this.status.set('idle');
  }
}
