<template>
  <div class="soundscape">
    <h1>This is the Soundscape Page for UUID {{ uuid }}</h1>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";

const { uuid } = defineProps<{
  uuid: string;
}>();

const loadInformation = () => {

}
</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
