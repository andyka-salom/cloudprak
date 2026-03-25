<template>
  <div class="card">
    <div class="card-hd">
      <div class="card-title"><div class="card-icon">👤</div>Kelola User</div>
    </div>

    <div class="row2">
      <!-- Add user -->
      <div>
        <p class="txt-sm txt-ghost mb2">➕ Tambah User</p>
        <div class="fg"><label>Nama</label><input v-model="nf.name" placeholder="Nama lengkap"></div>
        <div class="fg"><label>Email</label><input v-model="nf.email" type="email"></div>
        <div class="fg"><label>Password</label><input v-model="nf.password" type="password"></div>
        <div class="fg"><label>Role</label>
          <select v-model="nf.role">
            <option value="">— Pilih —</option>
            <option value="mahasiswa">Mahasiswa</option>
            <option value="dosen">Dosen</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="fg" v-if="nf.role === 'mahasiswa'">
          <label>NIM</label><input v-model="nf.nim">
        </div>
        <button class="btn btn--volt btn--full" @click="doAddUser" :disabled="loading.add">
          <span class="spinner" v-if="loading.add"></span>{{ loading.add ? '' : 'Tambah User' }}
        </button>
        <AppAlert :msg="alert.add" :type="alert.addType" />
      </div>

      <!-- Reset password -->
      <div>
        <p class="txt-sm txt-ghost mb2">🔐 Reset Password</p>
        <div class="fg"><label>Email Target</label><input v-model="rp.email" placeholder="user@kampus.ac.id"></div>
        <div class="fg"><label>Password Baru</label><input v-model="rp.password" type="password"></div>
        <button class="btn btn--amber btn--full" @click="doResetPw" :disabled="loading.reset">
          <span class="spinner" v-if="loading.reset"></span>{{ loading.reset ? '' : 'Reset Password' }}
        </button>
        <AppAlert :msg="alert.reset" :type="alert.resetType" />
        <hr class="divider">
        <div class="fg"><label>Filter Role</label>
          <select v-model="filterRole" @change="loadUsers">
            <option value="">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="dosen">Dosen</option>
            <option value="mahasiswa">Mahasiswa</option>
          </select>
        </div>
        <button class="btn btn--ghost btn--full" @click="loadUsers">⟳ Refresh</button>
      </div>
    </div>

    <hr class="divider">

    <div class="tbl-wrap">
      <table>
        <thead>
          <tr><th>#</th><th>Nama</th><th>Email</th><th>Role</th><th>NIM</th><th>Dibuat</th></tr>
        </thead>
        <tbody>
          <tr v-if="!users.length">
            <td colspan="6" class="tbl-empty">Klik Refresh untuk memuat data</td>
          </tr>
          <tr v-for="(u, i) in users" :key="u.user_id">
            <td>{{ i + 1 }}</td>
            <td><strong>{{ u.name }}</strong></td>
            <td class="txt-xs txt-dim">{{ u.email }}</td>
            <td><span :class="['badge', roleBadge(u.role)]">{{ u.role }}</span></td>
            <td><code>{{ u.nim || '—' }}</code></td>
            <td class="txt-xs txt-dim">{{ fmtDt(u.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '@/services/api'
import { fmtDt } from '@/utils/format'
import AppAlert from '@/components/ui/AppAlert.vue'

const users      = ref([])
const filterRole = ref('')

const nf = reactive({ name:'', email:'', password:'', role:'', nim:'' })
const rp = reactive({ email:'', password:'' })

const loading = reactive({ add: false, reset: false })
const alert   = reactive({ add:'', addType:'err', reset:'', resetType:'err' })

function showAlert(key, msg, type='err') {
  alert[key] = msg; alert[key+'Type'] = type
  if (type !== 'info') setTimeout(() => { alert[key] = '' }, 7000)
}

function roleBadge(role) {
  return role==='admin' ? 'badge--rose' : role==='dosen' ? 'badge--amber' : 'badge--volt'
}

async function loadUsers() {
  const r = await adminApi.listUsers(filterRole.value)
  if (r.ok) users.value = r.data.items || []
}

async function doAddUser() {
  if (!nf.name||!nf.email||!nf.password||!nf.role) { showAlert('add','Semua field wajib.'); return }
  loading.add = true
  const r = await adminApi.addUser({ name:nf.name, email:nf.email, password:nf.password, role:nf.role, nim:nf.nim })
  loading.add = false
  if (!r.ok) { showAlert('add', r.error); return }
  showAlert('add', `✅ ${r.data.name} (${r.data.role}) ditambahkan.`, 'ok')
  Object.assign(nf, { name:'', email:'', password:'', role:'', nim:'' })
  loadUsers()
}

async function doResetPw() {
  if (!rp.email||!rp.password) { showAlert('reset','Isi email dan password baru.'); return }
  loading.reset = true
  const r = await adminApi.resetPassword(rp.email, rp.password)
  loading.reset = false
  if (!r.ok) { showAlert('reset', r.error); return }
  showAlert('reset','✅ Password direset.','ok')
  rp.email = rp.password = ''
}

onMounted(loadUsers)
</script>
