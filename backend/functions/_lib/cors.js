// functions/_lib/cors.js

'use strict';

// Parse a CSV env var into a trimmed array
const parseList = (s) =>
  (s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

// Sensible defaults if ALLOWED_ORIGINS is not set
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://www.zensoulwellness.com',
  'https://zensoulwellness.com',
];

// Build the active allowlist
const ENV_ALLOW = parseList(process.env.ALLOWED_ORIGINS);
const ALLOW_LIST = ENV_ALLOW.length ? ENV_ALLOW : DEFAULT_ALLOWED_ORIGINS;

// Pick the response origin from request Origin header (case-insensitive)
function pickOrigin(event) {
  const reqHeaders = event?.headers || {};
  const key = Object.keys(reqHeaders).find((k) => k.toLowerCase() === 'origin');
  const origin = key ? reqHeaders[key] : '';
  return ALLOW_LIST.includes(origin) ? origin : ALLOW_LIST[0];
}

// Build a de-duplicated list of allowed headers
function buildAllowedHeaders(extraAllowedHeaders) {
  const base = ['Content-Type', 'Authorization', 'X-Seed-Token'];
  const extra = parseList(extraAllowedHeaders);
  const set = new Set([...base, ...extra]);
  return Array.from(set).join(',');
}

/**
 * CORS headers (Path A: no cookies) — do NOT mix wildcard with credentials.
 * By design, we set Allow-Credentials: false (Bearer tokens travel in Authorization header).
 *
 * @param {object} event - Lambda proxy event
 * @param {object} [opts]
 * @param {string} [opts.methods='GET,POST,PUT,PATCH,DELETE,OPTIONS'] - allowed methods
 * @param {string} [opts.extraAllowedHeaders=''] - CSV of additional allowed headers
 */
exports.corsHeaders = (event, { methods = 'GET,POST,PUT,PATCH,DELETE,OPTIONS', extraAllowedHeaders = '' } = {}) => {
  const allowOrigin = pickOrigin(event);
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    // Path A: no cookies → explicitly false (prevents browser rejecting '*' + credentials combos)
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': buildAllowedHeaders(extraAllowedHeaders),
    'Content-Type': 'application/json',
  };
};

/**
 * Handy preflight responder — return this early in handlers for OPTIONS.
 * Example:
 *   if (event.httpMethod === 'OPTIONS') return cors.corsPreflight(event)
 */
exports.corsPreflight = (event, opts) => ({
  statusCode: 204,
  headers: exports.corsHeaders(event, opts),
  body: '',
});

// (Optionally export for tests or advanced use)
exports._ALLOW_LIST = ALLOW_LIST;
exports._DEFAULT_ALLOWED_ORIGINS = DEFAULT_ALLOWED_ORIGINS;
