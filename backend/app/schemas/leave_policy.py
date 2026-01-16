from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Sub-schemas
class RoleAllocationSchema(BaseModel):
    leave_type_code: str
    days: int = Field(ge=0)

class RoleBasedAllocationSchema(BaseModel):
    role: str = Field(..., pattern="^(employee|team_lead|business_analyst|hr)$")
    allocations: List[RoleAllocationSchema] = []

# Request schemas
class LeavePolicyCreate(BaseModel):
    year: int = Field(..., ge=2020, le=2100)
    probation_enabled: bool = True
    probation_period_days: int = Field(default=90, ge=0)
    carry_forward_enabled: bool = True
    carry_forward_expiry_month: int = Field(default=3, ge=1, le=12)
    carry_forward_expiry_day: int = Field(default=31, ge=1, le=31)
    advance_notice_days: int = Field(default=0, ge=0)
    max_consecutive_days: int = Field(default=30, ge=1)
    weekend_days: List[str] = ["saturday", "sunday"]
    exclude_weekends: bool = True
    exclude_public_holidays: bool = True
    role_allocations: List[RoleBasedAllocationSchema] = []

class LeavePolicyUpdate(BaseModel):
    probation_enabled: Optional[bool] = None
    probation_period_days: Optional[int] = Field(None, ge=0)
    carry_forward_enabled: Optional[bool] = None
    carry_forward_expiry_month: Optional[int] = Field(None, ge=1, le=12)
    carry_forward_expiry_day: Optional[int] = Field(None, ge=1, le=31)
    advance_notice_days: Optional[int] = Field(None, ge=0)
    max_consecutive_days: Optional[int] = Field(None, ge=1)
    weekend_days: Optional[List[str]] = None
    exclude_weekends: Optional[bool] = None
    exclude_public_holidays: Optional[bool] = None
    role_allocations: Optional[List[RoleBasedAllocationSchema]] = None
    is_active: Optional[bool] = None

# Response schemas
class LeavePolicyResponse(BaseModel):
    id: str
    year: int
    probation_enabled: bool
    probation_period_days: int
    carry_forward_enabled: bool
    carry_forward_expiry_month: int
    carry_forward_expiry_day: int
    advance_notice_days: int
    max_consecutive_days: int
    weekend_days: List[str]
    exclude_weekends: bool
    exclude_public_holidays: bool
    role_allocations: List[RoleBasedAllocationSchema]
    is_active: bool
    updated_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]