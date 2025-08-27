// functions/auth/me.js
'use strict';

/**
 * /auth/me endpoint (Path A)
 * - Reads JWT from Authorization: Bearer <idToken> (no cookies).
 * - Decodes payload (no signature verification here—Cognito/API GW authorizer should guard protected routes).
 * - Returns minimal user profile + groups so the UI can gate admin.
 */

const { corsHeaders, corsPreflight } = require('../_lib/cors');

// --- helper: decode JWT payload safely (no verify) ---
function decodeJwtPayload(token) {
  try {
    const [, payload] = (token || '').split('.');
    if (!payload) return null;
    const json = Buffer
      .from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
      .toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// --- helper: read Bearer token from header only (Path A) ---
function readBearer(event) {
  const h = event.headers || {};
  const k = Object.keys(h).find((x) => x.toLowerCase() === 'authorization');
  const v = k ? h[k] : '';
  return v && v.startsWith('Bearer ') ? v.slice(7) : null;
}

module.exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsPreflight(event, { methods: 'GET,OPTIONS' });
  }

  const headers = corsHeaders(event, { methods: 'GET,OPTIONS' });

  try {
    const token = readBearer(event);
    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ message: 'Missing bearer token' }) };
    }

    const claims = decodeJwtPayload(token);
    if (!claims?.sub) {
      return { statusCode: 401, headers, body: JSON.stringify({ message: 'Invalid token' }) };
    }

    // Cognito groups may be a comma string or array
    const rawGroups = claims['cognito:groups'] || [];
    const groups = Array.isArray(rawGroups)
      ? rawGroups
      : String(rawGroups || '').split(',').map((s) => s.trim()).filter(Boolean);

    const me = {
      userId: claims.sub,
      email: claims.email || null,
      name: claims.name || claims['cognito:username'] || null,
      groups,
      role: groups.includes('Admins') ? 'admin' : 'user',
      exp: claims.exp,
      iat: claims.iat,
    };

    return { statusCode: 200, headers, body: JSON.stringify(me) };
  } catch (err) {
    console.error('auth/me error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }
};
