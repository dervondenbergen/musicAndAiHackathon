# Deployment Guide for Architecture Soundscapes

This guide explains how to deploy the Architecture Soundscapes application to Render.com.

## Prerequisites

1. Create a free account on [Render.com](https://render.com)
2. Fork or push this repository to your GitHub account
3. Prepare your sounds cache and model files

## Preparing External Files

### Sounds Cache
1. Create a ZIP file of the `backend/sounds_cache` directory:
   ```bash
   cd backend
   zip -r sounds_cache.zip sounds_cache/
   ```

2. Upload the ZIP file to one of these services:
   - GitHub Releases (attach to a release in your repository)
   - Google Drive (create a public sharing link)
   - Dropbox (create a direct download link)
   - Any other file hosting service with direct download links

3. Copy the direct download URL for later use

### Model Files (Optional)
The AI service will automatically download the BLIP model from Hugging Face on first startup. If you want to use a pre-downloaded model:

1. Create a TAR.GZ file of the model:
   ```bash
   cd ai
   tar -czf blip-model.tar.gz blip/
   ```

2. Upload and get a direct download URL (same as sounds cache)

## Deployment Steps

### 1. Connect GitHub Repository
1. Log in to Render.com
2. Click "New +" and select "Blueprint"
3. Connect your GitHub account if not already connected
4. Select your repository

### 2. Configure Environment Variables
After deployment starts, go to the backend service's dashboard and add:

#### Combined Backend + AI Service
- `SOUNDS_CACHE_URL`: Direct download URL for your sounds_cache.zip file
- `MODEL_URL`: (Optional) Direct download URL for your model file (if using pre-downloaded model)

### 3. Manual Environment Variable Updates
After all services are deployed, update the CORS environment variables:

1. Go to each service's Environment tab
2. Update `CORS_ORIGIN` to the actual frontend URL (e.g., `https://architecture-soundscapes-frontend.onrender.com`)
3. Update frontend's `VITE_API_URL` to the backend URL

### 4. Verify Deployment
1. Check health endpoint:
   - Combined service: `https://your-backend-url.onrender.com/health`

2. Test the application at your frontend URL

Note: The combined service runs both the backend (port 3000) and AI service (port 8000 internally) in the same container.

## Important Notes

### Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- No persistent storage (uploaded images are temporary)
- 750 hours/month total across all services

### Troubleshooting

#### Services Not Starting
- Check logs in Render dashboard
- Verify environment variables are set correctly
- Ensure health checks are passing

#### CORS Errors
- Verify CORS_ORIGIN environment variables match your frontend URL
- Check that all services have the correct URLs configured

#### Model Download Issues
- The AI service needs ~2GB of RAM to download and load the BLIP model
- First startup may take 5-10 minutes
- Check AI service logs for download progress

## Upgrading to Paid Tier

For production use, consider upgrading to remove limitations:
- Persistent disk storage for user uploads
- No spin-down (always on)
- More RAM and CPU
- Custom domains

## Alternative Deployment Options

If Render.com doesn't meet your needs:
- **Railway.app**: Similar to Render with $5/month hobby plan
- **Fly.io**: More complex but offers persistent volumes
- **Docker Compose**: Self-host on VPS or home server
- **Kubernetes**: For large-scale deployments