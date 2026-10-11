"""Core domain logic and calculation engine for EcoTrack AI.

Provides deterministic carbon accounting algorithms based on EPA/DEFRA emission
factors, sector breakdown analytics, verified sustainability recommendations,
and actionable micro-habit challenges.
"""

from __future__ import annotations

import math
from typing import Any, Callable, Dict, List, Optional

# EPA and UK DEFRA Standard GHG Conversion Baselines (kg CO2e per unit)
EMISSION_FACTORS: dict[str, float] = {
    "transport": 0.21,   # Average combustion passenger vehicle per km
    "electricity": 0.42, # Average power grid emissions per kWh
    "waste": 0.58,       # Municipal solid waste landfill lifecycle per kg
}

EMISSION_FACTOR_SOURCES: dict[str, str] = {
    "transport": "EPA / DEFRA passenger combustion vehicle average (0.21 kg CO2e / km)",
    "electricity": "EPA / DEFRA national power grid baseline (0.42 kg CO2e / kWh)",
    "waste": "EPA / DEFRA municipal landfill lifecycle emissions (0.58 kg CO2e / kg)",
}

# Real-world sequestration and activity equivalency factors
EQUIVALENCY_FACTORS = {
    "tree_absorption_kg_year": 22.0,  # 1 mature tree absorbs ~22 kg CO2e/year
    "car_mile_kg": 0.404,             # 1 passenger car mile emits ~0.404 kg CO2e
    "phone_charge_kg": 0.008,         # 1 full smartphone battery charge emits ~0.008 kg CO2e
}

# Verified daily decarbonization challenges from EcoTrack
ECO_CHALLENGES: list[dict[str, Any]] = [
    {
        "id": 1,
        "title": "Carry a reusable water bottle & mug all day",
        "category": "waste",
        "estimated_saving_kg_co2": 0.2,
        "impact_tier": "Quick Win",
        "description": "Avoid single-use plastics and packaging waste during transit and work hours.",
    },
    {
        "id": 2,
        "title": "Opt for cycling, walking, or public transit for 1 commute",
        "category": "transport",
        "estimated_saving_kg_co2": 2.4,
        "impact_tier": "High Impact",
        "description": "Replace a solo combustion vehicle trip with non-motorized or shared transit.",
    },
    {
        "id": 3,
        "title": "Unplug idle electronics / power strips overnight",
        "category": "electricity",
        "estimated_saving_kg_co2": 0.5,
        "impact_tier": "Quick Win",
        "description": "Eliminate phantom electric draw from standby power supplies and chargers.",
    },
    {
        "id": 4,
        "title": "Enjoy a 100% plant-based lunch or dinner",
        "category": "diet",
        "estimated_saving_kg_co2": 1.8,
        "impact_tier": "High Impact",
        "description": "Select plant-forward meals to lower agricultural supply-chain carbon intensity.",
    },
    {
        "id": 5,
        "title": "Air-dry laundry or wash in cold water",
        "category": "electricity",
        "estimated_saving_kg_co2": 1.1,
        "impact_tier": "Medium Impact",
        "description": "Skip heated wash cycles or high-draw electric tumble dry cycles.",
    },
]

# Verified deterministic recommendation templates by dominant sector
HEURISTIC_RECOMMENDATIONS: dict[str, str] = {
    "transport": "Optimize transit efficiency: Transition solo commuting to public transit, carpooling, or electric mobility to cut transport emissions.",
    "electricity": "Target electrical grid draw: Deploy programmable smart thermostats, convert lighting to high-lumen LEDs, and shift heavy appliance use off-peak.",
    "waste": "Eliminate landfill methane generation: Institute kitchen source-separation composting and prioritize bulk purchasing with reusable containers.",
}


def validate_non_negative_number(value: Any, field_name: str) -> float:
    """Validate that an input value can be converted to a non-negative float."""
    if value is None:
        raise ValueError(f"Field '{field_name}' is required and cannot be null.")
    try:
        val = float(value)
    except (ValueError, TypeError) as err:
        raise ValueError(f"Field '{field_name}' must be a valid number, got: {value!r}") from err

    if math.isnan(val) or math.isinf(val):
        raise ValueError(f"Field '{field_name}' must be a finite number.")

    if val < 0:
        raise ValueError(f"Field '{field_name}' must be non-negative (>= 0), got: {val}")

    return val


def compute_footprint(
    transport_km: float,
    electricity_kwh: float,
    waste_kg: float,
    period: str = "daily",
) -> dict[str, Any]:
    """Calculate deterministic emissions, category breakdown, equivalencies, and assumptions."""
    period_clean = (period or "daily").strip().lower()
    if period_clean not in ("daily", "annual"):
        raise ValueError("Parameter 'period' must be either 'daily' or 'annual'.")

    # Raw daily calculations
    t_daily = transport_km * EMISSION_FACTORS["transport"]
    e_daily = electricity_kwh * EMISSION_FACTORS["electricity"]
    w_daily = waste_kg * EMISSION_FACTORS["waste"]
    daily_total = round(t_daily + e_daily + w_daily, 2)

    scale_factor = 365.0 if period_clean == "annual" else 1.0
    active_total = round(daily_total * scale_factor, 2)

    # Equivalencies based on the calculated footprint
    annual_co2_kg = daily_total * 365.0
    trees_needed = max(1, round(annual_co2_kg / EQUIVALENCY_FACTORS["tree_absorption_kg_year"]))
    car_miles = round(active_total / EQUIVALENCY_FACTORS["car_mile_kg"], 1)
    phone_charges = round(active_total / EQUIVALENCY_FACTORS["phone_charge_kg"])

    return {
        "carbon_score_kg": active_total,
        "unit": "kg CO2e",
        "period": period_clean,
        "annual_projection_metric_tons": round(annual_co2_kg / 1000.0, 3),
        "breakdown": {
            "transport": {
                "emissions_kg": round(t_daily * scale_factor, 2),
                "activity_input": transport_km,
                "input_unit": "km",
                "emission_factor": EMISSION_FACTORS["transport"],
                "factor_unit": "kg CO2e / km",
                "source": EMISSION_FACTOR_SOURCES["transport"],
            },
            "electricity": {
                "emissions_kg": round(e_daily * scale_factor, 2),
                "activity_input": electricity_kwh,
                "input_unit": "kWh",
                "emission_factor": EMISSION_FACTORS["electricity"],
                "factor_unit": "kg CO2e / kWh",
                "source": EMISSION_FACTOR_SOURCES["electricity"],
            },
            "waste": {
                "emissions_kg": round(w_daily * scale_factor, 2),
                "activity_input": waste_kg,
                "input_unit": "kg",
                "emission_factor": EMISSION_FACTORS["waste"],
                "factor_unit": "kg CO2e / kg",
                "source": EMISSION_FACTOR_SOURCES["waste"],
            },
        },
        "equivalencies": {
            "trees_needed_annual_offset": trees_needed,
            "car_miles_equivalent": car_miles,
            "phone_charges_equivalent": phone_charges,
        },
        "assumptions": [
            "Baseline emission calculations represent direct Scope 1 and Scope 2 operational approximations.",
            "Emission factors derived from EPA and UK DEFRA standard GHG conversion guidelines.",
            "Tree sequestration equivalence assumes an average mature tree absorbing ~22 kg CO2e annually.",
            "Vehicle equivalence is based on an average combustion passenger vehicle emitting ~0.404 kg CO2e per mile.",
        ],
    }


def compute_breakdown(
    transport_km: float,
    electricity_kwh: float,
    waste_kg: float,
) -> dict[str, Any]:
    """Summarize emissions by category, determine relative percentages, and identify dominant contributors."""
    t_val = transport_km * EMISSION_FACTORS["transport"]
    e_val = electricity_kwh * EMISSION_FACTORS["electricity"]
    w_val = waste_kg * EMISSION_FACTORS["waste"]
    total = round(t_val + e_val + w_val, 2)

    safe_total = total if total > 0 else 0.0001

    items = [
        {
            "sector": "transport",
            "display_name": "Transport Mobility",
            "emissions_kg": round(t_val, 2),
            "share_percent": round((t_val / safe_total) * 100, 1),
            "input_amount": transport_km,
            "input_unit": "km",
            "factor": EMISSION_FACTORS["transport"],
        },
        {
            "sector": "electricity",
            "display_name": "Electricity & Power Grid",
            "emissions_kg": round(e_val, 2),
            "share_percent": round((e_val / safe_total) * 100, 1),
            "input_amount": electricity_kwh,
            "input_unit": "kWh",
            "factor": EMISSION_FACTORS["electricity"],
        },
        {
            "sector": "waste",
            "display_name": "Municipal Solid Waste",
            "emissions_kg": round(w_val, 2),
            "share_percent": round((w_val / safe_total) * 100, 1),
            "input_amount": waste_kg,
            "input_unit": "kg",
            "factor": EMISSION_FACTORS["waste"],
        },
    ]

    # Rank by highest emissions first
    items.sort(key=lambda x: x["emissions_kg"], reverse=True)
    for rank, item in enumerate(items, start=1):
        item["rank"] = rank

    dominant = items[0]
    reduction_advice = (
        f"'{dominant['display_name']}' is the dominant emission contributor ({dominant['share_percent']}% "
        f"of total emissions at {dominant['emissions_kg']} kg CO2e). Prioritizing interventions in this sector "
        f"will produce the greatest decarbonization impact."
    )

    return {
        "total_emissions_kg": total,
        "unit": "kg CO2e / day",
        "dominant_sector": dominant["sector"],
        "dominant_sector_name": dominant["display_name"],
        "dominant_sector_share_percent": dominant["share_percent"],
        "categories_ranked": items,
        "strategic_focus": reduction_advice,
    }


def generate_deterministic_recommendations(
    transport_km: float,
    electricity_kwh: float,
    waste_kg: float,
) -> list[str]:
    """Generate structured expert recommendations prioritized by highest emission category."""
    emissions = {
        "transport": transport_km * EMISSION_FACTORS["transport"],
        "electricity": electricity_kwh * EMISSION_FACTORS["electricity"],
        "waste": waste_kg * EMISSION_FACTORS["waste"],
    }
    sorted_categories = sorted(emissions.items(), key=lambda item: item[1], reverse=True)
    return [HEURISTIC_RECOMMENDATIONS[cat] for cat, _ in sorted_categories]


def compute_recommendations(
    transport_km: float,
    electricity_kwh: float,
    waste_kg: float,
    sampling_fn: Optional[Callable[[str], str]] = None,
) -> dict[str, Any]:
    """Generate sustainability recommendations, leveraging host sampling if available with verified heuristic fallback."""
    footprint = compute_footprint(transport_km, electricity_kwh, waste_kg, period="daily")
    score_kg = footprint["carbon_score_kg"]

    # Attempt host LLM sampling if a sampling callable is supplied
    if sampling_fn:
        prompt = (
            f"You are an environmental engineering AI auditor. Analyze these daily resource metrics:\n"
            f"- Transport: {transport_km} km\n"
            f"- Electricity: {electricity_kwh} kWh\n"
            f"- Municipal Waste: {waste_kg} kg\n"
            f"- Baseline Footprint: {score_kg} kg CO2e\n\n"
            f"Provide exactly 3 high-impact, highly actionable, concise sustainability recommendations to minimize this footprint.\n"
            f"Respond ONLY with a valid JSON array of 3 strings. Example: [\"Tip 1\", \"Tip 2\", \"Tip 3\"]"
        )
        try:
            raw_response = sampling_fn(prompt)
            import json
            parsed = json.loads(raw_response.strip())
            if isinstance(parsed, list) and len(parsed) == 3 and all(isinstance(x, str) for x in parsed):
                return {
                    "carbon_score_kg": score_kg,
                    "recommendations": parsed,
                    "ai_powered": True,
                    "model_source": "Anna Host Reverse-RPC LLM Sampling",
                    "notice": "Generated via host-negotiated LLM sampling.",
                }
        except Exception as exc:  # noqa: BLE001
            # Graceful fallback to verified deterministic logic
            pass

    # Deterministic heuristic fallback
    tips = generate_deterministic_recommendations(transport_km, electricity_kwh, waste_kg)
    return {
        "carbon_score_kg": score_kg,
        "recommendations": tips,
        "ai_powered": False,
        "model_source": "Deterministic Environmental Baseline Engine",
        "notice": "Operating on verified deterministic heuristic rules prioritized by top emission contributors.",
    }


def list_challenges(category: Optional[str] = None) -> dict[str, Any]:
    """List verified daily decarbonization challenges, optionally filtered by category."""
    cat_clean = (category or "all").strip().lower()

    valid_categories = {"all", "transport", "electricity", "waste", "diet"}
    if cat_clean not in valid_categories:
        raise ValueError(
            f"Invalid category '{category}'. Supported categories: {', '.join(sorted(valid_categories))}"
        )

    if cat_clean == "all":
        selected = ECO_CHALLENGES
    else:
        selected = [c for c in ECO_CHALLENGES if c["category"] == cat_clean]

    total_potential_savings = round(sum(c["estimated_saving_kg_co2"] for c in selected), 2)

    return {
        "filter_category": cat_clean,
        "total_challenges": len(selected),
        "total_potential_daily_saving_kg_co2": total_potential_savings,
        "unit": "kg CO2e / day",
        "challenges": selected,
    }
