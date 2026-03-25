<template>
  <div class="auth-wrap">
    <div class="auth-hero">
      <div class="auth-logo">🎓</div>
      <h1>Selamat Datang di <span class="accent">PresensiQR</span></h1>
      <p>Absensi cerdas berbasis QR Code dinamis</p>
    </div>

    <div class="card">
      <div class="auth-tabs">
        <button :class="['auth-tab', tab === 'login' ? 'auth-tab--active' : '']" @click="tab = 'login'">Masuk</button>
        <button :class="['auth-tab', tab === 'reg'   ? 'auth-tab--active' : '']" @click="tab = 'reg'">Daftar</button>
      </div>

      <!-- LOGIN -->
      <form v-if="tab === 'login'" @submit.prevent="doLogin">
        <div class="fg"><label>Email</label>
          <input v-model="lf.email" type="email" placeholder="email@kampus.ac.id" autocomplete="email">
        </div>
        <div class="fg"><label>Password</label>
          <input v-model="lf.password" type="password" placeholder="••••••••" autocomplete="current-password">
        </div>
        <button type="submit" class="btn btn--volt btn--full" :disabled="loading">
          <span class="spinner" v-if="loading"></span>
          {{ loading ? '' : 'Masuk ke Sistem' }}
        </button>
        <AppAlert :msg="alertMsg" :type="alertType" />
      </form>

      <!-- REGISTER -->
      <form v-else @submit.prevent="doRegister">
        <div class="fg"><label>Nama Lengkap</label>
          <input v-model="rf.name" placeholder="Nama sesuai KTP">
        </div>
        <div class="fg"><label>Email</label>
          <input v-model="rf.email" type="email" placeholder="email@kampus.ac.id">
        </div>
        <div class="fg"><label>Password</label>
          <input v-model="rf.password" type="password" placeholder="Min. 6 karakter">
        </div>
        <div class="fg"><label>Role</label>
          <select v-model="rf.role">
            <option value="">— Pilih Role —</option>
            <option value="mahasiswa">Mahasiswa</option>
            <option value="dosen">Dosen</option>
          </select>
        </div>
        <div class="fg" v-if="rf.role === 'mahasiswa'">
          <label>NIM</label>
          <input v-model="rf.nim" placeholder="Nomor Induk Mahasiswa">
        </div>
        <button type="submit" class="btn btn--volt btn--full" :disabled="loading">
          <span class="spinner" v-if="loading"></span>
          {{ loading ? '' : 'Buat Akun' }}
        </button>
        <AppAlert :msg="alertMsg" :type="alertType" />
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppAlert from '@/components/ui/AppAlert.vue'

const auth   = useAuthStore()
const router = useRouter()

const tab      = ref('login')
const loading  = ref(false)
const alertMsg = ref('')
const alertType = ref('err')

const lf = reactive({ email: '', password: '' })
const rf = reactive({ name: '', email: '', password: '', role: '', nim: '' })

watch(tab, () => { alertMsg.value = '' })

function showAlert(msg, type = 'err') {
  alertMsg.value  = msg
  alertType.value = type
  if (type !== 'info') setTimeout(() => { alertMsg.value = '' }, 7000)
}

async function doLogin() {
  if (!lf.email || !lf.password) { showAlert('Isi email dan password.'); return }
  loading.value = true
  try {
    await auth.login(lf.email, lf.password)
    router.push('/dash')
  } catch (e) {
    showAlert(e.message)
  } finally {
    loading.value = false
  }
}

async function doRegister() {
  if (!rf.name || !rf.email || !rf.password || !rf.role) { showAlert('Semua field wajib diisi.'); return }
  if (rf.role === 'mahasiswa' && !rf.nim) { showAlert('NIM wajib untuk mahasiswa.'); return }
  loading.value = true
  try {
    await auth.register({ name: rf.name, email: rf.email, password: rf.password, role: rf.role, nim: rf.nim })
    showAlert('✅ Registrasi berhasil! Silakan login.', 'ok')
    tab.value = 'login'
    lf.email = rf.email
  } catch (e) {
    showAlert(e.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-wrap { max-width: 420px; margin: 48px auto; padding: 0 14px; }

.auth-hero { text-align: center; margin-bottom: 28px; }

.auth-logo {
  width: 72px; height: 72px;
  background: var(--volt);
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; color: var(--ink);
  margin: 0 auto 16px;
  animation: logoIn .5s cubic-bezier(.175,.885,.32,1.275);
}

@keyframes logoIn {
  from { opacity: 0; transform: scale(.5) rotate(-15deg); }
  to   { opacity: 1; transform: none; }
}

h1 { font-size: 1.7rem; font-weight: 800; letter-spacing: -1.5px; }
.accent { color: var(--volt); }
p { color: var(--dim); font-size: .85rem; margin-top: 6px; font-family: var(--mono); }

.auth-tabs {
  display: flex;
  background: var(--ink3);
  border: 1px solid var(--border2);
  border-radius: 10px;
  padding: 4px; gap: 4px;
  margin-bottom: 18px;
}

.auth-tab {
  flex: 1; padding: 8px;
  border: none; border-radius: 7px;
  cursor: pointer;
  font-family: var(--sans); font-size: .84rem; font-weight: 700;
  transition: all .15s;
  background: transparent; color: var(--dim);
}

.auth-tab--active { background: var(--volt); color: var(--ink); }
</style>
