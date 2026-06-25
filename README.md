# Ravan AI by Qyntraix Cyber Defence

Ravan AI is a premium AI-powered cybersecurity intelligence platform built with Next.js 15, FastAPI, and PostgreSQL.

## Architecture & Tech Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: FastAPI (Python), SQLAlchemy, PostgreSQL, Redis
- **AI Layer**: Multi-model routing (OpenAI, Anthropic, Gemini, DeepSeek, Llama)
- **Knowledge Base**: ChromaDB for semantic search over documents (PDFs, etc.)
- **Billing**: Razorpay Integration

## Prerequisites

- [Docker & Docker Compose](https://www.docker.com/)
- [Node.js 18+](https://nodejs.org/)
- [Python 3.10+](https://www.python.org/)

## Local Development Setup

### 1. Infrastructure
Start the database (PostgreSQL), Redis, and ChromaDB:
```bash
docker-compose up -d
```

### 2. Backend (FastAPI)
1. Navigate to the `backend` directory.
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `source venv/bin/activate` (or `.\venv\Scripts\activate` on Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and fill in API keys.
6. Run the server: `uvicorn app.main:app --reload`
   - API Docs will be available at: http://localhost:8000/docs

### 3. Frontend (Next.js)
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`.
4. Run the development server: `npm run dev`
   - App will be available at: http://localhost:3000

## Deployment Guide

### Vercel (Frontend)
1. Push your code to a GitHub repository.
2. Import the project in Vercel.
3. Set the root directory to `frontend`.
4. Add the necessary Environment Variables.
5. Deploy.

### Cloud Run / Docker (Backend)
1. Build the Docker image for the backend.
2. Deploy the container to Google Cloud Run, AWS ECS, or your preferred container hosting service.
3. Use a managed PostgreSQL database (e.g., AWS RDS, Supabase, Google Cloud SQL) for production.
4. Ensure environment variables are securely injected into the container.
