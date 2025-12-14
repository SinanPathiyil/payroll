from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Note(BaseModel):
    user_id: str
    title: Optional[str] = ""
    content: str
    color: str = "yellow"  # yellow, blue, green, pink, purple
    is_pinned: bool = False
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()