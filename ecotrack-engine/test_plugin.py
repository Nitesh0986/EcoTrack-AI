"""Automated test suite for EcoTrack Executa Plugin.

Tests domain calculations, schema validation, tool invocations, error handling,
protocol dispatching, and regression integrity.
"""

from __future__ import annotations

import json
import pytest
from ecotrack_core import (
    EMISSION_FACTORS,
    compute_breakdown,
    compute_footprint,
    compute_recommendations,
    generate_deterministic_recommendations,
    list_challenges,
    validate_non_negative_number,
)
import ecotrack_engine_plugin as plugin


# ---------------------------------------------------------------------------
# Unit Tests: Core Domain Logic
# ---------------------------------------------------------------------------

def test_validate_non_negative_number_valid():
    assert validate_non_negative_number(10, "test") == 10.0
    assert validate_non_negative_number(0, "test") == 0.0
    assert validate_non_negative_number("15.5", "test") == 15.5


def test_validate_non_negative_number_invalid():
    with pytest.raises(ValueError, match="required and cannot be null"):
        validate_non_negative_number(None, "missing")

    with pytest.raises(ValueError, match="must be a valid number"):
        validate_non_negative_number("abc", "invalid")

    with pytest.raises(ValueError, match="must be non-negative"):
        validate_non_negative_number(-5.0, "negative")

    with pytest.raises(ValueError, match="must be a finite number"):
        validate_non_negative_number(float("nan"), "nan_val")


def test_compute_footprint_daily():
    res = compute_footprint(transport_km=10.0, electricity_kwh=20.0, waste_kg=5.0, period="daily")
    expected = round((10.0 * 0.21) + (20.0 * 0.42) + (5.0 * 0.58), 2)
    assert res["carbon_score_kg"] == expected
    assert res["unit"] == "kg CO2e"
    assert res["period"] == "daily"
    assert res["breakdown"]["transport"]["emissions_kg"] == 2.1
    assert res["breakdown"]["electricity"]["emissions_kg"] == 8.4
    assert res["breakdown"]["waste"]["emissions_kg"] == 2.9
    assert res["equivalencies"]["trees_needed_annual_offset"] > 0
    assert len(res["assumptions"]) >= 3


def test_compute_footprint_annual():
    daily_res = compute_footprint(transport_km=10.0, electricity_kwh=20.0, waste_kg=5.0, period="daily")
    annual_res = compute_footprint(transport_km=10.0, electricity_kwh=20.0, waste_kg=5.0, period="annual")
    assert annual_res["carbon_score_kg"] == round(daily_res["carbon_score_kg"] * 365, 2)
    assert annual_res["period"] == "annual"


def test_compute_footprint_invalid_period():
    with pytest.raises(ValueError, match="Parameter 'period' must be either 'daily' or 'annual'"):
        compute_footprint(1, 1, 1, period="monthly")


def test_compute_breakdown():
    res = compute_breakdown(transport_km=50.0, electricity_kwh=5.0, waste_kg=1.0)
    assert res["dominant_sector"] == "transport"
    assert res["categories_ranked"][0]["sector"] == "transport"
    assert res["categories_ranked"][0]["rank"] == 1
    assert sum(c["share_percent"] for c in res["categories_ranked"]) == pytest.approx(100.0, abs=0.5)


def test_compute_recommendations_deterministic():
    res = compute_recommendations(transport_km=10.0, electricity_kwh=20.0, waste_kg=5.0)
    assert res["ai_powered"] is False
    assert "Deterministic" in res["model_source"]
    assert len(res["recommendations"]) == 3
    # Electricity is dominant (8.4 kg vs 2.1 kg transport vs 2.9 kg waste)
    assert "electrical grid" in res["recommendations"][0].lower()


def test_compute_recommendations_with_sampling():
    mock_sampling = lambda prompt: '["Action 1", "Action 2", "Action 3"]'
    res = compute_recommendations(transport_km=10.0, electricity_kwh=20.0, waste_kg=5.0, sampling_fn=mock_sampling)
    assert res["ai_powered"] is True
    assert res["recommendations"] == ["Action 1", "Action 2", "Action 3"]


def test_compute_recommendations_sampling_fallback():
    # If sampling returns invalid json or raises error, fallback to deterministic
    bad_sampling = lambda prompt: "non json response"
    res = compute_recommendations(transport_km=10.0, electricity_kwh=20.0, waste_kg=5.0, sampling_fn=bad_sampling)
    assert res["ai_powered"] is False
    assert len(res["recommendations"]) == 3


def test_list_challenges():
    res_all = list_challenges("all")
    assert res_all["total_challenges"] == 5
    assert res_all["total_potential_daily_saving_kg_co2"] == 6.0

    res_transport = list_challenges("transport")
    assert res_transport["total_challenges"] == 1
    assert res_transport["challenges"][0]["category"] == "transport"

    with pytest.raises(ValueError, match="Invalid category"):
        list_challenges("unknown")


# ---------------------------------------------------------------------------
# Unit Tests: Plugin Tool Invoker
# ---------------------------------------------------------------------------

def test_plugin_invoke_ping():
    res = plugin.invoke("ping", {})
    assert res["success"] is True
    assert res["data"]["pong"] is True


def test_plugin_invoke_calculate_footprint_success():
    res = plugin.invoke("calculate_carbon_footprint", {
        "transport_km": 15,
        "electricity_kwh": 12,
        "waste_kg": 1.5,
    })
    assert res["success"] is True
    assert res["data"]["carbon_score_kg"] == 9.06


def test_plugin_invoke_missing_parameter():
    res = plugin.invoke("calculate_carbon_footprint", {
        "transport_km": 15,
    })
    assert res["success"] is False
    assert "Missing required parameter" in res["error"]


def test_plugin_invoke_negative_parameter():
    res = plugin.invoke("calculate_carbon_footprint", {
        "transport_km": -15,
        "electricity_kwh": 12,
        "waste_kg": 1.5,
    })
    assert res["success"] is False
    assert "must be non-negative" in res["error"]


def test_plugin_invoke_breakdown_success():
    res = plugin.invoke("analyze_emission_breakdown", {
        "transport_km": 15,
        "electricity_kwh": 12,
        "waste_kg": 1.5,
    })
    assert res["success"] is True
    assert res["data"]["dominant_sector"] == "electricity"


def test_plugin_invoke_recommendations_success():
    res = plugin.invoke("get_sustainability_recommendations", {
        "transport_km": 15,
        "electricity_kwh": 12,
        "waste_kg": 1.5,
    })
    assert res["success"] is True
    assert res["data"]["ai_powered"] is False
    assert len(res["data"]["recommendations"]) == 3


def test_plugin_invoke_challenges_success():
    res = plugin.invoke("get_eco_challenges", {"category": "waste"})
    assert res["success"] is True
    assert res["data"]["total_challenges"] == 1


def test_plugin_invoke_unknown_tool():
    res = plugin.invoke("some_random_tool", {})
    assert res["success"] is False
    assert "Unknown tool" in res["error"]


# ---------------------------------------------------------------------------
# Unit Tests: Protocol Dispatcher
# ---------------------------------------------------------------------------

def test_plugin_dispatch_initialize(capsys):
    env = {"jsonrpc": "2.0", "id": "1", "method": "initialize"}
    plugin._dispatch(env)
    captured = capsys.readouterr()
    res = json.loads(captured.out.strip())
    assert res["id"] == "1"
    assert res["result"]["protocolVersion"] == "2.0"
    assert "sampling" in res["result"]["capabilities"]


def test_plugin_dispatch_describe(capsys):
    env = {"jsonrpc": "2.0", "id": "2", "method": "describe"}
    plugin._dispatch(env)
    captured = capsys.readouterr()
    res = json.loads(captured.out.strip())
    assert res["id"] == "2"
    assert res["result"]["display_name"] == "tool-dev-ecotrack-engine"
    assert len(res["result"]["tools"]) == 5


def test_plugin_dispatch_health(capsys):
    env = {"jsonrpc": "2.0", "id": "3", "method": "health"}
    plugin._dispatch(env)
    captured = capsys.readouterr()
    res = json.loads(captured.out.strip())
    assert res["result"]["status"] == "ready"


def test_plugin_dispatch_invoke(capsys):
    env = {
        "jsonrpc": "2.0",
        "id": "4",
        "method": "invoke",
        "params": {
            "tool": "ping",
            "arguments": {}
        }
    }
    plugin._dispatch(env)
    captured = capsys.readouterr()
    res = json.loads(captured.out.strip())
    assert res["result"]["success"] is True


def test_plugin_dispatch_unknown_method(capsys):
    env = {"jsonrpc": "2.0", "id": "5", "method": "unknown_rpc_call"}
    plugin._dispatch(env)
    captured = capsys.readouterr()
    res = json.loads(captured.out.strip())
    assert "error" in res
    assert res["error"]["code"] == -32601
