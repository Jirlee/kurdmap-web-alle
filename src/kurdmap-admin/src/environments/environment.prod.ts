export const environment = {
  production: true,
  // Same-origin API: the admin is served at gs6x.kurdmap.eu and Caddy proxies
  // /api/* on that same host to the API container. Using a relative base means
  // the production bundle contains NO hardcoded external API URL, makes no
  // cross-origin requests (no CORS surface), and never exposes the API origin.
  apiUrl: '',
} as const;