<template>
  <aside class="sidebar">
    <template v-for="item in menu" :key="item.panel || item.sep">
      <div v-if="item.sep" class="sb-section">{{ item.sep }}</div>
      <button
        v-else
        :class="['sb-item', route.path === item.to ? 'sb-item--active' : '']"
        @click="router.push(item.to)"
      >
        <div class="sb-icon">{{ item.icon }}</div>
        {{ item.label }}
      </button>
    </template>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const MENUS = {
  admin: [
    { icon: '🏠', label: 'Dashboard',    to: '/dash' },
    { sep: 'Admin' },
    { icon: '👤', label: 'Kelola User',  to: '/admin/users' },
    { sep: 'Akademik' },
    { icon: '⚙️', label: 'Setup Kelas', to: '/setup' },
    { icon: '🔲', label: 'Generate QR',  to: '/qr' },
    { icon: '📋', label: 'Rekap Absen',  to: '/rekap' },
    { sep: 'Sensor' },
    { icon: '📈', label: 'Accelerometer',to: '/accel' },
    { icon: '🗺️', label: 'GPS Tracking', to: '/gps' },
  ],
  dosen: [
    { icon: '🏠', label: 'Dashboard',   to: '/dash' },
    { sep: 'Akademik' },
    { icon: '⚙️', label: 'Setup Kelas',to: '/setup' },
    { icon: '🔲', label: 'Generate QR', to: '/qr' },
    { icon: '📋', label: 'Rekap Absen', to: '/rekap' },
    { sep: 'Sensor' },
    { icon: '🗺️', label: 'GPS Tracking',to: '/gps' },
  ],
  mahasiswa: [
    { icon: '🏠', label: 'Dashboard',   to: '/dash' },
    { sep: 'Presensi' },
    { icon: '📷', label: 'Scan QR',     to: '/scan' },
    { icon: '⌨️', label: 'Token Manual',to: '/manual' },
    { icon: '📋', label: 'History Saya',to: '/history' },
    { sep: 'Sensor' },
    { icon: '📈', label: 'Accelerometer',to: '/accel' },
    { icon: '🗺️', label: 'GPS Tracking', to: '/gps' },
  ],
}

const menu = computed(() => MENUS[auth.role] || [])
</script>

<style scoped>
.sidebar {
  background: var(--ink2);
  border: 1px solid var(--border2);
  border-radius: var(--r);
  padding: 10px;
  position: sticky;
  top: 70px;
  max-height: calc(100vh - 86px);
  overflow-y: auto;
}

.sb-section {
  font-family: var(--mono);
  font-size: .58rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  padding: 10px 8px 4px;
}

.sb-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--ghost);
  font-size: .82rem;
  font-family: var(--sans);
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: all .14s;
  margin-bottom: 2px;
}

.sb-item:hover { background: var(--ink3); color: var(--white); }

.sb-item--active {
  background: rgba(200,255,0,.08);
  color: var(--volt);
  border-color: rgba(200,255,0,.2);
}

.sb-icon {
  width: 24px; height: 24px;
  border-radius: 6px;
  background: var(--ink3);
  display: flex; align-items: center; justify-content: center;
  font-size: .72rem;
  flex-shrink: 0;
}

.sb-item--active .sb-icon { background: rgba(200,255,0,.12); }

@media (max-width: 700px) {
  .sidebar {
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px;
    max-height: none;
  }
  .sb-item  { flex: 1; min-width: 100px; font-size: .76rem; justify-content: center; }
  .sb-section { width: 100%; }
}
</style>
