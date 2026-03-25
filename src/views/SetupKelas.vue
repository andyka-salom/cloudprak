<template>
  <div>
    <div class="row2">
      <!-- Mata Kuliah -->
      <div class="card">
        <div class="card-hd">
          <div class="card-title"><div class="card-icon">📚</div>Mata Kuliah</div>
        </div>
        <div class="fg"><label>Course ID</label><input v-model="nc.id" placeholder="cloud-101"></div>
        <div class="fg"><label>Nama</label><input v-model="nc.name" placeholder="Komputasi Awan"></div>
        <button class="btn btn--volt btn--full" @click="doCreateCourse" :disabled="loading.course">
          <span class="spinner" v-if="loading.course"></span>{{ loading.course ? '' : 'Buat' }}
        </button>
        <AppAlert :msg="alert.course" :type="alert.courseType" />
        <hr class="divider">
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>ID</th><th>Nama</th></tr></thead>
            <tbody>
              <tr v-if="!courses.length"><td colspan="2" class="tbl-empty">Memuat…</td></tr>
              <tr v-for="c in courses" :key="c.course_id">
                <td><code>{{ c.course_id }}</code></td>
                <td><strong>{{ c.course_name }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sesi -->
      <div class="card">
        <div class="card-hd">
          <div class="card-title"><div class="card-icon">📅</div>Sesi</div>
        </div>
        <div class="fg"><label>Mata Kuliah</label>
          <select v-model="ns.courseId">
            <option value="">— Pilih —</option>
            <option v-for="c in courses" :key="c.course_id" :value="c.course_id">
              {{ c.course_name }} ({{ c.course_id }})
            </option>
          </select>
        </div>
        <div class="fg"><label>Tanggal</label><input v-model="ns.date" type="date"></div>
        <div class="fg"><label>Label</label><input v-model="ns.label" placeholder="Pertemuan 1"></div>
        <button class="btn btn--emerald btn--full" @click="doCreateSession" :disabled="loading.session">
          <span class="spinner" v-if="loading.session"></span>{{ loading.session ? '' : 'Buat Sesi' }}
        </button>
        <AppAlert :msg="alert.session" :type="alert.sessionType" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { coursesApi, sessionsApi } from '@/services/api'
import AppAlert from '@/components/ui/AppAlert.vue'

const courses = ref([])
const nc = reactive({ id: '', name: '' })
const ns = reactive({ courseId: '', date: '', label: '' })
const loading = reactive({ course: false, session: false })
const alert   = reactive({ course: '', courseType: 'err', session: '', sessionType: 'err' })

function showAlert(key, msg, type = 'err') {
  alert[key] = msg; alert[key + 'Type'] = type
  if (type !== 'info') setTimeout(() => { alert[key] = '' }, 7000)
}

async function loadCourses() {
  const r = await coursesApi.list()
  if (r.ok) courses.value = r.data.items || []
}

async function doCreateCourse() {
  if (!nc.id || !nc.name) { showAlert('course', 'Isi semua field.'); return }
  loading.course = true
  const r = await coursesApi.create(nc.id, nc.name)
  loading.course = false
  if (!r.ok) { showAlert('course', r.error); return }
  showAlert('course', '✅ Mata kuliah dibuat!', 'ok')
  nc.id = nc.name = ''
  loadCourses()
}

async function doCreateSession() {
  if (!ns.courseId || !ns.date || !ns.label) { showAlert('session', 'Isi semua field.'); return }
  loading.session = true
  const r = await sessionsApi.create({ course_id: ns.courseId, date: ns.date, label: ns.label })
  loading.session = false
  if (!r.ok) { showAlert('session', r.error); return }
  showAlert('session', '✅ Sesi dibuat! ID: ' + r.data.session_id, 'ok')
  ns.date = ns.label = ''
}

onMounted(loadCourses)
</script>
