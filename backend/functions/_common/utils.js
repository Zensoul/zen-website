// functions/_common/utils.js
const crypto = require('crypto')
const { ddb, tables } = require('./db')

function safeJsonParse(str) {
  try {
    return str ? JSON.parse(str) : {}
  } catch {
    return {}
  }
}
exports.getBody = (event) => safeJsonParse(event.body)

exports.uuid = () => (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'))

exports.nowIso = () => new Date().toISOString()

exports.requireFields = (obj, fields) =>
  fields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === '')

function base64UrlDecode(seg) {
  const b64 = seg.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 === 2 ? '==' : b64.length % 4 === 3 ? '=' : ''
  return Buffer.from(b64 + pad, 'base64').toString('utf8')
}
function decodeJWT(token) {
  try {
    const [, payload] = token.split('.')
    return JSON.parse(base64UrlDecode(payload))
  } catch {
    return null
  }
}
exports.decodeJWT = decodeJWT

exports.getBearerToken = (event) => {
  const h = event.headers || {}
  const auth = h.Authorization || h.authorization || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (m) return m[1]
  // try cookie
  const cookie = h.Cookie || h.cookie || ''
  const cookieMatch = cookie.match(/(?:^|;\s*)idToken=([^;]+)/)
  return cookieMatch ? decodeURIComponent(cookieMatch[1]) : null
}

exports.getUserFromToken = async (event) => {
  const token = exports.getBearerToken(event)
  if (!token) return null
  const claims = decodeJWT(token)
  if (!claims) return null
  const userId = claims.sub
  if (!userId) return null
  // fetch user record for role, etc.
  try {
    const { Item } = await ddb
      .get({
        TableName: tables.USERS,
        Key: { userId },
      })
      .promise()
    return (
      Item || {
        userId,
        email: claims.email,
        name: claims.name,
        role: claims.role, // may be undefined until we write one
      }
    )
  } catch (e) {
    console.warn('getUserFromToken Dynamo error', e)
    return {
      userId,
      email: claims.email,
      name: claims.name,
      role: claims.role,
    }
  }
}

exports.isAdmin = async (event) => {
  const u = await exports.getUserFromToken(event)
  return !!(u && (u.role === 'admin' || u.isAdmin === true))
}
