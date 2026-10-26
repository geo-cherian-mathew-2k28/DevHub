# DevHub Troubleshooting Guide

Common failure modes, diagnostic commands, and clear steps to resolve them.

---

## 1. Port Conflicts: "address already in use"

### Symptom
```text
Error response from daemon: driver failed programming external connectivity on endpoint devhub-frontend: Bind for 0.0.0.0:3000 failed: port is already allocated
```

### Diagnosis
Identify the process currently listening on that port:
* **Windows (PowerShell):**
  ```powershell
  Get-NetTCPConnection -LocalPort 3000 | Select-Object LocalPort, OwningProcess
  ```
* **macOS / Linux:**
  ```bash
  lsof -i :3000
  ```

### Resolution
* **Option A:** Terminate the conflicting application.
* **Option B:** Map the service to another port in your `compose.override.yaml`:
  ```yaml
  services:
    frontend:
      ports:
        - "3001:80"
  ```

---

## 2. Database Connection Refused

### Symptom
```text
sqlalchemy.exc.OperationalError: could not connect to server: Connection refused
Is the server running on host "db" (172.18.0.2) and accepting TCP/IP connections on port 5432?
```

### Diagnosis
1. Check if the database container is running:
   ```powershell
   docker compose ps
   ```
2. Check PostgreSQL container logs:
   ```powershell
   docker compose logs db
   ```
3. Test PostgreSQL readiness from inside the network:
   ```powershell
   docker compose exec db pg_isready -U devhub -d devhub_db
   ```

### Resolution
* Ensure the service name in `DATABASE_URL` matches the compose service name (`db`, not `localhost`).
* Verify that `POSTGRES_PASSWORD` matches between the `db` service and `backend` service.

---

## 3. Container Exited (Code 137)

### Symptom
Container suddenly terminates with exit code `137`.

### Diagnosis & Cause
Exit code 137 indicates the container was killed by **SIGKILL**, almost always caused by an **Out Of Memory (OOM)** killer invocation.

### Resolution
* Check Docker Desktop Memory allocation: Settings &rarr; Resources &rarr; increase RAM to at least 4 GB (or 6 GB if running kind).
* If on WSL2, verify your `%USERPROFILE%\.wslconfig` allocates sufficient memory:
  ```ini
  [wsl2]
  memory=6GB
  ```

---

## 4. Kubernetes: `ImagePullBackOff` or `ErrImagePull` in kind

### Symptom
```text
NAME                      READY   STATUS             RESTARTS   AGE
backend-78b7b7449-74m8r   0/1     ImagePullBackOff   0          42s
```

### Diagnosis
Inspect the pod events:
```powershell
kubectl describe pod <POD_NAME> -n devhub
```
Look for: `Failed to pull image "devhub-api:local": rpc error: code = NotFound desc = failed to pull and unpack image ...`

### Cause
`kind` nodes are isolated containers. The local image exists on your host machine but has not been transferred into kind's containerd storage.

### Resolution
Run:
```powershell
kind load docker-image devhub-api:local --name devhub
kind load docker-image devhub-frontend:local --name devhub
```
Ensure your Deployment manifest defines:
```yaml
imagePullPolicy: IfNotPresent
```

---

## 5. Source Code Edits Not Appearing

### Cause
* You are running the **production** compose stack (`compose.yaml`). Production builds copy files into the image at build time; subsequent edits to local disk do not affect the running container.

### Resolution
* **For production mode:** Rebuild the image:
  ```powershell
  docker compose up -d --build
  ```
* **For live hot-reloading:** Switch to the development compose stack:
  ```powershell
  docker compose -f compose.dev.yaml up
  ```

---

## 6. Docker Build Cache Bloat / Disk Full

### Diagnosis
Check your Docker disk footprint:
```powershell
docker system df
```

### Resolution
Clean up unused build cache and stopped containers:
```powershell
docker builder prune
docker system prune
```
