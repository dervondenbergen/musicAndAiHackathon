# Deployment Checklist for Render.com

## Prerequisites
- [ ] Create accounts on Render.com
- [ ] Prepare external storage for sounds_cache.zip
- [ ] Prepare model hosting solution (optional - auto-downloads from Hugging Face)

## Implementation Tasks

### 1. Repository Cleanup
- [x] Update .gitignore to exclude sounds_cache, scapes, and model files
- [ ] Remove any accidentally committed sound/model files

### 2. Backend Service Updates
- [x] Add environment variable support in app.js
- [x] Create download-sounds.sh script
- [x] Update Dockerfile for backend
- [x] Add health check endpoint

### 3. AI Service Updates  
- [x] Add environment variable support in fastAPI.py
- [x] Fix relative paths to use absolute paths
- [x] Create download-model.sh script
- [x] Update Dockerfile for AI service
- [x] Add health check endpoint

### 4. Frontend Updates
- [x] Create .env.production file
- [x] Update API calls to use environment variables
- [ ] Update vite.config.ts if needed

### 5. Deployment Configuration
- [x] Create render.yaml file
- [x] Configure all environment variables
- [x] Set up build and start commands
- [x] Create deployment documentation

### 6. Free Tier Compatibility
- [x] Combine backend and AI into single service (Render free tier limitation)
- [x] Create combined Dockerfile and startup script
- [x] Update render.yaml to use only one web service

### 7. Testing
- [ ] Test local deployment with env variables
- [ ] Deploy to Render.com
- [ ] Verify all services are running

## Environment Variables Needed

### Backend
- `PORT` - Server port (default: 3000)
- `AI_SERVICE_URL` - AI service URL
- `CORS_ORIGIN` - Frontend URL for CORS
- `SOUNDS_CACHE_URL` - URL to download sounds_cache.zip

### AI Service
- `PORT` - Server port (default: 8000)
- `MODEL_URL` - Huggingface model download URL
- `SOUNDS_CACHE_PATH` - Path to sounds cache directory

### Frontend
- `VITE_API_URL` - Backend API URL