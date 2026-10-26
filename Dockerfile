# ==============================================================================
# DevHub Multi-Service Architecture Notice
# ==============================================================================
# DevHub is a modern, modular multi-container application with separated
# frontend and backend concerns.
#
# Please use the service-specific Dockerfiles:
#   - Backend API  : ./backend/Dockerfile
#   - Frontend UI  : ./frontend/Dockerfile
#
# To build both services together, use Docker Compose:
#   docker compose build
# ==============================================================================
FROM scratch
LABEL maintainer="DevHub Educational Team"
LABEL description="Root pointer. Refer to frontend/Dockerfile and backend/Dockerfile"
