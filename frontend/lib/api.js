// File: lib/api.js

// ==============================
// Base URL
// ==============================
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  'https://w4zqabm0ii.execute-api.ap-south-1.amazonaws.com/dev'

// Ensure path starts with `/`
function api(path) {
  if (!path.startsWith('/')) path = '/' + path
  return API_BASE + path
}

// ==============================
// Utils
// ==============================
function getToken() {
  if (typeof window === 'undefined') return null
  // Support both keys just in case different parts of the app use either
  try {
    return localStorage.getItem('idToken') || localStorage.getItem('token')
  } catch {
    return null
  }
}

// CHANGE: split out a helper to build auth header; keep Bearer optional.
// This stays the same functionally but we’ll reuse it below with “extra headers”.
function authHeaders() {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
  const t = getToken()
  if (t) headers.Authorization = `Bearer ${t}`
  return headers
}

/** Build `?key=value` query string; supports arrays */
function buildQuery(params = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    if (Array.isArray(v)) v.forEach((item) => sp.append(k, String(item)))
    else sp.set(k, String(v))
  })
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

// ==============================
// Core request
// ==============================
// CHANGE: add optional `extraHeaders` argument so callers (like /admin/seed)
// can send X-Seed-Token without duplicating fetch code.
async function request(method, path, body, extraHeaders) {
  const res = await fetch(api(path), {
    method,
    headers: { ...authHeaders(), ...(extraHeaders || {}) }, // CHANGE: merge extra headers
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    credentials: 'include', // IMPORTANT: send/receive HttpOnly session cookie
  })

  // CHANGE: tolerate empty bodies (e.g., 204) gracefully.
  const raw = await res.text()
  let data
  try {
    data = raw ? JSON.parse(raw) : {}
  } catch {
    data = { raw }
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status} ${res.statusText}`
    const err = new Error(msg)
    err.status = res.status
    err.payload = data
    throw err
  }

  return data
}

// Convenience wrappers (useful across app & admin)
// CHANGE: add 4th param passthrough for extra headers on POST/PUT only when needed.
export const apiGet = (p) => request('GET', p)
export const apiPost = (p, b, h) => request('POST', p, b, h) // CHANGE
export const apiPut = (p, b, h) => request('PUT', p, b, h)   // CHANGE
export const apiDelete = (p) => request('DELETE', p)

// ==============================
// Public API functions
// ==============================

// Auth
export const signup = ({ name, email, password }) =>
  apiPost('/auth/signup', { name, email, password })

export const login = ({ email, password }) =>
  apiPost('/auth/login', { email, password })

export const logout = () => apiPost('/auth/logout')

export const me = () => apiGet('/auth/me')

// Assessments
export const submitAssessment = (payload) => apiPost('/assessment', payload)
export const listAssessments = (userId) => apiGet(`/assessment${buildQuery({ userId })}`)

// Counsellors
export const listCounsellors = (params = {}) => apiGet(`/counsellors${buildQuery(params)}`)

// Appointments
export const checkAvailability = ({ counsellorId, counselorId, date }) => {
  // accept both spellings
  const id = counsellorId || counselorId
  return apiGet(`/appointments/check-availability${buildQuery({ counsellorId: id, date })}`)
}

export const createAppointment = (payload) => apiPost('/appointments', payload)

// ==============================
// Admin (protected by Cognito + group)
// ==============================
// CHANGE: Add explicit seedAdmin call that passes the X-Seed-Token header expected by the backend.
// Requires that the caller is logged in as an Admin (Authorization header will be attached automatically).
export const seedAdmin = (seedToken) =>
  apiPost('/admin/seed', {}, { 'X-Seed-Token': seedToken }) // CHANGE
