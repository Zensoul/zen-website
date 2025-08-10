// File: lib/api.js

// 1) Base URL (env first, then prod fallback)
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  'https://w4zqabm0ii.execute-api.ap-south-1.amazonaws.com/dev';

// 2) Build full URL safely
export function api(path) {
  if (!path.startsWith('/')) path = '/' + path;
  return API_BASE + path;
}

// 3) Token-aware headers (safe on SSR)
function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

// 4) Unified request + error handling (no-cache)
async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(api(path), {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    credentials: 'omit',
  });

  const raw = await res.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw || null;
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data;
}

/* =====================
   Public API functions
   ===================== */

// auth
export async function signup({ name, email, password }) {
  return request('/auth/signup', {
    method: 'POST',
    body: { name, email, password },
  });
}

export async function login({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

// assessment
export async function submitAssessment(payload) {
  return request('/assessment', { method: 'POST', body: payload });
}

export async function listCounsellors({ category }) {
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  return request(`/counsellors${q}`);
}

// appointments
export async function checkAvailability({ counsellorId, date }) {
  return request(
    `/appointments/check-availability?counsellorId=${encodeURIComponent(
      counsellorId
    )}&date=${encodeURIComponent(date)}`
  );
}

export async function createAppointment(payload) {
  // { userId, userName, counsellorId, counsellorName, sessionType, date, timeSlot, fee, notes }
  return request('/appointments', { method: 'POST', body: payload });
}
