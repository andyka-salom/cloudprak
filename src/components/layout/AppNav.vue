<template>
  <nav class="nav">
    <div class="nav-brand" @click="router.push('/dash')" style="cursor:pointer">
      <div class="brand-mark">QR</div>
      <div>
        <div class="brand-text">Presensi<span>QR</span></div>
        <div class="brand-sub">CLOUD COMPUTING · VER A</div>
      </div>
    </div>

    <div class="nav-right" v-if="auth.isLoggedIn">
      <span class="nav-username">{{ auth.name }}</span>
      <span :class="['role-tag', `role-tag--${auth.role}`]">{{ auth.role }}</span>
      <button class="btn btn--ghost btn--sm" @click="handleLogout">Keluar</button>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useAccelStore } from '@/stores/accel'
import { useRouter } from 'vue-router'

const auth  = useAuthStore()
const accel = useAccelStore()
const router = useRouter()

function handleLogout() {
  accel.reset()
  auth.logout()
  router.push('/auth')
}
</script>

<style scoped>
.nav {
  position: sticky; top: 0; z-index: 500;
  background: rgba(10,12,20,.88);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--border2);
  height: 56px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px;
}

.nav-brand { display: flex; align-items: center; gap: 10px; }

.brand-mark {
  width: 32px; height: 32px;
  background: var(--volt);
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-size: .85rem; color: var(--ink); font-weight: 800;
}

.brand-text { font-size: .9rem; font-weight: 800; letter-spacing: -.5px; }
.brand-text span { color: var(--volt); }
.brand-sub { font-family: var(--mono); font-size: .58rem; color: var(--dim); letter-spacing: 1px; }

.nav-right  { display: flex; align-items: center; gap: 10px; }
.nav-username { font-size: .82rem; font-weight: 600; color: var(--ghost); }

.role-tag {
  font-family: var(--mono); font-size: .58rem; font-weight: 700;
  padding: 3px 8px; border-radius: 4px;
  text-transform: uppercase; letter-spacing: .5px;
}

.role-tag--admin     { background: rgba(255,61,107,.15); color: var(--rose); border: 1px solid rgba(255,61,107,.25); }
.role-tag--dosen     { background: rgba(255,179,64,.12); color: var(--amber); border: 1px solid rgba(255,179,64,.2); }
.role-tag--mahasiswa { background: rgba(200,255,0,.1); color: var(--volt2); border: 1px solid rgba(200,255,0,.2); }
</style>
