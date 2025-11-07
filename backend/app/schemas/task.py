from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskCreate(BaseModel):
    title: str
    description: str
    assigned_to: str
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    status: str  # pending, in_progress, completed

class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    assigned_to: str
    assigned_by: str
    status: str
    due_date: Optional[datetime]
    created_at: datetime
    completed_at: Optional[datetime]