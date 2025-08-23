// File: functions/auth/login.js
'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' })
const cognito = new AWS.CognitoIdentityServiceProvider()

// === NEW: Dynamic CORS helper (no wildcard when sending credentials) ===
const DEFAULT_ALLOWED_ORIGINS = [
  // CHANGED: sensible defaults; override via ALLOWED_ORIGINS env (CSV)
  'http://localhost:3000',
  'https://www.zensoulwellness.com',
  'https://zensoulwellness.com',
]
function buildCorsHeaders(event) {
  const reqHeaders = event.headers || {}
  const originKey = Object.keys(reqHeaders).find((k) => k.toLowerCase() === 'origin')
  const origin = originKey ? reqHeaders[originKey] : ''
  const list = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const allowlist = list.length ? list : DEFAULT_ALLOWED_ORIGINS
  const allowOrigin = allowlist.includes(origin) ? origin : allowlist[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin, // CHANGED: echo a specific origin, not '*'
    'Vary': 'Origin',                           // NEW: keep caches correct
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json',
  }
}

// Safe JWT payload decoder (no signature verification here; Cognito already issued it)
function decodeJwtPayload(jwt) {
  try {
    const [, payloadB64] = jwt.split('.')
    if (!payloadB64) return null
    const json = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

module.exports.handler = async (event) => {
  const headers = buildCorsHeaders(event) // CHANGED: use dynamic per-request headers

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' } // CHANGED: preflight with specific origin
  }

  try {
    const { email, password } = JSON.parse(event.body || '{}')

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Email and password are required' }),
      }
    }

    const resp = await cognito
      .initiateAuth({
        ClientId: process.env.COGNITO_CLIENT_ID,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })
      .promise()

    const auth = resp.AuthenticationResult || {}

    // Handle challenges (MFA, NEW_PASSWORD_REQUIRED, etc.)
    if (!auth.IdToken && resp.ChallengeName) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          message: 'Challenge required',
          challengeName: resp.ChallengeName,
          session: resp.Session || null,
        }),
      }
    }

    if (!auth.IdToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Authentication failed' }),
      }
    }

    // Decode ID token to expose claims and group membership
    const claims = decodeJwtPayload(auth.IdToken) || {}
    const rawGroups = claims['cognito:groups'] || []
    const groups = Array.isArray(rawGroups)
      ? rawGroups
      : String(rawGroups || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)

    const isAdmin = groups.includes('Admins')

    // Build a small user profile for FE convenience
    const user = {
      sub: claims.sub,
      email: claims.email || claims['custom:email'] || email,
      name: claims.name || claims['cognito:username'] || null,
      groups,
      isAdmin,
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login successful',
        // CHANGED: include BOTH keys for compatibility with existing FE code
        token: auth.IdToken,          // existing UserContext expects `res.token`
        idToken: auth.IdToken,        // clearer naming for new consumers
        accessToken: auth.AccessToken,
        refreshToken: auth.RefreshToken,
        expiresIn: auth.ExpiresIn,
        user,
      }),
    }
  } catch (err) {
    console.error('Login error:', err)

    // Cognito common errors
    const code = err.code || ''
    const statusCode = (
      code === 'NotAuthorizedException' ||
      code === 'UserNotConfirmedException' ||
      code === 'PasswordResetRequiredException' ||
      code === 'UserNotFoundException' ||
      code === 'CodeMismatchException'
    ) ? 401 : 500

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        message: err.message || 'Internal Server Error',
        code: err.code || 'Error',
      }),
    }
  }
}
