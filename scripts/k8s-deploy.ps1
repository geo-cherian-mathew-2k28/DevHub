# DevHub - Kubernetes Local Deployment Script with kind (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "       DevHub Kubernetes (kind) Deployment" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

$clusterName = "devhub"

# 1. Check or Create kind Cluster
$existingClusters = kind get clusters 2>&1
if ($existingClusters -match "\b$clusterName\b") {
    Write-Host "[1/5] kind cluster '$clusterName' already exists." -ForegroundColor Green
} else {
    Write-Host "[1/5] Creating kind cluster '$clusterName'..." -ForegroundColor Yellow
    kind create cluster --name $clusterName
    Write-Host "Cluster created successfully." -ForegroundColor Green
}

# 2. Build Docker Images locally
Write-Host "`n[2/5] Building local container images for Kubernetes..." -ForegroundColor Yellow
docker build -t devhub-api:local ./backend
docker build -t devhub-frontend:local ./frontend
Write-Host "Images built successfully." -ForegroundColor Green

# 3. Load Images into kind Nodes
# (Crucial educational step: kind nodes are separate Docker containers that cannot access host images without loading)
Write-Host "`n[3/5] Loading images into kind cluster nodes..." -ForegroundColor Yellow
kind load docker-image devhub-api:local --name $clusterName
kind load docker-image devhub-frontend:local --name $clusterName
Write-Host "Images loaded into kind nodes." -ForegroundColor Green

# 4. Apply Kubernetes Manifests
Write-Host "`n[4/5] Applying Kubernetes manifests via Kustomize..." -ForegroundColor Yellow
kubectl apply -k k8s/

# 5. Wait for Deployments to Roll Out
Write-Host "`n[5/5] Waiting for pods to reach Ready state..." -ForegroundColor Yellow
kubectl rollout status deployment/postgres -n devhub --timeout=90s
kubectl rollout status deployment/backend -n devhub --timeout=90s
kubectl rollout status deployment/frontend -n devhub --timeout=90s

Write-Host "`n===============================================" -ForegroundColor Green
Write-Host "DevHub has successfully deployed to kind!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

Write-Host "`nCluster Resources in 'devhub' namespace:" -ForegroundColor Cyan
kubectl get pods,services,pvc -n devhub

Write-Host "`nNext Steps for the Workshop:" -ForegroundColor Yellow
Write-Host "1. Access the Frontend via port-forwarding:"
Write-Host "   kubectl port-forward service/frontend 8080:80 -n devhub" -ForegroundColor White
Write-Host "   (Then visit: http://localhost:8080 in your browser)"
Write-Host ""
Write-Host "2. Scale the Backend Deployment to 3 replicas:"
Write-Host "   kubectl scale deployment/backend --replicas=3 -n devhub" -ForegroundColor White
Write-Host ""
Write-Host "3. Test self-healing by deleting a backend pod:"
Write-Host "   kubectl get pods -n devhub" -ForegroundColor White
Write-Host "   kubectl delete pod <POD_NAME> -n devhub" -ForegroundColor White
Write-Host ""
Write-Host "4. Clean up the cluster when done:"
Write-Host "   kind delete cluster --name devhub`n" -ForegroundColor White
