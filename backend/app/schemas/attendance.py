from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AttendanceCreate(BaseModel):
    user_id: str

class AttendanceResponse(BaseModel):
    id: str
    user_id: str
    login_time: datetime
    logout_time: Optional[datetime] = None
    total_hours: Optional[float] = None
    date: str
    status: str