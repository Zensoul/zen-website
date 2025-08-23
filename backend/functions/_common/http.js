// functions/_common/http.js
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'

const baseHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
}

const res = (statusCode, body = {}, extraHeaders = {}) => ({
  statusCode,
  headers: { ...baseHeaders, ...extraHeaders },
  body: typeof body === 'string' ? body : JSON.stringify(body),
})

exports.ok = (body, headers) => res(200, body, headers)
exports.created = (body, headers) => res(201, body, headers)
exports.noContent = (headers) => res(204, '', headers)
exports.badRequest = (msg = 'Bad Request', details) => res(400, { message: msg, details })
exports.unauthorized = (msg = 'Unauthorized') => res(401, { message: msg })
exports.forbidden = (msg = 'Forbidden') => res(403, { message: msg })
exports.conflict = (msg = 'Conflict') => res(409, { message: msg })
exports.serverError = (err) => {
  console.error('SERVER ERROR:', err)
  return res(500, { message: 'Internal Server Error' })
}
exports.handleOptions = (event) => {
  if (event.httpMethod === 'OPTIONS') return exports.noContent()
  return null
}
