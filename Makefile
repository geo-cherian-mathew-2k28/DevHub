# DevHub Automation Makefile

.PHONY: help check up dev down test k8s clean logs

help:
	@echo "DevHub Commands:"
	@echo "  make check       Run environment pre-flight checks"
	@echo "  make up          Start full stack with Docker Compose"
	@echo "  make dev         Start development mode with hot reload"
	@echo "  make down        Stop Docker Compose containers"
	@echo "  make logs        Follow container logs"
	@echo "  make test        Execute automated test suite"
	@echo "  make k8s         Deploy stack to local kind cluster"
	@echo "  make clean       Stop containers and delete volumes (warning: resets DB)"

check:
	@powershell -ExecutionPolicy Bypass -File scripts/setup-check.ps1

up:
	@powershell -ExecutionPolicy Bypass -File scripts/dev-up.ps1

dev:
	docker compose -f compose.dev.yaml up --build

down:
	docker compose down

logs:
	docker compose logs -f

test:
	@powershell -ExecutionPolicy Bypass -File scripts/test.ps1

k8s:
	@powershell -ExecutionPolicy Bypass -File scripts/k8s-deploy.ps1

clean:
	docker compose down -v
