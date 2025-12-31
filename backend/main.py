from fastapi import FastAPI
from backend.core.config import settings
from backend.database import init_db

from fastapi.middleware.cors import CORSMiddleware
from backend.api import auth_routes, maps, participants, users, geocode, notifications

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from fastapi.staticfiles import StaticFiles
import os

app.include_router(auth_routes.router)
app.include_router(maps.router)
app.include_router(participants.router)
app.include_router(users.router)
app.include_router(geocode.router)
app.include_router(notifications.router)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def read_root():
    return {"message": "Welcome to Odyssey", "environment": "DEBUG" if settings.DEBUG else "PRODUCTION"}
