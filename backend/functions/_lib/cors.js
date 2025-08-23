// functions/_lib/cors.js
const parseList = (s) =>
  (s || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);

const ALLOW_LIST = parseList(process.env.ALLOWED_ORIGINS) // CSV list
const DEFAULT_ALLOW = ALLOW_LIST[0] || 'http://localhost:3000'

exports.corsHeaders = (event, { methods = 'GET,POST,OPTIONS', extraAllowedHeaders = '' } = {}) => {
  const reqHeaders = event.headers || {}
  const origin = reqHeaders.origin || reqHeaders.Origin || ''
  const allowOrigin = ALLOW_LIST.includes(origin) ? origin : DEFAULT_ALLOW
  const allowHeaders = ['Content-Type','Authorization','X-Seed-Token', extraAllowedHeaders]
    .filter(Boolean).join(',')

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': allowHeaders,
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  }
}
