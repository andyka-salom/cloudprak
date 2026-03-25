<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="modal-overlay" v-if="modelValue" @click.self="$emit('update:modelValue', false)">
        <div class="modal-box">

          <!-- GPS / confirm state -->
          <template v-if="state === 'gps'">
            <div class="modal-strip modal-strip--volt"></div>
            <div class="modal-icon modal-icon--volt">📡</div>
            <h3>QR Terdeteksi!</h3>
            <p class="modal-sub">Konfirmasi absen untuk sesi ini</p>

            <div class="modal-data">
              <div class="mdr"><span class="mdr-key">Token</span><span class="mdr-val">{{ qrData.qr_token }}</span></div>
              <div class="mdr"><span class="mdr-key">Kelas</span><span class="mdr-val">{{ qrData.course_id }}</span></div>
              <div class="mdr"><span class="mdr-key">Sesi</span><span class="mdr-val">{{ qrData.session_id }}</span></div>
            </div>

            <div class="gps-row">
              <div :class="['gps-dot', `gps-dot--${gpsStatus}`]"></div>
              <span class="txt-sm txt-ghost">{{ gpsText }}</span>
            </div>

            <div style="display:flex;gap:10px">
              <button class="btn btn--volt" style="flex:1"
                @click="$emit('confirm')"
                :disabled="loading || gpsStatus === 'loading'">
                <span class="spinner" v-if="loading"></span>
                {{ loading ? '' : '✅ Absen Sekarang' }}
              </button>
              <button class="btn btn--ghost" style="padding:9px 14px"
                @click="$emit('update:modelValue', false)">✕</button>
            </div>
            <p class="txt-xs txt-dim" style="text-align:center;margin-top:8px">GPS wajib — disimpan otomatis ke server</p>
          </template>

          <!-- Success state -->
          <template v-if="state === 'ok'">
            <div class="modal-strip modal-strip--emerald"></div>
            <div class="success-state">
              <div style="font-size:3.5rem;margin-bottom:10px">✅</div>
              <h3 style="font-size:1.2rem">Absen Berhasil!</h3>
              <p class="modal-sub">{{ okDetail }}</p>
              <p class="txt-xs txt-dim" style="margin-bottom:10px">{{ okId }}</p>
              <div v-if="okGps" class="saved-tag saved-tag--gps">📍 {{ okGps }}</div>
              <div v-if="okAccel" class="saved-tag saved-tag--accel mt1">📳 {{ okAccel }}</div>
              <button class="btn btn--emerald btn--full mt3"
                @click="$emit('update:modelValue', false)">Tutup</button>
            </div>
          </template>

          <!-- Error state -->
          <template v-if="state === 'err'">
            <div class="modal-strip modal-strip--rose"></div>
            <div class="modal-icon modal-icon--rose">❌</div>
            <h3>Gagal Absen</h3>
            <p class="modal-sub">{{ errText }}</p>
            <button class="btn btn--rose btn--full"
              @click="$emit('update:modelValue', false)">Tutup</button>
          </template>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  state:      { type: String, default: 'gps' },
  qrData:     { type: Object, default: () => ({}) },
  gpsStatus:  { type: String, default: 'loading' },
  gpsText:    { type: String, default: '' },
  loading:    { type: Boolean, default: false },
  okDetail:   String, okId: String, okGps: String, okAccel: String, errText: String,
})

defineEmits(['update:modelValue', 'confirm'])
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(10,12,20,.8);
  backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

.modal-box {
  background: var(--ink2);
  border: 1px solid var(--border2);
  border-radius: 20px;
  padding: 28px;
  width: 100%; max-width: 380px;
  box-shadow: 0 24px 80px rgba(0,0,0,.5);
}

.modal-strip { height: 3px; border-radius: 2px; margin-bottom: 22px; }
.modal-strip--volt    { background: linear-gradient(90deg, var(--volt), var(--cyan)); }
.modal-strip--emerald { background: linear-gradient(90deg, var(--emerald), var(--cyan)); }
.modal-strip--rose    { background: linear-gradient(90deg, var(--rose), var(--purple)); }

.modal-icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.9rem; margin: 0 auto 14px; }
.modal-icon--volt    { background: rgba(200,255,0,.1); }
.modal-icon--rose    { background: rgba(255,61,107,.08); }

h3 { font-size: 1rem; font-weight: 800; text-align: center; margin-bottom: 4px; }
.modal-sub { font-size: .82rem; color: var(--dim); text-align: center; margin-bottom: 16px; }

.modal-data { background: var(--ink3); border: 1px solid var(--border2); border-radius: 8px; overflow: hidden; margin-bottom: 12px; }
.mdr { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--border); }
.mdr:last-child { border: none; }
.mdr-key { font-family: var(--mono); font-size: .6rem; color: var(--dim); width: 55px; flex-shrink: 0; text-transform: uppercase; }
.mdr-val { font-family: var(--mono); font-size: .8rem; font-weight: 600; color: var(--white); flex: 1; overflow: hidden; text-overflow: ellipsis; }

.gps-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; background: var(--ink3); border: 1px solid var(--border2); border-radius: 8px; margin-bottom: 12px; }

.gps-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.gps-dot--loading { border: 2px solid var(--border2); border-top-color: var(--volt); animation: spin .7s linear infinite; }
.gps-dot--ok  { background: var(--emerald); box-shadow: 0 0 8px rgba(0,214,143,.5); }
.gps-dot--err { background: var(--rose); }
@keyframes spin { to { transform: rotate(360deg); } }

.success-state { text-align: center; animation: popIn .4s cubic-bezier(.175,.885,.32,1.275); }
@keyframes popIn { from { opacity:0; transform: scale(.85); } to { opacity:1; transform: none; } }

.saved-tag { display: flex; align-items: center; gap: 6px; padding: 7px 11px; border-radius: 7px; font-size: .78rem; font-weight: 600; }
.saved-tag--gps   { background: rgba(0,214,143,.07); border: 1px solid rgba(0,214,143,.2); color: var(--emerald); }
.saved-tag--accel { background: rgba(200,255,0,.06); border: 1px solid rgba(200,255,0,.2); color: var(--volt2); }

/* Transition */
.modal-enter-active, .modal-leave-active { transition: all .25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(.9) translateY(20px); }
</style>
