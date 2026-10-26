# Advanced Docker Desktop Features Guide

Explore modern Docker Desktop capabilities: Docker Scout, Gordon AI, Docker Model Runner, MCP Toolkit, and Docker Extensions.

---

## 1. Docker Scout (Vulnerability Scanning)

Docker Scout analyzes container images, generates a Software Bill of Materials (SBOM), and identifies known Common Vulnerabilities and Exposures (CVEs).

### Hands-On Exercise:
1. **Build the Backend Image:**
   ```powershell
   docker build -t devhub-api:local ./backend
   ```

2. **Run a Quick Security Overview:**
   ```powershell
   docker scout quickview devhub-api:local
   ```
   *Scout analyzes each layer, categorizing vulnerabilities by severity (Critical, High, Medium, Low).*

3. **Inspect Specific CVEs:**
   ```powershell
   docker scout cves devhub-api:local
   ```

4. **Distinguish Base Image vs. Application CVEs:**
   * **Base Image Vulnerabilities:** Found in system packages (Debian `libc`, `openssl`). Resolved by updating the base image tag (e.g., `python:3.12-slim-bookworm` to the latest patch).
   * **Application Vulnerabilities:** Found in PyPI packages (`fastapi`, `pydantic`). Resolved by updating `backend/requirements.txt`.

> [!NOTE]
> A scan showing 0 known vulnerabilities does not mean software is 100% bug-free; it means no *known, cataloged* CVEs currently match your dependency versions.

---

## 2. Gordon (Docker's AI Assistant)

Gordon (`docker ai`) is an AI assistant embedded in Docker Desktop designed to analyze container states, diagnose failures, and explain Docker concepts.

### Practical Workshop Prompts for Gordon:
* `"Explain the stages in frontend/Dockerfile to a complete beginner."`
* `"Why did my backend container exit with status 137?"`
* `"Review compose.yaml and explain how service discovery works between 'backend' and 'db'."`
* `"How does a named volume differ from a bind mount?"`

> [!IMPORTANT]
> Gordon is an advisory tool. Always review and understand proposed commands and configuration changes before executing them.

---

## 3. Docker Model Runner (Local AI Inference)

Docker Model Runner allows developers to run small open-source language models locally on their workstation without paid cloud API keys.

### How DevHub Integrates with Model Runner:
* DevHub includes an optional **"Suggest with AI"** button on the task creation form.
* When `MODEL_RUNNER_ENABLED=true` in `.env`, the backend connects to `MODEL_RUNNER_URL` (e.g. `http://localhost:11434` or Docker Model Runner endpoint) to summarize task descriptions.
* If Model Runner is disabled or unavailable, DevHub **gracefully falls back** to an educational rule-based engine. The core CRUD workflow **never** depends on AI!

### Testing Local Model Runner (If supported by your machine):
```powershell
# Check Docker Model CLI
docker model --help

# Run a lightweight model prompt
docker model run smollm2:135m "Summarize best practices for Docker volumes in two bullet points"
```

---

## 4. MCP Toolkit (Model Context Protocol)

The **Model Context Protocol (MCP)** is an open standard that allows AI agents to interact with external tools and data sources safely.

### Security Principles of MCP:
1. **Least Privilege:** Expose only read-only endpoints to agents by default.
2. **Explicit Trust Boundaries:** Never give an AI agent unrestricted access to the Docker socket (`/var/run/docker.sock`) or raw database write access.
3. **Structured Schemas:** Tools must define strict input parameters.

### DevHub Read-Only Tool Example:
In an MCP configuration, DevHub exposes a read-only query tool:
```json
{
  "name": "get_task_summary",
  "description": "Returns counts of pending, in-progress, and completed tasks from DevHub",
  "parameters": {}
}
```
The agent calls `GET /api/tasks` and reports statistics to the user without any capability to delete or modify data.

---

## 5. Docker Extensions

Docker Extensions extend Docker Desktop with specialized third-party tools (e.g., Disk Usage, Logs Explorer, Kubernetes visualizers).

### Workshop Exercise:
1. Open **Docker Desktop**.
2. Click on **Extensions** in the left sidebar.
3. Browse extensions such as **Disk Usage** or **Resource Usage**.
4. Review the publisher details, permissions requested, and install the extension to inspect container resource consumption visually.
