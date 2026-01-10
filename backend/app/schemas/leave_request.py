from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date

# Request schemas
class LeaveRequestCreate(BaseModel):
    leave_type_code: str
    start_date: date
    end_date: date
    is_half_day: bool = False
    half_day_period: Optional[str] = Field(None, pattern="^(first_half|second_half)$")
    reason: str = Field(..., min_length=10, max_length=500)
    attachment_url: Optional[str] = None
    
    @validator('end_date')
    def end_date_must_be_after_start(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date must be after or equal to start_date')
        return v
    
    @validator('is_half_day')
    def half_day_validation(cls, v, values):
        if v and 'start_date' in values and 'end_date' in values:
            if values['start_date'] != values['end_date']:
                raise ValueError('Half day leave must be for a single day')
        return v

class LeaveRequestCancel(BaseModel):
    cancelled_reason: str = Field(..., min_length=5, max_length=200)

class LeaveRequestApprove(BaseModel):
    hr_notes: Optional[str] = Field(None, max_length=500)

class LeaveRequestReject(BaseModel):
    hr_notes: str = Field(..., min_length=10, max_length=500)

# Response schemas
class LeaveRequestResponse(BaseModel):
    id: str
    request_number: str
    user_id: str
    user_name: str
    user_email: str
    user_role: str
    team_lead_id: Optional[str]
    team_lead_name: Optional[str]
    leave_type_code: str
    leave_type_name: str
    leave_type_color: str
    start_date: date
    end_date: date
    is_half_day: bool
    half_day_period: Optional[str]
    total_days: float
    excluded_dates: List[str]
    reason: str
    attachment_url: Optional[str]
    status: str
    reviewed_by_hr_id: Optional[str]
    reviewed_by_hr_name: Optional[str]
    hr_action: Optional[str]
    hr_notes: Optional[str]
    hr_action_at: Optional[datetime]
    cancelled_by: Optional[str]
    cancelled_at: Optional[datetime]
    cancelled_reason: Optional[str]
    requested_at: datetime

class LeaveRequestList(BaseModel):
    total: int
    requests: List[LeaveRequestResponse]

class LeaveRequestStats(BaseModel):
    pending_count: int
    approved_today_count: int
    on_leave_today_count: int
    total_requests: int