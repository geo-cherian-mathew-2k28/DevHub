# ==============================================================================
# DevHub Backend Dockerfile
# Multi-stage / minimal attack-surface production image
# ==============================================================================

FROM python:3.12-slim-bookworm AS base

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

# Install runtime curl for healthchecks and libpq dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-privileged user and group for runtime security
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/bash -m appuser

WORKDIR /app

# Install Python dependencies first (leveraging Docker layer caching)
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code, migrations, and test suite
COPY alembic.ini .
COPY migrations/ ./migrations/
COPY app/ ./app/
COPY tests/ ./tests/

# Set correct ownership for non-root execution
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Document exposed container port
EXPOSE 8000

# Health check using the backend's HTTP liveness endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Production entrypoint
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
