#!/bin/bash

# Download model if MODEL_URL is provided
if [ -n "$MODEL_URL" ]; then
    echo "Downloading model from $MODEL_URL..."
    
    # Create model directory if it doesn't exist
    mkdir -p blip
    
    # Download and extract the model
    curl -L "$MODEL_URL" -o model.tar.gz
    tar -xzf model.tar.gz -C blip/
    rm model.tar.gz
    
    echo "Model downloaded and extracted successfully"
else
    echo "No MODEL_URL provided, attempting to use Hugging Face model directly"
    
    # If no URL provided, we'll download from Hugging Face
    if [ ! -d "blip/model" ] || [ ! -d "blip/processor" ]; then
        echo "Downloading BLIP model from Hugging Face..."
        python -c "
from transformers import BlipProcessor, BlipForConditionalGeneration
import os

model_dir = 'blip/model'
processor_dir = 'blip/processor'

os.makedirs(model_dir, exist_ok=True)
os.makedirs(processor_dir, exist_ok=True)

print('Downloading processor...')
processor = BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-base')
processor.save_pretrained(processor_dir)

print('Downloading model...')
model = BlipForConditionalGeneration.from_pretrained('Salesforce/blip-image-captioning-base')
model.save_pretrained(model_dir)

print('Model download complete!')
"
    fi
fi