# DevHub Installation & Environment Setup Guide

Welcome to **DevHub**! This guide takes you step-by-step through configuring your local machine for the Docker and Kubernetes workshop.

---

## 1. System Requirements

| Component | Minimum | Recommended |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11 (WSL2), macOS 12+, Ubuntu 22.04+ | Windows 11 with WSL2 enabled |
| **RAM** | 8 GB | 16 GB (recommended for local Kubernetes) |
| **CPU** | 4 Cores (x86_64 or ARM64) | 6+ Cores |
| **Free Disk Space** | 10 GB | 20 GB (for container images and layers) |

---

## 2. Installing Prerequisites

### A. Docker Desktop (Windows / macOS)
1. Download and install **Docker Desktop** from [docker.com](https://www.docker.com/products/docker-desktop/).
2. On Windows:
   * Ensure **WSL 2 based engine** is checked in Docker Desktop Settings &rarr; General.
   * Allocate at least 4 GB of RAM to WSL2 / Docker Desktop (Settings &rarr; Resources).
3. Verify installation in PowerShell:
   ```powershell
   docker --version
   docker compose version
   docker buildx version
   ```

### B. Kubernetes CLI (`kubectl`)
* **Windows (via winget or Docker Desktop):**
  Docker Desktop includes `kubectl`. If not already on your PATH:
  ```powershell
  winget install -e --id Kubernetes.kubectl
  ```
* **Verify:**
  ```powershell
  kubectl version --client
  ```

### C. kind (Kubernetes in Docker)
`kind` runs local Kubernetes clusters by running cluster nodes as Docker containers.
* **Windows (PowerShell):**
  ```powershell
  # Download kind binary directly
  Invoke-WebRequest -Uri "https://github.com/kubernetes-sigs/kind/releases/download/v0.27.0/kind-windows-amd64" -OutFile "$env:APPDATA\npm\kind.exe" -UseBasicParsing
  ```
  *(Or install via winget: `winget install Kubernetes.kind`)*
* **macOS / Linux:**
  ```bash
  # Via Homebrew
  brew install kind
  ```
* **Verify:**
  ```powershell
  kind version
  ```

---

## 3. Cloning and Setting Up DevHub

1. **Clone the repository:**
   ```powershell
   git clone https://github.com/YOUR_USERNAME/devhub.git
   cd devhub
   ```

2. **Run the Automated Pre-flight Setup Check:**
   * On Windows:
     ```powershell
     .\scripts\setup-check.ps1
     ```
   * On macOS / Linux:
     ```bash
     chmod +x scripts/*.sh
     ./scripts/setup-check.sh
     ```

3. **Initialize Environment Variables:**
   Copy the provided `.env.example` to `.env`:
   * Windows PowerShell:
     ```powershell
     Copy-Item .env.example .env
     ```
   * macOS / Linux:
     ```bash
     cp .env.example .env
     ```

---

## 4. Port Conflict Inspection

DevHub uses standard ports for clarity:
* `3000`: Frontend React / Nginx dashboard
* `8000`: Backend FastAPI REST API
* `5432`: PostgreSQL database (internal to Docker network in production mode; exposed in dev mode)

If you already have PostgreSQL or another app running on your machine:
```powershell
Get-NetTCPConnection -LocalPort 3000, 8000, 5432 -ErrorAction SilentlyContinue
```
You can customize port numbers in your `.env` or `compose.override.yaml` file without altering core configuration.
