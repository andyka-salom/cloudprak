import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/services/api'

const STORAGE_KEY = 'pqs_session'

export const useAuthStore = defineStore('auth', () => {
  const token    = ref('')
  const userId   = ref('')
  const name     = ref('')
  const role     = ref('')
  const nim      = ref('')

  const isLoggedIn = computed(() => !!token.value)

  function _apply(data) {
    token.value  = data.token  || ''
    userId.value = data.user_id || ''
    name.value   = data.name   || ''
    role.value   = data.role   || ''
    nim.value    = data.nim    || ''
  }

  function restore() {
    try {
      const s = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')
      if (s.token) _apply(s)
    } catch {}
  }

  async function login(email, password) {
    const r = await authApi.login(email, password)
    if (!r.ok) throw new Error(r.error)
    _apply(r.data)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(r.data))
    return r.data
  }

  async function register(data) {
    const r = await authApi.register(data)
    if (!r.ok) throw new Error(r.error)
    return r.data
  }

  function logout() {
    token.value = userId.value = name.value = role.value = nim.value = ''
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return { token, userId, name, role, nim, isLoggedIn, restore, login, register, logout }
})
