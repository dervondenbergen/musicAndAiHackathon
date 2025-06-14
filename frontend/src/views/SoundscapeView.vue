<template>
  <div class="soundscape">
    <h1>This is the Soundscape Page for UUID {{ uuid }}</h1>
    <img v-if="imagePath" :src="imagePath" />
    <p v-if="infoJson?.caption">This is how your Images get's described: <b>{{ infoJson.caption }}</b>, #{{ infoJson.imageTags?.join(" #") }}</p>
    <p v-else-if="infoJson && onImageTags">🔄 Analyzing image...</p>
    <audio v-if="musicPath" controls :src="musicPath">
      Your browser does not support the audio element.
    </audio>
    <p v-else-if="infoJson && !onImageTags && noMusicFilename">🎵 Generating music...</p>
    <pre>{{ infoJson }}</pre>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, nextTick, onBeforeUnmount, onMounted, ref } from "vue";

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

const imagePath = computed(() => {
  if (infoJson.value) {
    return `http://localhost:3000/scapes/${infoJson.value.uuid}/${infoJson.value.imageFilename}`
  }
});

const musicPath = computed(() => {
  if (infoJson.value?.musicFilename) {
    return `http://localhost:3000/scapes/${infoJson.value.uuid}/${infoJson.value.musicFilename}`
  }
});

const onImageTags = computed(() => {
  return infoJson.value?.imageTags === undefined;
});
const noMusicFilename = computed(() => {
  return infoJson.value?.musicFilename === undefined;
});

const needsRefresh = computed(() => {
  return onImageTags.value || noMusicFilename.value;
});

let refreshTimeout: number;
const scheduleRefresh = () => {
  refreshTimeout = setTimeout(async () => {
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

onBeforeUnmount(() => {
  clearTimeout(refreshTimeout);
});
</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}

img {
  max-width: 300px;
}
</style>
