# DevHub — Full-Stack Docker & Kubernetes Learning Platform

[![CI/CD Build & Verification](https://github.com/YOUR_USERNAME/devhub/actions/workflows/docker-build.yml/badge.svg)](https://github.com/YOUR_USERNAME/devhub/actions)
[![Docker](https://img.shields.io/badge/Docker-29.2%2B-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-kind-326CE5?logo=kubernetes&logoColor=white)](https://kind.sigs.k8s.io/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

**DevHub** is an educational, production-minded web application engineered specifically to teach Docker and Kubernetes from the ground up to complete beginners.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [What You Will Build & Learn](#2-what-you-will-build--learn)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Prerequisites](#4-prerequisites)
5. [Quickstart (3-Minute Setup)](#5-quickstart-3-minute-setup)
6. [How to Run DevHub](#6-how-to-run-devhub)
7. [Automated Verification & Testing](#7-automated-verification--testing)
8. [Docker Compose Mastery](#8-docker-compose-mastery)
9. [Inspecting & Debugging Containers](#9-inspecting--debugging-containers)
10. [Networking & Volume Persistence](#10-networking--volume-persistence)
11. [Building & Publishing to Docker Hub](#11-building--publishing-to-docker-hub)
12. [Deploying to Kubernetes with kind](#12-deploying-to-kubernetes-with-kind)
13. [Vulnerability Scanning with Docker Scout](#13-vulnerability-scanning-with-docker-scout)
14. [Optional Advanced AI & Tooling (Gordon, Model Runner, MCP)](#14-optional-advanced-ai--tooling)
15. [Troubleshooting Guide](#15-troubleshooting-guide)
16. [Safe Cleanup & Teardown](#16-safe-cleanup--teardown)
17. [Official Documentation Links](#17-official-documentation-links)

---

## 1. Project Overview

Most Docker tutorials use toy examples like a static "Hello World" or an in-memory counter that don't reflect real software development.

**DevHub is different.** It is a complete, working task management application built with industry standards:
* **Frontend:** React 18, TypeScript, and Vite served by high-performance Nginx.
* **Backend:** Python 3.12, FastAPI, SQLAlchemy ORM, and Alembic database migrations.
* **Database:** PostgreSQL 16 Alpine, with state persisted via named Docker volumes.
* **Orchestration:** Multi-container Docker Compose and native Kubernetes (`kind`) manifests.

---

## 2. What You Will Build & Learn

By working through this repository, you will master:
1. Writing production Dockerfiles with **multi-stage builds** and **non-root security** (`USER 10001`).
2. Isolating dependencies and drastically cutting build times using `.dockerignore` and layer caching.
3. Running multi-container environments with **Docker Compose**.
4. Connecting services using Docker networks and internal DNS service discovery (`db:5432`, `backend:8000`).
5. Persisting relational database state across container destructions using **named Docker volumes**.
6. Differentiating liveness probes (`/api/health`) from readiness probes (`/api/ready`).
7. Tagging, scanning with **Docker Scout**, and publishing images to **Docker Hub**.
8. Deploying to a local Kubernetes cluster using **kind** with Deployments, Services, ConfigMaps, Secrets, and PVCs.
9. Scaling stateless workloads and testing Kubernetes self-healing pod recovery.

---

## 3. Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                                 USER BROWSER                                    |
|                                       |                                         |
|                                 Host Port :3000                                 |
+---------------------------------------|-----------------------------------------+
                                        v
+---------------------------------------------------------------------------------+
|                        DOCKER BRIDGE NETWORK (devhub-network)                   |
|                                                                                 |
|   +------------------------------------+                                        |
|   |         devhub-frontend            |                                        |
|   |  - Nginx 1.27 Alpine (Port :80)    |                                        |
|   |  - Static React SPA (/dist)        |                                        |
|   |  - Reverse Proxies /api requests --+---------+                              |
|   +------------------------------------+         |                              |
|                                                  | /api                         |
|                                                  v                              |
|                                  +-------------------------------+              |
|                                  |        devhub-backend         |              |
|                                  |  - Python 3.12 (Port :8000)   |              |
|                                  |  - FastAPI REST API           |              |
|                                  |  - Non-root user (UID 10001)  |              |
|                                  |  - Liveness & Readiness APIs  |              |
|                                  +---------------+---------------+              |
|                                                  |                              |
|                                                  | SQL Internal                 |
|                                                  | Port :5432                   |
|                                                  v                              |
|                                  +-------------------------------+              |
|                                  |           devhub-db           |              |
|                                  |  - PostgreSQL 16 Alpine       |              |
|                                  |  - Port 5432 (Internal only)  |              |
|                                  +---------------+---------------+              |
|                                                  |                              |
+--------------------------------------------------|------------------------------+
                                                   v
                                     [ devhub_postgres_data ]
                                     (Host Persistent Volume)
```

---

## 4. Prerequisites

* **Operating System:** Windows 10/11 (WSL2 recommended), macOS 12+, or Linux.
* **Docker Desktop:** Version 25+ or later (includes Docker Compose and Buildx).
* **kubectl & kind:** For the Kubernetes exercises.
* **Pre-flight check tool:** DevHub provides an automated checker script.

---

## 5. Quickstart (3-Minute Setup)

Clone the repository and run the setup verification:

### PowerShell (Windows - Default Workshop Environment):
```powershell
# 1. Run Pre-flight Check
.\scripts\setup-check.ps1

# 2. Copy the environment configuration
Copy-Item .env.example .env

# 3. Launch DevHub with Compose
.\scripts\dev-up.ps1
```

### Bash (macOS / Linux):
```bash
# 1. Run Pre-flight Check
./scripts/setup-check.sh

# 2. Copy the environment configuration
cp .env.example .env

# 3. Launch DevHub with Compose
./scripts/dev-up.sh
```

Once started, open:
* **Frontend Web Application:** [http://localhost:3000](http://localhost:3000)
* **Interactive OpenAPI (Swagger) Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Backend Liveness Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)
* **Backend Database Readiness Check:** [http://localhost:8000/api/ready](http://localhost:8000/api/ready)

---

## 6. How to Run DevHub

### Production-Like Mode (Default)
Builds optimized, minimal production container images:
```powershell
docker compose up -d --build
```

### Development Mode (Live Hot Reloading)
Mounts local source files directly into containers, enabling instant hot-reloading without rebuilding images:
```powershell
docker compose -f compose.dev.yaml up
```
* Frontend runs on Vite dev server: [http://localhost:5173](http://localhost:5173)
* Backend runs with `uvicorn --reload` on port `8000`
* PostgreSQL port `5432` is exposed for local GUI inspection (DBeaver, TablePlus)

---

## 7. Automated Verification & Testing

DevHub comes with a comprehensive test suite including backend unit/integration tests and live HTTP smoke tests.

### Run Tests:
* **Windows (PowerShell):**
  ```powershell
  .\scripts\test.ps1
  ```
* **macOS / Linux (Bash):**
  ```bash
  ./scripts/test.sh
  ```

### What the test suite validates:
* **Liveness:** `GET /api/health` returns HTTP 200 independently of the database.
* **Readiness:** `GET /api/ready` confirms PostgreSQL connectivity.
* **CRUD Operations:** Creation (`POST`), Retrieval (`GET`), Partial Update (`PATCH`), Deletion (`DELETE`).
* **Input Validation:** Rejection of empty titles, invalid enum values, or oversized payloads (HTTP 422).
* **Error Handling:** Returning 404 for nonexistent task IDs.
* **Live Smoke Test:** Verifies the full frontend & backend integration against PostgreSQL.

---

## 8. Docker Compose Mastery

```powershell
# Preview compiled configuration with variables resolved
docker compose config

# Check container status and health
docker compose ps

# Follow live container logs
docker compose logs -f

# Follow logs of only the backend
docker compose logs -f backend

# Stop containers safely (Preserves persistent database data)
docker compose down

# Stop containers AND delete persistent volumes (DESTRUCTIVE RESET)
docker compose down -v
```

---

## 9. Inspecting & Debugging Containers

When troubleshooting containers, use these standard diagnostic commands:

```powershell
# Open a shell inside the running backend container
docker compose exec backend sh

# Inspect container environment variables, IP address, and mounts
docker inspect devhub-backend

# Check container real-time CPU and Memory usage
docker stats

# Run an ad-hoc query against PostgreSQL from inside the database container
docker compose exec db psql -U devhub -d devhub_db -c "SELECT id, title, priority, status FROM tasks;"
```

---

## 10. Networking & Volume Persistence

### Internal DNS & Networking
In DevHub's `devhub-network`, containers talk to each other using service names:
* The backend connects to `postgresql+psycopg2://...@{db}:5432/...`
* The frontend Nginx config proxies `/api/` traffic to `http://backend:8000/api/`
* The database port `5432` is kept **internal** to the Docker network in production mode for security.

### Volume Persistence Exercise (The Survival Test)
Learn why containers are ephemeral but volumes are durable:
1. Open [http://localhost:3000](http://localhost:3000) and create a task named `"Important Workshop Milestone"`.
2. Stop and completely destroy the database container:
   ```powershell
   docker compose stop db
   docker compose rm -f db
   ```
3. Re-launch the database container:
   ```powershell
   docker compose up -d db
   ```
4. Refresh your browser at [http://localhost:3000](http://localhost:3000).
5. **Notice:** Your task is still intact because its storage was mapped to the named Docker volume `devhub_postgres_data`!

---

## 11. Building & Publishing to Docker Hub

```powershell
# 1. Log in to Docker Hub
docker login

# 2. Build local images
docker build -t devhub-api:local ./backend
docker build -t devhub-frontend:local ./frontend

# 3. Tag images for your registry
docker tag devhub-api:local YOUR_DOCKERHUB_USERNAME/devhub-api:1.0
docker tag devhub-frontend:local YOUR_DOCKERHUB_USERNAME/devhub-frontend:1.0

# 4. Push to Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/devhub-api:1.0
docker push YOUR_DOCKERHUB_USERNAME/devhub-frontend:1.0
```

---

## 12. Deploying to Kubernetes with kind

DevHub provides native Kubernetes manifests in `k8s/` that reuse the exact same container images!

```powershell
# 1. Automated deployment to a local kind cluster
.\scripts\k8s-deploy.ps1

# 2. Check cluster resources
kubectl get pods,services,pvc -n devhub

# 3. Port-forward the frontend service to access it on your machine
kubectl port-forward service/frontend 8080:80 -n devhub
```
Open [http://localhost:8080](http://localhost:8080) to interact with DevHub inside Kubernetes.

### Test Kubernetes Self-Healing:
```powershell
# Scale backend to 4 replicas
kubectl scale deployment/backend --replicas=4 -n devhub

# Delete a backend pod and watch Kubernetes automatically replace it
kubectl delete pod <POD_NAME> -n devhub
kubectl get pods -n devhub
```

---

## 13. Vulnerability Scanning with Docker Scout

Scan your images for Common Vulnerabilities and Exposures (CVEs):

```powershell
# Overview of image layers and vulnerabilities
docker scout quickview devhub-api:local

# Detailed CVE list
docker scout cves devhub-api:local
```

Learn how to separate base OS image patches from Python package upgrades.

---

## 14. Optional Advanced AI & Tooling

DevHub is fully functional without AI, but provides optional integrations to demonstrate cutting-edge Docker Desktop capabilities:
* **Docker Model Runner:** Run small local LLMs (`smollm2:135m`) with `docker model` to suggest task descriptions via the in-app AI assistant.
* **Gordon AI (`docker ai`):** Use Docker's built-in assistant to explain Dockerfiles and diagnose errors.
* **Docker MCP Toolkit:** Expose safe, read-only tools to AI agents using the Model Context Protocol.
* **Docker Extensions:** Explore UI plugins in Docker Desktop.

See [docs/DOCKER_DESKTOP_FEATURES.md](docs/DOCKER_DESKTOP_FEATURES.md) for detailed tutorials.

---

## 15. Troubleshooting Guide

| Problem | Cause | Quick Solution |
| :--- | :--- | :--- |
| `port is already allocated` | Another process is using port 3000, 8000, or 5432 | Stop conflicting process or change port in `compose.override.yaml` |
| `could not connect to server: Connection refused` | Database container still initializing | Wait a few seconds for healthcheck or check `docker compose logs db` |
| `ImagePullBackOff` in kind | Local image not loaded into kind cluster nodes | Run `kind load docker-image devhub-api:local --name devhub` |
| Container exited with status `137` | Out Of Memory (OOM) killer | Increase memory allocated to Docker Desktop / WSL2 (min 4 GB) |

For complete troubleshooting details, see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

---

## 16. Safe Cleanup & Teardown

### Standard Cleanup (Preserves stored tasks):
```powershell
docker compose down
```

### Complete Reset (Deletes persistent database volume):
```powershell
docker compose down -v
```

### Delete kind Kubernetes Cluster:
```powershell
kind delete cluster --name devhub
```

---

## 17. Official Documentation Links

* [Docker Documentation](https://docs.docker.com/)
* [Docker Compose Specification](https://docs.docker.com/compose/)
* [Docker Scout Documentation](https://docs.docker.com/scout/)
* [kind (Kubernetes in Docker)](https://kind.sigs.k8s.io/)
* [Kubernetes Official Documentation](https://kubernetes.io/docs/)
* [FastAPI Framework](https://fastapi.tiangolo.com/)
* [Vite Build Tool](https://vitejs.dev/)
