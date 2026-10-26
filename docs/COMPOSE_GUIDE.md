# Docker Compose In-Depth Guide

Docker Compose is a declarative tool for defining and running multi-container Docker applications using a single YAML configuration file.

---

## 1. Why Docker Compose?

Without Compose, launching DevHub would require manually running 3 long CLI commands, manually creating a user-defined network, passing environment variables individually, and remembering volume mount syntax:

```
+-----------------------------------------------------------+
|                      devhub-network                       |
|                                                           |
|  +--------------------+         +---------------------+   |
|  |  devhub-frontend   |  /api   |   devhub-backend    |   |
|  |  (Nginx :80)       | ------> |   (FastAPI :8000)   |   |
|  +--------------------+         +---------------------+   |
|            |                               |              |
|       Host :3000                           | SQL :5432    |
|                                            v              |
|                                 +---------------------+   |
|                                 |      devhub-db      |   |
|                                 |  (PostgreSQL :5432) |   |
|                                 +---------------------+   |
|                                            |              |
|                                            v              |
|                               [ devhub_postgres_data ]    |
|                                   (Named Volume)          |
+-----------------------------------------------------------+
```

With Docker Compose, one command (`docker compose up -d`) creates the network, configures volumes, builds images, and starts all containers in dependency order.

---

## 2. Key Concepts in DevHub's `compose.yaml`

### A. Internal DNS & Service Discovery
Docker automatically provides internal DNS resolution on user-defined networks. When the backend needs to connect to PostgreSQL, it connects to `db:5432`—the service name defined in `compose.yaml`.

The database port `5432` does **not** need to be published to your host computer for the application to work! Keeping database ports internal reduces attack surface and prevents host port conflicts.

### B. Healthchecks & Startup Sequencing
In real production applications, container startup order is not enough—a database process might take 5 seconds to initialize its data directory after the container starts.

```yaml
backend:
  depends_on:
    db:
      condition: service_healthy # Waits until pg_isready returns 0
```

### C. Persistent Storage with Named Volumes
Containers are ephemeral by default. If a container stops or is replaced, changes in its writable layer disappear.
To preserve database records:
```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```
Docker mounts the named volume `devhub_postgres_data` from the host's protected Docker storage directory into the container.

---

## 3. Core Compose Commands

| Command | Purpose |
| :--- | :--- |
| `docker compose config` | Validates YAML syntax and previews merged environment variables |
| `docker compose up -d --build` | Builds images and starts all services in the background |
| `docker compose ps` | Displays service status, healthcheck state, and port mappings |
| `docker compose logs -f` | Streams consolidated, color-coded logs from all containers |
| `docker compose exec backend sh` | Enters a shell inside the running backend container |
| `docker compose restart backend` | Restarts a specific service without affecting others |
| `docker compose down` | Stops and removes containers and networks (**preserves volume data!**) |
| `docker compose down -v` | **DESTRUCTIVE:** Stops containers AND deletes persistent volumes |

> [!WARNING]
> Running `docker compose down -v` permanently erases the `devhub_postgres_data` volume and deletes all tasks! Always use `docker compose down` for normal stopping.

---

## 4. Development Workflow (Hot Reloading)

For rapid day-to-day coding, DevHub provides `compose.dev.yaml`:
* **Backend:** Mounts `./backend/app` directly into `/app/app` and runs `uvicorn --reload`. When you edit Python code, the server restarts instantly without rebuilding the image!
* **Frontend:** Mounts `./frontend` and runs Vite's development server with Hot Module Replacement (HMR) on port `5173`.
* **Database:** Exposes port `5432` to localhost so you can inspect tables with database tools like DBeaver or TablePlus.

### Starting Dev Mode:
```powershell
docker compose -f compose.dev.yaml up --build
```
