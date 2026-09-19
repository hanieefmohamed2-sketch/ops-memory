# OPS MEMORY

**AI-Powered Operational Knowledge Continuity System**

OPS MEMORY captures, preserves, and retrieves operational knowledge, incident reports, and system insights to ensure seamless team continuity and fast post-mortem analysis.

---

## Project Structure

```text
ops-memory/
├── backend/            # FastAPI Python server (REST API, AI engine, Postgres/pgvector DB)
├── frontend/           # Vite + React + TypeScript + Tailwind CSS SPA
└── README.md
```

---

## Quick Start

### 1. Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- API Base URL: `http://localhost:8000`
- Health Check: `http://localhost:8000/health`
- Swagger Docs: `http://localhost:8000/docs`

### 2. Frontend Setup (React + Vite + Tailwind CSS)

```bash
cd frontend
npm install
npm run dev
```

- Web App URL: `http://localhost:5173`

---

## Module Overview

- **Dashboard** (`/`): Overview metrics, recent incidents, system status.
- **New Incident** (`/incidents/new`): Capture operational incidents and lessons learned.
- **Incidents List** (`/incidents`): Filterable archive of all recorded incidents.
- **Knowledge Explorer** (`/knowledge`): Semantic search & vector-indexed docs.
- **Intelligence** (`/intelligence`): AI assistant & automated synthesis.
- **Analytics** (`/analytics`): Incident trends, mean-time-to-resolution, tag metrics.
- **Knowledge Management** (`/management`): Data source management, ingestion pipelines & integrations.
