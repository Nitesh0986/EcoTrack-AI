# EcoTrack-AI

[![CI Pipeline](https://github.com/Nitesh0986/EcoTrack-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/Nitesh0986/EcoTrack-AI/actions)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.2-61DAFB.svg)](https://react.dev/)
[![Anna Executa](https://img.shields.io/badge/Anna_Executa-JSON--RPC_2.0-8A2BE2.svg)](https://github.com/Nitesh0986/EcoTrack-AI/tree/main/ecotrack-engine)

Production-grade carbon intelligence and decarbonization platform featuring a decoupled **Full-Stack Web Application** (FastAPI, React, Google Gemini AI) and an officially supported **Anna App Executa Plugin** (`ecotrack-engine`) speaking JSON-RPC 2.0 over standard I/O for autonomous AI agents.

---

## Architecture Diagram

```
===================================================================================
                                ECOTRACK AI PLATFORM
===================================================================================

[WEB CLIENT TIER]                                [ANNA APP / AI AGENT TIER]
  React 18 SPA (Vite / Hooks)                       Anna Host AI Workspace
  - Carbon Gauges & Equivalencies                   - In-Process Autonomous Dispatch
  - Sector Breakdown Charts                         - Zero-Port Stdio Execution
  - LocalStorage Audit History                      - Reverse-RPC Host LLM Sampling
         |                                                    |
         | HTTP POST /api/analyze-emissions                   | JSON-RPC 2.0 (stdio)
         v                                                    v
+-----------------------------------+     +----------------------------------------+
|       FASTAPI BACKEND TIER        |     |      ANNA EXECUTAPLUGIN TIER           |
| (backend/main.py)                 |     | (ecotrack-engine/ecotrack_engine_plugin)|
| - Pydantic Schema Enforcement     |     | - Protocol 2.0 stdio Negotiation       |
| - CORS Middleware Validation      |     | - Deterministic Baseline Engine        |
| - Deterministic Baseline Engine   |     | - Isolated Stderr Diagnostics          |
+-----------------------------------+     +----------------------------------------+
         |                                                    |
         | Async RPC (Zero-shot JSON)                         | sampling/createMessage
         v                                                    v
+-----------------------------------+     +----------------------------------------+
|       GOOGLE GEMINI AI TIER       |     |        ANNA HOST LLM SAMPLING          |
| (gemini-1.5-flash)                |     | (Host-Negotiated Agent Inference)      |
| - Generative Action Plans         |     | - Zero-Secret Agent Recommendations    |
| - Deterministic Heuristic Fallback|     | - Deterministic Heuristic Fallback     |
+-----------------------------------+     +----------------------------------------+
```

---

## Key Features

1. **Deterministic Carbon Accounting**:
   - Industry-standard GHG emission factors (EPA & UK DEFRA baselines).
   - Real-world carbon equivalencies: mature tree sequestration run-rates, passenger car commuting miles, and smartphone battery charges.
2. **Anna App Executa Integration (`ecotrack-engine`)**:
   - Autonomous tool provider speaking JSON-RPC 2.0 over `stdio`.
   - 5 certified tools: `calculate_carbon_footprint`, `analyze_emission_breakdown`, `get_sustainability_recommendations`, `get_eco_challenges`, and `ping`.
   - Offline-resilient: gracefully operates on deterministic rules when host sampling is unavailable.
3. **Decoupled Full-Stack Architecture**:
   - Modern React 18 interface with interactive carbon gauges, category breakdown bars, and micro-habit daily challenges.
   - High-throughput asynchronous FastAPI gateway with strict Pydantic runtime validation.
4. **Zero-Trust Security & Cost Control**:
   - Zero credential exposure in client bundles or repositories.
   - 100% free development and execution: no paid APIs, no mandatory cloud subscriptions.

---

## Carbon Accounting Emission Factors

| Sector | Baseline Factor | Unit | Source / Methodology |
| :--- | :--- | :--- | :--- |
| **Transport** | `0.21` | kg CO₂e / km | EPA & UK DEFRA passenger combustion vehicle average |
| **Electricity** | `0.42` | kg CO₂e / kWh | EPA & UK DEFRA national power grid carbon intensity baseline |
| **Municipal Waste** | `0.58` | kg CO₂e / kg | EPA municipal solid landfill lifecycle factor |

### Equivalency Conversion Standards
- **Tree Sequestration**: 1 mature tree absorbs ~22 kg CO₂e/year (~0.06 kg/day).
- **Passenger Vehicle Miles**: 1 combustion passenger vehicle mile emits ~0.404 kg CO₂e.
- **Smartphone Recharge**: 1 full smartphone battery charge cycle consumes ~0.008 kg CO₂e.

---

## Part 1: Anna App Executa Engine (`ecotrack-engine/`)

The `ecotrack-engine` directory provides the standalone plugin conforming to the official Anna Executa specification.

### Executa Tools Catalog

- **`calculate_carbon_footprint`**: Computes total emissions, breakdowns, annual projections, tree offsets, and activity equivalencies.
  - Parameters: `transport_km` (*num*), `electricity_kwh` (*num*), `waste_kg` (*num*), `period` (*str*, optional: `"daily"` or `"annual"`).
- **`analyze_emission_breakdown`**: Summarizes emissions by category, calculates percentages, and identifies the dominant sector.
  - Parameters: `transport_km` (*num*), `electricity_kwh` (*num*), `waste_kg` (*num*).
- **`get_sustainability_recommendations`**: Generates high-impact decarbonization advice. Uses host LLM sampling when enabled, with automatic fallback to deterministic heuristic rules.
  - Parameters: `transport_km` (*num*), `electricity_kwh` (*num*), `waste_kg` (*num*), `enable_ai` (*bool*, optional).
- **`get_eco_challenges`**: Returns verified micro-habit decarbonization challenges with quantified carbon reduction values.
  - Parameters: `category` (*str*, optional: `"all"`, `"transport"`, `"electricity"`, `"waste"`, `"diet"`).
- **`ping`**: Protocol smoke-test and health check.

### Local Testing with Anna CLI

```bash
# Navigate to Executa directory
cd ecotrack-engine

# Describe manifest and tools
anna-app executa dev --dir . --describe

# Health check
anna-app executa dev --dir . --health

# Calculate footprint
anna-app executa dev --dir . --invoke calculate_carbon_footprint \
  --args '{"transport_km":15,"electricity_kwh":12,"waste_kg":1.5}'

# Sector breakdown
anna-app executa dev --dir . --invoke analyze_emission_breakdown \
  --args '{"transport_km":15,"electricity_kwh":12,"waste_kg":1.5}'

# Sustainability recommendations (Deterministic)
anna-app executa dev --dir . --invoke get_sustainability_recommendations \
  --args '{"transport_km":15,"electricity_kwh":12,"waste_kg":1.5}'

# Sustainability recommendations (Host Sampling Mock)
anna-app executa dev --dir . --mock-sampling ./sampling-fixture.jsonl \
  --invoke get_sustainability_recommendations \
  --args '{"transport_km":15,"electricity_kwh":12,"waste_kg":1.5,"enable_ai":true}'

# Eco Challenges
anna-app executa dev --dir . --invoke get_eco_challenges --args '{}'
```

### Running Automated Executa Unit Tests

```bash
pytest ecotrack-engine/test_plugin.py -v
```
*(All 23 automated tests covering domain calculations, schema validation, and JSON-RPC dispatching).*

### Publishing to Anna Platform

```bash
cd ecotrack-engine

# 1. Login to Anna developer account
anna-app login

# 2. Dry-run validation
anna-app executa publish --cwd . --dry-run

# 3. Mint and publish
anna-app executa publish --cwd . --publish
```

---

## Part 2: Full-Stack Web Application Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Active Google Gemini API Key *(Optional: system includes deterministic fallback)*

### Backend Setup (`/backend`)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY (optional for heuristic mode)

# Launch FastAPI development server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend Setup (`/frontend`)

```bash
cd frontend

# Install dependencies
npm install

# Launch Vite development server
npm run dev
```

### Option B: Unified Containerized Launch (Docker Compose)

```bash
# Build and spin up the complete full-stack environment
docker compose up --build
```
*Frontend: `http://localhost:3000` | Backend API: `http://localhost:8000`*

---

## Automated Verification & Testing

### Backend Unit Tests
```bash
cd backend
pytest test_main.py -v
```
*(6 automated tests verifying routing, schema bounds, emission math, and mocked Gemini inference).*

### Frontend Production Build
```bash
cd frontend
npm run build
```
*(Compiles and validates production bundle optimization with zero warnings).*

### Executa Test Suite
```bash
pytest ecotrack-engine/test_plugin.py -v
```
*(23 automated tests verifying Executa protocol compliance, boundary errors, and tools).*

---

## Repository Structure

```
EcoTrack-AI/
├── .github/workflows/
│   └── ci.yml                  # GitHub Actions CI pipeline (Pytest + Vite Build)
├── backend/
│   ├── Dockerfile              # Production containerization
│   ├── main.py                 # FastAPI server with CORS, Pydantic validation & Gemini
│   ├── test_main.py            # Automated Pytest suite with mock inference & boundary checks
│   ├── requirements.txt        # Backend dependencies (FastAPI, google-genai, Pydantic)
│   └── .env.example            # Environment configuration template
├── ecotrack-engine/            # Official Anna App Executa Plugin
│   ├── ecotrack_engine_plugin.py # JSON-RPC 2.0 protocol handler & tool dispatcher
│   ├── ecotrack_core.py        # Pure Python calculation engine & emission baselines
│   ├── test_plugin.py          # Automated Pytest suite (23 unit & protocol tests)
│   ├── executa.json            # Official Anna Executa manifest & identity definition
│   ├── pyproject.toml          # Python package & entrypoint configuration
│   ├── sampling-fixture.jsonl  # Canned fixture for local reverse-RPC testing
│   ├── .gitignore              # Engine-specific security exclusions
│   └── README.md               # Executa integration and publishing guide
├── frontend/
│   ├── Dockerfile              # Multi-stage production container build (Vite + Nginx)
│   ├── nginx.conf              # Nginx reverse proxy configuration
│   ├── index.html              # SPA HTML host
│   ├── package.json            # Dependencies & Vite scripts
│   ├── vite.config.js          # Vite build & local dev configuration
│   └── src/
│       ├── App.jsx             # Root component wrapper
│       ├── main.jsx            # React DOM render entrypoint
│       ├── ecotrack.css        # Modern responsive design system
│       └── components/
│           ├── EcoTrack.jsx    # Core interactive carbon intelligence view
│           ├── CarbonGauge.jsx # Dynamic SVG radial emissions gauge
│           ├── EmissionsBreakdown.jsx # Sector contribution & equivalency cards
│           ├── AIRecommendations.jsx  # Structured decarbonization interventions
│           ├── EcoChallenges.jsx      # Daily micro-habit decarbonization tracker
│           └── AuditHistory.jsx       # Local audit history & summary exporter
├── legacy/                     # Preserved monolithic prototype
│   ├── index.html
│   ├── script.js
│   └── style.css
├── docker-compose.yml          # Multi-container orchestration
├── .gitignore                  # Multi-tier security gitignore protecting secrets
└── README.md                   # Full platform architecture and setup documentation
```

---

## Security Engineering

1. **Zero Secret Exposure**: LLM provider credentials remain server-bound in the backend tier. The Anna Executa plugin delegates sampling to the host runtime via reverse-RPC, requiring zero client-side API keys.
2. **Type-Safe Boundary Ingestion**: Pydantic models and explicit Python numeric validation guard against negative numbers, non-numeric values, and schema overflows.
3. **Fail-Safe Offline Resilience**: When LLM upstream connectivity or host sampling is unavailable, both the backend and Executa engine fallback to deterministic environmental heuristic baselines without crashing.

---

## License

This project is licensed under the MIT License.
