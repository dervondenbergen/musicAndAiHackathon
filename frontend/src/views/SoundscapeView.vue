<template>
  <div class="soundscape">
    <h1 class="font">{{ infoJson?.caption ?? "AI is working ✨" }}</h1>
    <!-- <p v-if="infoJson?.caption">This is how your Images get's described: <b>{{ infoJson.caption }}</b>, #{{ infoJson.imageTags?.join(" #") }}</p> -->
    <!-- <AudioVis /> -->
    <img v-if="imagePath" :src="imagePath" class="uploaded-image" />
    <!-- <p v-if="infoJson && onImageTags">🔄 Analyzing image...</p>
    <p v-else-if="infoJson && !onImageTags && noMusicFilename">🎵 Generating music...</p> -->
    <template v-if="musicPath">
      <audio v-if="musicPath" loop controls :src="musicPath" class="audio-element" ref="audio">
        Your browser does not support the audio element.
      </audio>
      <div class="mp3-player">
        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress" :style="{'--progress': progressValue}"></div>
            </div>
        </div>
        <div class="controls">
            <!-- <div class="control-btn"><i class="pi pi-angle-double-left"></i></div>
            <div class="control-btn"><i class="pi pi-angle-left"></i></div> -->
            <div class="control-btn play-btn" @click="onPlayPause"><i class="pi" :class="playbackClass"></i></div>
            <!-- <div class="control-btn"><i class="pi pi-angle-right"></i></div>
            <div class="control-btn"><i class="pi pi-angle-double-right"></i></div> -->
        </div>
        <!-- <div class="volume-control">
            <span><i class = "pi pi-volume-up"></i></span>
            <div class="volume-bar">
                <div class="volume-progress"></div>
            </div>
        </div> -->
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";

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

const audioElement = useTemplateRef("audio");
const playbackClass = ref("pi-caret-right");

var progressValue = ref("0%");
var playbackUpdaterInterval;

const onPlayPause = () => {
  const element = audioElement.value;
  if (element) {
    if (element.paused) {
      element.play();
      playbackClass.value = "pi-pause";
      playbackUpdaterInterval = setInterval(() => {
        progressValue.value = `${Math.round(element.currentTime / element.duration * 100)}%`
      }, 100);
    } else {
      element.pause();
      playbackClass.value = "pi-caret-right";
      clearInterval(playbackUpdaterInterval);
    }
  }
}

onMounted(async () => {
  await loadInformation();

  if (needsRefresh.value) {
    scheduleRefresh();
  }
});

onBeforeUnmount(() => {
  clearTimeout(refreshTimeout);
  clearInterval(playbackUpdaterInterval);
});
</script>

<style scoped>
.soundscape {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3rem;
    padding: 2rem;
}

.uploaded-image {
  max-width: 100%;
  width: 20rem;
}

.audio-element {
  display: none;

  position: fixed;
  top: 0;
  left: 0;
}

.font {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
}

.mp3-player {
    width: 500px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    padding: 15px 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.progress-container {
    padding: 0 10px;
    margin-top: 5px;
}

.progress-bar {
    height: 2px;
    width: 100%;
    background: #e0e0e0;
    border-radius: 1px;
    cursor: pointer;
}

.progress {
    height: 100%;
    width: var(--progress);
    background: linear-gradient(to right, #667eea, #7d0cee);
    border-radius: 1px;
    position: relative;
}
/*
.progress::after {
    content: '';
    position: absolute;
    right: -4px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.2);
} */

.time {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 11px;
    color: #666;
}

.controls {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 15px;
    gap: 15px;
}

.control-btn {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(245, 245, 245, 0.8);
    font-size: 12px;
}

.control-btn i {
  font-size: 2rem;
}

.control-btn:hover {
    transform: scale(1.1);
}

.volume-control {
    padding: 0 15px;
    margin-top: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.volume-bar {
    flex-grow: 1;
    height: 2px;
    background: #e0e0e0;
    border-radius: 1px;
    cursor: pointer;
}

.volume-progress {
    height: 100%;
    width: 70%;
    background: linear-gradient(to right, #667eea, #764ba2);
    border-radius: 1px;
}
.ult-div {
  text-align: center;
  position: relative;
  color: black;
}
.ult-span {
  position: absolute;
  top: 50%; right: 0;
  transform: translateY(-50%);
}
</style>
