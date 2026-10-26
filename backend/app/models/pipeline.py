from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class PipelineStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Pipeline(Base):
    __tablename__ = "pipelines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), nullable=False, index=True)
    repo_url = Column(String(300), nullable=False)
    branch = Column(String(100), nullable=False, default="main")
    commit_sha = Column(String(40), nullable=True)
    commit_message = Column(String(255), nullable=True)
    status = Column(String(30), nullable=False, default=PipelineStatus.QUEUED.value, index=True)
    duration_seconds = Column(Integer, nullable=False, default=0)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    stages = relationship("PipelineStage", back_populates="pipeline", cascade="all, delete-orphan", order_by="PipelineStage.order")


class PipelineStage(Base):
    __tablename__ = "pipeline_stages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    order = Column(Integer, nullable=False, default=1)
    status = Column(String(30), nullable=False, default=PipelineStatus.QUEUED.value)
    duration_seconds = Column(Integer, nullable=False, default=0)
    logs = Column(Text, nullable=True)
    exit_code = Column(Integer, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    pipeline = relationship("Pipeline", back_populates="stages")
