import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join, normalize } from 'node:path';
import { randomBytes } from 'node:crypto';
import { request as httpRequest } from 'node:http';

const browserDistFolder = join(import.meta.dirname, '../browser');
const isProduction = process.env['NODE_ENV'] === 'production';
const apiUrl = process.env['API_URL'] || 'http://localhost:8080';

const app = express();
const angularApp = new AngularNodeAppEngine();

// ── Security headers ───────────────────────────────────────
app.use((_req, res, next) => {
  const nonce = randomBytes(16).toString('base64');
  res.locals['cspNonce'] = nonce;

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; ` +
    `script-src 'self' 'unsafe-inline'; ` +
    `style-src 'self' 'unsafe-inline'; ` +
    `font-src 'self'; ` +
    `img-src 'self' data: https://*.tile.openstreetmap.org; ` +
    `connect-src 'self' https://*.tile.openstreetmap.org; ` +
    `frame-ancestors 'none'; ` +
    `base-uri 'self'; ` +
    `form-action 'self'`
  );

  next();
});

// ── Path traversal protection ──────────────────────────────
app.use((req, res, next) => {
  const normalized = normalize(req.path);
  if (normalized.includes('..') || normalized.includes('//')) {
    res.status(400).end('Bad Request');
    return;
  }
  next();
});

/**
 * Proxy /api requests to the backend API server
 */
app.use('/api', (req, res) => {
  const url = new URL(apiUrl);
  const proxyReq = httpRequest(
    {
      hostname: url.hostname,
      port: url.port || 80,
      path: `/api${req.url}`,
      method: req.method,
      headers: { ...req.headers, host: url.host },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    },
  );
  proxyReq.on('error', () => {
    if (!res.headersSent) res.status(502).json({ error: 'API unavailable' });
  });
  req.pipe(proxyReq, { end: true });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
