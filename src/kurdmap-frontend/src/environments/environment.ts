export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  defaultLanguage: 'de',
  supportedLanguages: ['ku', 'kmr', 'de', 'en'],
  // Only Sorani (ku) uses Arabic script and is RTL. Kurmanji (kmr) uses Latin script → LTR.
  rtlLanguages: ['ku'],
};
