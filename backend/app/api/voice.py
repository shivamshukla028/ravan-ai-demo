"""
Ravan AI — Voice API Router
Handles: Speech-to-Text (STT) and Text-to-Speech (TTS) using OpenAI
"""
import os
import tempfile
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from openai import AsyncOpenAI
import aiofiles

from .. import schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if OPENAI_API_KEY:
    openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
else:
    openai_client = None

@router.post("/transcribe")
async def transcribe_audio(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Convert audio file to text using Whisper."""
    user = get_current_user(request, db)
    
    if not openai_client:
        raise HTTPException(status_code=501, detail="OpenAI API key not configured")
        
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
        
    is_dummy_key = "your-" in (OPENAI_API_KEY or "").lower()
    if is_dummy_key:
        # Mock transcription when using placeholder keys
        return {"text": "This is a simulated transcription. Please set a valid OPENAI_API_KEY to enable actual speech-to-text processing."}
        
    # Save uploaded file to temp file for processing
    fd, temp_path = tempfile.mkstemp(suffix=".webm")
    os.close(fd)
    
    try:
        async with aiofiles.open(temp_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
            
        with open(temp_path, "rb") as audio_file:
            transcription = await openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
            
        return {"text": transcription}
    except Exception as e:
        print(f"[Voice] STT Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


class SynthesizeRequest(schemas.BaseModel):
    text: str
    voice: str = "alloy"  # alloy, echo, fable, onyx, nova, shimmer

@router.post("/synthesize")
async def synthesize_audio(
    body: SynthesizeRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Convert text to speech using OpenAI TTS and stream it back."""
    user = get_current_user(request, db)
    
    if not openai_client:
        raise HTTPException(status_code=501, detail="OpenAI API key not configured")
        
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    is_dummy_key = "your-" in (OPENAI_API_KEY or "").lower()
    if is_dummy_key:
        raise HTTPException(status_code=501, detail="Text-to-Speech simulation requires a real OPENAI_API_KEY. Please update your backend .env file.")
        
    try:
        response = await openai_client.audio.speech.create(
            model="tts-1",
            voice=body.voice,
            input=body.text,
            response_format="mp3"
        )
        
        async def stream_audio():
            async for chunk in response.iter_bytes(chunk_size=4096):
                yield chunk
                
        return StreamingResponse(
            stream_audio(),
            media_type="audio/mpeg"
        )
    except Exception as e:
        print(f"[Voice] TTS Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
