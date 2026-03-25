<template>
  <div>
    <AppNav v-if="auth.isLoggedIn" />
    <div v-if="auth.isLoggedIn" class="app-wrap">
      <div class="two-col">
        <AppSidebar />
        <main>
          <RouterView v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" :key="$route.path" />
            </Transition>
          </RouterView>
        </main>
      </div>
    </div>
    <RouterView v-else />
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import AppNav     from '@/components/layout/AppNav.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
const auth = useAuthStore()
</script>

<style>
.app-wrap { max-width: 1060px; margin: 0 auto; padding: 20px 14px; }
.two-col { display: grid; grid-template-columns: 200px 1fr; gap: 16px; align-items: start; }
.page-enter-active, .page-leave-active { transition: all .18s ease; }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to   { opacity: 0; transform: translateY(-4px); }
@media (max-width: 700px) { .two-col { grid-template-columns: 1fr; } }
</style>
