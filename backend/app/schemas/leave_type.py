from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# Request schemas
class LeaveTypeCreate(BaseModel):
    name: str = Field(..., description="Leave type name from predefined list")
    code: str = Field(..., description="Auto-assigned code (SICK, CASUAL, etc.)")
    description: Optional[str] = None
    max_days_per_year: int = Field(ge=0, description="Maximum days per year")
    requires_document: bool = False
    can_carry_forward: bool = False
    carry_forward_limit: int = Field(default=0, ge=0)
    allow_half_day: bool = True
    color: str = Field(default="#3b82f6", pattern="^#[0-9A-Fa-f]{6}$")
    is_paid: bool = True

class LeaveTypeUpdate(BaseModel):
    description: Optional[str] = None
    max_days_per_year: Optional[int] = Field(None, ge=0)
    requires_document: Optional[bool] = None
    can_carry_forward: Optional[bool] = None
    carry_forward_limit: Optional[int] = Field(None, ge=0)
    allow_half_day: Optional[bool] = None
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    is_paid: Optional[bool] = None
    is_active: Optional[bool] = None

# Response schemas
class LeaveTypeResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str]
    max_days_per_year: int
    requires_document: bool
    can_carry_forward: bool
    carry_forward_limit: int
    allow_half_day: bool
    color: str
    is_paid: bool
    is_active: bool
    created_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

class LeaveTypeList(BaseModel):
    total: int
    leave_types: list[LeaveTypeResponse]

# Predefined leave types for dropdown
PREDEFINED_LEAVE_TYPES = [
    {"name": "Sick Leave", "code": "SICK", "color": "#ef4444"},
    {"name": "Casual Leave", "code": "CASUAL", "color": "#f59e0b"},
    {"name": "Paid Leave", "code": "PAID", "color": "#10b981"},
    {"name": "Unpaid Leave", "code": "UNPAID", "color": "#6b7280"},
    {"name": "Work From Home", "code": "WFH", "color": "#3b82f6"},
    {"name": "Compensatory Off", "code": "COMP_OFF", "color": "#8b5cf6"},
    {"name": "Maternity Leave", "code": "MATERNITY", "color": "#ec4899"},
    {"name": "Paternity Leave", "code": "PATERNITY", "color": "#06b6d4"},
    {"name": "Emergency Leave", "code": "EMERGENCY", "color": "#dc2626"}
]