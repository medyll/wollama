import argparse
import uvicorn
from fastapi import FastAPI, Body
from fastapi.responses import Response
import json
import sys
import numpy as np
import io
from scipy.io.wavfile import write

app = FastAPI()

def generate_sine_wave(frequency=440, duration=1.0, sample_rate=44100):
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    tone = np.sin(frequency * t * 2 * np.pi)
    # Normalize to 16-bit PCM
    audio = (tone * 32767).astype(np.int16)
    return audio, sample_rate

@app.post("/synthesize")
async def synthesize(
    text: str = Body(...),
    emotion_tags: list = Body(default=[]),
    parameters: dict = Body(default={})
):
    print(f"Received synthesis request: {text} | Tags: {emotion_tags} | Params: {parameters}")
    
    # Generate a simple beep for testing purposes
    # In a real scenario, this would call the TTS model inference
    audio_data, sample_rate = generate_sine_wave(frequency=440, duration=1.0)
    
    byte_io = io.BytesIO()
    write(byte_io, sample_rate, audio_data)
    wav_bytes = byte_io.getvalue()
    
    return Response(content=wav_bytes, media_type="audio/wav")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    
    print(f"Starting Chatterbox Turbo on port {args.port}")
    uvicorn.run(app, host="127.0.0.1", port=args.port)
