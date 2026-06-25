from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .api import auth, ai, chat, knowledge, teams, voice, admin, ops, support
from .middleware.security import SecurityMiddleware

# Create all tables in the database (for development)
# In production, use Alembic migrations instead
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"WARNING: Database not available: {e}")
    print("   Server will start but DB-dependent routes will fail.")
    print("   Start PostgreSQL and restart the server to fix this.")

app = FastAPI(title="Ravan AI Enterprise API", version="1.0.0", debug=True)

# Add Security Middleware (Rate limiting, headers)
app.add_middleware(SecurityMiddleware)

import os

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
origins = [origin.strip() for origin in FRONTEND_URL.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(voice.router, prefix="/api/voice", tags=["voice"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(ops.router, prefix="/api/ops", tags=["ops"])
app.include_router(support.router, prefix="/api/support", tags=["support"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Ravan AI Enterprise API"}

