"""EcoTrack AI Executa Plugin (Python).

Speaks Executa JSON-RPC 2.0 over stdin/stdout. Implements methods
(`initialize`, `describe`, `health`, `invoke`) and supports host reverse-RPC
sampling for generative sustainability recommendations.
"""

from __future__ import annotations

import json
import sys
import uuid
from typing import Any

from ecotrack_core import (
    compute_breakdown,
    compute_footprint,
    compute_recommendations,
    list_challenges,
    validate_non_negative_number,
)

MANIFEST: dict[str, Any] = {
    "display_name": "tool-dev-ecotrack-engine",
    "version": "0.1.0",
    "description": "EcoTrack AI carbon intelligence and decarbonization engine: calculate carbon footprint, analyze emission breakdowns, generate recommendations, and track eco challenges.",
    "host_capabilities": ["llm.sample"],
    "tools": [
        {
            "name": "ping",
            "description": "Smoke-test and health check method.",
            "parameters": [],
        },
        {
            "name": "calculate_carbon_footprint",
            "description": "Calculate deterministic carbon footprint from transport, electricity, and waste metrics using EPA/DEFRA conversion factors.",
            "parameters": [
                {
                    "name": "transport_km",
                    "type": "number",
                    "description": "Daily distance traveled in kilometers (combustion vehicle transport).",
                    "required": True,
                },
                {
                    "name": "electricity_kwh",
                    "type": "number",
                    "description": "Daily electricity consumed in kilowatt-hours.",
                    "required": True,
                },
                {
                    "name": "waste_kg",
                    "type": "number",
                    "description": "Daily solid waste produced in kilograms.",
                    "required": True,
                },
                {
                    "name": "period",
                    "type": "string",
                    "description": "Calculation time period: 'daily' (default) or 'annual'.",
                    "required": False,
                },
            ],
        },
        {
            "name": "analyze_emission_breakdown",
            "description": "Summarize emissions by category, calculate percentage shares, and identify dominant emission contributors.",
            "parameters": [
                {
                    "name": "transport_km",
                    "type": "number",
                    "description": "Daily distance traveled in kilometers.",
                    "required": True,
                },
                {
                    "name": "electricity_kwh",
                    "type": "number",
                    "description": "Daily electricity consumed in kilowatt-hours.",
                    "required": True,
                },
                {
                    "name": "waste_kg",
                    "type": "number",
                    "description": "Daily solid waste produced in kilograms.",
                    "required": True,
                },
            ],
        },
        {
            "name": "get_sustainability_recommendations",
            "description": "Generate practical decarbonization recommendations prioritized by dominant emission contributors, with optional host AI sampling.",
            "parameters": [
                {
                    "name": "transport_km",
                    "type": "number",
                    "description": "Daily distance traveled in kilometers.",
                    "required": True,
                },
                {
                    "name": "electricity_kwh",
                    "type": "number",
                    "description": "Daily electricity consumed in kilowatt-hours.",
                    "required": True,
                },
                {
                    "name": "waste_kg",
                    "type": "number",
                    "description": "Daily solid waste produced in kilograms.",
                    "required": True,
                },
                {
                    "name": "enable_ai",
                    "type": "boolean",
                    "description": "Set to true to request AI-generated recommendations via host LLM sampling (falls back gracefully to deterministic heuristics).",
                    "required": False,
                },
            ],
        },
        {
            "name": "get_eco_challenges",
            "description": "Retrieve verified decarbonization challenges with estimated CO2 savings and impact tiers.",
            "parameters": [
                {
                    "name": "category",
                    "type": "string",
                    "description": "Optional category filter: 'all', 'transport', 'electricity', 'waste', or 'diet'.",
                    "required": False,
                },
            ],
        },
    ],
}


def _log_debug(msg: str) -> None:
    """Write diagnostic messages to stderr to avoid corrupting JSON-RPC stdout pipe."""
    sys.stderr.write(f"[ecotrack-engine] {msg}\n")
    sys.stderr.flush()


def _write(envelope: dict[str, Any]) -> None:
    """Send JSON-RPC envelope strictly to stdout."""
    sys.stdout.write(json.dumps(envelope) + "\n")
    sys.stdout.flush()


def _request_sampling(prompt: str) -> str:
    """Issue a reverse-RPC `sampling/createMessage` and block until response."""
    rid = str(uuid.uuid4())
    _write(
        {
            "jsonrpc": "2.0",
            "id": rid,
            "method": "sampling/createMessage",
            "params": {
                "messages": [
                    {"role": "user", "content": {"type": "text", "text": prompt}}
                ],
                "maxTokens": 400,
            },
        }
    )
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            env = json.loads(line)
        except Exception:  # noqa: BLE001
            continue

        if env.get("id") == rid and "method" not in env:
            if "error" in env:
                raise RuntimeError(env["error"].get("message", "host sampling returned error"))
            result = env.get("result", {})
            content = result.get("content", {})
            if isinstance(content, dict):
                return content.get("text", "")
            if isinstance(content, str):
                return content
            return json.dumps(content)
        # Re-dispatch other unexpected requests
        _dispatch(env)
    raise RuntimeError("stdin closed before host sampling response arrived")


def invoke(method: str, args: dict[str, Any]) -> dict[str, Any]:
    """Execute tool calls safely with parameter validation and predictable return structures."""
    try:
        if method == "ping":
            return {"success": True, "data": {"pong": True, "status": "healthy"}}

        if method == "calculate_carbon_footprint":
            for req in ("transport_km", "electricity_kwh", "waste_kg"):
                if req not in args:
                    return {"success": False, "error": f"Missing required parameter: '{req}'"}

            t_km = validate_non_negative_number(args.get("transport_km"), "transport_km")
            e_kwh = validate_non_negative_number(args.get("electricity_kwh"), "electricity_kwh")
            w_kg = validate_non_negative_number(args.get("waste_kg"), "waste_kg")
            period = str(args.get("period", "daily"))

            data = compute_footprint(t_km, e_kwh, w_kg, period=period)
            return {"success": True, "data": data}

        if method == "analyze_emission_breakdown":
            for req in ("transport_km", "electricity_kwh", "waste_kg"):
                if req not in args:
                    return {"success": False, "error": f"Missing required parameter: '{req}'"}

            t_km = validate_non_negative_number(args.get("transport_km"), "transport_km")
            e_kwh = validate_non_negative_number(args.get("electricity_kwh"), "electricity_kwh")
            w_kg = validate_non_negative_number(args.get("waste_kg"), "waste_kg")

            data = compute_breakdown(t_km, e_kwh, w_kg)
            return {"success": True, "data": data}

        if method == "get_sustainability_recommendations":
            for req in ("transport_km", "electricity_kwh", "waste_kg"):
                if req not in args:
                    return {"success": False, "error": f"Missing required parameter: '{req}'"}

            t_km = validate_non_negative_number(args.get("transport_km"), "transport_km")
            e_kwh = validate_non_negative_number(args.get("electricity_kwh"), "electricity_kwh")
            w_kg = validate_non_negative_number(args.get("waste_kg"), "waste_kg")

            enable_ai = bool(args.get("enable_ai", False))
            sampling_fn = _request_sampling if enable_ai else None

            data = compute_recommendations(t_km, e_kwh, w_kg, sampling_fn=sampling_fn)
            return {"success": True, "data": data}

        if method == "get_eco_challenges":
            cat = args.get("category", "all")
            data = list_challenges(cat)
            return {"success": True, "data": data}

        return {"success": False, "error": f"Unknown tool: '{method}'"}

    except ValueError as ve:
        return {"success": False, "error": str(ve)}
    except Exception as exc:  # noqa: BLE001
        _log_debug(f"Exception during tool invoke '{method}': {exc}")
        return {"success": False, "error": f"Execution failure: {str(exc)}"}


def _dispatch(env: dict[str, Any]) -> None:
    method = env.get("method")
    rid = env.get("id")
    try:
        if method == "initialize":
            result = {
                "protocolVersion": "2.0",
                "server_info": {"name": MANIFEST["display_name"], "version": MANIFEST["version"]},
                "capabilities": {"sampling": {}},
            }
        elif method == "describe":
            result = MANIFEST
        elif method == "health":
            result = {"status": "ready"}
        elif method == "invoke":
            params = env.get("params", {})
            result = invoke(params.get("tool", ""), params.get("arguments", {}))
        else:
            raise ValueError(f"unknown rpc: {method}")
        _write({"jsonrpc": "2.0", "id": rid, "result": result})
    except Exception as e:  # noqa: BLE001
        _write(
            {
                "jsonrpc": "2.0",
                "id": rid,
                "error": {"code": -32601, "message": str(e)},
            }
        )


def main() -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            env = json.loads(line)
        except Exception as exc:  # noqa: BLE001
            _log_debug(f"Malformed JSON on stdin: {exc}")
            continue
        _dispatch(env)


if __name__ == "__main__":
    main()
