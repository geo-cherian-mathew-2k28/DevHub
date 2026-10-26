# Docker Fundamentals & Architecture Guide

This guide introduces core containerization principles using DevHub's codebase as a real-world reference.

---

## 1. Containers vs. Virtual Machines

* **Virtual Machine (VM):** Bundles an entire guest Operating System, virtualized kernel, drivers, and heavy memory overhead. Startup takes minutes.
* **Docker Container:** An isolated user-space process sharing the host operating system's kernel. Startup takes milliseconds, memory usage is measured in megabytes, and containers are completely portable across Linux, Windows, and macOS.

```
+-----------------------------------+     +-----------------------------------+
|      Virtual Machines (VMs)       |     |        Docker Containers          |
| +-----------+       +-----------+ |     | +-----------+       +-----------+ |
| |   App A   |       |   App B   | |     | | Frontend  |       |  Backend  | |
| +-----------+       +-----------+ |     | +-----------+       +-----------+ |
| | Guest OS  |       | Guest OS  | |     | | Bin/Libs  |       | Bin/Libs  | |
| +-----------+       +-----------+ |     | +-----------+-------+-----------+ |
| |           Hypervisor          | |     | |         Docker Engine         | |
| +-------------------------------+ |     | +-------------------------------+ |
| |        Host Operating System  | |     | |     Host OS (Shared Kernel)   | |
+-----------------------------------+     +-----------------------------------+
```

---

## 2. Image vs. Container

* **Image:** An immutable, read-only template consisting of stacked filesystem layers. Think of it as the compiled *class* or *blueprint*.
* **Container:** A runnable, isolated instance of an image with a thin, writable top layer. Think of it as an instantiated *object*.

---

## 3. Anatomy of a Dockerfile

DevHub's backend (`backend/Dockerfile`) demonstrates production best practices:

```dockerfile
# 1. Base Image: Use official, pinned slim Debian/Alpine images
FROM python:3.12-slim-bookworm AS base

# 2. Environment Flags: Optimize Python execution in containers
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 3. Non-Root Security: Avoid running as root!
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/bash -m appuser

WORKDIR /app

# 4. Layer Caching: Copy dependencies file before source code
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Application Code: Copy only necessary runtime files
COPY alembic.ini .
COPY migrations/ ./migrations/
COPY app/ ./app/

# 6. Privilege Drop: Switch to the non-privileged user
USER appuser

EXPOSE 8000

# 7. Healthcheck: Built-in liveness verification
HEALTHCHECK --interval=15s --timeout=5s CMD curl -f http://localhost:8000/api/health || exit 1

# 8. Entrypoint: The process that receives PID 1 signals
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 4. Multi-Stage Builds

Why ship a 1.2 GB Node.js build environment when production only needs 30 MB of static HTML/JS?

DevHub's frontend (`frontend/Dockerfile`) utilizes **multi-stage builds**:

```
[ Stage 1: Build Stage ]               [ Stage 2: Production Runtime ]
node:20-alpine                        nginx:1.27-alpine
 - Installs devDependencies            - Zero Node.js or npm tooling
 - Runs TypeScript compiler            - Custom lightweight reverse-proxy config
 - Generates /dist static bundle  ---> - Copies ONLY compiled assets (/dist)
                                       - Final image size: ~35 MB!
```

---

## 5. Build Context and `.dockerignore`

When you run `docker build -t devhub-api:local ./backend`, the Docker CLI sends the specified folder (the **build context**) to the Docker daemon.

Using `.dockerignore` is critical because:
1. It prevents leaking sensitive files (`.env`, private keys).
2. It excludes unnecessary files (`node_modules`, `.git`, `__pycache__`), vastly accelerating build speeds.
3. It keeps layer caches valid across machines.
