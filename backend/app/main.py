from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import router

settings = get_settings()
app = FastAPI(title="Dizilink API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api")
