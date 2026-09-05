# Deep Researcher

A multi-agent research assistant for multi-hop, multi-source investigations.

## Current phase

This repository contains the architecture and learner build guide plus a minimal React/FastAPI scaffold. The application workflow is intentionally API-first so the agent contracts can be tested before the visual experience is expanded.

Read [docs/architecture-and-build-guide.md](docs/architecture-and-build-guide.md) for the complete design, implementation sequence, prompts, test strategy, and deployment notes.

## Repository layout

```text
backend/  FastAPI service and future LangGraph workflow
frontend/ React + TypeScript client
docs/     Architecture and learner workshop guide
```

## Quick start

### Frontend

```bash
cd frontend
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

Copy `backend/.env.example` to `backend/.env` before connecting real providers. The initial backend exposes a health endpoint and does not call external services.
