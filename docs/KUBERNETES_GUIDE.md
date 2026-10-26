# Kubernetes & kind Deployment Guide

Learn how to take your containerized DevHub application and orchestrate it using **Kubernetes** with **kind** (Kubernetes in Docker).

---

## 1. Kubernetes Core Concepts for Beginners

| Concept | Explanation | Real-world Analogy |
| :--- | :--- | :--- |
| **Cluster** | A collection of physical or virtual machines running Kubernetes | A shipping shipyard |
| **Node** | A single server or virtual machine in the cluster | An individual crane or worker at the dock |
| **Pod** | The smallest deployable unit in Kubernetes (wraps 1 or more containers) | A standard shipping container |
| **Deployment** | Manages a declarative state of Pod replicas, rolling updates, and self-healing | A fleet manager ensuring 3 trucks are always driving |
| **Service** | A stable internal IP address and DNS name that load-balances traffic across Pods | A company switchboard routing calls to available reps |
| **ConfigMap** | Injects non-sensitive environment configuration into Pods | A printed company handbook |
| **Secret** | Injects sensitive configuration (passwords, tokens) into Pods | A locked drawer containing keys |
| **PersistentVolumeClaim (PVC)** | Requests durable persistent storage from the cluster | A reservation for long-term warehouse space |

---

## 2. What is kind?

`kind` (Kubernetes IN Docker) creates local Kubernetes clusters using Docker containers as cluster nodes.

When you run `kind create cluster --name devhub`, Docker starts a container named `devhub-control-plane` containing `kube-apiserver`, `etcd`, `kube-scheduler`, and `containerd`.

### The Critical "Local Image Loading" Concept
> [!IMPORTANT]
> Because kind nodes are separate Docker containers, images on your host machine's Docker engine are **not** automatically visible inside the Kubernetes cluster!
> You must explicitly load them into kind:
> ```powershell
> kind load docker-image devhub-api:local --name devhub
> kind load docker-image devhub-frontend:local --name devhub
> ```
> And your Kubernetes manifests must set `imagePullPolicy: IfNotPresent` so Kubernetes doesn't try pulling local images from the public Docker Hub registry!

---

## 3. Kubernetes Manifest Breakdown

DevHub defines manifests in `k8s/`:
* `k8s/namespace.yaml`: Isolates DevHub workloads under the `devhub` namespace.
* `k8s/configmap.yaml`: Supplies database host name (`postgres`), port (`5432`), and app config.
* `k8s/secret.example.yaml`: Supplies credentials.

> [!WARNING]
> **Secret Encoding vs. Encryption:** Kubernetes Secrets encode data in base64. Base64 is an encoding format, NOT encryption! Anyone with `kubectl get secret -o yaml` can decode it. Production clusters use KMS envelope encryption, HashiCorp Vault, or External Secrets Operators.

* `k8s/postgres.yaml`: Deploys PostgreSQL with a 1Gi `PersistentVolumeClaim`. Uses `strategy: Recreate` so only one pod accesses the disk volume.
* `k8s/backend.yaml`: Deploys 2 replicas of the FastAPI backend. Configures non-root user (UID 10001), resource requests/limits, HTTP liveness probe (`/api/health`), and readiness probe (`/api/ready`).
* `k8s/frontend.yaml`: Deploys 2 replicas of the Nginx/React frontend.

---

## 4. Hands-On Deployment Walkthrough

### Step 1: Create the kind Cluster
```powershell
kind create cluster --name devhub
```

### Step 2: Build the Images
```powershell
docker build -t devhub-api:local ./backend
docker build -t devhub-frontend:local ./frontend
```

### Step 3: Load Images into kind
```powershell
kind load docker-image devhub-api:local --name devhub
kind load docker-image devhub-frontend:local --name devhub
```

### Step 4: Apply Manifests with Kustomize
```powershell
kubectl apply -k k8s/
```

### Step 5: Verify Deployment Status
```powershell
# Watch pods come online
kubectl get pods -n devhub -w

# Check rollout status
kubectl rollout status deployment/backend -n devhub
```

### Step 6: Access the Application via Port-Forward
Because the cluster is inside Docker, port-forward the frontend service to your host:
```powershell
kubectl port-forward service/frontend 8080:80 -n devhub
```
Open [http://localhost:8080](http://localhost:8080) in your browser. Create a new task!

---

## 5. Kubernetes Self-Healing & Scaling Exercises

### Exercise A: Scale the Backend Deployment
Observe how easily Kubernetes scales stateless workloads:
```powershell
kubectl scale deployment/backend --replicas=4 -n devhub
kubectl get pods -n devhub -l app=backend
```

### Exercise B: Test Self-Healing (Pod Replacement)
Delete one of the backend pods:
```powershell
$pod = (kubectl get pods -n devhub -l app=backend -o jsonpath="{.items[0].metadata.name}")
kubectl delete pod $pod -n devhub
```
Run `kubectl get pods -n devhub`. Notice that the Deployment immediately launched a new replacement Pod!

---

## 6. Persistence & Production Realities

* In kind, storage is provisioned by the `standard` local-path storage provisioner on the kind node.
* While a Pod can be deleted and replaced without losing data, the database is still a **single instance**.
* **Never simply increase database replicas (`replicas: 2`) on PostgreSQL without a cluster replication coordinator** (such as CloudNativePG, Zalando Postgres Operator, or CrunchyData PGO). Naively scaling a relational database causes split-brain data corruption!

---

## 7. Cluster Cleanup

When you have finished the workshop:
```powershell
kind delete cluster --name devhub
```
This safely deletes the kind container node without affecting any other Docker images or containers on your machine.
