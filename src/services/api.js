const BASE_URL = import.meta.env.VITE_API_URL ||
  'https://script.google.com/macros/s/AKfycbx85Sb45S4bQ4b_NQVxdizFIWJdah8A-Rqs8nrasFN_6PvLW7lcu7gqzDlSaVzpEC4mjw/exec'

import { useAuthStore } from '@/stores/auth'

async function request(path, data = {}) {
  const authStore = useAuthStore()
  const body = { path, ...data }
  if (authStore.token) body.auth_token = authStore.token

  try {
    const r = await fetch(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'text/plain' },
    })
    const text = await r.text()
    return JSON.parse(text)
  } catch {
    try {
      const encoded = encodeURIComponent(JSON.stringify(body))
      const r2 = await fetch(`${BASE_URL}?body=${encoded}`)
      return JSON.parse(await r2.text())
    } catch (e) {
      return { ok: false, error: 'Koneksi gagal: ' + e.message }
    }
  }
}

export const authApi = {
  login: (email, password) => request('auth/login', { email, password }),
  register: (data) => request('auth/register', data),
}

export const adminApi = {
  addUser: (data) => request('admin/add-user', data),
  listUsers: (role = '') => request('admin/list-users', role ? { role } : {}),
  resetPassword: (target_email, new_password) =>
    request('admin/reset-password', { target_email, new_password }),
}

export const coursesApi = {
  list: () => request('courses'),
  create: (course_id, course_name) => request('courses/create', { course_id, course_name }),
}

export const sessionsApi = {
  list: (course_id) => request('sessions', { course_id }),
  create: (data) => request('sessions/create', data),
}

export const presenceApi = {
  generateQR: (course_id, session_id) =>
    request('presence/qr/generate', { course_id, session_id, ts: new Date().toISOString() }),
  checkin: (data) => request('presence/checkin', data),
  history: (course_id, session_id) =>
    request('presence/history', { course_id, ...(session_id ? { session_id } : {}) }),
  historyAll: (session_id) => request('presence/history/all', { session_id }),
}

export const telemetryApi = {
  postAccel: (device_id, samples, session_id = '') =>
    request('telemetry/accel', { device_id, ts: new Date().toISOString(), samples, session_id }),
  postAccelGate: (device_id, samples, session_id = '') =>
    request('telemetry/accel/gate', {
      device_id, ts: new Date().toISOString(),
      samples, session_id, duration_sec: 5,
    }),
  latestAccel: (device_id) => request('telemetry/accel/latest', { device_id }),
  postGps: (device_id, lat, lng, accuracy_m, session_id = '') =>
    request('telemetry/gps', { device_id, ts: new Date().toISOString(), lat, lng, accuracy_m, session_id }),
  latestGps: (device_id) => request('telemetry/gps/latest', { device_id }),
  historyGps: (device_id, limit = 200) =>
    request('telemetry/gps/history', { device_id, limit }),
}
