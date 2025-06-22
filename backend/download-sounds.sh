#!/bin/bash

# Download sounds cache if URL is provided
if [ -n "$SOUNDS_CACHE_URL" ]; then
    echo "Downloading sounds cache from $SOUNDS_CACHE_URL..."
    
    # Create sounds_cache directory if it doesn't exist
    mkdir -p sounds_cache
    
    # Download the zip file
    curl -L "$SOUNDS_CACHE_URL" -o sounds_cache.zip
    
    # Extract the zip file
    unzip -o sounds_cache.zip -d sounds_cache/
    
    # Remove the zip file
    rm sounds_cache.zip
    
    echo "Sounds cache downloaded and extracted successfully"
else
    echo "No SOUNDS_CACHE_URL provided, skipping sounds cache download"
fi