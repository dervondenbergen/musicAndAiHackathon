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

# Load the model and processor once at startup
processor = BlipProcessor.from_pretrained("blip/processor")
model = BlipForConditionalGeneration.from_pretrained("blip/model")

app = FastAPI()

# CORS (adjust for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    "aisle": ["../backend/sounds_cache/aisle_0.mp3"],
    "altar": ["../backend/sounds_cache/altar_0.mp3"],
    "bell": ["../backend/sounds_cache/bell_0.mp3"],
    "birds": ["../backend/sounds_cache/birds_0.mp3"],
    "bridge": ["../backend/sounds_cache/bridge_0.mp3"],
    "building": ["../backend/sounds_cache/building_0.mp3"],
    "castle": ["../backend/sounds_cache/castle_0.mp3"],
    "cathedral": ["../backend/sounds_cache/cathedral_0.mp3"],
    "ceremony": ["../backend/sounds_cache/ceremony_0.mp3"],
    "church": ["../backend/sounds_cache/church_0.mp3"],
    "clock": ["../backend/sounds_cache/clock_0.mp3"],
    "dragon": ["../backend/sounds_cache/dragon_0.mp3"],
    "echo": ["../backend/sounds_cache/echo_0.mp3"],
    "fire": ["../backend/sounds_cache/fire_0.mp3"],
    "forest": ["../backend/sounds_cache/forest_0.mp3"],
    "fountain": ["../backend/sounds_cache/fountain_0.mp3"],
    "garden": ["../backend/sounds_cache/garden_0.mp3"],
    "glass": ["../backend/sounds_cache/glass_0.mp3"],
    "leaves": ["../backend/sounds_cache/leaves_0.mp3"],
    "mosque": ["../backend/sounds_cache/mosque_0.mp3"],
    "ocean": ["../backend/sounds_cache/ocean_0.mp3"],
    "pagoda": ["../backend/sounds_cache/pagoda_0.mp3"],
    "pond": ["../backend/sounds_cache/pond_0.mp3"],
    "rain": ["../backend/sounds_cache/rain_0.mp3"],
    "river": ["../backend/sounds_cache/river_0.mp3"],
    "roof": ["../backend/sounds_cache/roof_0.mp3"],
    "square": ["../backend/sounds_cache/square_0.mp3"],
    "statue": ["../backend/sounds_cache/statue_0.mp3"],
    "stone": ["../backend/sounds_cache/stone_0.mp3"],
    "temple": ["../backend/sounds_cache/temple_0.mp3"],
    "tower": ["../backend/sounds_cache/tower_0.mp3"],
    "tree": ["../backend/sounds_cache/tree_0.mp3"],
    "water": ["../backend/sounds_cache/water_0.mp3"],
    "wind": ["../backend/sounds_cache/wind_0.mp3"],
    "wood": ["../backend/sounds_cache/wood_0.mp3"],
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
        output_file = "combined_soundscape.mp3"
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


# Run the app with: uvicorn fastAPI:app --reload
