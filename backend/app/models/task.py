from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Task(BaseModel):
    title: str
    description: str
    assigned_to: str  # user_id
    assigned_by: str  # hr user_id
    status: str = "pending"  # pending, in_progress, completed
    due_date: Optional[datetime] = None
    created_at: datetime = datetime.now()
    completed_at: Optional[datetime] = None