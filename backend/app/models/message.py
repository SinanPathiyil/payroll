from pydantic import BaseModel
from datetime import datetime

class Message(BaseModel):
    from_user: str  # user_id
    to_user: str  # user_id
    content: str
    is_read: bool = False
    created_at: datetime = datetime.now()