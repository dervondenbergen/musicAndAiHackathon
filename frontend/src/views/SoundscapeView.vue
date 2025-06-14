<template>
  <div class="soundscape">
    <h1>This is the Soundscape Page for UUID {{ uuid }}</h1>
    <pre>{{ infoJson }}</pre>
    <button @click="testGetImageTags">getImageTags Test Button</button>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, nextTick, onMounted, ref } from "vue";

const { uuid } = defineProps<{
  uuid: string;
}>();

type SoundscapeInfo = {
  uuid: string;
  imageFilename: string;
  imageTags?: Array<string>;
  caption?: string;
  musicFilename?: string;
}

const infoJson = ref<SoundscapeInfo>();

const onImageTags = computed(() => {
  return infoJson.value?.imageTags === undefined;
});
const noMusicFilename = computed(() => {
  return infoJson.value?.musicFilename === undefined;
});

const needsRefresh = computed(() => {
  return onImageTags.value //|| noMusicFilename.value;
});

const scheduleRefresh = () => {
  setTimeout(async () => {
    await loadInformation();

    await nextTick();

    if (needsRefresh.value) {
      scheduleRefresh();
    }
  }, 1000);
}

const loadInformation = async () => {
  const info = await fetch(`http://localhost:3000/soundscape/${uuid}?cb=${Date.now()}`);
  infoJson.value = (await info.json()) as SoundscapeInfo;
}

onMounted(async () => {
  await loadInformation();

  if (needsRefresh.value) {
    scheduleRefresh();
  }
});

const testGetImageTags = () => {
  fetch(`http://localhost:3000/test/soundscape/${uuid}/getImageTags`, {
    method: "POST",
  });
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
