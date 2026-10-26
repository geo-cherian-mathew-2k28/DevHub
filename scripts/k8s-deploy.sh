#!/usr/bin/env bash
# DevHub - Kubernetes Local Deployment Script with kind (Bash)

set -e

echo ""
echo "==============================================="
echo "       DevHub Kubernetes (kind) Deployment"
echo "==============================================="
echo ""

cluster_name="devhub"

# 1. Check or Create kind Cluster
if kind get clusters 2>/dev/null | grep -q "^${cluster_name}$"; then
    echo "[1/5] kind cluster '${cluster_name}' already exists."
else
    echo "[1/5] Creating kind cluster '${cluster_name}'..."
    kind create cluster --name "$cluster_name"
fi

# 2. Build Docker Images
echo ""
echo "[2/5] Building local container images..."
docker build -t devhub-api:local ./backend
docker build -t devhub-frontend:local ./frontend

# 3. Load Images into kind
echo ""
echo "[3/5] Loading images into kind cluster nodes..."
kind load docker-image devhub-api:local --name "$cluster_name"
kind load docker-image devhub-frontend:local --name "$cluster_name"

# 4. Apply Manifests
echo ""
echo "[4/5] Applying Kubernetes manifests..."
kubectl apply -k k8s/

# 5. Wait for Rollout
echo ""
echo "[5/5] Waiting for pods to reach Ready state..."
kubectl rollout status deployment/postgres -n devhub --timeout=90s
kubectl rollout status deployment/backend -n devhub --timeout=90s
kubectl rollout status deployment/frontend -n devhub --timeout=90s

echo ""
echo "==============================================="
echo "DevHub has successfully deployed to kind!"
echo "==============================================="
echo ""
kubectl get pods,services,pvc -n devhub
echo ""
echo "Access the frontend via:"
echo "kubectl port-forward service/frontend 8080:80 -n devhub"
echo ""
