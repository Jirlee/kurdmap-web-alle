import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import de from './locales/de';
import ku from './locales/ku';
import kmr from './locales/kmr';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
    ku: { translation: ku },
    kmr: { translation: kmr },
  },
  lng: 'de',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
