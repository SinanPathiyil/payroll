from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ActivityLog(BaseModel):
    session_id: str
    mouse_events: int = 0
    keyboard_events: int = 0
    idle_time: float = 0
    active_time: float = 0

class ActivityResponse(BaseModel):
    id: str
    user_id: str
    session_id: str
    mouse_events: int
    keyboard_events: int
    idle_time: float
    active_time: float
    productivity_score: float
    timestamp: datetime

class ActivityStats(BaseModel):
    total_active_time: float
    total_idle_time: float
    avg_productivity_score: float
    total_mouse_events: int
    total_keyboard_events: int