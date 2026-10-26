from fastapi import APIRouter
from pydantic import BaseModel, Field
import httpx
from app.config import settings

router = APIRouter(prefix="/api/ai", tags=["ai"])


class SuggestDescriptionRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)


class SuggestDescriptionResponse(BaseModel):
    suggested_description: str
    source: str
    model: str


@router.post("/suggest-description", response_model=SuggestDescriptionResponse)
async def suggest_description(req: SuggestDescriptionRequest):
    """
    Educational AI helper for generating task descriptions.
    If Docker Model Runner (or local Ollama) is configured and running, it calls the local model.
    Otherwise, it falls back to an educational heuristic template so the app is always functional!
    """
    title = req.title.strip()

    if settings.MODEL_RUNNER_ENABLED:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(
                    f"{settings.MODEL_RUNNER_URL}/api/generate",
                    json={
                        "model": "smollm2:135m",
                        "prompt": f"Write a concise 2-sentence actionable description for the task: '{title}'.",
                        "stream": False,
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("response", "").strip()
                    if response_text:
                        return SuggestDescriptionResponse(
                            suggested_description=response_text,
                            source="Docker Model Runner",
                            model="smollm2:135m",
                        )
        except Exception:
            # Gracefully degrade to fallback if model runner is unavailable
            pass

    # High-quality contextual heuristic fallback for workshop users
    keywords_map = {
        "docker": "Package the service into an optimized container image with multi-stage build, minimal attack surface, and non-root execution.",
        "compose": "Define multi-container network configuration and ensure persistent storage via named volumes with healthcheck dependencies.",
        "kubernetes": "Create standard manifests (Deployment, Service, PVC, ConfigMap, Secret) and verify pod scheduling on kind.",
        "database": "Configure PostgreSQL credentials through environment variables and verify persistence across container recreation.",
        "test": "Execute automated integration and smoke tests to verify HTTP endpoints and database queries.",
        "security": "Scan container images using Docker Scout to inspect base image layers and remediate high-severity CVEs.",
    }

    lowered = title.lower()
    for key, desc in keywords_map.items():
        if key in lowered:
            return SuggestDescriptionResponse(
                suggested_description=f"{desc} (Auto-generated template for '{title}')",
                source="DevHub Rule Engine (Model Runner optional)",
                model="heuristic-fallback",
            )

    return SuggestDescriptionResponse(
        suggested_description=f"Define actionable acceptance criteria and implementation steps for '{title}'. Ensure all changes are covered by tests.",
        source="DevHub Rule Engine (Model Runner optional)",
        model="heuristic-fallback",
    )
