import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Lazy-loaded views
const AuthView      = () => import('@/views/AuthView.vue')
const DashView      = () => import('@/views/DashView.vue')
const AdminUsers    = () => import('@/views/admin/AdminUsers.vue')
const SetupKelas    = () => import('@/views/SetupKelas.vue')
const GenerateQR    = () => import('@/views/GenerateQR.vue')
const RekapAbsen    = () => import('@/views/RekapAbsen.vue')
const ScanQR        = () => import('@/views/mahasiswa/ScanQR.vue')
const ManualToken   = () => import('@/views/mahasiswa/ManualToken.vue')
const HistoryMhs    = () => import('@/views/mahasiswa/HistoryMhs.vue')
const AccelPanel    = () => import('@/views/AccelPanel.vue')
const GpsPanel      = () => import('@/views/GpsPanel.vue')

const routes = [
  { path: '/', redirect: '/dash' },
  { path: '/auth', component: AuthView, meta: { public: true } },
  {
    path: '/dash',         component: DashView,    meta: { roles: ['admin','dosen','mahasiswa'] },
  },
  {
    path: '/admin/users',  component: AdminUsers,  meta: { roles: ['admin'] },
  },
  {
    path: '/setup',        component: SetupKelas,  meta: { roles: ['admin','dosen'] },
  },
  {
    path: '/qr',           component: GenerateQR,  meta: { roles: ['admin','dosen'] },
  },
  {
    path: '/rekap',        component: RekapAbsen,  meta: { roles: ['admin','dosen'] },
  },
  {
    path: '/scan',         component: ScanQR,      meta: { roles: ['mahasiswa'] },
  },
  {
    path: '/manual',       component: ManualToken, meta: { roles: ['mahasiswa'] },
  },
  {
    path: '/history',      component: HistoryMhs,  meta: { roles: ['mahasiswa'] },
  },
  {
    path: '/accel',        component: AccelPanel,  meta: { roles: ['admin','dosen','mahasiswa'] },
  },
  {
    path: '/gps',          component: GpsPanel,    meta: { roles: ['admin','dosen','mahasiswa'] },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) return true
  if (!auth.isLoggedIn) return { path: '/auth' }
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) return { path: '/dash' }
  return true
})

export default router
