import { renderHook, act } from '@testing-library/react-native';
import { useDebounce, useDebouncedCallback } from '@/hooks/useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('debounces value updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 300 } },
    );

    rerender({ value: 'world', delay: 300 });
    expect(result.current).toBe('hello');

    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe('world');
  });

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => jest.advanceTimersByTime(200));
    rerender({ value: 'c' });
    act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe('a');

    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe('c');
  });

  it('cleans up timer on unmount', () => {
    const { result, unmount, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    unmount();
    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe('a');
  });
});

describe('useDebouncedCallback', () => {
  it('debounces callback execution', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => result.current());
    act(() => result.current());
    act(() => result.current());

    expect(callback).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(300));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
