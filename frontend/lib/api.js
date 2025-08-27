// File: lib/api.js

// ==============================
// Base URL
// ==============================
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  'https://w4zqabm0ii.execute-api.ap-south-1.amazonaws.com/dev';

// Ensure path starts with `/`
function api(path) {
  if (!path.startsWith('/')) path = '/' + path;
  return API_BASE + path;
}

// ==============================
// Utils
// ==============================
function getToken() {
  if (typeof window === 'undefined') return null;
  try {
    // Prefer idToken; fall back to legacy key "token"
    return localStorage.getItem('idToken') || localStorage.getItem('token');
  } catch {
    return null;
  }
}

// Build auth headers (Bearer optional)
export function authHeaders() {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  return headers;
}

/** Build `?key=value` query string; supports arrays */
function buildQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) v.forEach((item) => sp.append(k, String(item)));
    else sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

// ==============================
// Core request
// ==============================
async function request(method, path, body, extraHeaders) {
  const res = await fetch(api(path), {
    method,
    headers: { ...authHeaders(), ...(extraHeaders || {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    // IMPORTANT (Path A): do NOT include credentials/cookies
    // credentials: 'omit',
  });

  // Tolerate empty bodies (e.g., 204)
  const raw = await res.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw };
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data;
}

// Convenience wrappers
export const apiGet = (p) => request('GET', p);
export const apiPost = (p, b, h) => request('POST', p, b, h);
export const apiPut = (p, b, h) => request('PUT', p, b, h);
export const apiDelete = (p) => request('DELETE', p);

// ==============================
// Public API functions
// ==============================

// -------- Auth --------
export const signup = ({ name, email, password }) =>
  apiPost('/auth/signup', { name, email, password });

// Accepts extra fields for challenges: { email, password, newPassword?, code?, session? }
export const login = (payload) => apiPost('/auth/login', payload);

// Frontend-only logout (no backend endpoint needed)
export const logout = async () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('idToken');
      localStorage.removeItem('token');
    }
  } catch {}
  return { ok: true };
};

export const me = () => apiGet('/auth/me');

// -------- Assessments --------
export const submitAssessment = (payload) => apiPost('/assessment', payload);

// NOTE: expects raw userId string; if you prefer an object, change signature to ({ userId }) and keep call-site in sync.
export const listAssessments = (userId) =>
  apiGet(`/assessment${buildQuery({ userId })}`);

// -------- Public Counsellors --------
export const listCounsellors = (params = {}) =>
  apiGet(`/counsellors${buildQuery(params)}`);

// -------- Appointments --------
export const checkAvailability = ({ counsellorId, counselorId, date }) => {
  const id = counsellorId || counselorId;
  return apiGet(`/appointments/check-availability${buildQuery({ counsellorId: id, date })}`);
};

export const createAppointment = (payload) => apiPost('/appointments', payload);

// ==============================
// Admin (protected by Cognito + Admins group)
// ==============================

// seeding with header (only if you actually use this endpoint)
export const seedAdmin = (seedToken) =>
  apiPost('/admin/seed', {}, { 'X-Seed-Token': seedToken });

// whoami for admin
export const adminMe = () => apiGet('/admin/me');

// Therapist matching (NEW)
export const recommendTherapists = (payload) =>
  apiPost('/match/recommend', payload);

// dashboard stats (make sure you created functions/admin/stats.js)
export const adminStats = () => apiGet('/admin/stats');

// counsellors (admin)
export const adminListCounsellors = (params = {}) =>
  apiGet(`/admin/counsellors${buildQuery(params)}`);

export const adminCreateCounsellor = (payload) =>
  apiPost('/admin/counsellors', payload);

export const adminUpdateCounsellor = (payload) =>
  apiPut('/admin/counsellors', payload);

export const adminDeleteCounsellor = (counsellorId) =>
  apiDelete(`/admin/counsellors${buildQuery({ counsellorId })}`);

// users (admin)
export const adminListUsers = (params = {}) =>
  apiGet(`/admin/users${buildQuery(params)}`);

// appointments (admin)
export const adminListAppointments = (params = {}) =>
  apiGet(`/admin/appointments${buildQuery(params)}`);
