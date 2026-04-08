import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useLocation } from '@/hooks/useLocation';

describe('useLocation', () => {
  it('returns coordinates when permission is granted', async () => {
    const { result } = renderHook(() => useLocation());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.latitude).toBe(50.9375);
    expect(result.current.longitude).toBe(6.9603);
    expect(result.current.error).toBeNull();
  });

  it('returns error when permission is denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });

    const { result } = renderHook(() => useLocation());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
    expect(result.current.error).toBe('Permission denied');
  });

  it('returns error when location fetch fails', async () => {
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValueOnce(
      new Error('Location unavailable'),
    );

    const { result } = renderHook(() => useLocation());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.latitude).toBeNull();
    expect(result.current.error).toBe('Failed to get location');
  });

  it('does not update state after unmount', async () => {
    let resolveLocation: (v: unknown) => void;
    (Location.getCurrentPositionAsync as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => { resolveLocation = resolve; }),
    );

    const { result, unmount } = renderHook(() => useLocation());

    // Wait for getCurrentPositionAsync to be called (after permission resolves)
    await waitFor(() => expect(Location.getCurrentPositionAsync).toHaveBeenCalled());
    expect(result.current.loading).toBe(true);

    unmount();
    resolveLocation!({ coords: { latitude: 51, longitude: 7 } });

    // Should not throw or update — state stays as-is after unmount
    expect(result.current.loading).toBe(true);
  });
});
