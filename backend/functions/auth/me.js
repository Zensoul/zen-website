// functions/auth/me.js
'use strict'

/**
 * /auth/me endpoint
 * - Reads JWT from Authorization: Bearer <idToken> OR from cookies.
 * - Decodes payload (no signature verification here—use authorizers for protected routes).
 * - Returns minimal user profile + groups so the UI can gate admin.
 *
 * CHANGED: dynamic per-request CORS with allowlist (no wildcard when credentials are used).
 */

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })

// CHANGED: helper to pick the request Origin (case-insensitive)
function getOrigin(event) {
  const h = event.headers || {}
  const k = Object.keys(h).find((x) => x.toLowerCase() === 'origin')
  return k ? h[k] : ''
}

// CHANGED: build CORS headers per request using an allowlist
function buildCorsHeaders(event) {
  // Read allowlist from env (comma separated) or use sensible defaults
  // e.g. NEXT_PUBLIC frontends + localhost
  const defaults = [
    'http://localhost:3000',
    'https://www.zensoulwellness.com',
    'https://zensoulwellness.com',
  ]
  // ALLOWED_ORIGINS can be: "http://localhost:3000,https://www.zensoulwellness.com"
  const list = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const allowlist = list.length ? list : defaults
  const origin = getOrigin(event)

  // If request Origin is on the allowlist, echo it (required for credentials)
  const allowOrigin = allowlist.includes(origin) ? origin : allowlist[0]

  return {
    'Access-Control-Allow-Origin': allowOrigin, // CHANGED: no '*'
    'Vary': 'Origin',                           // CHANGED: make caches vary on Origin
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json',
  }
}

// --- helper: decode JWT payload safely (no verify) ---
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString('binary')
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

// --- helper: pull token from header or cookie ---
function readToken(event) {
  // 1) Authorization header
  const h = event.headers || {}
  const authKey = Object.keys(h).find((k) => k.toLowerCase() === 'authorization')
  const authVal = authKey ? h[authKey] : null
  if (authVal && authVal.startsWith('Bearer ')) return authVal.slice(7)

  // 2) Cookie (idToken / token)
  const cookieKey = Object.keys(h).find((k) => k.toLowerCase() === 'cookie')
  const cookieVal = cookieKey ? h[cookieKey] : ''
  if (cookieVal) {
    const map = Object.fromEntries(
      cookieVal.split(';').map((p) => {
        const [k, ...rest] = p.trim().split('=')
        return [k, decodeURIComponent((rest || []).join('='))]
      })
    )
    return map.idToken || map.token || null
  }

  return null
}

module.exports.handler = async (event) => {
  const headers = buildCorsHeaders(event) // CHANGED: build per-request CORS

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    // CHANGED: return with dynamic headers (echoing allowed origin)
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const token = readToken(event)
    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ message: 'No token' }) }
    }

    const claims = decodeJWT(token)
    if (!claims) {
      return { statusCode: 401, headers, body: JSON.stringify({ message: 'Invalid token' }) }
    }

    // Cognito groups may be a comma string or array
    const rawGroups = claims['cognito:groups'] || []
    const groups = Array.isArray(rawGroups)
      ? rawGroups
      : String(rawGroups || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)

    // Minimal, normalized payload for the frontend
    const me = {
      userId: claims.sub,
      email: claims.email || null,
      name: claims.name || claims['cognito:username'] || null,
      groups,
      // convenience: derive role from groups
      role: groups.includes('Admins') ? 'admin' : 'user',
      exp: claims.exp,
      iat: claims.iat,
    }

    return { statusCode: 200, headers, body: JSON.stringify(me) }
  } catch (err) {
    console.error('me error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Internal Server Error' }) }
  }
}
