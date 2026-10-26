from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.pipeline import PipelineStatus


class PipelineStageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    order: int
    status: PipelineStatus
    duration_seconds: int
    logs: Optional[str]
    exit_code: Optional[int]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]


class PipelineTriggerRequest(BaseModel):
    name: Optional[str] = Field(None, description="Optional pipeline run name")
    repo_url: str = Field(..., min_length=5, description="Git repository URL")
    branch: str = Field(default="main", min_length=1, description="Target branch")
    commit_message: Optional[str] = Field(None, description="Commit description")


class PipelineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    repo_url: str
    branch: str
    commit_sha: Optional[str]
    commit_message: Optional[str]
    status: PipelineStatus
    duration_seconds: int
    created_at: datetime
    completed_at: Optional[datetime]
    stages: List[PipelineStageResponse] = []


class PipelineListResponse(BaseModel):
    total: int
    items: List[PipelineResponse]
