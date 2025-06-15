
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
<div class = "app-bg">
  <RouterLink  to="/" class = "no-underline"></RouterLink>
  <RouterView />
  </div>
</template>

<style>
.app-bg {
  background: rgba(42, 123, 155, .2);
  background: linear-gradient(90deg, rgba(42, 123, 155, .2) 0%, rgba(87, 199, 133, .2) 50%, rgba(237, 221, 83, .2) 100%);
  min-height: 100vh;
  width: 100%;
}

</style>