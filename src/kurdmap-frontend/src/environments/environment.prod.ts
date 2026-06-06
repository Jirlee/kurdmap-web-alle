export const environment = {
  production: true,
  apiUrl: '/api/v1',
  defaultLanguage: 'de',
  supportedLanguages: ['ku', 'kmr', 'de', 'en'],
  // Only Sorani (ku) uses Arabic script and is RTL. Kurmanji (kmr) uses Latin script → LTR.
  rtlLanguages: ['ku'],
};
