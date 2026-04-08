import { renderHook, act } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

describe('useNetworkStatus', () => {
  it('defaults to connected', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(true);
  });

  it('subscribes to NetInfo on mount', () => {
    renderHook(() => useNetworkStatus());
    expect(NetInfo.addEventListener).toHaveBeenCalled();
  });

  it('updates when network goes offline', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      (NetInfo as any).__emit({ isConnected: false });
    });

    expect(result.current).toBe(false);
  });

  it('updates when network comes back online', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      (NetInfo as any).__emit({ isConnected: false });
    });
    expect(result.current).toBe(false);

    act(() => {
      (NetInfo as any).__emit({ isConnected: true });
    });
    expect(result.current).toBe(true);
  });

  it('unsubscribes on unmount', () => {
    const unsubscribe = jest.fn();
    (NetInfo.addEventListener as jest.Mock).mockReturnValueOnce(unsubscribe);

    const { unmount } = renderHook(() => useNetworkStatus());
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
