from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class LeaveBalance(BaseModel):
    user_id: str  # Employee user_id
    year: int  # 2024, 2025, etc.
    leave_type_code: str  # "SICK", "CASUAL", etc.
    
    # Balance breakdown
    allocated: float = 0  # Initially allocated for the year
    carried_forward: float = 0  # Carried from previous year
    total_available: float = 0  # allocated + carried_forward
    
    used: float = 0  # Approved leaves (past dates only)
    pending: float = 0  # Pending approval
    available: float = 0  # total_available - used - pending
    
    # Carry forward tracking
    carry_forward_expires_on: Optional[date] = None
    
    # Metadata
    last_updated: datetime = datetime.now()