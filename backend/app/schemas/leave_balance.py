from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

# Response schemas (read-only, calculated by system)
class LeaveBalanceResponse(BaseModel):
    id: str
    user_id: str
    user_name: str  # Populated from user data
    year: int
    leave_type_code: str
    leave_type_name: str  # Populated from leave type
    allocated: float
    carried_forward: float
    total_available: float
    used: float
    pending: float
    available: float
    carry_forward_expires_on: Optional[date]
    last_updated: datetime

class LeaveBalanceSummary(BaseModel):
    user_id: str
    user_name: str
    year: int
    balances: List[LeaveBalanceResponse]
    total_allocated: float
    total_used: float
    total_available: float

# Admin allocation request
class LeaveAllocationRequest(BaseModel):
    user_id: str
    year: int
    leave_type_code: str
    days: float = Field(ge=0, description="Days to allocate")