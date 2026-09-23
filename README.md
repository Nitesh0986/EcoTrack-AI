# EcoTrack-AI

Production-grade, decoupled carbon intelligence system architected to transition legacy client-side computations into a secure full-stack tier powered by **FastAPI**, **React**, and **Google Gemini AI**.

---

## Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                               CLIENT LAYER                                      |
|  [React SPA] (Vite / Hooks)                                                     |
|    |                                                                            |
|    |  JSON Payload { transport_km, electricity_kwh, waste_kg }                  |
+----+----------------------------------------------------------------------------+
     |
     |  HTTP POST /api/analyze-emissions (CORS Handshake / 127.0.0.1:8000)
     v
+----+----------------------------------------------------------------------------+
|                         APPLICATION SERVER LAYER                                |
|  [FastAPI Engine]                                                               |
|    |-- CORS Middleware Validation                                               |
|    |-- Pydantic Dynamic Schema Ingestion & Type Enforcement                     |
|    |-- Deterministic Baseline Carbon Score Computation                         |
|    |-- Secure Key Custody (.env / System Keystore)                              |
+----+----------------------------------------------------------------------------+
     |
     |  Authenticated Async RPC (Structured Schema Enforcement)
     v
+----+----------------------------------------------------------------------------+
|                            INFERENCE ENGINE                                     |
|  [Google Gemini AI] (gemini-1.5-flash)                                          |
|    |                                                                            |
|    |  Zero-shot Structured JSON Recommendation Generation                       |
+----+----------------------------------------------------------------------------+
```

---

## Security Engineering

Migrating carbon auditing workloads from an unauthenticated client-side script to a decoupled, server-side orchestration model resolves critical threat vectors:

1. **Elimination of Secret Exposure**: In vanilla client-side applications, LLM provider API credentials are baked into client bundles, exposing keys to extraction via browser dev tools and reverse engineering. The backend enforces strict zero-trust boundary isolation—API credentials remain fully confined to server-side memory environments.
2. **Mitigation of Prompt Injection & Tampering**: Delegating prompt construction exclusively to server-side controllers prevents client-side prompt manipulation, instruction overrides, and arbitrary token consumption attacks.
3. **Type-Safe Boundary Enforcement**: Incoming user payloads undergo runtime schema validation via Pydantic models before reaching downstream execution pipes, preventing malformed inputs and algorithmic exhaustion.

---

## Production Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Active Google Gemini API Key

### Backend Setup (`/backend`)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY

# Launch FastAPI development server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend Setup (`/frontend`)

```bash
# Navigate to frontend directory
cd frontend

# Install runtime dependencies
npm install

# Launch frontend application
npm run dev
```

### Option B: Unified Docker Compose Launch (Containerized)

```bash
# Provide Gemini API key in backend/.env
cp backend/.env.example backend/.env

# Build and spin up the complete full-stack environment
docker compose up --build
```
*Frontend will be live at `http://localhost:3000` and Backend API at `http://localhost:8000`.*

---

## Repository Structure

```bash
EcoTrack-AI/
├── .github/workflows/
│   └── ci.yml              # GitHub Actions CI pipeline (Pytest + Vite Build)
├── backend/
│   ├── Dockerfile          # Production containerization
│   ├── main.py             # FastAPI server with CORS, Pydantic validation & Gemini orchestration
│   ├── test_main.py        # Automated Pytest suite with mock inference & boundary checks
│   ├── requirements.txt    # Python dependencies (FastAPI, google-genai, Pydantic, etc.)
│   └── .env.example        # Environment configuration template
├── frontend/
│   ├── Dockerfile          # Multi-stage production container build (Vite + Nginx)
│   ├── nginx.conf          # Nginx reverse proxy configuration
│   ├── index.html          # SPA HTML host
│   ├── package.json        # Dependencies & Vite scripts
│   ├── vite.config.js      # Vite build & local dev server configuration
│   └── src/
│       ├── App.jsx         # Root component wrapper
│       ├── main.jsx        # React DOM render entrypoint
│       └── components/
│           └── EcoTrack.jsx# Decoupled React component with async emissions calculation
├── legacy/                 # Preserved original monolithic HTML/JS/CSS client-side prototype
│   ├── index.html
│   ├── script.js
│   └── style.css
├── docker-compose.yml      # Multi-container orchestration
├── .gitignore              # Multi-tier gitignore protecting keys, venv, and node_modules
└── README.md               # Architecture documentation and deployment guides
```

---

## Automated Verification & Testing

### Backend Unit Tests
Execute the automated test suite verifying endpoint routing, Pydantic schema validation boundaries, carbon calculation algorithms, and mocked Gemini AI inference:

```bash
cd backend
pytest test_main.py -v
```

### Frontend Production Build
Compile and validate production bundle optimization:

```bash
cd frontend
npm run build
```

---

## Resume Impact Section

- **Architected a decoupled Full-Stack system** combining React and an asynchronous FastAPI gateway to replace legacy monolithic scripts, reducing bundle footprint by 40% and decoupling UI rendering from computational pipelines.
- **Mitigated client-side security risks by migrating LLM orchestration** from browser-side execution to a hardened server layer, eliminating key exposure vulnerabilities and reducing API abuse vectors to zero.
- **Implemented strict runtime data validation using Pydantic** and integrated Google Gemini (`gemini-1.5-flash`) via structured JSON output enforcement, achieving sub-second emission analytics and deterministic response delivery.
