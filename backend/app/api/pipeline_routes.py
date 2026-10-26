import asyncio
import time
from datetime import datetime, timezone
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.pipeline import Pipeline, PipelineStage, PipelineStatus
from app.schemas.pipeline import (
    PipelineResponse,
    PipelineListResponse,
    PipelineTriggerRequest,
    PipelineStageResponse,
)

router = APIRouter(prefix="/api/pipelines", tags=["pipelines"])


async def run_pipeline_execution(pipeline_id: int):
    """
    Background worker simulating a production container CI/CD pipeline:
    1. Clone & Lint: Checks Git repository & syntax
    2. Docker Build: Simulates building multi-stage container images
    3. Automated Tests: Simulates Pytest & Vitest runner
    4. Docker Scout Security: Simulates vulnerability & CVE scanning
    5. Kubernetes Deploy: Simulates rolling deployment to kind/cluster
    """
    db: Session = SessionLocal()
    try:
        pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
        if not pipeline:
            return

        pipeline.status = PipelineStatus.RUNNING.value
        db.commit()

        start_time = time.time()
        stages = db.query(PipelineStage).filter(PipelineStage.pipeline_id == pipeline_id).order_by(PipelineStage.order).all()

        pipeline_failed = False

        for stage in stages:
            if pipeline_failed:
                stage.status = PipelineStatus.CANCELLED.value
                stage.logs = "Stage cancelled due to previous pipeline failure."
                db.commit()
                continue

            stage.status = PipelineStatus.RUNNING.value
            stage.started_at = datetime.now(timezone.utc)
            db.commit()

            # Realistic simulated stage timing
            await asyncio.sleep(2.0)

            # Generate realistic CI/CD output logs
            if stage.name == "Checkout & Lint":
                stage.logs = f"""Cloning repository {pipeline.repo_url} (branch: {pipeline.branch})...
HEAD is now at {pipeline.commit_sha} {pipeline.commit_message or 'Initial commit'}
Running Flake8, Ruff & ESLint checks...
Checking 42 files across frontend and backend...
[SUCCESS] 0 linting errors, 0 warnings found. Code style verified."""
                stage.exit_code = 0
                stage.status = PipelineStatus.SUCCESS.value

            elif stage.name == "Docker Build & Optimize":
                stage.logs = f"""[+] Building 4.2s (14/14) FINISHED
 => [internal] load build definition from Dockerfile
 => => transferring dockerfile: 1.63kB done
 => [stage-0 1/6] FROM docker.io/library/python:3.12-slim
 => [stage-0 2/6] WORKDIR /app
 => [stage-0 3/6] COPY requirements.txt .
 => [stage-0 4/6] RUN pip install --no-cache-dir -r requirements.txt (cached)
 => [stage-0 5/6] COPY . .
 => [stage-0 6/6] USER appuser (UID 10001)
 => exporting to image: devhub-api:{pipeline.commit_sha[:7]}
[SUCCESS] Multi-stage container build completed. Image size: 77.4 MB (65% reduction)."""
                stage.exit_code = 0
                stage.status = PipelineStatus.SUCCESS.value

            elif stage.name == "Automated Test Suite":
                stage.logs = f"""============================= test session starts ==============================
platform linux -- Python 3.12.15, pytest-8.3.5
rootdir: /app, plugins: anyio-4.15.1
collected 12 items

tests/test_tasks.py::test_health_endpoint PASSED                         [  8%]
tests/test_tasks.py::test_ready_endpoint PASSED                          [ 16%]
tests/test_tasks.py::test_create_task_success PASSED                     [ 25%]
tests/test_tasks.py::test_input_validation PASSED                        [ 50%]
tests/test_tasks.py::test_database_persistence PASSED                    [ 75%]
tests/test_tasks.py::test_delete_and_404 PASSED                          [100%]

======================== 12 passed, 0 failed in 0.42s =========================
[PASS] Code coverage: 94.8% across critical business paths."""
                stage.exit_code = 0
                stage.status = PipelineStatus.SUCCESS.value

            elif stage.name == "Docker Scout Security Scan":
                stage.logs = f"""Target: devhub-api:{pipeline.commit_sha[:7]}
Analyzing Software Bill of Materials (SBOM)...
Comparing 186 packages against known CVE database...
Vulnerabilities: 0 Critical, 0 High, 2 Medium, 4 Low
Base image recommendation: Base image python:3.12-slim is up to date.
Security Gate: PASSED (Policy requires 0 High/Critical CVEs)."""
                stage.exit_code = 0
                stage.status = PipelineStatus.SUCCESS.value

            elif stage.name == "Kubernetes Cluster Deploy":
                stage.logs = f"""Connecting to Kubernetes cluster (namespace: devhub)...
deployment.apps/backend configured
deployment.apps/frontend configured
Waiting for rollout to finish: 2 of 2 updated replicas are available...
deployment "backend" successfully rolled out.
Zero-downtime rolling update verified. Healthcheck /api/ready: HTTP 200 OK."""
                stage.exit_code = 0
                stage.status = PipelineStatus.SUCCESS.value

            stage.duration_seconds = int(time.time() - start_time)
            stage.completed_at = datetime.now(timezone.utc)
            db.commit()

        total_duration = int(time.time() - start_time)
        pipeline.duration_seconds = total_duration
        pipeline.status = PipelineStatus.FAILED.value if pipeline_failed else PipelineStatus.SUCCESS.value
        pipeline.completed_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as exc:
        if pipeline:
            pipeline.status = PipelineStatus.FAILED.value
            db.commit()
    finally:
        db.close()


@router.get("", response_model=PipelineListResponse, summary="List all pipeline executions")
def list_pipelines(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    query = db.query(Pipeline)
    if status_filter:
        query = query.filter(Pipeline.status == status_filter)
    
    # Auto-seed sample pipeline runs if empty
    if query.count() == 0:
        seed_sample_pipeline(db)

    pipelines = query.order_by(Pipeline.created_at.desc()).all()
    return PipelineListResponse(total=len(pipelines), items=pipelines)


@router.get("/{pipeline_id}", response_model=PipelineResponse, summary="Get pipeline details and stage logs")
def get_pipeline(pipeline_id: int, db: Session = Depends(get_db)):
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return pipeline


@router.post("/trigger", response_model=PipelineResponse, status_code=status.HTTP_201_CREATED, summary="Trigger a new CI/CD build")
def trigger_pipeline(
    req: PipelineTriggerRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    commit_hex = "".join(random.choices("0123456789abcdef", k=40))
    pipeline = Pipeline(
        name=req.name or f"Build #{random.randint(100, 999)}",
        repo_url=req.repo_url.strip(),
        branch=req.branch.strip(),
        commit_sha=commit_hex,
        commit_message=req.commit_message or "feat: implement container healthchecks and K8s rolling deployment",
        status=PipelineStatus.QUEUED.value,
        duration_seconds=0,
    )
    db.add(pipeline)
    db.commit()
    db.refresh(pipeline)

    stage_definitions = [
        ("Checkout & Lint", "Clone repository and verify code quality", 1),
        ("Docker Build & Optimize", "Compile multi-stage Docker image with layer cache", 2),
        ("Automated Test Suite", "Run Pytest & integration tests inside container", 3),
        ("Docker Scout Security Scan", "Scan image layers against CVE vulnerability databases", 4),
        ("Kubernetes Cluster Deploy", "Rolling update on kind/Kubernetes with zero downtime", 5),
    ]

    for name, desc, order in stage_definitions:
        stage = PipelineStage(
            pipeline_id=pipeline.id,
            name=name,
            description=desc,
            order=order,
            status=PipelineStatus.QUEUED.value,
            duration_seconds=0,
            logs="Waiting for previous stages to complete...",
        )
        db.add(stage)

    db.commit()
    db.refresh(pipeline)

    background_tasks.add_task(run_pipeline_execution, pipeline.id)
    return pipeline


def seed_sample_pipeline(db: Session):
    p = Pipeline(
        name="Build #108 - Release v1.2",
        repo_url="https://github.com/geo-cherian-mathew-2k28/DevHub.git",
        branch="main",
        commit_sha="fb5f8a1e8a931a67d02842df75b3199bc4512aa4",
        commit_message="feat: production Dockerfile & K8s deployment manifests",
        status=PipelineStatus.SUCCESS.value,
        duration_seconds=12,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(p)
    db.commit()
    db.refresh(p)

    stages = [
        ("Checkout & Lint", "Clone repository and verify code quality", 1, 2, "Git clone completed.\nFlake8 and ESLint passed 0 errors."),
        ("Docker Build & Optimize", "Compile multi-stage Docker image with layer cache", 2, 4, "Built devhub-api:latest.\nOptimized size: 77.4 MB via multi-stage."),
        ("Automated Test Suite", "Run Pytest & integration tests inside container", 3, 2, "12 passed, 0 failed.\nAll liveness and readiness tests verified."),
        ("Docker Scout Security Scan", "Scan image layers against CVE vulnerability databases", 4, 2, "0 Critical, 0 High vulnerabilities.\nPassed security policy."),
        ("Kubernetes Cluster Deploy", "Rolling update on kind/Kubernetes with zero downtime", 5, 2, "Rolled out to kind cluster.\nPods ready: 2/2."),
    ]
    for name, desc, order, dur, logs in stages:
        s = PipelineStage(
            pipeline_id=p.id,
            name=name,
            description=desc,
            order=order,
            status=PipelineStatus.SUCCESS.value,
            duration_seconds=dur,
            logs=logs,
            exit_code=0,
        )
        db.add(s)
    db.commit()
