<template>
  <div class="upload-container">
    <div 
      class="dropzone"
      @dragover.prevent="dragover = true"
      @dragleave.prevent="dragover = false"
      @drop.prevent="handleDrop"
      :class="{ 'active-dropzone': dragover }"
    >
      <div class="dropzone-content">
        <svg class="upload-icon" viewBox="0 0 24 24">
          <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
        </svg>
        <p>Drag & drop files here or</p>
        <label for="fileInput" class="browse-btn">Browse files</label>
        <input 
          id="fileInput"
          type="file" 
          @change="handleFileChange"
          class="file-input"
          multiple
        />
      </div>
    </div>

    <div v-if="selectedFiles.length > 0" class="file-list">
      <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
        <div class="file-info">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
        </div>
        <button @click="removeFile(index)" class="remove-btn">
          &times;
        </button>
      </div>
    </div>

    <button 
      @click="handleSubmit" 
      class="upload-btn"
      :disabled="isUploading || selectedFiles.length === 0"
    >
      <span v-if="!isUploading">Upload Files</span>
      <span v-else>Uploading... ({{ progress }}%)</span>
    </button>

    <div v-if="progress > 0 && progress < 100" class="progress-container">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>

    <div v-if="successMessage" class="message success">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="message error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedFiles: [],
      dragover: false,
      isUploading: false,
      progress: 0,
      successMessage: '',
      errorMessage: ''
    };
  },
  methods: {
    handleFileChange(event) {
      this.addFiles(event.target.files);
      event.target.value = ''; // Reset input to allow selecting same file again
    },
    handleDrop(event) {
      this.dragover = false;
      this.addFiles(event.dataTransfer.files);
    },
    addFiles(files) {
      const newFiles = Array.from(files).filter(file => {
        // Basic validation - check file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          this.errorMessage = `${file.name} is too large (max 5MB)`;
          return false;
        }
        return true;
      });
      
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
      this.errorMessage = '';
    },
    removeFile(index) {
      this.selectedFiles.splice(index, 1);
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    async handleSubmit() {
      if (this.selectedFiles.length === 0) return;
      
      this.isUploading = true;
      this.progress = 0;
      this.errorMessage = '';
      
      const formData = new FormData();
      this.selectedFiles.forEach(file => {
        formData.append('files[]', file);
      });

      try {
        // Using axios for upload with progress
        await this.$axios.post('/upload', formData, {
          onUploadProgress: progressEvent => {
            this.progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
          }
        });
        
        this.successMessage = `${this.selectedFiles.length} file(s) uploaded successfully!`;
        this.selectedFiles = [];
      } catch (error) {
        this.errorMessage = 'Upload failed: ' + error.message;
      } finally {
        this.isUploading = false;
      }
    }
  }
};
</script>

<style scoped>
.upload-container {
  max-width: 600px;
  margin: 2rem auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.dropzone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}

.active-dropzone {
  border-color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  width: 48px;
  height: 48px;
  fill: #666;
  margin-bottom: 1rem;
}

.browse-btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #4CAF50;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 1rem;
}

.browse-btn:hover {
  background: #45a049;
}

.file-input {
  display: none;
}

.file-list {
  margin: 1.5rem 0;
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
}

.file-item:last-child {
  border-bottom: none;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.file-size {
  font-size: 0.8rem;
  color: #666;
}

.remove-btn {
  background: none;
  border: none;
  color: #ff4444;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 0.5rem;
  line-height: 1;
}

.upload-btn {
  width: 100%;
  padding: 0.75rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.upload-btn:hover:not(:disabled) {
  background: #45a049;
}

.upload-btn:disabled {
  background: #a5d6a7;
  cursor: not-allowed;
}

.progress-container {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  margin-top: 1rem;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s ease;
}

.message {
  padding: 0.75rem;
  margin-top: 1rem;
  border-radius: 4px;
  text-align: center;
}

.message.success {
  background: #dff0d8;
  color: #3c763d;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
}
</style>