import os
import json
from typing import List, Optional
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
    ai_powered: bool = True
    notice: Optional[str] = None

# Conversion metrics: kg CO2e per unit (EPA/DEFRA standard emission baselines)
EMISSION_FACTORS = {
    "transport": 0.21,   # Average combustion passenger vehicle per km
    "electricity": 0.42, # Average power grid emissions per kWh
    "waste": 0.58        # Landfill waste lifecycle emissions per kg
}

def generate_heuristic_tips(data: CarbonData) -> List[str]:
    """Generates structured expert recommendations dynamically based on highest emission categories."""
    emissions = {
        "transport": data.transport_km * EMISSION_FACTORS["transport"],
        "electricity": data.electricity_kwh * EMISSION_FACTORS["electricity"],
        "waste": data.waste_kg * EMISSION_FACTORS["waste"]
    }
    sorted_categories = sorted(emissions.items(), key=lambda item: item[1], reverse=True)

    recommendations_map = {
        "transport": "Optimize transit efficiency: Transition solo commuting to public transit, carpooling, or electric mobility to cut transport emissions.",
        "electricity": "Target electrical grid draw: Deploy programmable smart thermostats, convert lighting to high-lumen LEDs, and shift heavy appliance use off-peak.",
        "waste": "Eliminate landfill methane generation: Institute kitchen source-separation composting and prioritize bulk purchasing with reusable containers."
    }

    return [recommendations_map[cat] for cat, _ in sorted_categories]

@app.post("/api/analyze-emissions", response_model=AnalysisResponse)
async def analyze_emissions(data: CarbonData):
    # Compute deterministic carbon footprint
    raw_carbon_score = round(
        (data.transport_km * EMISSION_FACTORS["transport"]) +
        (data.electricity_kwh * EMISSION_FACTORS["electricity"]) +
        (data.waste_kg * EMISSION_FACTORS["waste"]),
        2
    )

    # Hot-reload from .env if not explicitly set in environment
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        load_dotenv(override=True)
        api_key = os.getenv("GEMINI_API_KEY")

    # If no key or placeholder is present, gracefully provide expert heuristic interventions
    if not api_key or api_key.strip() in ("", "your_gemini_api_key_here"):
        return AnalysisResponse(
            carbon_score_kg=raw_carbon_score,
            recommendations=generate_heuristic_tips(data),
            ai_powered=False,
            notice="Operating in Demonstration Mode. Add GEMINI_API_KEY to backend/.env to activate live Google Gemini AI generative analysis."
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
            recommendations=parsed_tips,
            ai_powered=True
        )
    except Exception as exc:
        # Fallback to heuristic recommendations on LLM upstream failure so user is never blocked
        return AnalysisResponse(
            carbon_score_kg=raw_carbon_score,
            recommendations=generate_heuristic_tips(data),
            ai_powered=False,
            notice=f"LLM API temporarily unavailable ({str(exc)[:60]}...). Displaying deterministic baseline interventions."
        )
