<template>
  <div class="card">
    <div class="card-hd">
      <div class="card-title"><div class="card-icon">📋</div>Rekap Absen</div>
    </div>

    <div class="row2">
      <div class="fg">
        <label>Mata Kuliah</label>
        <select v-model="sel.courseId" @change="loadSessions">
          <option value="">— Pilih —</option>
          <option v-for="c in courses" :key="c.course_id" :value="c.course_id">
            {{ c.course_name }} ({{ c.course_id }})
          </option>
        </select>
      </div>
      <div class="fg">
        <label>Sesi</label>
        <select v-model="sel.sessionId">
          <option value="">— Pilih —</option>
          <option v-for="s in sessions" :key="s.session_id" :value="s.session_id">
            {{ s.label }} — {{ s.date }}
          </option>
        </select>
      </div>
    </div>

    <button class="btn btn--volt btn--full" @click="loadRekap" :disabled="loading">
      <span class="spinner" v-if="loading"></span>{{ loading ? '' : '🔍 Tampilkan Rekap' }}
    </button>
    <AppAlert :msg="alertMsg" :type="alertType" />

    <template v-if="shown">
      <div class="stats-grid mt3">
        <div class="stat-card stat-card--emerald"><div class="stat-n">{{ total }}</div><div class="stat-l">Total Hadir</div></div>
        <div class="stat-card stat-card--cyan"><div class="stat-n" style="font-size:1rem">{{ sesiLabel || '—' }}</div><div class="stat-l">Sesi</div></div>
        <div class="stat-card stat-card--amber"><div class="stat-n" style="font-size:1rem">{{ tglLabel || '—' }}</div><div class="stat-l">Tanggal</div></div>
      </div>

      <div v-if="withLoc.length" class="map-wrap">
        <div id="recap-map" style="height:260px"></div>
        <div class="map-bar">📍 Peta Lokasi Absen</div>
      </div>

      <div class="tbl-wrap mt3">
        <table>
          <thead><tr><th>#</th><th>NIM</th><th>Nama</th><th>Jam</th><th>Lokasi</th><th>Accel</th><th>Status</th></tr></thead>
          <tbody>
            <tr v-if="!items.length"><td colspan="7" class="tbl-empty">Belum ada absen</td></tr>
            <tr v-for="p in items" :key="p.presence_id">
              <td>{{ p.no }}</td>
              <td><code>{{ p.nim || '—' }}</code></td>
              <td><strong>{{ p.nama }}</strong></td>
              <td class="txt-mono txt-xs">{{ fmtTime(p.jam_checkin) }}</td>
              <td>
                <a v-if="p.maps_url" :href="p.maps_url" target="_blank" class="map-link">📍 Lihat</a>
                <span v-else class="txt-dim">—</span>
              </td>
              <td>
                <span :class="['badge', p.accel_verified ? 'badge--volt' : 'badge--rose']">
                  {{ p.accel_verified ? '✓' : '—' }}
                </span>
              </td>
              <td><span class="badge badge--emerald">{{ p.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { coursesApi, sessionsApi, presenceApi } from '@/services/api'
import { fmtTime } from '@/utils/format'
import { initMap, IC_VOLT } from '@/utils/maps'
import L from 'leaflet'
import AppAlert from '@/components/ui/AppAlert.vue'

const courses  = ref([])
const sessions = ref([])
const sel      = ref({ courseId: '', sessionId: '' })
const loading  = ref(false)
const alertMsg = ref('')
const alertType = ref('err')
const shown      = ref(false)
const total      = ref(0)
const sesiLabel  = ref('')
const tglLabel   = ref('')
const items      = ref([])
let   recapLayer = null

function showAlert(msg, type = 'err') {
  alertMsg.value = msg; alertType.value = type
  if (type !== 'info') setTimeout(() => { alertMsg.value = '' }, 7000)
}

const withLoc = computed(() => items.value.filter(p => p.lokasi?.lat))

async function loadSessions() {
  if (!sel.value.courseId) return
  const r = await sessionsApi.list(sel.value.courseId)
  if (r.ok) sessions.value = r.data.items || []
}

async function loadRekap() {
  if (!sel.value.sessionId) { showAlert('Pilih sesi.'); return }
  loading.value = true
  const r = await presenceApi.historyAll(sel.value.sessionId)
  loading.value = false
  if (!r.ok) { showAlert(r.error); return }
  const d = r.data
  shown.value = true
  total.value = d.total_hadir
  sesiLabel.value = d.pertemuan || sel.value.sessionId
  tglLabel.value  = d.tanggal || '—'
  items.value = d.items || []

  nextTick(() => {
    if (!withLoc.value.length) return
    const map = initMap('recap-map')
    if (recapLayer) map.removeLayer(recapLayer)
    recapLayer = L.layerGroup().addTo(map)
    const bounds = []
    withLoc.value.forEach(p => {
      const { lat, lng } = p.lokasi
      bounds.push([lat, lng])
      L.marker([lat, lng], { icon: IC_VOLT })
        .bindPopup(`<div class="pop-title">${p.nama}</div>NIM: ${p.nim||'—'}<br>${fmtTime(p.jam_checkin)}`)
        .addTo(recapLayer)
    })
    if (bounds.length) map.fitBounds(bounds, { padding:[40,40], maxZoom:17 })
    setTimeout(() => map.invalidateSize(), 150)
  })
}

onMounted(async () => {
  const r = await coursesApi.list()
  if (r.ok) courses.value = r.data.items || []
})
</script>

<style scoped>
.map-link { color: var(--volt); font-family: var(--mono); font-size: .76rem; font-weight: 600; }
</style>
