import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) {
            setState({ latitude: null, longitude: null, loading: false, error: 'Permission denied' });
          }
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!cancelled) {
          setState({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            loading: false,
            error: null,
          });
        }
      } catch {
        if (!cancelled) {
          setState({ latitude: null, longitude: null, loading: false, error: 'Failed to get location' });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
