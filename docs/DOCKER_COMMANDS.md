# Essential Docker Command Reference

A practical command dictionary for the DevHub workshop.

---

## 1. Image Operations

### Build an Image
```powershell
# Build backend image with tag 'devhub-api:local' using context ./backend
docker build -t devhub-api:local ./backend

# Build frontend image with tag 'devhub-frontend:local' using context ./frontend
docker build -t devhub-frontend:local ./frontend
```

### List and Inspect Images
```powershell
# List local images
docker images

# Inspect image architecture, environment variables, and metadata
docker image inspect devhub-api:local

# Inspect image layers and cache contributions
docker history devhub-api:local
```

### Remove Images
```powershell
# Remove a single image
docker rmi devhub-api:local

# Remove untagged dangling images
docker image prune
```

---

## 2. Container Operations

### Run a Container
```powershell
# Run backend container in background (-d), publish port 8000 (-p), set container name (--name)
docker run -d --name my-api -p 8000:8000 devhub-api:local

# Run with environment variables
docker run -d --name my-api -e ENVIRONMENT=production -p 8000:8000 devhub-api:local
```

### Monitor and Inspect Containers
```powershell
# List running containers
docker ps

# List all containers (including stopped or exited)
docker ps -a

# View container logs with live follow (-f)
docker logs -f devhub-backend

# View container resource utilization (CPU, memory, network I/O)
docker stats
```

### Execute Commands Inside a Running Container
```powershell
# Open an interactive shell inside the backend container
docker exec -it devhub-backend sh

# Test database connection from inside the backend container
docker exec -it devhub-backend python -c "from app.database import check_db_connection; print('DB ready:', check_db_connection())"
```

### Stop and Remove Containers
```powershell
# Stop a container gracefully (sends SIGTERM, then SIGKILL after 10s)
docker stop devhub-backend

# Restart a container
docker restart devhub-backend

# Remove a stopped container
docker rm devhub-backend

# Force-stop and remove a running container
docker rm -f devhub-backend
```

---

## 3. Storage and Volumes

```powershell
# List all Docker volumes
docker volume ls

# Inspect a volume's host mount point and labels
docker volume inspect devhub_postgres_data

# Remove a specific volume (ONLY when no container is using it)
docker volume rm devhub_postgres_data
```

> [!CAUTION]
> Removing a database volume will permanently delete all task records stored in PostgreSQL!

---

## 4. Networking

```powershell
# List Docker networks
docker network ls

# Inspect network members and their assigned container IP addresses
docker network inspect devhub-network

# Create a custom bridge network manually
docker network create my-custom-net
```

---

## 5. Safe System Cleanup

```powershell
# Check disk usage consumed by Docker images, containers, and volumes
docker system df

# Clean up stopped containers and dangling images safely without deleting volumes
docker system prune

# Clean up EVERYTHING unused including unused volumes (DESTRUCTIVE - USE WITH CARE)
docker system prune --volumes
```
