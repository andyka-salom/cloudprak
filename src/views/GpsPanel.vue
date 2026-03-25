<template>
  <div class="card">
    <div class="card-hd">
      <div class="card-title"><div class="card-icon">🗺️</div>GPS Tracking</div>
    </div>

    <div class="row2" style="margin-bottom:8px">
      <div class="fg"><label>Device ID</label><input v-model="deviceId" placeholder="web-browser-01"></div>
      <div class="flex-end">
        <button class="btn btn--emerald" v-if="!active" @click="startGPS">▶ Track</button>
        <button class="btn btn--rose"    v-if="active"  @click="stopGPS">⏹ Stop</button>
      </div>
    </div>

    <div class="track-row">
      <div :class="['track-bead', active ? 'track-bead--active' : '']"></div>
      <span style="flex:1;font-family:var(--mono);font-size:.8rem">{{ statusText }}</span>
      <span v-if="accBadge" :class="['badge', accColor]">{{ accBadge }}</span>
    </div>

    <div class="map-wrap">
      <div id="gps-map" style="height:330px"></div>
      <div class="map-bar" v-if="curLat">
        <span style="font-family:var(--mono);font-size:.74rem">{{ curLat.toFixed(6) }}, {{ curLng.toFixed(6) }}</span>
        <a :href="`https://maps.google.com/?q=${curLat},${curLng}`" target="_blank">🌐 Google Maps</a>
      </div>
    </div>
    <AppAlert :msg="alertMsg" :type="alertType" />

    <hr class="divider">

    <p style="font-size:.86rem;font-weight:700;margin-bottom:10px;color:var(--ghost)">📍 Riwayat GPS Server</p>
    <div class="fg">
      <label>Device ID</label>
      <div style="display:flex;gap:8px">
        <input v-model="histDeviceId" placeholder="web-browser-01">
        <button class="btn btn--volt btn--sm" @click="fetchHistory" :disabled="loadingHist">
          <span class="spinner" v-if="loadingHist"></span>{{ loadingHist ? '' : 'Ambil' }}
        </button>
      </div>
    </div>

    <div v-if="histItems.length" class="map-wrap mb3">
      <p style="font-size:.74rem;color:var(--dim);padding:6px 10px;border-bottom:1px solid var(--border)">
        🟢 Awal &nbsp;•&nbsp; 🔴 Akhir &nbsp;•&nbsp; 🔵 Jalur
      </p>
      <div id="gps-history-map" style="height:250px"></div>
    </div>

    <div class="tbl-wrap">
      <table>
        <thead><tr><th>#</th><th>Waktu</th><th>Lat</th><th>Lng</th><th>Akurasi</th><th>Maps</th></tr></thead>
        <tbody>
          <tr v-if="!histItems.length"><td colspan="6" class="tbl-empty">Masukkan Device ID</td></tr>
          <tr v-for="(g,i) in histItems" :key="i">
            <td>{{ i+1 }}</td>
            <td class="txt-xs">{{ fmtDt(g.ts) }}</td>
            <td class="txt-mono">{{ Number(g.lat).toFixed(5) }}</td>
            <td class="txt-mono">{{ Number(g.lng).toFixed(5) }}</td>
            <td>{{ g.accuracy_m ? `±${Number(g.accuracy_m).toFixed(0)}m` : '—' }}</td>
            <td><a :href="`https://maps.google.com/?q=${g.lat},${g.lng}`" target="_blank" style="color:var(--volt);font-family:var(--mono);font-size:.76rem">🗺️</a></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore }   from '@/stores/auth'
import { telemetryApi }   from '@/services/api'
import { fmtDt }          from '@/utils/format'
import { initMap, getMap, IC_VOLT, IC_GRN, IC_RED, mkDot, DEF_CENTER } from '@/utils/maps'
import L from 'leaflet'
import AppAlert from '@/components/ui/AppAlert.vue'

const auth = useAuthStore()
const deviceId    = ref('web-browser-01')
const histDeviceId = ref('')
const active      = ref(false)
const statusText  = ref('Tidak aktif')
const accBadge    = ref('')
const accColor    = ref('badge--cyan')
const curLat      = ref(null), curLng = ref(null)
const alertMsg    = ref(''), alertType = ref('err')
const histItems   = ref([])
const loadingHist = ref(false)

let gpsWatcher = null, gpsMark = null, gpsCircle = null, gpsPts = [], gpsPoly = null, histLayer = null

function showAlert(msg, type = 'err') {
  alertMsg.value = msg; alertType.value = type
  if (type !== 'info') setTimeout(() => { alertMsg.value = '' }, 7000)
}

function startGPS() {
  if (!navigator.geolocation) { showAlert('Geolocation tidak didukung.'); return }
  active.value = true; gpsPts = []
  statusText.value = 'Aktif…'
  const map = getMap('gps-map') || initMap('gps-map', DEF_CENTER, 15)

  gpsWatcher = navigator.geolocation.watchPosition(pos => {
    const { latitude: lat, longitude: lng, accuracy } = pos.coords
    curLat.value = lat; curLng.value = lng
    statusText.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    accBadge.value = `±${accuracy.toFixed(0)}m`
    accColor.value = accuracy < 20 ? 'badge--emerald' : accuracy < 60 ? 'badge--amber' : 'badge--rose'

    if (!gpsMark) gpsMark = L.marker([lat,lng], { icon: IC_VOLT }).addTo(map)
    else gpsMark.setLatLng([lat,lng])

    if (gpsCircle) map.removeLayer(gpsCircle)
    gpsCircle = L.circle([lat,lng], { radius:accuracy, color:'#c8ff00', weight:1.5, fillOpacity:.06 }).addTo(map)
    gpsPts.push([lat,lng])
    if (gpsPoly) map.removeLayer(gpsPoly)
    if (gpsPts.length > 1)
      gpsPoly = L.polyline(gpsPts, { color:'#c8ff00', weight:4, opacity:.8, lineCap:'round' }).addTo(map)
    map.panTo([lat,lng], { animate:true, duration:.5 })
    telemetryApi.postGps(deviceId.value||'web-01', lat, lng, accuracy)
  }, err => {
    showAlert('GPS error: ' + err.message); active.value = false
  }, { enableHighAccuracy:true, timeout:15000, maximumAge:0 })
}

function stopGPS() {
  if (gpsWatcher !== null) { navigator.geolocation.clearWatch(gpsWatcher); gpsWatcher = null }
  active.value = false; statusText.value = 'Tidak aktif'; accBadge.value = ''
}

async function fetchHistory() {
  if (!histDeviceId.value) return
  loadingHist.value = true
  const r = await telemetryApi.historyGps(histDeviceId.value)
  loadingHist.value = false
  if (!r.ok) { showAlert(r.error); return }
  histItems.value = r.data.items || []
  if (!histItems.value.length) return

  nextTick(() => {
    const map = initMap('gps-history-map')
    if (histLayer) map.removeLayer(histLayer)
    histLayer = L.layerGroup().addTo(map)
    const coords = histItems.value.map(g => [g.lat, g.lng])
    if (coords.length > 1)
      L.polyline(coords, { color:'#c8ff00', weight:4, opacity:.85, lineCap:'round' }).addTo(histLayer)
    L.marker(coords[0], { icon: IC_GRN })
      .bindPopup(`<div class="pop-title">🟢 Titik Awal</div>${fmtDt(histItems.value[0].ts)}`)
      .addTo(histLayer)
    if (coords.length > 1)
      L.marker(coords[coords.length-1], { icon: IC_RED })
        .bindPopup(`<div class="pop-title">🔴 Terbaru</div>${fmtDt(histItems.value[histItems.value.length-1].ts)}`)
        .addTo(histLayer)
    coords.slice(1,-1).forEach((c,i) =>
      L.marker(c, { icon: mkDot('#c8ff00') })
        .bindPopup(`<div class="pop-title">Titik ${i+2}</div>${fmtDt(histItems.value[i+1].ts)}`)
        .addTo(histLayer)
    )
    try { map.fitBounds(coords, { padding:[40,40], maxZoom:17 }) } catch {}
    map.invalidateSize()
  })
}

onMounted(() => {
  nextTick(() => { initMap('gps-map', DEF_CENTER, 15).invalidateSize() })
})
onUnmounted(stopGPS)
</script>

<style scoped>
.track-row {
  display:flex; align-items:center; gap:10px;
  padding:9px 13px; background:var(--ink3); border:1px solid var(--border2);
  border-radius:8px; margin-bottom:10px;
}
.track-bead { width:9px; height:9px; border-radius:50%; background:var(--muted); flex-shrink:0; transition:background .3s; }
.track-bead--active { background:var(--emerald); animation:pulseDot 1.2s ease-in-out infinite; }
@keyframes pulseDot { 0%,100%{box-shadow:0 0 0 0 rgba(0,214,143,.6)} 50%{box-shadow:0 0 0 6px rgba(0,214,143,0)} }
</style>
