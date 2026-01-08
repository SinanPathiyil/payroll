from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, date

class LeaveType(BaseModel):
    name: str  # "Sick Leave", "Casual Leave", etc.
    code: str  # "SICK", "CASUAL", etc.
    description: Optional[str] = None
    color: str  # For calendar display
    requires_documentation: bool = False  # Admin can enable/disable
    max_days_per_request: Optional[int] = None  # Admin can set or None for unlimited
    allow_half_day: bool = True  # Admin can enable/disable per leave type
    allow_carry_forward: bool = False  # Admin configurable
    is_active: bool = True  # Admin can activate/deactivate
    created_by: str
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()

class LeavePolicy(BaseModel):
    leave_type_code: str
    role: Optional[str] = None  # If None, applies to all roles
    allocated_days: float  # Admin sets this
    can_carry_forward: bool = False  # Admin configurable
    max_carry_forward: Optional[float] = None  # Admin sets limit
    pro_rated: bool = True  # Admin can enable/disable
    applies_to_all: bool = True  # Admin decides
    min_service_months: int = 0  # Admin can set minimum service period
    accrual_basis: str = "yearly"  # "yearly", "monthly" - Admin choice
    created_by: str
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()

class LeaveBalance(BaseModel):
    user_id: str
    year: int
    leave_type_code: str
    allocated: float
    used: float = 0.0
    pending: float = 0.0
    available: float = 0.0
    carried_forward: float = 0.0
    manually_adjusted: float = 0.0  # Admin can manually adjust
    updated_at: datetime = datetime.now()

class LeaveRequest(BaseModel):
    user_id: str
    leave_type_code: str
    start_date: date
    end_date: date
    total_days: float  # Support half days
    is_half_day: bool = False
    half_day_period: Optional[str] = None  # "first_half", "second_half"
    reason: str
    status: str = "pending"  # pending, approved, rejected, cancelled
    requested_at: datetime = datetime.now()
    
    # Dynamic approval chain (built based on admin workflow settings)
    approval_chain: List[Dict[str, Any]] = []
    # Example: [
    #   {"role": "team_lead", "user_id": "tl_id", "status": "pending", "approved_at": None, "notes": None},
    #   {"role": "hr", "user_id": "hr_id", "status": "pending", "approved_at": None, "notes": None}
    # ]
    
    current_approval_level: int = 0
    final_status: str = "pending"
    
    # Attachments (if admin enabled)
    attachments: List[str] = []
    
    # Cancellation
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[str] = None
    cancellation_reason: Optional[str] = None
    
    # Admin override
    admin_override: bool = False
    override_by: Optional[str] = None
    override_reason: Optional[str] = None

class LeaveSystemSettings(BaseModel):
    """
    Master settings controlled by Super Admin
    All leave system features are configurable here
    """
    # Feature Toggles
    enable_leave_system: bool = True
    enable_half_day_leave: bool = True
    enable_carry_forward: bool = True
    enable_document_attachment: bool = True
    enable_leave_calendar: bool = True
    enable_leave_notifications: bool = True
    enable_backdated_requests: bool = False
    enable_leave_encashment: bool = False  # NEW
    
    # Approval Workflow
    workflow_type: str = "tl_then_hr"  # "tl_only", "hr_only", "tl_then_hr", "hr_then_tl", "none" (auto-approve)
    auto_approve_wfh: bool = False
    require_tl_approval: bool = True
    require_hr_approval: bool = True
    
    # Request Constraints
    max_advance_days: int = 90  # How many days in advance can apply
    min_notice_days: int = 1  # Minimum notice period
    require_document_after_days: int = 3  # Require document after X days
    max_consecutive_days: Optional[int] = None  # Limit consecutive leave days
    block_weekend_sandwich: bool = False  # Prevent leave sandwich around weekends
    
    # Year Settings
    leave_year_start_month: int = 1  # January = 1, April = 4, etc.
    leave_year_start_day: int = 1
    
    # Carry Forward Rules
    carry_forward_deadline_days: int = 90  # Use within 90 days of new year
    max_carry_forward_percentage: int = 50  # Max 50% of allocated can be carried
    
    # Leave Deduction
    deduct_weekends: bool = False  # Include weekends in leave calculation
    deduct_holidays: bool = False  # Include holidays in leave calculation
    
    # Notifications
    notify_on_request: bool = True
    notify_on_approval: bool = True
    notify_on_rejection: bool = True
    notify_approvers: bool = True
    reminder_pending_leaves_days: int = 7  # Remind approvers after X days
    
    # Admin Controls
    allow_admin_override: bool = True  # Admin can approve/reject any leave
    allow_manual_balance_adjustment: bool = True
    allow_negative_balance: bool = False  # Allow employees to go into negative
    
    # Updated tracking
    updated_by: str
    updated_at: datetime = datetime.now()

class LeaveHoliday(BaseModel):
    """
    Public holidays - used for leave calculation if admin enables
    """
    date: date
    name: str
    description: Optional[str] = None
    is_optional: bool = False  # Optional holiday (employee can choose to work)
    created_by: str
    created_at: datetime = datetime.now()