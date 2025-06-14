<template>
  <main>
    <h2>Welcome to Architecture Soundscapes</h2>
    <p>Upload an image to generate a soundscape which matches the vibe of the image.</p>

    <form @submit="submitForm" ref="form">
      <input type="file" name="image" id="image" accept="image/*" @input="fileSelected" multiple="false" ref="imageInput">
      <template v-if="selectedFileUrl">
        <img :src="selectedFileUrl" alt="">
        <button type="submit">Upload and Transform</button>
      </template>
    </form>
  </main>
</template>

<script setup lang="ts">
import router from "@/router";
import {useTemplateRef, ref} from "vue";

const form = useTemplateRef("form");
const imageInput = useTemplateRef("imageInput");

var selectedFileUrl = ref("");
const fileSelected = () => {
  if (!imageInput.value) {
    return;
  }

  var reader = new FileReader();

  reader.onload = () => {
    // Display the image in preview element:
    if (reader.result && typeof reader.result === "string") {
      selectedFileUrl.value = reader.result
    }
  }

  // Reads the data URL of the file that was selected by user:
  reader.readAsDataURL(imageInput.value.files[0]!);
}

const submitForm = (event: Event) => {
  event.preventDefault();

  if (!form.value) {
    console.error("Why no Form?");
  }

  const formData = new FormData(form.value!)

  console.log(formData);

  // send after here to Backend

  // response will contain uuid

  router.push({
    name: "soundscape",
    params: {
      uuid: crypto.randomUUID(),
    }
  })
}
</script>

<style lang="css" scoped>
img {
  max-width: 100%;
}

</style>
