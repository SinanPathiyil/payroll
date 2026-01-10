from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LeaveType(BaseModel):
    name: str  # "Sick Leave", "Casual Leave", etc.
    code: str  # "SICK", "CASUAL", etc.
    description: Optional[str] = None
    max_days_per_year: int = 0
    requires_document: bool = False
    can_carry_forward: bool = False
    carry_forward_limit: int = 0  # Max days that can be carried forward
    allow_half_day: bool = True
    color: str = "#3b82f6"  # Default blue color for calendar
    is_paid: bool = True  # Paid or unpaid leave
    is_active: bool = True
    created_by: Optional[str] = None  # Admin user_id
    created_at: datetime = datetime.now()
    updated_at: Optional[datetime] = None