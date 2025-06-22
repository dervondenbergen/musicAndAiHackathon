#!/bin/bash

echo "Starting combined backend + AI service..."

# Create shared sounds cache directory
mkdir -p /app/sounds_cache

# Download sounds cache once (shared by both services)
if [ -n "$SOUNDS_CACHE_URL" ]; then
    echo "Downloading shared sounds cache from $SOUNDS_CACHE_URL..."
    cd /app
    curl -L "$SOUNDS_CACHE_URL" -o sounds_cache.zip
    unzip -o sounds_cache.zip -d /app/
    rm sounds_cache.zip
    echo "Shared sounds cache downloaded and extracted successfully"
else
    echo "No SOUNDS_CACHE_URL provided, skipping sounds cache download"
fi

# Download model for AI service  
cd /app/ai
./download-model.sh

# Start AI service in background on port 8000
echo "Starting AI service on port 8000..."
cd /app/ai
# Use environment variables from render.yaml, with fallback defaults
export SOUNDS_CACHE_PATH="${SOUNDS_CACHE_PATH:-/app/sounds_cache}"
export MODEL_PATH="${MODEL_PATH:-/app/ai/blip}"
/app/ai/.venv/bin/uvicorn fastAPI:app --host 0.0.0.0 --port 8000 &

# Wait a moment for AI service to start
sleep 5

# Start backend service on port 3000 (main port)
echo "Starting backend service on port 3000..."
cd /app/backend
# Use environment variables from render.yaml, with fallback defaults
export AI_SERVICE_URL="${AI_SERVICE_URL:-http://localhost:8000}"
export SOUNDS_CACHE_PATH="${SOUNDS_CACHE_PATH:-/app/sounds_cache}"
export PORT="${PORT:-3000}"
node app.js