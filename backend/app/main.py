import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.database import engine, Base
from app.api.routes import router as task_router
from app.api.ai_routes import router as ai_router
from app.api.pipeline_routes import router as pipeline_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("devhub")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager:
    Initializes database schema on startup if needed and handles clean shutdown.
    """
    logger.info("Starting DevHub API backend...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    try:
        # Create tables automatically on startup for development convenience
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as exc:
        logger.warning(f"Could not connect to database on startup: {exc}")
        logger.warning("The application will start, but /api/ready will report 503 until the DB is reachable.")
    yield
    logger.info("DevHub API backend shutting down...")


app = FastAPI(
    title="DevHub API",
    version="1.0.0",
    description="Educational REST API for learning Docker and Kubernetes from the ground up.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Provides clear, structured validation errors for learners and frontends."""
    errors = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err.get("loc", []))
        errors.append({
            "field": field,
            "message": err.get("msg"),
            "type": err.get("type"),
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "The request body or parameters failed validation.",
            "details": errors,
        },
    )


@app.get("/", tags=["root"], summary="Root service status")
def root():
    return {
        "name": "DevHub API",
        "version": "1.0.0",
        "status": "online",
        "documentation": "/docs",
        "health": "/api/health",
        "ready": "/api/ready",
        "tasks": "/api/tasks",
    }


# Include API routers
app.include_router(task_router)
app.include_router(ai_router)
app.include_router(pipeline_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
