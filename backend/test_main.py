import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app, EMISSION_FACTORS

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_analyze_emissions_validation_error_negative_values():
    # Negative values should trigger 422 Unprocessable Entity via Pydantic
    payload = {
        "transport_km": -10.0,
        "electricity_kwh": 5.0,
        "waste_kg": 2.0
    }
    response = client.post("/api/analyze-emissions", json=payload)
    assert response.status_code == 422

def test_analyze_emissions_validation_error_missing_fields():
    # Missing fields should trigger 422 Unprocessable Entity
    payload = {
        "transport_km": 10.0
    }
    response = client.post("/api/analyze-emissions", json=payload)
    assert response.status_code == 422

def test_analyze_emissions_calculation_and_mocked_gemini(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-mock-key")
    
    # Expected score: 10 * 0.21 + 20 * 0.42 + 5 * 0.58 = 2.1 + 8.4 + 2.9 = 13.4
    expected_score = round(
        (10.0 * EMISSION_FACTORS["transport"]) +
        (20.0 * EMISSION_FACTORS["electricity"]) +
        (5.0 * EMISSION_FACTORS["waste"]),
        2
    )

    mock_tips = [
        "Optimize daily transit with carpooling or EV alternatives.",
        "Transition to smart LED fixtures and programmable thermostats.",
        "Institute rigorous organic composting to eliminate landfill waste."
    ]

    mock_client = MagicMock()
    mock_model_response = MagicMock()
    mock_model_response.text = '["Optimize daily transit with carpooling or EV alternatives.", "Transition to smart LED fixtures and programmable thermostats.", "Institute rigorous organic composting to eliminate landfill waste."]'
    mock_client.models.generate_content.return_value = mock_model_response

    with patch("google.genai.Client", return_value=mock_client):
        payload = {
            "transport_km": 10.0,
            "electricity_kwh": 20.0,
            "waste_kg": 5.0
        }
        response = client.post("/api/analyze-emissions", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["carbon_score_kg"] == expected_score
        assert len(data["recommendations"]) == 3
        assert data["recommendations"] == mock_tips
