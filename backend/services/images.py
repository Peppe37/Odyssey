import os
import uuid
from PIL import Image
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = "uploads"
MAX_IMAGE_SIZE = (1024, 1024) # Resize to max 1024x1024
QUALITY = 70 # JPEG quality

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def save_upload_file(file: UploadFile) -> str:
    # Validate content type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        # Open image using Pillow
        image = Image.open(file.file)
        
        # Convert to RGB (in case of RGBA) to save as JPEG/WebP optimization
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
            
        # Resize if too large
        image.thumbnail(MAX_IMAGE_SIZE, Image.LANCZOS)
        
        # Save compressed
        # We enforce JPEG for consistency and Better Compression than PNG
        final_filename = f"{uuid.uuid4()}.jpg"
        final_path = os.path.join(UPLOAD_DIR, final_filename)
        
        image.save(final_path, "JPEG", optimize=True, quality=QUALITY)
        
        return final_filename
    except Exception as e:
        print(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail="Failed to process image")

def delete_image(filename: str):
    if not filename:
        return
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
