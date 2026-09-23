import os
import json
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Support modern google-genai SDK with graceful fallback to google-generativeai
try:
    from google import genai
    from google.genai import types
    USE_NEW_SDK = True
except ImportError:
    import google.generativeai as legacy_genai
    USE_NEW_SDK = False

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY environment variable is not configured. Set it in .env before running inferences.")

app = FastAPI(
    title="EcoTrack-AI Backend Engine",
    description="High-performance async emissions analytics powered by FastAPI and Google Gemini AI",
    version="2.0.0"
)

# CORS configuration for decoupled frontend-backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "EcoTrack-AI Backend Engine",
        "version": "2.0.0",
        "sdk": "google-genai" if USE_NEW_SDK else "google-generativeai"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

class CarbonData(BaseModel):
    transport_km: float = Field(..., ge=0.0, description="Daily distance traveled in kilometers")
    electricity_kwh: float = Field(..., ge=0.0, description="Daily electricity consumed in kilowatt-hours")
    waste_kg: float = Field(..., ge=0.0, description="Daily solid waste produced in kilograms")

class AnalysisResponse(BaseModel):
    carbon_score_kg: float
    recommendations: List[str]

# Conversion metrics: kg CO2e per unit (EPA/DEFRA standard emission baselines)
EMISSION_FACTORS = {
    "transport": 0.21,   # Average combustion passenger vehicle per km
    "electricity": 0.42, # Average power grid emissions per kWh
    "waste": 0.58        # Landfill waste lifecycle emissions per kg
}

@app.post("/api/analyze-emissions", response_model=AnalysisResponse)
async def analyze_emissions(data: CarbonData):
    raw_carbon_score = round(
        (data.transport_km * EMISSION_FACTORS["transport"]) +
        (data.electricity_kwh * EMISSION_FACTORS["electricity"]) +
        (data.waste_kg * EMISSION_FACTORS["waste"]),
        2
    )

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured on the server. Please add it to your .env file."
        )

    prompt = f"""
    You are an environmental engineering AI auditor. Analyze the following verified daily resource consumption metrics:
    - Transport Distance: {data.transport_km} km
    - Electricity Consumption: {data.electricity_kwh} kWh
    - Municipal Waste: {data.waste_kg} kg
    - Calculated Baseline Footprint: {raw_carbon_score} kg CO2e

    Provide exactly 3 high-impact, highly actionable, concise sustainability recommendations to minimize this footprint.
    Respond ONLY with a JSON array containing exactly 3 strings.
    Example: ["Tip 1", "Tip 2", "Tip 3"]
    """

    try:
        if USE_NEW_SDK:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )
            raw_text = response.text
        else:
            legacy_genai.configure(api_key=api_key)
            model = legacy_genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                generation_config={
                    "temperature": 0.2,
                    "response_mime_type": "application/json"
                }
            )
            response = await model.generate_content_async(prompt)
            raw_text = response.text

        parsed_tips = json.loads(raw_text)

        if not isinstance(parsed_tips, list) or len(parsed_tips) != 3:
            raise ValueError("Incompatible AI response structure received from upstream model.")

        return AnalysisResponse(
            carbon_score_kg=raw_carbon_score,
            recommendations=parsed_tips
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Downstream LLM inference failure: {str(exc)}"
        )
