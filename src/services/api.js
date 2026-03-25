/**
 * API Service — Google Apps Script backend
 *
 * CORS STRATEGY (3 layers):
 *
 * 1. DEV  → Vite proxy at /gas-proxy  (Node server-side, no CORS)
 * 2. PROD → fetch POST with text/plain  (GAS accepts this without preflight)
 * 3. FALLBACK → fetch GET with ?body=  (for file:// or blocked POST)
 *
 * Why text/plain content-type?
 *   Browser sends a "simple request" (no preflight OPTIONS) when:
 *   - Method is POST + Content-Type is text/plain  ← we use this
 *   GAS deployed as "Anyone" access accepts this and returns JSON.
 *   The CORS header IS present on successful GAS responses — the issue
 *   is only when the script URL is wrong (YOUR_SCRIPT_ID placeholder).
 */

const GAS_URL = import.meta.env.VITE_API_URL || ''

// In dev mode Vite proxy handles /gas-proxy → GAS url
// This completely avoids browser CORS because the proxy is server-side
const isDev = import.meta.env.DEV

function getEndpoint() {
  if (isDev) return '/gas-proxy'
  return GAS_URL
}

import { useAuthStore } from '@/stores/auth'

async function request(path, data = {}) {
  if (!GAS_URL || GAS_URL.includes('YOUR_SCRIPT_ID')) {
    console.error('[API] VITE_API_URL not configured. Copy .env.example → .env and set your GAS URL.')
    return { ok: false, error: 'API URL belum dikonfigurasi. Set VITE_API_URL di file .env' }
  }

  const authStore = useAuthStore()
  const body = { path, ...data }
  if (authStore.token) body.auth_token = authStore.token

  const endpoint = getEndpoint()
  const bodyStr  = JSON.stringify(body)

  // --- Attempt 1: POST with text/plain (simple request, no preflight) ---
  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      body: bodyStr,
      // text/plain → browser sends simple request → no OPTIONS preflight
      // GAS handles it fine and returns CORS headers on response
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const text = await r.text()
    return JSON.parse(text)
  } catch (e1) {
    // --- Attempt 2: GET with body encoded as query param (GAS doGet fallback) ---
    try {
      const encoded = encodeURIComponent(bodyStr)
      const gasGet  = `${GAS_URL}?body=${encoded}&path=${encodeURIComponent(path)}`
      const r2 = await fetch(gasGet)
      const text2 = await r2.text()
      return JSON.parse(text2)
    } catch (e2) {
      console.error('[API] Both POST and GET failed:', e1.message, e2.message)
      return {
        ok: false,
        error: `Koneksi gagal. Pastikan:\n1. VITE_API_URL sudah diisi benar di .env\n2. GAS deploy sebagai "Anyone"\n3. Jalankan npm run dev (bukan buka file:// langsung)\nDetail: ${e1.message}`,
      }
    }
  }
}

// ─── Auth ─────────────────────────────────────────────────────────
export const authApi = {
  login:    (email, password) => request('auth/login', { email, password }),
  register: (data)            => request('auth/register', data),
}

// ─── Admin ────────────────────────────────────────────────────────
export const adminApi = {
  addUser:       (data)                         => request('admin/add-user', data),
  listUsers:     (role = '')                    => request('admin/list-users', role ? { role } : {}),
  resetPassword: (target_email, new_password)   => request('admin/reset-password', { target_email, new_password }),
}

// ─── Courses ──────────────────────────────────────────────────────
export const coursesApi = {
  list:   ()                        => request('courses'),
  create: (course_id, course_name)  => request('courses/create', { course_id, course_name }),
}

// ─── Sessions ─────────────────────────────────────────────────────
export const sessionsApi = {
  list:   (course_id) => request('sessions',        { course_id }),
  create: (data)      => request('sessions/create', data),
}

// ─── Presence ─────────────────────────────────────────────────────
export const presenceApi = {
  generateQR:  (course_id, session_id) =>
    request('presence/qr/generate', { course_id, session_id, ts: new Date().toISOString() }),
  checkin:     (data)        => request('presence/checkin', data),
  history:     (course_id)   => request('presence/history',     { course_id }),
  historyAll:  (session_id)  => request('presence/history/all', { session_id }),
}

// ─── Telemetry ────────────────────────────────────────────────────
export const telemetryApi = {
  postAccel: (device_id, samples, session_id = '') =>
    request('telemetry/accel', {
      device_id, ts: new Date().toISOString(), samples, session_id,
    }),
  postAccelGate: (device_id, samples, session_id = '') =>
    request('telemetry/accel/gate', {
      device_id, ts: new Date().toISOString(), samples, session_id, duration_sec: 5,
    }),
  latestAccel:  (device_id) => request('telemetry/accel/latest',  { device_id }),
  postGps: (device_id, lat, lng, accuracy_m, session_id = '') =>
    request('telemetry/gps', {
      device_id, ts: new Date().toISOString(), lat, lng, accuracy_m, session_id,
    }),
  historyGps: (device_id, limit = 200) =>
    request('telemetry/gps/history', { device_id, limit }),
}
