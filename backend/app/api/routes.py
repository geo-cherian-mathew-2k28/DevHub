from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database import get_db, check_db_connection
from app.models.task import Task
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskListResponse,
    TaskStats,
    TaskPriority,
    TaskStatus,
)

router = APIRouter(prefix="/api", tags=["tasks"])


@router.get("/health", status_code=status.HTTP_200_OK, summary="Liveness probe")
def health():
    """
    Indicates whether the application process is running.
    Does NOT depend on the database (distinguishes process liveness from dependency readiness).
    """
    return {
        "status": "healthy",
        "service": "devhub-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/ready", status_code=status.HTTP_200_OK, summary="Readiness probe")
def readiness():
    """
    Verifies that the API can successfully communicate with its database dependency.
    Returns 503 if the database is unreachable.
    """
    is_ready = check_db_connection()
    if not is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not ready",
        )
    return {
        "status": "ready",
        "database": "connected",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get(
    "/tasks",
    response_model=TaskListResponse,
    status_code=status.HTTP_200_OK,
    summary="List and filter tasks",
)
def list_tasks(
    status_filter: Optional[TaskStatus] = Query(None, alias="status", description="Filter by task status"),
    priority_filter: Optional[TaskPriority] = Query(None, alias="priority", description="Filter by task priority"),
    q: Optional[str] = Query(None, min_length=1, description="Search in title and description"),
    db: Session = Depends(get_db),
):
    """
    List tasks with optional filtering by status, priority, and search keyword.
    Also returns overall statistics across all tasks.
    """
    # Base query for tasks list
    query = db.query(Task)

    if status_filter:
        query = query.filter(Task.status == status_filter.value)
    if priority_filter:
        query = query.filter(Task.priority == priority_filter.value)
    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Task.title.ilike(search_pattern),
                Task.description.ilike(search_pattern),
            )
        )

    tasks = query.order_by(Task.created_at.desc()).all()

    # Calculate overall task stats (unfiltered, representing dashboard totals)
    total_count = db.query(func.count(Task.id)).scalar() or 0
    pending_count = (
        db.query(func.count(Task.id)).filter(Task.status == TaskStatus.PENDING.value).scalar()
        or 0
    )
    in_progress_count = (
        db.query(func.count(Task.id))
        .filter(Task.status == TaskStatus.IN_PROGRESS.value)
        .scalar()
        or 0
    )
    completed_count = (
        db.query(func.count(Task.id))
        .filter(Task.status == TaskStatus.COMPLETED.value)
        .scalar()
        or 0
    )

    stats = TaskStats(
        total=total_count,
        pending=pending_count,
        in_progress=in_progress_count,
        completed=completed_count,
    )

    return TaskListResponse(
        total=len(tasks),
        items=tasks,
        stats=stats,
    )


@router.post(
    "/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    """Creates a new task in PostgreSQL."""
    now = datetime.now(timezone.utc)
    task = Task(
        title=task_in.title.strip(),
        description=task_in.description.strip() if task_in.description else None,
        priority=task_in.priority.value,
        status=task_in.status.value,
        created_at=now,
        updated_at=now,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Get task details",
)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Retrieves an individual task by ID."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )
    return task


@router.patch(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Update task",
)
def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db)):
    """Updates an existing task."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )

    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "priority" and value is not None:
            setattr(task, field, value.value)
        elif field == "status" and value is not None:
            setattr(task, field, value.value)
        elif field == "title" and value is not None:
            setattr(task, field, value.strip())
        elif field == "description":
            setattr(task, field, value.strip() if value else None)

    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task


@router.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete task",
)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Deletes a task by ID."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found",
        )
    db.delete(task)
    db.commit()
    return None
