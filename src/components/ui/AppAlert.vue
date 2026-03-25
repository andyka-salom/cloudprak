<template>
  <Transition name="alert-fade">
    <div v-if="msg" :class="['alert', `alert--${type}`]">{{ msg }}</div>
  </Transition>
</template>

<script setup>
defineProps({
  msg:  { type: String, default: '' },
  type: { type: String, default: 'err' },
})
</script>

<style scoped>
.alert-fade-enter-active, .alert-fade-leave-active { transition: all .2s ease; }
.alert-fade-enter-from, .alert-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
