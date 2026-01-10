from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class LeaveRequest(BaseModel):
    request_number: str  # Auto-generated: "LR-2024-00001"
    
    # Requester information
    user_id: str
    user_name: str
    user_email: str
    user_role: str  # "employee", "team_lead"
    team_lead_id: Optional[str] = None  # For TL visibility
    team_lead_name: Optional[str] = None
    
    # Leave details
    leave_type_code: str  # "SICK", "CASUAL", etc.
    leave_type_name: str  # "Sick Leave"
    leave_type_color: str = "#3b82f6"
    
    start_date: date
    end_date: date
    is_half_day: bool = False
    half_day_period: Optional[str] = None  # "first_half" or "second_half"
    
    total_days: float = 0  # Calculated (excluding weekends/holidays)
    excluded_dates: List[str] = []  # Dates excluded (weekends/holidays)
    
    reason: str
    attachment_url: Optional[str] = None  # File storage URL
    
    # Status
    status: str = "pending"  # "pending", "approved", "rejected", "cancelled"
    
    # HR approval
    reviewed_by_hr_id: Optional[str] = None
    reviewed_by_hr_name: Optional[str] = None
    hr_action: Optional[str] = None  # "approved" or "rejected"
    hr_notes: Optional[str] = None
    hr_action_at: Optional[datetime] = None
    
    # Cancellation
    cancelled_by: Optional[str] = None  # user_id who cancelled
    cancelled_at: Optional[datetime] = None
    cancelled_reason: Optional[str] = None
    
    # Timestamps
    requested_at: datetime = datetime.now()
    
    # Notification tracking
    tl_notified: bool = False
    hr_notified: bool = False
    user_notified: bool = False  # Notified about approval/rejection