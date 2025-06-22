from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import Image
import io
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration
from pydub import AudioSegment
import os

import json

# Configuration from environment variables
PORT = int(os.getenv('PORT', '8000'))
SOUNDS_CACHE_PATH = os.getenv('SOUNDS_CACHE_PATH', '/app/sounds_cache')  # Default to shared location
MODEL_PATH = os.getenv('MODEL_PATH', 'blip')
# AI service is internal, only allow localhost (backend calls it)
CORS_ORIGIN = os.getenv('CORS_ORIGIN', 'http://localhost:3000')

# Load the model and processor once at startup
processor = BlipProcessor.from_pretrained(f"{MODEL_PATH}/processor")
model = BlipForConditionalGeneration.from_pretrained(f"{MODEL_PATH}/model")

app = FastAPI()

# CORS (adjust for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Returns string without any pronouns, as a list of keywords separated by commas
def clean_text(text):
    # Remove all unwanted words and return string of main keywords 
    unwanted_words = ["a", "on", "the", "is", "it", "of", "and", "to", "in", "for", "with", "as", "that", "this", "by"]
    words = text.split()
    words = list(set(words))  # Remove duplicates
    
    # Filter out unwanted words (don't modify list while iterating)
    filtered_words = [word for word in words if word not in unwanted_words]

    return filtered_words


def combine_audio_files(input_files, output_file, mode="overlay", duration_ms=15000):
    if not input_files:
        raise ValueError("No audio files found for the given keywords")
    
    # Filter existing files
    existing_files = [f for f in input_files if os.path.exists(f)]
    if not existing_files:
        raise ValueError("None of the audio files exist")
    
    # Load audio
    audios = [AudioSegment.from_file(file) for file in existing_files]
    
    # Combine
    if mode == "overlay":
        combined = audios[0]
        for audio in audios[1:]:
            combined = combined.overlay(audio)
    else:  # concatenate
        combined = audios[0]
        for audio in audios[1:]:
            combined += audio
    
    # Trim to duration
    if duration_ms:
        combined = combined[:duration_ms]
    
    # Export as MP3
    combined.export(output_file, format="mp3")
    return output_file

AUDIO_MAPPING = {
    "aisle": [os.path.join(SOUNDS_CACHE_PATH, "aisle_0.mp3")],
    "altar": [os.path.join(SOUNDS_CACHE_PATH, "altar_0.mp3")],
    "bell": [os.path.join(SOUNDS_CACHE_PATH, "bell_0.mp3")],
    "birds": [os.path.join(SOUNDS_CACHE_PATH, "birds_0.mp3")],
    "bridge": [os.path.join(SOUNDS_CACHE_PATH, "bridge_0.mp3")],
    "building": [os.path.join(SOUNDS_CACHE_PATH, "building_0.mp3")],
    "castle": [os.path.join(SOUNDS_CACHE_PATH, "castle_0.mp3")],
    "cathedral": [os.path.join(SOUNDS_CACHE_PATH, "cathedral_0.mp3")],
    "ceremony": [os.path.join(SOUNDS_CACHE_PATH, "ceremony_0.mp3")],
    "church": [os.path.join(SOUNDS_CACHE_PATH, "church_0.mp3")],
    "clock": [os.path.join(SOUNDS_CACHE_PATH, "clock_0.mp3")],
    "dragon": [os.path.join(SOUNDS_CACHE_PATH, "dragon_0.mp3")],
    "echo": [os.path.join(SOUNDS_CACHE_PATH, "echo_0.mp3")],
    "fire": [os.path.join(SOUNDS_CACHE_PATH, "fire_0.mp3")],
    "forest": [os.path.join(SOUNDS_CACHE_PATH, "forest_manual.mp3")],
    "fountain": [os.path.join(SOUNDS_CACHE_PATH, "fountain_0.mp3")],
    "garden": [os.path.join(SOUNDS_CACHE_PATH, "garden_0.mp3")],
    "glass": [os.path.join(SOUNDS_CACHE_PATH, "glass_0.mp3")],
    "leaves": [os.path.join(SOUNDS_CACHE_PATH, "leaves_0.mp3")],
    "mosque": [os.path.join(SOUNDS_CACHE_PATH, "mosque_0.mp3")],
    "ocean": [os.path.join(SOUNDS_CACHE_PATH, "ocean_0.mp3")],
    "pagoda": [os.path.join(SOUNDS_CACHE_PATH, "pagoda_0.mp3")],
    "pond": [os.path.join(SOUNDS_CACHE_PATH, "pond_0.mp3")],
    "rain": [os.path.join(SOUNDS_CACHE_PATH, "rain_0.mp3")],
    "river": [os.path.join(SOUNDS_CACHE_PATH, "river_0.mp3")],
    "roof": [os.path.join(SOUNDS_CACHE_PATH, "roof_0.mp3")],
    "square": [os.path.join(SOUNDS_CACHE_PATH, "square_0.mp3")],
    "statue": [os.path.join(SOUNDS_CACHE_PATH, "statue_0.mp3")],
    "stone": [os.path.join(SOUNDS_CACHE_PATH, "stone_0.mp3")],
    "temple": [os.path.join(SOUNDS_CACHE_PATH, "temple_manual.mp3")],
    "tower": [os.path.join(SOUNDS_CACHE_PATH, "tower_0.mp3")],
    "tree": [os.path.join(SOUNDS_CACHE_PATH, "tree_0.mp3")],
    "water": [os.path.join(SOUNDS_CACHE_PATH, "water_0.mp3")],
    "wind": [os.path.join(SOUNDS_CACHE_PATH, "wind_0.mp3")],
    "wood": [os.path.join(SOUNDS_CACHE_PATH, "wood_0.mp3")],
}

@app.post("/generateMusic")
async def generateMusic(keywordString):
    try:

        keywords = keywordString.split(",")

        print("Keywords", keywords)

        audio_files = []
        for keyword in keywords:
            if keyword.lower() in AUDIO_MAPPING:
                audio_files.extend(AUDIO_MAPPING[keyword.lower()])
        audio_files = list(set(audio_files))  # Remove duplicates
        print("AUDIO FILES ==", audio_files)

        # Skip Audio for files that weren't found.
        
        # Combine audio files
        output_file = "output/" + "_".join(keywords) + ".mp3"
        combine_audio_files(audio_files, output_file, mode="overlay", duration_ms=15000)
        
        # Return the MP3
        return FileResponse(output_file, media_type="audio/mpeg", filename="soundscape.mp3")


        return data
    
    except Exception as e:
        return {"error": str(e)}

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    try:
        # Read and open image
        image_bytes = await image.read()
        raw_image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Prompt Engineering - Not working with BLIP for some reason
        # prompt = "Give a list of keywords describing this image, separated by commas:"

        # Inference
        inputs = processor(raw_image, return_tensors="pt")
        out = model.generate(**inputs)
        caption = processor.decode(out[0], skip_special_tokens=True)

        print(caption)

        # Clean the caption
        tags = clean_text(caption)

        data = {
            'caption': caption,
            'tags': ",".join(tags),
        }

        return data
    
    except Exception as e:
        return {"error": str(e)}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ai"}

# Run the app with: uvicorn fastAPI:app --reload --port $PORT
