<template>
  <div class="card">
    <div class="card-hd">
      <div class="card-title"><div class="card-icon">📋</div>History Absen Saya</div>
    </div>

    <div class="row2">
      <div class="fg">
        <label>Course ID</label>
        <input v-model="courseId" placeholder="cloud-101" @keyup.enter="loadHistory">
      </div>
      <div class="flex-end">
        <button class="btn btn--volt btn--full" @click="loadHistory" :disabled="loading">
          <span class="spinner" v-if="loading"></span>{{ loading ? '' : '🔍 Cari' }}
        </button>
      </div>
    </div>

    <p class="txt-muted">
      Total Hadir: <strong style="color:var(--emerald)">{{ items.length }}</strong> pertemuan
    </p>

    <div v-if="withLoc.length" class="map-wrap mt2">
      <div id="mhs-map" style="height:200px"></div>
    </div>

    <div class="tbl-wrap mt2">
      <table>
        <thead><tr><th>#</th><th>Pertemuan</th><th>Tanggal</th><th>Jam</th><th>Lokasi</th><th>Status</th></tr></thead>
        <tbody>
          <tr v-if="!items.length && !loaded">
            <td colspan="6" class="tbl-empty">Masukkan Course ID lalu tekan Cari</td>
          </tr>
          <tr v-else-if="!items.length">
            <td colspan="6" class="tbl-empty">Belum ada data absen</td>
          </tr>
          <tr v-for="p in items" :key="p.presence_id">
            <td>{{ p.no }}</td>
            <td><strong>{{ p.pertemuan }}</strong></td>
            <td class="txt-xs txt-dim">{{ p.tanggal || '—' }}</td>
            <td class="txt-mono txt-xs">{{ fmtTime(p.jam_checkin) }}</td>
            <td>
              <a v-if="p.maps_url" :href="p.maps_url" target="_blank" class="map-link">📍 Lihat</a>
              <span v-else class="txt-dim">—</span>
            </td>
            <td><span class="badge badge--emerald">{{ p.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <AppAlert :msg="alertMsg" :type="alertType" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { presenceApi } from '@/services/api'
import { fmtTime } from '@/utils/format'
import { initMap, IC_GRN, IC_RED, IC_VOLT } from '@/utils/maps'
import L from 'leaflet'
import AppAlert from '@/components/ui/AppAlert.vue'

const courseId  = ref('')
const items     = ref([])
const loaded    = ref(false)
const loading   = ref(false)
const alertMsg  = ref('')
const alertType = ref('err')
let   mhsLayer  = null

const withLoc = computed(() => items.value.filter(p => p.lokasi?.lat))

function showAlert(msg, type = 'err') {
  alertMsg.value = msg; alertType.value = type
  if (type !== 'info') setTimeout(() => { alertMsg.value = '' }, 7000)
}

async function loadHistory() {
  if (!courseId.value.trim()) { showAlert('Masukkan Course ID.'); return }
  loading.value = true
  const r = await presenceApi.history(courseId.value.trim())
  loading.value = false; loaded.value = true
  if (!r.ok) { showAlert(r.error); return }
  items.value = r.data.items || []

  nextTick(() => {
    if (!withLoc.value.length) return
    const map = initMap('mhs-map')
    if (mhsLayer) map.removeLayer(mhsLayer)
    mhsLayer = L.layerGroup().addTo(map)
    const bounds = []
    withLoc.value.forEach((p, i) => {
      const { lat, lng } = p.lokasi; bounds.push([lat, lng])
      const icon = i === 0 ? IC_GRN : i === withLoc.value.length - 1 ? IC_RED : IC_VOLT
      L.marker([lat, lng], { icon })
        .bindPopup(`<div class="pop-title">${p.pertemuan}</div>${p.tanggal}`)
        .addTo(mhsLayer)
    })
    if (bounds.length > 1)
      L.polyline(bounds, { color:'#c8ff00', weight:3, opacity:.6, dashArray:'5 7' }).addTo(mhsLayer)
    try { map.fitBounds(bounds, { padding:[40,40], maxZoom:17 }) } catch {}
    setTimeout(() => map.invalidateSize(), 150)
  })
}
</script>

<style scoped>
.map-link { color: var(--volt); font-family: var(--mono); font-size: .76rem; font-weight: 600; }
</style>
