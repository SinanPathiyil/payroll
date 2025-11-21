from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MessageCreate(BaseModel):
    to_user: str
    content: str
    task_id: Optional[str] = None  # <<< ADD THIS LINE

class MessageResponse(BaseModel):
    id: str
    from_user: str
    to_user: str
    content: str
    is_read: bool
    created_at: datetime
    task_id: Optional[str] = None  # <<< ADD THIS LINE