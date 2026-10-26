# DevHub Workshop Runbook & Hands-On Exercises

A step-by-step, self-paced curriculum designed to take beginners from Docker zero to Kubernetes practitioner.

---

## Lab 1: Pre-flight Verification
**Objective:** Confirm your machine is ready before starting the exercises.

1. Open PowerShell (Windows) or Terminal (macOS/Linux) in the DevHub root directory:
   ```powershell
   .\scripts\setup-check.ps1
   ```
2. Verify that Docker, Docker Compose, Buildx, kind, and kubectl all display `[OK]`.

---

## Lab 2: Manual Image Building with Docker Buildx
**Objective:** Learn build contexts, tags, and multi-stage builds.

1. Build the backend image:
   ```powershell
   docker build -t devhub-api:local ./backend
   ```
2. Build the frontend image:
   ```powershell
   docker build -t devhub-frontend:local ./frontend
   ```
3. Inspect image layers and sizes:
   ```powershell
   docker images
   docker history devhub-frontend:local
   ```
   *Question to answer:* Notice how small the final frontend image is compared to the Node.js build stage. Why?

---

## Lab 3: Running DevHub with Docker Compose
**Objective:** Launch a connected multi-tier stack with declarative configuration.

1. Launch the stack:
   ```powershell
   docker compose up -d
   ```
2. Monitor service startup:
   ```powershell
   docker compose ps
   ```
   *Notice the health status transitions from `starting` to `healthy`.*
3. Open your browser:
   * Frontend: [http://localhost:3000](http://localhost:3000)
   * Backend Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
4. Stream consolidated logs:
   ```powershell
   docker compose logs -f backend
   ```

---

## Lab 4: Container Networking & Service Discovery
**Objective:** Verify that containers resolve each other by service name.

1. Inspect the Compose-created network:
   ```powershell
   docker network inspect devhub-network
   ```
2. Execute a network test from inside the frontend container to the backend:
   ```powershell
   docker compose exec frontend wget -qO- http://backend:8000/api/health
   ```
   *Observation:* The frontend reaches the backend using DNS name `backend:8000`, not an IP address!

---

## Lab 5: Volume Persistence Exercise (The Survival Test)
**Objective:** Prove that database data survives container destruction.

1. In the DevHub browser UI ([http://localhost:3000](http://localhost:3000)), create a unique task:
   * Title: `Data Persistence Verification Test`
   * Priority: `High`
2. Stop and remove the database container:
   ```powershell
   docker compose stop db
   docker compose rm -f db
   ```
3. Recreate and start the database container using the exact same named volume:
   ```powershell
   docker compose up -d db
   ```
4. Refresh your browser at [http://localhost:3000](http://localhost:3000).
5. **Result:** Your task is still there! The data was preserved in the `devhub_postgres_data` volume.

---

## Lab 6: Docker Hub Publishing Workflow
**Objective:** Tag, push, and pull images from a container registry.

*(Replace `YOUR_DOCKERHUB_USERNAME` with your personal Docker Hub username)*

1. Log in to Docker Hub:
   ```powershell
   docker login
   ```
2. Tag your local image with your registry repository name and version tag:
   ```powershell
   docker tag devhub-api:local YOUR_DOCKERHUB_USERNAME/devhub-api:1.0
   ```
3. Push the image to Docker Hub:
   ```powershell
   docker push YOUR_DOCKERHUB_USERNAME/devhub-api:1.0
   ```
4. Verify on another machine or pull directly:
   ```powershell
   docker pull YOUR_DOCKERHUB_USERNAME/devhub-api:1.0
   ```

---

## Lab 7: Image Vulnerability Scanning with Docker Scout
**Objective:** Inspect container layers and remediate vulnerabilities.

1. Run an SBOM and vulnerability quickview:
   ```powershell
   docker scout quickview devhub-api:local
   ```
2. List detailed CVEs:
   ```powershell
   docker scout cves devhub-api:local
   ```
3. Identify whether issues originate in Debian base packages or Python packages.

---

## Lab 8: Deploying to Kubernetes with kind
**Objective:** Deploy DevHub to a local Kubernetes cluster.

1. Deploy the full stack with the automated deployment script:
   ```powershell
   .\scripts\k8s-deploy.ps1
   ```
2. Inspect cluster status:
   ```powershell
   kubectl get pods -n devhub
   kubectl get services -n devhub
   kubectl get pvc -n devhub
   ```
3. Forward the frontend service to port 8080 on your host:
   ```powershell
   kubectl port-forward service/frontend 8080:80 -n devhub
   ```
4. Visit [http://localhost:8080](http://localhost:8080) and create a task in Kubernetes!

---

## Lab 9: Scaling & Self-Healing in Kubernetes
**Objective:** Observe Kubernetes maintaining desired state.

1. Scale the backend to 4 replicas:
   ```powershell
   kubectl scale deployment/backend --replicas=4 -n devhub
   kubectl get pods -n devhub -l app=backend
   ```
2. Simulate a crash by manually killing one of the backend pods:
   ```powershell
   $podName = (kubectl get pods -n devhub -l app=backend -o jsonpath="{.items[0].metadata.name}")
   kubectl delete pod $podName -n devhub
   ```
3. Immediately list pods again:
   ```powershell
   kubectl get pods -n devhub -l app=backend
   ```
   *Notice Kubernetes instantly scheduled a brand new replacement pod!*

---

## Lab 10: Clean Workshop Teardown
**Objective:** Safely clean up all workshop resources.

1. Delete the Kubernetes kind cluster:
   ```powershell
   kind delete cluster --name devhub
   ```
2. Stop Compose containers (if running):
   ```powershell
   docker compose down
   ```
3. (Optional) Remove the database volume if you want a complete reset:
   ```powershell
   docker compose down -v
   ```
