<template>
  <main class="upload-container">
    <div class="header-section">
      <h2 class="title">Welcome to Architecture Soundscapes</h2>
      <p class="subtitle">Upload an image to generate a matching soundscape</p>
    </div>

    <div class="upload-area">
      <form @submit.prevent="submitForm" class="upload-form">
        <div 
          class="dropzone"
          :class="{ 'has-image': selectedFileUrl }"
          @dragover.prevent="dragover = true"
          @dragleave.prevent="dragover = false"
          @drop.prevent="handleDrop"

        >
          <div v-if="!selectedFileUrl" class="upload-instructions">
            <i class="pi pi-cloud-upload" style="font-size: 2rem; opacity: 0.3;"></i>
            <p>Drag & drop your image here or</p>
            <label for="image" class="browse-btn">Select Image <i class="pi pi-folder-plus"></i></label>
          </div>
          
          <div v-else class="image-preview-container">
            <img :src="selectedFileUrl" alt="Selected preview" class="preview-image">
            <div class="button-group">
              <button type="button" @click="clearSelection" class="secondary-btn">
                Choose Different Image
              </button>
              <button type="submit" class="primary-btn">
                Generate Soundscape
              </button>
            </div>
          </div>
          
          <input 
            id="image"
            type="file" 
            name="image"
            accept="image/*"
            @change="fileSelected"
            ref="imageInput"
            class="file-input"
          />
        </div>
      </form>
    </div>
  </main>
</template>


<script setup lang="ts">
import router from "@/router";
import { ref } from "vue";

const imageInput = ref<HTMLInputElement | null>(null);
const selectedFileUrl = ref("");
const dragover = ref(false);

const fileSelected = () => {
  if (!imageInput.value?.files) return;
  
  const file = imageInput.value.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      selectedFileUrl.value = reader.result;
    }
  };
  reader.readAsDataURL(file);
};

const handleDrop = (event: DragEvent) => {
  dragover.value = false;
  if (!event.dataTransfer?.files) return;
  
  imageInput.value!.files = event.dataTransfer.files;
  fileSelected();
};


const clearSelection = () => {
  selectedFileUrl.value = "";
  if (imageInput.value) {
    imageInput.value.value = "";
  }
};

const submitForm = (event: Event) => {
  if (!imageInput.value?.files?.length) return;
  
  const formData = new FormData();
  formData.append("image", imageInput.value.files[0]);


  console.log(formData);

  
  setTimeout(() => {
    router.push({
      name: "soundscape",
      params: { uuid: crypto.randomUUID() }
    });
  }, 1000);
};
</script>


<style scoped>

.upload-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header-section {
  text-align: center;
  margin-bottom: 2.5rem;
  margin-top: 13rem;
  
}

.title {
  
  font-size: 2rem;
  font-weight: 600;
  color:  rgba(0, 38, 53, 0.6);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  color: #4a5568;
  margin: 0;
}

.upload-area {
  margin-top: 1.5rem;
  opacity: 3d;
}

.upload-form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dropzone {
  margin-top: 1rem;
  width: 100%;
  min-height: 40px;
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  transition: all 0.3s ease;
  background-color: #f8fafc;
  background: rgba(0, 183, 255, 0.2);
  background: linear-gradient(90deg, rgba(42, 123, 155, .2) 0%, rgba(87, 199, 133, .2) 50%);
}

.dropzone.has-image {
  border-color: #a0aec0;
  background-color: white;
  padding: 1rem;
}

.dropzone:hover {
  border-color: #4fd1c5;
}

.upload-instructions {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.upload-icon {
  width: 64px;
  height: 64px;
  fill: #718096;
  margin-bottom: 1.5rem;
}

.upload-instructions p {
  color: #4a5568;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.browse-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(29, 215, 221, 0.5);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}


.browse-btn:hover {
  background-color: #38b2ac;
  transform: translateY(-1px);
}

.file-input {
  display: none;
}

.button-group {
  display: flex;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
}

.primary-btn {
  flex: 1;
  padding: 0.75rem;
  background-color: #4fd1c5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-btn:hover {
  background-color: #38b2ac;
  transform: translateY(-1px);
}

.secondary-btn {
  flex: 1;
  padding: 0.75rem;
  background-color: white;
  color: #4a5568;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-btn:hover {
  background-color: #f7fafc;
  border-color: #a0aec0;
}

</style>
