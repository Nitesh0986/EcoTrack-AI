# EcoTrack Engine — Anna App Executa Plugin

`ecotrack-engine` is the official Anna App Executa integration for **EcoTrack AI**. It provides high-performance, deterministic carbon accounting algorithms, sector breakdown analytics, verified sustainability recommendations, and actionable micro-habit challenges via the Anna Executa protocol (JSON-RPC 2.0 over `stdio`).

---

## 1. Overview & Architecture

```
+-----------------------------------------------------------------------------------+
|                                ANNA RUNTIME / HOST                                |
|  [Anna Workspace / AI Agent]                                                      |
|    |                                                                              |
|    |  JSON-RPC 2.0 over stdio (initialize / describe / health / invoke)          |
|    v                                                                              |
+----+------------------------------------------------------------------------------+
|                          ECOTRACK EXECUTAPLUGIN                                   |
|  [ecotrack-engine] (Python 3.10+ / uv runner)                                     |
|    |                                                                              |
|    |-- Tool Dispatcher: ecotrack_engine_plugin.py                                 |
|    |-- Domain Logic & Validation: ecotrack_core.py                                |
|    |-- EPA & UK DEFRA Emission Baselines                                          |
|    |                                                                              |
|    |-- Reverse-RPC Host Sampling (sampling/createMessage) [Optional / Fallback]   |
|         |--> If Host Sampling Granted: Generative LLM Recommendations            |
|         |--> If Offline / Disabled: Deterministic Heuristic Expert Recommendations|
+-----------------------------------------------------------------------------------+
```

### Key Architectural Tenets
1. **Zero Secret Exposure**: Operates without baking client or server API keys into the plugin. LLM generation leverages Anna's host-managed sampling reverse-RPC (`sampling/createMessage`).
2. **Deterministic Fallback**: If host sampling is disabled or unavailable, the engine falls back to deterministic expert recommendations without crashing or hanging.
3. **Strict Validation**: All incoming arguments are validated for presence, numeric type, non-negativity, and finiteness before calculation.
4. **Clean Protocol Stream**: Protocol messages strictly use `stdout`. All diagnostic logs are routed exclusively to `stderr`.

---

## 2. Prerequisites

- **Python 3.10+** (Tested on Python 3.14.0)
- **uv** (v0.12+)
- **Anna App CLI** (`anna-app` v0.1.57+)

Verify your environment:
```powershell
anna-app doctor
uv --version
```

---

## 3. Directory Structure

```
ecotrack-engine/
├── ecotrack_engine_plugin.py # JSON-RPC 2.0 protocol handler & tool router
├── ecotrack_core.py          # Pure Python carbon algorithms, factors & validation
├── test_plugin.py            # Automated Pytest suite (23 unit & protocol tests)
├── executa.json              # Official Anna Executa manifest & identity definition
├── pyproject.toml            # Python package & CLI entrypoint configuration
├── sampling-fixture.jsonl    # Canned fixture for local offline reverse-RPC testing
└── README.md                 # Integration documentation
```

---

## 4. Local Execution & CLI Commands

Run the Executa in isolation using the Anna CLI runner:

### A. Describe Manifest
Prints the complete tool schema and declared capabilities:
```powershell
anna-app executa dev --dir . --describe
```

### B. Health Check
Verifies runtime readiness:
```powershell
anna-app executa dev --dir . --health
```

### C. Invoke Smoke Test (`ping`)
```powershell
anna-app executa dev --dir . --invoke ping
```

### D. Invoke Carbon Footprint Calculation
```powershell
anna-app executa dev --dir . --invoke calculate_carbon_footprint --args '{"transport_km":15,"electricity_kwh":12,"waste_kg":1.5}'
```

Annual calculation:
```powershell
anna-app executa dev --dir . --invoke calculate_carbon_footprint --args '{"transport_km":15,"electricity_kwh":12,"waste_kg":1.5,"period":"annual"}'
```

### E. Invoke Sector Breakdown Analytics
```powershell
anna-app executa dev --dir . --invoke analyze_emission_breakdown --args '{"transport_km":15,"electricity_kwh":12,"waste_kg":1.5}'
```

### F. Invoke Sustainability Recommendations
1. **Deterministic Heuristic Baseline** (offline / no LLM):
```powershell
anna-app executa dev --dir . --invoke get_sustainability_recommendations --args '{"transport_km":15,"electricity_kwh":12,"waste_kg":1.5}'
```

2. **Generative Host Sampling** (using local fixture):
```powershell
anna-app executa dev --dir . --mock-sampling ./sampling-fixture.jsonl --invoke get_sustainability_recommendations --args '{"transport_km":15,"electricity_kwh":12,"waste_kg":1.5,"enable_ai":true}'
```

### G. Invoke Eco Challenges
Retrieve all challenges:
```powershell
anna-app executa dev --dir . --invoke get_eco_challenges --args '{}'
```

Filter by sector (`transport`, `electricity`, `waste`, `diet`):
```powershell
anna-app executa dev --dir . --invoke get_eco_challenges --args '{"category":"transport"}'
```

---

## 5. Tool Specifications & Schemas

### 1. `calculate_carbon_footprint`
- **Description**: Calculate deterministic carbon footprint from transport, electricity, and waste metrics using EPA/DEFRA conversion factors.
- **Parameters**:
  - `transport_km` (*number*, **required**): Daily distance traveled in kilometers.
  - `electricity_kwh` (*number*, **required**): Daily electricity consumed in kWh.
  - `waste_kg` (*number*, **required**): Daily solid waste produced in kg.
  - `period` (*string*, optional): `"daily"` (default) or `"annual"`.
- **Response Shape**:
  ```json
  {
    "success": true,
    "data": {
      "carbon_score_kg": 9.06,
      "unit": "kg CO2e",
      "period": "daily",
      "annual_projection_metric_tons": 3.307,
      "breakdown": {
        "transport": { "emissions_kg": 3.15, "activity_input": 15, "input_unit": "km", "emission_factor": 0.21, "factor_unit": "kg CO2e / km", "source": "EPA / DEFRA passenger combustion vehicle average (0.21 kg CO2e / km)" },
        "electricity": { "emissions_kg": 5.04, "activity_input": 12, "input_unit": "kWh", "emission_factor": 0.42, "factor_unit": "kg CO2e / kWh", "source": "EPA / DEFRA national power grid baseline (0.42 kg CO2e / kWh)" },
        "waste": { "emissions_kg": 0.87, "activity_input": 1.5, "input_unit": "kg", "emission_factor": 0.58, "factor_unit": "kg CO2e / kg", "source": "EPA / DEFRA municipal landfill lifecycle emissions (0.58 kg CO2e / kg)" }
      },
      "equivalencies": {
        "trees_needed_annual_offset": 150,
        "car_miles_equivalent": 22.4,
        "phone_charges_equivalent": 1132
      },
      "assumptions": [
        "Baseline emission calculations represent direct Scope 1 and Scope 2 operational approximations.",
        "Emission factors derived from EPA and UK DEFRA standard GHG conversion guidelines.",
        "Tree sequestration equivalence assumes an average mature tree absorbing ~22 kg CO2e annually.",
        "Vehicle equivalence is based on an average combustion passenger vehicle emitting ~0.404 kg CO2e per mile."
      ]
    }
  }
  ```

### 2. `analyze_emission_breakdown`
- **Description**: Summarize emissions by category, calculate percentage shares, and identify dominant emission contributors.
- **Parameters**: `transport_km`, `electricity_kwh`, `waste_kg` (all *number*, **required**).
- **Response Shape**:
  ```json
  {
    "success": true,
    "data": {
      "total_emissions_kg": 9.06,
      "unit": "kg CO2e / day",
      "dominant_sector": "electricity",
      "dominant_sector_name": "Electricity & Power Grid",
      "dominant_sector_share_percent": 55.6,
      "categories_ranked": [
        { "sector": "electricity", "display_name": "Electricity & Power Grid", "emissions_kg": 5.04, "share_percent": 55.6, "input_amount": 12, "input_unit": "kWh", "factor": 0.42, "rank": 1 },
        { "sector": "transport", "display_name": "Transport Mobility", "emissions_kg": 3.15, "share_percent": 34.8, "input_amount": 15, "input_unit": "km", "factor": 0.21, "rank": 2 },
        { "sector": "waste", "display_name": "Municipal Solid Waste", "emissions_kg": 0.87, "share_percent": 9.6, "input_amount": 1.5, "input_unit": "kg", "factor": 0.58, "rank": 3 }
      ],
      "strategic_focus": "'Electricity & Power Grid' is the dominant emission contributor (55.6% of total emissions at 5.04 kg CO2e). Prioritizing interventions in this sector will produce the greatest decarbonization impact."
    }
  }
  ```

### 3. `get_sustainability_recommendations`
- **Description**: Generate practical decarbonization recommendations prioritized by dominant emission contributors, with optional host AI sampling.
- **Parameters**: `transport_km`, `electricity_kwh`, `waste_kg` (*number*, **required**), `enable_ai` (*boolean*, optional).
- **Distinction of AI vs Heuristic**:
  - `ai_powered`: `true` when generated via host LLM sampling, `false` when generated via deterministic baseline rules.
  - `model_source`: Clearly names either `"Anna Host Reverse-RPC LLM Sampling"` or `"Deterministic Environmental Baseline Engine"`.

### 4. `get_eco_challenges`
- **Description**: Retrieve verified decarbonization challenges with estimated CO2 savings and impact tiers.
- **Parameters**: `category` (*string*, optional: `"all"`, `"transport"`, `"electricity"`, `"waste"`, `"diet"`).
- **Response Shape**: Includes `filter_category`, `total_challenges`, `total_potential_daily_saving_kg_co2`, and the challenge checklist.

---

## 6. Carbon Emission Factors & Standards

| Activity Sector | Baseline Emission Factor | Metric Unit | Benchmark Source |
| :--- | :--- | :--- | :--- |
| **Transport** | `0.21` | kg CO2e / km | EPA & UK DEFRA passenger combustion vehicle average |
| **Electricity** | `0.42` | kg CO2e / kWh | EPA & UK DEFRA national electrical grid carbon intensity |
| **Municipal Waste** | `0.58` | kg CO2e / kg | EPA municipal solid landfill lifecycle factor |

### Equivalency Standards
- **Tree Absorption**: 1 mature tree sequesters ~22 kg CO2e/year (EPA Greenhouse Gas Equivalencies).
- **Passenger Car Miles**: 1 combustion passenger vehicle mile emits ~0.404 kg CO2e.
- **Smartphone Charge**: 1 full smartphone battery recharge consumes ~0.008 kg CO2e.

---

## 7. Testing Suite

The integration includes 23 automated tests covering domain calculations, parameter validation, error responses, reverse-RPC sampling, and JSON-RPC protocol dispatching.

Run unit and integration tests:
```powershell
pytest test_plugin.py -v
```

---

## 8. Connecting to an Anna App

To consume `ecotrack-engine` inside an Anna App:

### A. Reference in `manifest.json`
Declare `tool-dev-ecotrack-engine` under `required_executas` and `ui.host_api.tools`:
```json
{
  "schema": 2,
  "required_executas": [
    {
      "tool_id": "tool-dev-ecotrack-engine"
    }
  ],
  "tags": ["sustainability", "carbon", "climate"],
  "ui": {
    "bundle": {
      "format": "static-spa",
      "entry": "index.html"
    },
    "host_api": {
      "tools": ["tool-dev-ecotrack-engine"],
      "storage": ["get", "set"],
      "window": ["set_title", "ready"]
    }
  }
}
```

### B. Publishing Prerequisites (Remote Actions Require Approval)
1. **Device Authentication**:
   ```powershell
   anna-app login
   ```
2. **Executa Dry-Run**:
   ```powershell
   anna-app executa publish --cwd . --dry-run
   ```
3. **Executa Publication**:
   ```powershell
   anna-app executa publish --cwd . --publish
   ```
4. **App Linking**:
   Link the published `tool_id` in your app's `manifest.json` and validate:
   ```powershell
   anna-app validate
   ```

---

## 9. Troubleshooting

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| `Missing required parameter` | Missing parameter in tool call | Ensure `transport_km`, `electricity_kwh`, and `waste_kg` are passed. |
| `must be non-negative (>= 0)` | Negative numeric input | Provide values $\ge 0.0$. |
| `sampling_disabled` | Host sampling not enabled | Engine automatically falls back to deterministic heuristic advice. |
| Protocol negotiation timeout | Debug printing to stdout | Never print to `stdout`. Use `_log_debug()` which routes strictly to `stderr`. |
