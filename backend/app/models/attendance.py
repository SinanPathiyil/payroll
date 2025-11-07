from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Attendance(BaseModel):
    user_id: str
    login_time: datetime
    logout_time: Optional[datetime] = None
    total_hours: Optional[float] = None
    date: str  # YYYY-MM-DD format
    status: str = "active"  # active, completed