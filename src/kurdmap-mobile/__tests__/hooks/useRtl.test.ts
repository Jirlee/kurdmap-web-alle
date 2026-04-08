import { renderHook } from '@testing-library/react-native';
import { I18nManager } from 'react-native';
import { useRtl } from '@/hooks/useRtl';
import { useAppStore } from '@/stores/app-store';

// Mock I18nManager methods
const allowRTL = jest.spyOn(I18nManager, 'allowRTL');
const forceRTL = jest.spyOn(I18nManager, 'forceRTL');

describe('useRtl', () => {
  beforeEach(() => {
    allowRTL.mockReset();
    forceRTL.mockReset();
    // Reset I18nManager state
    Object.defineProperty(I18nManager, 'isRTL', { value: false, writable: true });
  });

  it('returns LTR for English', () => {
    useAppStore.setState({ language: 'en' });
    const { result } = renderHook(() => useRtl());

    expect(result.current.isRtl).toBe(false);
    expect(result.current.direction).toBe('ltr');
  });

  it('returns LTR for German', () => {
    useAppStore.setState({ language: 'de' });
    const { result } = renderHook(() => useRtl());

    expect(result.current.isRtl).toBe(false);
    expect(result.current.direction).toBe('ltr');
  });

  it('returns RTL for Kurdish (Sorani)', () => {
    useAppStore.setState({ language: 'ku' });
    const { result } = renderHook(() => useRtl());

    expect(result.current.isRtl).toBe(true);
    expect(result.current.direction).toBe('rtl');
  });

  it('returns LTR for Kurmanji (Latin script)', () => {
    useAppStore.setState({ language: 'kmr' });
    const { result } = renderHook(() => useRtl());

    expect(result.current.isRtl).toBe(false);
    expect(result.current.direction).toBe('ltr');
  });

  it('forces RTL when language is ku and I18nManager is LTR', () => {
    Object.defineProperty(I18nManager, 'isRTL', { value: false, writable: true });
    useAppStore.setState({ language: 'ku' });

    renderHook(() => useRtl());

    expect(allowRTL).toHaveBeenCalledWith(true);
    expect(forceRTL).toHaveBeenCalledWith(true);
  });
});
