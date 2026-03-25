<template>
  <div class="card">
    <div class="card-hd">
      <div class="card-title"><div class="card-icon">🔲</div>Generate QR Token</div>
      <span class="badge badge--emerald">AUTO CHECKIN ✓</span>
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

    <button class="btn btn--volt btn--full" @click="doGenerate" :disabled="loading">
      <span class="spinner" v-if="loading"></span>
      {{ loading ? '' : '⚡ Generate QR Sekarang' }}
    </button>
    <AppAlert :msg="alertMsg" :type="alertType" />

    <!-- QR Display -->
    <Transition name="qr-reveal">
      <div v-if="qrToken" class="qr-layout mt3">
        <!-- Canvas -->
        <div class="qr-frame-wrap">
          <div class="qr-frame">
            <div class="qr-corner qr-corner--tl"></div>
            <div class="qr-corner qr-corner--tr"></div>
            <div class="qr-corner qr-corner--bl"></div>
            <div class="qr-corner qr-corner--br"></div>
            <div ref="qrWrap" class="qr-canvas-wrap"></div>
            <div class="qr-scan-line" v-if="timerRem > 0"></div>
          </div>
        </div>

        <!-- Info panel -->
        <div class="qr-info">
          <div class="token-box">
            <span class="token-label">Token</span>
            <span class="token-val">{{ qrToken }}</span>
          </div>

          <div class="timer-box">
            <div class="timer-ring">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="4"/>
                <circle cx="24" cy="24" r="19" fill="none"
                  :stroke="timerRem <= 30 ? '#ff3d6b' : 'url(#tg)'"
                  stroke-width="4"
                  stroke-dasharray="119.38"
                  :stroke-dashoffset="timerOffset"
                  stroke-linecap="round"
                  style="transition:stroke-dashoffset 1s linear;transform:rotate(-90deg);transform-origin:center"/>
                <defs>
                  <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#c8ff00"/>
                    <stop offset="100%" stop-color="#00e5ff"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="timer-pct">{{ Math.round((timerRem/120)*100) }}%</div>
            </div>
            <div class="timer-info">
              <div :class="['timer-count', timerRem <= 30 ? 'timer-count--danger' : '']">
                {{ timerDisplay }}
              </div>
              <div class="timer-sub">sisa waktu token aktif</div>
            </div>
          </div>

          <div class="info-row"><div class="info-icon">📚</div>
            <div><div class="info-key">Mata Kuliah</div><div class="info-val">{{ sel.courseId }}</div></div>
          </div>
          <div class="info-row"><div class="info-icon">📅</div>
            <div><div class="info-key">Sesi</div><div class="info-val">{{ sel.sessionId }}</div></div>
          </div>

          <div class="live-row"><div class="pulse-dot"></div>Scan → auto checkin langsung</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { coursesApi, sessionsApi, presenceApi } from '@/services/api'
import { renderQRCanvas } from '@/utils/qrCanvas'
import AppAlert from '@/components/ui/AppAlert.vue'

const courses  = ref([])
const sessions = ref([])
const sel      = ref({ courseId: '', sessionId: '' })
const loading  = ref(false)
const alertMsg = ref('')
const alertType = ref('err')
const qrToken  = ref('')
const qrExpiry = ref(0)
const timerRem = ref(0)
const qrWrap   = ref(null)
let timerInterval = null

function showAlert(msg, type = 'err') {
  alertMsg.value = msg; alertType.value = type
  if (type !== 'info') setTimeout(() => { alertMsg.value = '' }, 7000)
}

async function loadSessions() {
  if (!sel.value.courseId) return
  const r = await sessionsApi.list(sel.value.courseId)
  if (r.ok) sessions.value = r.data.items || []
}

async function doGenerate() {
  if (!sel.value.courseId || !sel.value.sessionId) { showAlert('Pilih mata kuliah dan sesi.'); return }
  loading.value = true
  const r = await presenceApi.generateQR(sel.value.courseId, sel.value.sessionId)
  loading.value = false
  if (!r.ok) { showAlert(r.error); return }

  qrToken.value  = r.data.qr_token
  qrExpiry.value = new Date(r.data.expires_at).getTime()

  const payload = r.data.qr_payload || JSON.stringify({
    qr_token: r.data.qr_token,
    course_id: sel.value.courseId,
    session_id: sel.value.sessionId,
  })

  nextTick(() => {
    if (qrWrap.value) renderQRCanvas(qrWrap.value, payload, 220)
  })

  if (timerInterval) clearInterval(timerInterval)
  const tick = () => { timerRem.value = Math.max(0, Math.floor((qrExpiry.value - Date.now()) / 1000)) }
  tick()
  timerInterval = setInterval(() => { tick(); if (timerRem.value <= 0) clearInterval(timerInterval) }, 1000)
}

const timerOffset = computed(() => 119.38 * (1 - timerRem.value / 120))
const timerDisplay = computed(() => {
  if (timerRem.value <= 0) return 'Expired!'
  return `${String(Math.floor(timerRem.value/60)).padStart(2,'0')}:${String(timerRem.value%60).padStart(2,'0')}`
})

onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })

// load courses on mount
import { onMounted } from 'vue'
onMounted(async () => {
  const r = await coursesApi.list()
  if (r.ok) courses.value = r.data.items || []
})
</script>

<style scoped>
.qr-layout { display: flex; gap: 24px; align-items: flex-start; }
.qr-frame-wrap { flex-shrink: 0; }

.qr-frame {
  background: #fff; border-radius: 16px; padding: 14px;
  position: relative; display: inline-block;
  box-shadow: 0 0 40px rgba(200,255,0,.15), 0 0 0 1px rgba(200,255,0,.2);
}

.qr-corner { position: absolute; width: 20px; height: 20px; border-color: rgba(200,255,0,.8); border-style: solid; }
.qr-corner--tl { top:7px;left:7px;   border-width:2px 0 0 2px; border-radius:5px 0 0 0; }
.qr-corner--tr { top:7px;right:7px;  border-width:2px 2px 0 0; border-radius:0 5px 0 0; }
.qr-corner--bl { bottom:7px;left:7px;border-width:0 0 2px 2px; border-radius:0 0 0 5px; }
.qr-corner--br { bottom:7px;right:7px;border-width:0 2px 2px 0;border-radius:0 0 5px 0; }

.qr-canvas-wrap { min-width:220px; min-height:220px; background:#fff; border-radius:8px; display:flex; align-items:center; justify-content:center; }

.qr-scan-line {
  position:absolute; left:14px; right:14px; height:2px;
  background:linear-gradient(90deg,transparent,var(--volt),transparent);
  animation:scanLine 2s ease-in-out infinite; z-index:2;
}
@keyframes scanLine { 0%{top:14px} 50%{top:calc(100% - 14px)} 100%{top:14px} }

.qr-info { flex:1; display:flex; flex-direction:column; gap:10px; min-width:0; }

.token-box {
  display:flex; align-items:center; gap:10px;
  background:rgba(200,255,0,.06); border:1px solid rgba(200,255,0,.2);
  border-radius:10px; padding:12px 14px;
}
.token-label { font-family:var(--mono); font-size:.58rem; color:var(--dim); text-transform:uppercase; letter-spacing:1px; white-space:nowrap; }
.token-val   { font-family:var(--mono); font-size:1.1rem; font-weight:700; color:var(--volt); letter-spacing:2px; flex:1; text-align:center; }

.timer-box { display:flex; align-items:center; gap:12px; background:var(--ink3); border:1px solid var(--border2); border-radius:10px; padding:12px 14px; }
.timer-ring { position:relative; width:48px; height:48px; flex-shrink:0; }
.timer-pct  { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-family:var(--mono); font-size:.6rem; font-weight:700; color:var(--ghost); }
.timer-info { flex:1; }
.timer-count { font-family:var(--mono); font-size:1.6rem; font-weight:700; color:var(--white); line-height:1; }
.timer-count--danger { color:var(--rose); animation:blinkAnim .8s infinite; }
@keyframes blinkAnim { 0%,100%{opacity:1} 50%{opacity:.4} }
.timer-sub { font-size:.72rem; color:var(--dim); margin-top:2px; }

.info-row { display:flex; align-items:center; gap:8px; background:var(--ink3); border:1px solid var(--border); border-radius:8px; padding:8px 12px; }
.info-icon { width:24px; height:24px; background:rgba(200,255,0,.1); border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:.7rem; flex-shrink:0; }
.info-key  { font-family:var(--mono); font-size:.6rem; color:var(--dim); text-transform:uppercase; }
.info-val  { font-family:var(--mono); font-size:.8rem; font-weight:700; color:var(--volt); }

.qr-reveal-enter-active { transition:all .3s ease; }
.qr-reveal-enter-from   { opacity:0; transform:translateY(12px); }

@media(max-width:700px) {
  .qr-layout { flex-direction:column; }
  .qr-frame-wrap { width:100%; display:flex; justify-content:center; }
}
</style>
