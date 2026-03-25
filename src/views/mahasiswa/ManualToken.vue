<template>
  <div class="card">
    <div class="card-hd">
      <div class="card-title"><div class="card-icon">⌨️</div>Token Manual</div>
    </div>
    <p class="txt-muted mb3">Ketik token dari layar dosen jika kamera tidak tersedia.</p>

    <div class="fg">
      <label>QR Token</label>
      <input v-model="form.token" placeholder="TKN-XXXXXX"
        style="font-family:var(--mono);font-size:1.1rem;text-transform:uppercase;letter-spacing:2px;text-align:center">
    </div>
    <div class="row2">
      <div class="fg"><label>Course ID</label><input v-model="form.courseId" placeholder="cloud-101"></div>
      <div class="fg"><label>Session ID</label><input v-model="form.sessionId" placeholder="SES-XXXXXX"></div>
    </div>

    <div class="fg">
      <label>Lokasi (Opsional)</label>
      <div style="display:flex;gap:8px;margin-bottom:6px">
        <button class="btn btn--emerald btn--sm" @click="getGPS">📍 Deteksi GPS</button>
        <button class="btn btn--ghost   btn--sm" @click="toggleMap">🗺️ Pilih Peta</button>
      </div>
      <p class="txt-xs txt-dim" v-if="locLabel">{{ locLabel }}</p>
    </div>

    <div v-if="mapVisible" class="map-wrap mb3">
      <div id="manual-map" style="height:220px"></div>
      <div class="map-bar" id="manual-map-bar">Klik peta untuk memilih lokasi</div>
    </div>

    <button class="btn btn--volt btn--full mt2" @click="doCheckin" :disabled="loading">
      <span class="spinner" v-if="loading"></span>{{ loading ? '' : '✅ Absen Sekarang' }}
    </button>
    <AppAlert :msg="alertMsg" :type="alertType" />
  </div>
</template>

<script setup>
import { ref, nextTick, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { presenceApi } from '@/services/api'
import { initMap, getMap, IC_CYAN, DEF_CENTER } from '@/utils/maps'
import AppAlert from '@/components/ui/AppAlert.vue'
import L from 'leaflet'

const auth = useAuthStore()
const form = ref({ token: '', courseId: '', sessionId: '' })
const lat  = ref(null), lng = ref(null)
const locLabel   = ref('')
const mapVisible = ref(false)
const loading    = ref(false)
const alertMsg   = ref('')
const alertType  = ref('err')
let   manMark    = null

function showAlert(msg, type = 'err') {
  alertMsg.value = msg; alertType.value = type
  if (type !== 'info') setTimeout(() => { alertMsg.value = '' }, 7000)
}

function getGPS() {
  if (!navigator.geolocation) return
  locLabel.value = 'Mendeteksi GPS…'
  navigator.geolocation.getCurrentPosition(pos => {
    lat.value = pos.coords.latitude; lng.value = pos.coords.longitude
    locLabel.value = `📍 ${lat.value.toFixed(5)}, ${lng.value.toFixed(5)} (±${pos.coords.accuracy.toFixed(0)}m)`
    if (mapVisible.value) updateMark(lat.value, lng.value)
  }, () => { locLabel.value = 'Gagal mendapat lokasi.' })
}

function toggleMap() {
  mapVisible.value = !mapVisible.value
  if (!mapVisible.value) return
  nextTick(() => {
    const map = initMap('manual-map', DEF_CENTER, 14)
    map.on('click', e => {
      lat.value = e.latlng.lat; lng.value = e.latlng.lng
      locLabel.value = `📍 ${lat.value.toFixed(5)}, ${lng.value.toFixed(5)}`
      updateMark(lat.value, lng.value)
      const bar = document.getElementById('manual-map-bar')
      if (bar) bar.textContent = `Dipilih: ${lat.value.toFixed(5)}, ${lng.value.toFixed(5)}`
    })
    if (lat.value && lng.value) updateMark(lat.value, lng.value)
  })
}

function updateMark(la, ln) {
  const map = getMap('manual-map'); if (!map) return
  if (manMark) map.removeLayer(manMark)
  manMark = L.marker([la, ln], { icon: IC_CYAN })
    .bindPopup(`<div class="pop-title">Lokasi Dipilih</div>${la.toFixed(5)}, ${ln.toFixed(5)}`)
    .addTo(map).openPopup()
  map.setView([la, ln], 17)
}

async function doCheckin() {
  if (!form.value.token || !form.value.courseId || !form.value.sessionId) {
    showAlert('Isi semua field.'); return
  }
  loading.value = true
  const payload = {
    device_id: 'web-manual-' + (auth.userId || '01'),
    course_id: form.value.courseId,
    session_id: form.value.sessionId,
    qr_token: form.value.token.toUpperCase(),
    ts: new Date().toISOString(),
  }
  if (lat.value && lng.value) { payload.lat = lat.value; payload.lng = lng.value }
  const r = await presenceApi.checkin(payload)
  loading.value = false
  if (!r.ok) { showAlert(r.error); return }
  showAlert(`✅ Absen berhasil! ID: ${r.data.presence_id}`, 'ok')
  form.value.token = form.value.courseId = form.value.sessionId = ''
  lat.value = lng.value = null; locLabel.value = ''; mapVisible.value = false
}
</script>
