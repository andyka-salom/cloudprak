<template>
  <div class="card">
    <div class="card-hd">
      <div class="card-title"><div class="card-icon">📈</div>Accelerometer</div>
    </div>

    <div class="row2">
      <div class="fg"><label>Device ID</label><input v-model="deviceId" placeholder="web-browser-01"></div>
      <div class="flex-end">
        <button class="btn btn--emerald" v-if="!active" @click="startAccel">▶ Mulai</button>
        <button class="btn btn--rose"    v-if="active"  @click="stopAccel">⏹ Stop</button>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <p class="txt-sm txt-ghost" style="font-weight:600">Sensor Realtime</p>
      <span class="source-badge">{{ srcLabel }}</span>
    </div>

    <div class="accel-axes">
      <div class="axis-card ax-x">
        <div class="axis-label">X-Axis</div>
        <div class="axis-val" :style="{ color: Math.abs(x) > 3 ? 'var(--volt)' : 'var(--white)' }">{{ x.toFixed(3) }}</div>
        <div class="axis-unit">m/s²</div>
      </div>
      <div class="axis-card ax-y">
        <div class="axis-label">Y-Axis</div>
        <div class="axis-val" :style="{ color: Math.abs(y) > 3 ? 'var(--volt)' : 'var(--white)' }">{{ y.toFixed(3) }}</div>
        <div class="axis-unit">m/s²</div>
      </div>
      <div class="axis-card ax-z">
        <div class="axis-label">Z-Axis</div>
        <div class="axis-val" :style="{ color: Math.abs(z - 9.81) > 3 ? 'var(--volt)' : 'var(--white)' }">{{ z.toFixed(3) }}</div>
        <div class="axis-unit">m/s²</div>
      </div>
    </div>

    <p class="txt-xs txt-dim" style="text-align:center">📱 Buka via HTTPS / localhost agar sensor HP aktif</p>
    <AppAlert :msg="alertMsg" :type="alertType" />

    <hr class="divider">

    <p style="font-size:.86rem;font-weight:700;margin-bottom:10px;color:var(--ghost)">📊 Data Terbaru Server</p>
    <div class="fg">
      <label>Device ID</label>
      <div style="display:flex;gap:8px">
        <input v-model="queryId" placeholder="web-browser-01">
        <button class="btn btn--volt btn--sm" @click="fetchLatest">Ambil</button>
      </div>
    </div>
    <p class="txt-mono txt-dim mt1">{{ latestDisplay || '—' }}</p>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useAuthStore }  from '@/stores/auth'
import { telemetryApi }  from '@/services/api'
import { fmtDt }         from '@/utils/format'
import AppAlert          from '@/components/ui/AppAlert.vue'

const auth     = useAuthStore()
const deviceId = ref('web-browser-01')
const queryId  = ref('')
const active   = ref(false)
const srcLabel = ref('menunggu…')
const x = ref(0), y = ref(0), z = ref(9.81)
const alertMsg = ref(''), alertType = ref('err')
const latestDisplay = ref('')

let motionHandler = null
let simTimer      = null
let batchBuf      = []
let batchTimer    = null

function showAlert(msg, type = 'err') {
  alertMsg.value = msg; alertType.value = type
  if (type !== 'info') setTimeout(() => { alertMsg.value = '' }, 7000)
}

function startBatchTimer() {
  batchTimer = setInterval(async () => {
    if (!batchBuf.length) return
    const batch = batchBuf.splice(0)
    await telemetryApi.postAccel(deviceId.value || 'web-browser-01', batch)
  }, 3000)
}

function attachSensor() {
  active.value = true; srcLabel.value = 'DeviceMotion'
  motionHandler = e => {
    const a = e.accelerationIncludingGravity || e.acceleration; if (!a) return
    x.value = +(a.x||0).toFixed(3); y.value = +(a.y||0).toFixed(3); z.value = +(a.z||9.81).toFixed(3)
    batchBuf.push({ t: new Date().toISOString(), x: x.value, y: y.value, z: z.value })
  }
  window.addEventListener('devicemotion', motionHandler)
  startBatchTimer()
}

function startSim() {
  active.value = true; srcLabel.value = 'simulasi'
  let t = 0
  simTimer = setInterval(() => {
    t += 0.1
    x.value = +(Math.sin(t*1.3)*0.8 + (Math.random()-.5)*.3).toFixed(3)
    y.value = +(Math.cos(t*0.9)*0.6 + (Math.random()-.5)*.3).toFixed(3)
    z.value = +(9.81 + Math.sin(t*2.1)*.4 + (Math.random()-.5)*.1).toFixed(3)
    batchBuf.push({ t: new Date().toISOString(), x: x.value, y: y.value, z: z.value })
  }, 100)
  startBatchTimer()
  showAlert('Sensor tidak tersedia — simulasi aktif', 'info')
}

async function startAccel() {
  if (!window.DeviceMotionEvent) { startSim(); return }
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const state = await DeviceMotionEvent.requestPermission()
      state === 'granted' ? attachSensor() : startSim()
    } catch { startSim() }
  } else { attachSensor() }
}

function stopAccel() {
  active.value = false; srcLabel.value = 'menunggu…'
  if (motionHandler) { window.removeEventListener('devicemotion', motionHandler); motionHandler = null }
  if (simTimer)  { clearInterval(simTimer);  simTimer  = null }
  if (batchTimer){ clearInterval(batchTimer); batchTimer = null }
  batchBuf = []
}

async function fetchLatest() {
  if (!queryId.value) return
  const r = await telemetryApi.latestAccel(queryId.value)
  if (!r.ok) { latestDisplay.value = r.error; return }
  const d = r.data
  latestDisplay.value = `${d.device_id} — t:${fmtDt(d.t)} | X:${d.x} Y:${d.y} Z:${d.z}`
}

onUnmounted(stopAccel)
</script>

<style scoped>
.source-badge {
  font-family: var(--mono); font-size: .65rem;
  padding: 2px 8px; border-radius: 4px;
  background: var(--ink3); color: var(--muted);
  border: 1px solid var(--border2);
}

.accel-axes { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin: 12px 0; }

.axis-card {
  background: var(--ink3); border: 1px solid var(--border2);
  border-radius: 8px; padding: 12px; text-align: center;
  position: relative; overflow: hidden;
}

.axis-card::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; }
.ax-x::after { background: var(--cyan); }
.ax-y::after { background: var(--volt); }
.ax-z::after { background: var(--amber); }

.axis-label { font-family: var(--mono); font-size: .6rem; color: var(--dim); text-transform: uppercase; }
.axis-val   { font-family: var(--mono); font-size: 1.2rem; font-weight: 700; margin-top: 3px; }
.axis-unit  { font-size: .62rem; color: var(--muted); }

@media(max-width:700px) { .accel-axes { grid-template-columns: 1fr; } }
</style>
