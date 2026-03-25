<template>
  <div>
    <!-- STEP 1: Accel Gate -->
    <AccelGate />

    <!-- STEP 2: Scan QR -->
    <div :class="['card', accel.verified ? 'card--unlocked' : 'card--locked']">
      <div class="card-hd">
        <div class="card-title"><div class="card-icon">📷</div>Langkah 2 — Scan QR</div>
        <span :class="['badge', accel.verified ? 'badge--volt' : 'badge--rose']">
          {{ accel.verified ? '🔓 TERBUKA' : '🔒 TERKUNCI' }}
        </span>
      </div>

      <p class="txt-muted mb3">Setelah verifikasi gerak selesai, scan QR yang dosen tampilkan.</p>

      <div v-if="!accel.verified" class="locked-overlay">
        <div style="font-size:2.5rem;margin-bottom:8px">🔒</div>
        <p style="font-weight:700;color:var(--muted);font-size:.86rem">Selesaikan verifikasi gerak dulu</p>
      </div>

      <div style="display:flex;gap:10px;justify-content:center;margin-bottom:14px">
        <button class="btn btn--emerald" v-if="!scanActive" @click="startScan">📷 Buka Kamera</button>
        <button class="btn btn--rose"    v-if="scanActive"  @click="stopScan">⏹ Stop</button>
      </div>

      <div id="qr-reader"></div>
      <AppAlert :msg="alertMsg" :type="alertType" />
    </div>

    <!-- Checkin Modal -->
    <CheckinModal
      v-model="modalOpen"
      :state="modalState"
      :qr-data="modalQrData"
      :gps-status="gpsStatus"
      :gps-text="gpsText"
      :loading="loadingCheckin"
      :ok-detail="okDetail"
      :ok-id="okId"
      :ok-gps="okGps"
      :ok-accel="okAccel"
      :err-text="errText"
      @confirm="confirmCheckin"
    />
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { useAccelStore } from '@/stores/accel'
import { useAuthStore }  from '@/stores/auth'
import { presenceApi, telemetryApi } from '@/services/api'
import AccelGate    from '@/components/ui/AccelGate.vue'
import CheckinModal from '@/components/ui/CheckinModal.vue'
import AppAlert     from '@/components/ui/AppAlert.vue'

const accel = useAccelStore()
const auth  = useAuthStore()

const scanActive    = ref(false)
const alertMsg      = ref('')
const alertType     = ref('err')
let   scanner       = null

// Modal state
const modalOpen     = ref(false)
const modalState    = ref('gps')
const modalQrData   = ref({})
const gpsStatus     = ref('loading')
const gpsText       = ref('')
const loadingCheckin = ref(false)
const okDetail = ref(''), okId = ref(''), okGps = ref(''), okAccel = ref(''), errText = ref('')
let   pendingGps   = null
let   gpsTimeout   = null

function showAlert(msg, type = 'err') {
  alertMsg.value = msg; alertType.value = type
  if (type !== 'info') setTimeout(() => { alertMsg.value = '' }, 7000)
}

function startScan() {
  if (!accel.verified) { showAlert('⚠️ Selesaikan verifikasi gerak dulu!', 'err'); return }
  scanActive.value = true
  scanner = new Html5Qrcode('qr-reader')
  scanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    (text) => {
      stopScan()
      let payload = null
      try {
        const p = JSON.parse(text)
        if (p.qr_token && p.course_id && p.session_id) payload = p
      } catch {}
      if (payload) openModal(payload)
      else { showAlert('QR tidak valid. Gunakan QR dari sistem ini.', 'err') }
    },
    () => {}
  ).catch(e => { showAlert('Kamera error: ' + e, 'err'); scanActive.value = false })
}

function stopScan() {
  if (scanner) { try { scanner.stop().then(() => scanner.clear()) } catch {} scanner = null }
  scanActive.value = false
}

function openModal(qrPayload) {
  modalQrData.value = qrPayload
  modalState.value  = 'gps'
  modalOpen.value   = true
  gpsStatus.value   = 'loading'
  gpsText.value     = 'Mengambil lokasi GPS otomatis…'
  pendingGps        = null

  if (!navigator.geolocation) {
    gpsStatus.value = 'err'; gpsText.value = 'Geolocation tidak didukung'; return
  }
  gpsTimeout = setTimeout(() => {
    gpsStatus.value = 'err'; gpsText.value = 'GPS timeout — absen tanpa koordinat'
  }, 10000)

  navigator.geolocation.getCurrentPosition(
    pos => {
      clearTimeout(gpsTimeout)
      const { latitude: lat, longitude: lng, accuracy } = pos.coords
      pendingGps = { lat, lng, accuracy_m: accuracy }
      gpsStatus.value = 'ok'
      gpsText.value   = `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)} (±${accuracy.toFixed(0)}m)`
    },
    () => {
      clearTimeout(gpsTimeout)
      gpsStatus.value = 'err'; gpsText.value = 'GPS tidak tersedia'
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
}

async function confirmCheckin() {
  loadingCheckin.value = true
  const now = new Date().toISOString()
  const deviceId = 'web-scan-' + (auth.userId || '01')

  // Send accel gate telemetry
  if (accel.samples.length > 0) {
    await telemetryApi.postAccelGate(deviceId, accel.samples.slice(-20), modalQrData.value.session_id)
  }

  const payload = {
    device_id: deviceId,
    course_id: modalQrData.value.course_id,
    session_id: modalQrData.value.session_id,
    qr_token: modalQrData.value.qr_token,
    ts: now,
    accel_verified: accel.verified,
    accel_samples: accel.samples.length,
  }
  if (pendingGps) {
    payload.lat = pendingGps.lat
    payload.lng = pendingGps.lng
    payload.accuracy_m = pendingGps.accuracy_m
  }

  const r = await presenceApi.checkin(payload)
  loadingCheckin.value = false

  if (!r.ok) { modalState.value = 'err'; errText.value = r.error; return }

  modalState.value = 'ok'
  okDetail.value = `${r.data.course_id} · ${r.data.session_id}`
  okId.value     = 'Presence ID: ' + r.data.presence_id
  okGps.value    = r.data.gps_saved && r.data.gps
    ? `GPS: ${r.data.gps.lat.toFixed(5)}, ${r.data.gps.lng.toFixed(5)}` : ''
  okAccel.value  = r.data.accel_verified
    ? `Gerakan terverifikasi (${r.data.accel_samples} sampel)` : ''

  accel.reset()
  setTimeout(() => { modalOpen.value = false }, 4000)
}

onUnmounted(() => { stopScan(); clearTimeout(gpsTimeout) })
</script>

<style scoped>
.card--locked   { opacity: .45; pointer-events: none; transition: opacity .4s; }
.card--unlocked { opacity: 1;   pointer-events: auto; transition: opacity .4s; }

.locked-overlay {
  text-align: center; padding: 28px;
  background: var(--ink3); border-radius: 10px;
  border: 1.5px dashed var(--border2); margin-bottom: 14px;
}

#qr-reader {
  width: 100%; max-width: 340px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border2);
}
</style>
