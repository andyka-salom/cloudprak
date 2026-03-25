<template>
  <div class="card">
    <div class="card-hd">
      <div class="card-title">
        <div class="card-icon">📳</div>
        Langkah 1 — Verifikasi Gerak
      </div>
      <span :class="['badge', store.verified ? 'badge--emerald' : 'badge--rose']">
        {{ store.verified ? '✅ TERVERIFIKASI' : 'BELUM' }}
      </span>
    </div>

    <p class="txt-muted mb3">
      Goyangkan handphone minimal <strong style="color:var(--white)">5 detik</strong>
      untuk membuktikan Anda hadir membawa perangkat sendiri.
    </p>

    <!-- Visualisasi sensor -->
    <div class="gate-viz">
      <div :class="['gate-ring', store.active ? 'gate-ring--shaking' : '', store.verified ? 'gate-ring--done' : '']">
        <div :class="['gate-icon', store.active ? 'gate-icon--shake' : '']">{{ store.icon }}</div>
        <div class="gate-sub-label">{{ ringLabel }}</div>
      </div>
      <div class="gate-bars">
        <div class="gate-bar-row" v-for="axis in axes" :key="axis.key">
          <span class="gate-bar-axis">{{ axis.key }}</span>
          <div class="gate-bar-track">
            <div class="gate-bar-fill"
              :style="{ width: barWidth(axis.val) + 'px', background: axis.color }" />
          </div>
          <span class="gate-bar-val">{{ axis.val.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- Progress -->
    <div v-if="store.active || store.verified" class="progress-wrap">
      <div class="progress-header">
        <span>Progress Gerakan</span>
        <span class="txt-volt txt-mono">{{ store.pct }}%</span>
      </div>
      <div class="progress-track">
        <div :class="['progress-bar', store.verified ? 'progress-bar--done' : '']"
          :style="{ width: store.pct + '%' }" />
      </div>
      <p class="progress-msg">{{ store.msg }}</p>
    </div>

    <!-- Buttons -->
    <div style="display:flex;gap:10px;margin-top:12px">
      <button class="btn btn--volt btn--full" v-if="!store.active && !store.verified" @click="handleStart">
        📳 Mulai Verifikasi Gerak
      </button>
      <button class="btn btn--rose" v-if="store.active" @click="store.stop()">⏹ Batal</button>
      <button class="btn btn--emerald btn--full" v-if="store.verified" disabled>✅ Terverifikasi!</button>
    </div>

    <AppAlert :msg="alertMsg" :type="alertType" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAccelStore } from '@/stores/accel'
import AppAlert from '@/components/ui/AppAlert.vue'

const store = useAccelStore()
const alertMsg  = ref('')
const alertType = ref('info')

const ringLabel = computed(() => {
  if (store.verified) return 'Terverifikasi!'
  if (store.active)   return 'Gerakkan!'
  return 'Tekan Mulai'
})

const axes = computed(() => [
  { key: 'X', val: store.ax, color: 'var(--cyan)' },
  { key: 'Y', val: store.ay, color: 'var(--volt)' },
  { key: 'Z', val: store.az, color: 'var(--amber)' },
])

const barWidth = (val) => Math.min(160, Math.abs(val) * 20)

async function handleStart() {
  alertMsg.value = ''
  const src = await store.start()
  if (src === 'sim') {
    alertMsg.value  = '📱 Sensor tidak tersedia — simulasi aktif'
    alertType.value = 'info'
  } else {
    alertMsg.value  = '✅ Sensor aktif — gerakkan HP Anda!'
    alertType.value = 'info'
  }
}
</script>

<style scoped>
.gate-viz {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 18px;
  background: var(--ink3);
  border: 1px solid var(--border2);
  border-radius: var(--r);
  margin-bottom: 14px;
}

.gate-ring {
  width: 88px; height: 88px;
  border-radius: 50%;
  border: 2px solid var(--border2);
  background: var(--ink2);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all .3s;
}

.gate-ring--shaking {
  border-color: var(--volt);
  box-shadow: 0 0 20px rgba(200,255,0,.25);
  animation: ringShake .2s ease-in-out infinite;
}

.gate-ring--done {
  border-color: var(--emerald);
  box-shadow: 0 0 20px rgba(0,214,143,.25);
  background: rgba(0,214,143,.06);
}

@keyframes ringShake {
  0%,100% { transform: rotate(0deg); }
  25%      { transform: rotate(-4deg) translateX(-2px); }
  75%      { transform: rotate(4deg) translateX(2px); }
}

.gate-icon { font-size: 2.2rem; }
.gate-icon--shake { animation: iconShake .1s ease-in-out infinite alternate; }
@keyframes iconShake { from { transform: rotate(-8deg); } to { transform: rotate(8deg); } }

.gate-sub-label {
  font-family: var(--mono);
  font-size: .58rem;
  color: var(--dim);
  text-transform: uppercase;
  margin-top: 4px;
}

.gate-bars { flex: 1; display: flex; flex-direction: column; gap: 10px; }

.gate-bar-row { display: flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: .62rem; color: var(--dim); }

.gate-bar-axis { width: 12px; text-transform: uppercase; }

.gate-bar-track { flex: 1; height: 6px; background: var(--ink); border-radius: 3px; overflow: hidden; }

.gate-bar-fill { height: 100%; border-radius: 3px; transition: width .1s; min-width: 4px; }

.gate-bar-val { width: 40px; text-align: right; }

.progress-wrap { margin-bottom: 12px; }

.progress-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 6px; font-size: .8rem; font-weight: 700; color: var(--ghost);
}

.progress-track { height: 8px; background: var(--ink3); border-radius: 20px; overflow: hidden; border: 1px solid var(--border2); }

.progress-bar {
  height: 100%; border-radius: 20px;
  background: linear-gradient(90deg, var(--volt), var(--cyan));
  transition: width .3s ease;
}

.progress-bar--done { background: linear-gradient(90deg, var(--emerald), var(--cyan)); }

.progress-msg { font-family: var(--mono); font-size: .7rem; color: var(--dim); text-align: center; margin-top: 5px; }
</style>
