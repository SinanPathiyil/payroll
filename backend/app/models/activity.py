from pydantic import BaseModel
from datetime import datetime

class Activity(BaseModel):
    user_id: str
    session_id: str
    mouse_events: int = 0
    keyboard_events: int = 0
    idle_time: float = 0  # in seconds
    active_time: float = 0  # in seconds
    timestamp: datetime = datetime.utcnow()
    productivity_score: float = 0  # 0-100