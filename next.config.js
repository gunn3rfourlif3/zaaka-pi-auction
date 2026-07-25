/** @type {import('next').NextConfig} */

// Production app origin (e.g. https://auction.example.com). Used for CSP and
// server-action allow-listing. Falls back to localhost in development.
const APP_ORIGIN = process.env.NEXTAUTH_URL || 'http://localhost:3000';
let APP_HOST = 'localhost:3000';
try { APP_HOST = new URL(APP_ORIGIN).host; } catch (_) {}

// Pi Network origins the app must interoperate with.
const PI_ORIGINS = [
  'https://sdk.minepi.com',
  'https://app-cdn.minepi.com',
  'https://sandbox.minepi.com',
  'https://api.minepi.com',
];

// Content-Security-Policy locked to our own origin + the Pi Network.
// NOTE: 'unsafe-inline'/'unsafe-eval' remain for scripts because Next.js and
// some libraries rely on them; a future hardening step is to move to nonces.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.minepi.com https://app-cdn.minepi.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // Same-origin API + websockets, plus the Pi API.
  "connect-src 'self' ws: wss: https://api.minepi.com https://*.minepi.com",
  // Allow the Pi Browser / sandbox to embed the app (replaces X-Frame-Options).
  "frame-ancestors 'self' https://sandbox.minepi.com https://app-cdn.minepi.com https://*.minepi.com",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig = {
  // Runs behind a custom server (server.js) under PM2, so no 'standalone' output.
  distDir: '.next',
  poweredByHeader: false,
  // Don't fail production builds on lint warnings/errors — CI runs lint separately.
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: [APP_HOST, ...PI_ORIGINS.map((o) => new URL(o).host)],
    },
  },
};

module.exports = nextConfig;
