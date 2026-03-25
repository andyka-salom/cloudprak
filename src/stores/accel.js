import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { telemetryApi } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const GATE_NEEDED = 5.0   // seconds of movement
const SAMPLE_MS   = 100   // tick interval

export const useAccelStore = defineStore('accel', () => {
  const active   = ref(false)
  const verified = ref(false)
  const accum    = ref(0)
  const ax       = ref(0)
  const ay       = ref(0)
  const az       = ref(0)
  const samples  = ref([])
  const icon     = ref('📱')

  const pct = computed(() => Math.min(100, Math.round((accum.value / GATE_NEEDED) * 100)))
  const msg = computed(() => {
    if (verified.value) return `✅ Terverifikasi — ${samples.value.length} sampel tersimpan`
    if (!active.value)  return 'Tekan Mulai untuk memulai verifikasi'
    return `Terus gerakkan… ${(GATE_NEEDED - accum.value).toFixed(1)}s lagi`
  })

  let progressTimer = null
  let motionHandler = null
  let simTimer      = null
  let lastMoved     = false
  let lastX = null, lastY = null, lastZ = null

  function _processMotion(aax, aay, aaz) {
    if (!active.value) return
    ax.value = aax; ay.value = aay; az.value = aaz
    let mag
    if (Math.abs(aaz) > 5) {
      const dx = lastX !== null ? aax - lastX : 0
      const dy = lastY !== null ? aay - lastY : 0
      const dz = lastZ !== null ? aaz - lastZ : 0
      mag = Math.sqrt(dx * dx + dy * dy + dz * dz)
    } else {
      mag = Math.sqrt(aax * aax + aay * aay + aaz * aaz)
    }
    lastX = aax; lastY = aay; lastZ = aaz
    lastMoved = mag > 0.5
    samples.value.push({ t: new Date().toISOString(), x: +aax.toFixed(3), y: +aay.toFixed(3), z: +aaz.toFixed(3) })
  }

  function _startProgressTimer() {
    progressTimer = setInterval(() => {
      if (!active.value) { clearInterval(progressTimer); return }
      if (lastMoved) { accum.value = +(accum.value + 0.1).toFixed(1); lastMoved = false }
      if (accum.value >= GATE_NEEDED) { clearInterval(progressTimer); _onVerified() }
    }, SAMPLE_MS)
  }

  function _startSim() {
    let t = 0
    simTimer = setInterval(() => {
      if (!active.value) { clearInterval(simTimer); return }
      t += 0.1
      _processMotion(
        Math.sin(t * 2.1) * 2.5 + (Math.random() - .5) * .8,
        Math.cos(t * 1.8) * 2.0 + (Math.random() - .5) * .8,
        9.81 + Math.sin(t * 3.3) * 1.5 + (Math.random() - .5) * .5,
      )
    }, 80)
  }

  function _attachSensor() {
    motionHandler = (e) => {
      const a = e.acceleration || e.accelerationIncludingGravity
      if (!a) return
      _processMotion(a.x || 0, a.y || 0, a.z || 0)
    }
    window.addEventListener('devicemotion', motionHandler)
  }

  async function _onVerified() {
    verified.value = true
    icon.value = '✅'
    _stopTimers()
    active.value = false
    const authStore = useAuthStore()
    if (samples.value.length > 0) {
      await telemetryApi.postAccelGate(
        'scan-gate-' + (authStore.userId || '01'),
        samples.value.slice(-20),
      )
    }
  }

  function _stopTimers() {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null }
    if (simTimer) { clearInterval(simTimer); simTimer = null }
    if (motionHandler) { window.removeEventListener('devicemotion', motionHandler); motionHandler = null }
  }

  async function start() {
    if (verified.value) return
    active.value = true
    accum.value = 0
    samples.value = []
    lastMoved = false
    lastX = lastY = lastZ = null
    icon.value = '📱'
    _startProgressTimer()

    if (!window.DeviceMotionEvent) { _startSim(); return 'sim' }

    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const state = await DeviceMotionEvent.requestPermission()
        if (state === 'granted') { _attachSensor(); return 'sensor' }
        else { _startSim(); return 'sim' }
      } catch { _startSim(); return 'sim' }
    } else {
      _attachSensor(); return 'sensor'
    }
  }

  function stop() {
    active.value = false
    _stopTimers()
    accum.value = 0
    icon.value = '📱'
  }

  function reset() {
    verified.value = false
    active.value = false
    accum.value = 0
    samples.value = []
    icon.value = '📱'
    ax.value = ay.value = 0; az.value = 0
    _stopTimers()
  }

  return { active, verified, accum, ax, ay, az, samples, icon, pct, msg, start, stop, reset }
})
