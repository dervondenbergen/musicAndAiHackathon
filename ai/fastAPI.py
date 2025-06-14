from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration
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

    return ",".join(filtered_words)


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
            'tags': tags,
        }

        return data
    
    except Exception as e:
        return {"error": str(e)}


# Run the app with: uvicorn fastAPI:app --reload
