import { I18nManager } from 'react-native';
import { useAppStore } from '@/stores/app-store';

const RTL_LANGUAGES = ['ku'];

export function useRtl() {
  const language = useAppStore((s) => s.language);
  const isRtl = RTL_LANGUAGES.includes(language);

  if (I18nManager.isRTL !== isRtl) {
    I18nManager.allowRTL(isRtl);
    I18nManager.forceRTL(isRtl);
  }

  return { isRtl, direction: isRtl ? 'rtl' : 'ltr' } as const;
}
