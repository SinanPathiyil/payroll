from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, date

class RoleAllocation(BaseModel):
    leave_type_code: str
    days: int

class RoleBasedAllocation(BaseModel):
    role: str  # "employee", "team_lead", "hr"
    allocations: List[RoleAllocation] = []

class LeavePolicy(BaseModel):
    year: int  # 2024, 2025, etc.
    
    # Probation settings
    probation_enabled: bool = True
    probation_period_days: int = 90
    
    # Carry forward settings
    carry_forward_enabled: bool = True
    carry_forward_expiry_month: int = 3  # March (1-12)
    carry_forward_expiry_day: int = 31  # 31st
    
    # Request settings
    advance_notice_days: int = 0  # Apply X days in advance (0 = no restriction)
    max_consecutive_days: int = 30  # Max continuous leave
    
    # Weekend & holiday settings
    weekend_days: List[str] = ["saturday", "sunday"]
    exclude_weekends: bool = True  # Don't count weekends in leave calculation
    exclude_public_holidays: bool = True  # Don't count holidays in leave calculation
    
    # Role-based allocation
    role_allocations: List[RoleBasedAllocation] = []
    
    # Metadata
    is_active: bool = True
    updated_by: Optional[str] = None  # Admin user_id
    created_at: datetime = datetime.now()
    updated_at: Optional[datetime] = None