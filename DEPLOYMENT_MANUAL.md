# Manual Deployment Guide (Alternative to Blueprint)

Since the Blueprint approach is asking for payment, let's deploy manually:

## Step 1: Deploy Backend Service Manually

1. Go to Render dashboard and click "New +" → "Web Service"
2. **Connect Repository**: Choose your GitHub repo
3. **Configuration**:
   - Name: `architecture-soundscapes-backend`
   - Branch: `deployment` (or your main branch)
   - Root Directory: Leave empty (uses root)
   - Runtime: `Docker`
   - Dockerfile Path: `./Dockerfile`
   - Instance Type: `Free`

4. **Environment Variables** (add these):
   ```
   PORT=3000
   AI_SERVICE_URL=http://localhost:8000
   CORS_ORIGIN=*
   SOUNDS_CACHE_PATH=/app/sounds_cache
   MODEL_PATH=/app/ai/blip
   SOUNDS_CACHE_URL=[your sounds_cache.zip URL]
   ```

5. **Advanced Settings**:
   - Health Check Path: `/health`
   - Auto Deploy: Yes

6. Click "Create Web Service"

## Step 2: Deploy Frontend Manually

1. Click "New +" → "Static Site"
2. **Connect Repository**: Same GitHub repo
3. **Configuration**:
   - Name: `architecture-soundscapes-frontend`
   - Branch: `deployment`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

4. **Environment Variables**:
   ```
   VITE_API_URL=https://[your-backend-url].onrender.com
   ```
   (Replace with actual backend URL after step 1)

5. Click "Create Static Site"

## Step 3: Update CORS

After both services are deployed:
1. Go to backend service → Environment
2. Update `CORS_ORIGIN` to your frontend URL
3. It will auto-redeploy

## Step 4: Test

- Backend health: `https://[backend-url]/health`
- Frontend: `https://[frontend-url]`

This approach avoids the Blueprint payment requirement!