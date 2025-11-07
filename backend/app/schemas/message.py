from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MessageCreate(BaseModel):
    to_user: str
    content: str

class MessageResponse(BaseModel):
    id: str
    from_user: str
    to_user: str
    content: str
    is_read: bool
    created_at: datetime