import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import pool_graph
from .config import get_settings
from .routes import router

logger = logging.getLogger(__name__)
settings = get_settings()


async def _warm_pool_graph() -> None:
    """Build the connection graph up front so the first game doesn't wait on it."""
    try:
        graph = await pool_graph.get_pool_graph(settings)
        logger.info("Pool graph ready: %d titles", len(graph.media_by_key))
    except asyncio.CancelledError:
        raise
    except Exception:
        # Leave it to the first request to retry — a cold cache is slow, not broken.
        logger.warning("Could not warm the pool graph at startup", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    warmup = asyncio.create_task(_warm_pool_graph())
    yield
    warmup.cancel()


app = FastAPI(title="Dizilink API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api")
