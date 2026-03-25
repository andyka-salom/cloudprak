<template>
  <div class="card">
    <div class="card-hd">
      <div class="card-title"><div class="card-icon">🏠</div>Dashboard</div>
    </div>
    <p class="txt-muted">
      Halo, <strong style="color:var(--white)">{{ auth.name }}</strong>!
      <span :class="['badge', roleBadge]" style="margin-left:6px">{{ auth.role }}</span>
      <code v-if="auth.nim" style="margin-left:8px">{{ auth.nim }}</code>
    </p>
    <hr class="divider">
    <div class="stats-grid">
      <div class="stat-card stat-card--volt">
        <div class="stat-n">—</div>
        <div class="stat-l">{{ auth.role === 'mahasiswa' ? 'Total Hadir' : 'Matkul' }}</div>
      </div>
      <div class="stat-card stat-card--cyan">
        <div class="stat-n">—</div>
        <div class="stat-l">{{ auth.role === 'mahasiswa' ? 'Mata Kuliah' : 'Sesi' }}</div>
      </div>
      <div class="stat-card stat-card--amber">
        <div class="stat-n">—</div>
        <div class="stat-l">Device</div>
      </div>
    </div>
    <p class="txt-xs txt-dim" style="text-align:center">Pilih menu di sidebar untuk memulai</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const roleBadge = computed(() =>
  auth.role === 'admin' ? 'badge--rose' : auth.role === 'dosen' ? 'badge--amber' : 'badge--volt'
)
</script>
