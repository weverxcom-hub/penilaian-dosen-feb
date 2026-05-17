"""FastAPI entrypoint for the Penilaian Dosen FEB platform."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import Base, SessionLocal, engine
from app.routers import admin as admin_router
from app.routers import public as public_router
from app.seed import seed_all

app = FastAPI(title="Penilaian Dosen FEB", version="0.1.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.on_event("startup")
def on_startup() -> None:
    # Import models so SQLAlchemy registers them on Base.metadata.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_all(db)
    finally:
        db.close()


app.include_router(public_router.router)
app.include_router(admin_router.router)


@app.get("/healthz")
async def healthz() -> dict:
    return {"status": "ok"}
