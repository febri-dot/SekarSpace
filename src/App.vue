<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app-layout">
    <RouterView />
  </div>
</template>

<style>
#app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
