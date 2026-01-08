from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date

# ============================================
# LEAVE TYPE SCHEMAS
# ============================================
class LeaveTypeCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    color: str = "#3b82f6"
    requires_documentation: bool = False
    max_days_per_request: Optional[int] = None
    allow_half_day: bool = True
    allow_carry_forward: bool = False

class LeaveTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    requires_documentation: Optional[bool] = None
    max_days_per_request: Optional[int] = None
    allow_half_day: Optional[bool] = None
    allow_carry_forward: Optional[bool] = None
    is_active: Optional[bool] = None

class LeaveTypeResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str]
    color: str
    requires_documentation: bool
    max_days_per_request: Optional[int]
    allow_half_day: bool
    allow_carry_forward: bool
    is_active: bool
    created_at: datetime

# ============================================
# LEAVE POLICY SCHEMAS
# ============================================
class LeavePolicyCreate(BaseModel):
    leave_type_code: str
    role: Optional[str] = None
    allocated_days: float
    can_carry_forward: bool = False
    max_carry_forward: Optional[float] = None
    pro_rated: bool = True
    applies_to_all: bool = True
    min_service_months: int = 0
    accrual_basis: str = "yearly"

    @validator('accrual_basis')
    def validate_accrual_basis(cls, v):
        if v not in ['yearly', 'monthly']:
            raise ValueError('accrual_basis must be yearly or monthly')
        return v

class LeavePolicyUpdate(BaseModel):
    allocated_days: Optional[float] = None
    can_carry_forward: Optional[bool] = None
    max_carry_forward: Optional[float] = None
    pro_rated: Optional[bool] = None
    min_service_months: Optional[int] = None
    accrual_basis: Optional[str] = None

class LeavePolicyResponse(BaseModel):
    id: str
    leave_type_code: str
    leave_type_name: str
    role: Optional[str]
    allocated_days: float
    can_carry_forward: bool
    max_carry_forward: Optional[float]
    pro_rated: bool
    applies_to_all: bool
    min_service_months: int
    accrual_basis: str
    created_at: datetime

# ============================================
# LEAVE BALANCE SCHEMAS
# ============================================
class LeaveBalanceResponse(BaseModel):
    leave_type_code: str
    leave_type_name: str
    color: str
    allocated: float
    used: float
    pending: float
    available: float
    carried_forward: float
    manually_adjusted: float

class ManualBalanceAdjustment(BaseModel):
    user_id: str
    leave_type_code: str
    adjustment: float  # Can be positive or negative
    reason: str

# ============================================
# LEAVE REQUEST SCHEMAS
# ============================================
class LeaveRequestCreate(BaseModel):
    leave_type_code: str
    start_date: date
    end_date: date
    is_half_day: bool = False
    half_day_period: Optional[str] = None
    reason: str
    attachments: Optional[List[str]] = []

    @validator('end_date')
    def end_date_must_be_after_start(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date must be after or equal to start_date')
        return v

    @validator('half_day_period')
    def validate_half_day_period(cls, v, values):
        if values.get('is_half_day') and v not in ['first_half', 'second_half']:
            raise ValueError('half_day_period must be first_half or second_half')
        return v

class LeaveRequestUpdate(BaseModel):
    reason: Optional[str] = None
    attachments: Optional[List[str]] = None

class LeaveApprovalAction(BaseModel):
    action: str  # "approve" or "reject"
    notes: Optional[str] = None

    @validator('action')
    def validate_action(cls, v):
        if v not in ['approve', 'reject']:
            raise ValueError('action must be approve or reject')
        return v

class LeaveCancellation(BaseModel):
    cancellation_reason: str

class AdminLeaveOverride(BaseModel):
    action: str  # "approve" or "reject"
    reason: str

class LeaveRequestResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    leave_type_code: str
    leave_type_name: str
    leave_type_color: str
    start_date: date
    end_date: date
    total_days: float
    is_half_day: bool
    half_day_period: Optional[str]
    reason: str
    status: str
    requested_at: datetime
    approval_chain: List[Dict[str, Any]]
    current_approval_level: int
    final_status: str
    attachments: List[str]
    cancelled_at: Optional[datetime]
    cancellation_reason: Optional[str]
    admin_override: bool
    override_reason: Optional[str]

# ============================================
# LEAVE SYSTEM SETTINGS SCHEMAS
# ============================================
class LeaveSystemSettingsUpdate(BaseModel):
    # Feature Toggles
    enable_leave_system: Optional[bool] = None
    enable_half_day_leave: Optional[bool] = None
    enable_carry_forward: Optional[bool] = None
    enable_document_attachment: Optional[bool] = None
    enable_leave_calendar: Optional[bool] = None
    enable_leave_notifications: Optional[bool] = None
    enable_backdated_requests: Optional[bool] = None
    enable_leave_encashment: Optional[bool] = None
    
    # Approval Workflow
    workflow_type: Optional[str] = None
    auto_approve_wfh: Optional[bool] = None
    require_tl_approval: Optional[bool] = None
    require_hr_approval: Optional[bool] = None
    
    # Request Constraints
    max_advance_days: Optional[int] = None
    min_notice_days: Optional[int] = None
    require_document_after_days: Optional[int] = None
    max_consecutive_days: Optional[int] = None
    block_weekend_sandwich: Optional[bool] = None
    
    # Year Settings
    leave_year_start_month: Optional[int] = None
    leave_year_start_day: Optional[int] = None
    
    # Carry Forward Rules
    carry_forward_deadline_days: Optional[int] = None
    max_carry_forward_percentage: Optional[int] = None
    
    # Leave Deduction
    deduct_weekends: Optional[bool] = None
    deduct_holidays: Optional[bool] = None
    
    # Notifications
    notify_on_request: Optional[bool] = None
    notify_on_approval: Optional[bool] = None
    notify_on_rejection: Optional[bool] = None
    notify_approvers: Optional[bool] = None
    reminder_pending_leaves_days: Optional[int] = None
    
    # Admin Controls
    allow_admin_override: Optional[bool] = None
    allow_manual_balance_adjustment: Optional[bool] = None
    allow_negative_balance: Optional[bool] = None

    @validator('workflow_type')
    def validate_workflow_type(cls, v):
        if v is not None:
            valid_types = ['tl_only', 'hr_only', 'tl_then_hr', 'hr_then_tl', 'none']
            if v not in valid_types:
                raise ValueError(f'workflow_type must be one of {valid_types}')
        return v

class LeaveSystemSettingsResponse(BaseModel):
    id: str
    enable_leave_system: bool
    enable_half_day_leave: bool
    enable_carry_forward: bool
    enable_document_attachment: bool
    enable_leave_calendar: bool
    enable_leave_notifications: bool
    enable_backdated_requests: bool
    enable_leave_encashment: bool
    workflow_type: str
    auto_approve_wfh: bool
    require_tl_approval: bool
    require_hr_approval: bool
    max_advance_days: int
    min_notice_days: int
    require_document_after_days: int
    max_consecutive_days: Optional[int]
    block_weekend_sandwich: bool
    leave_year_start_month: int
    leave_year_start_day: int
    carry_forward_deadline_days: int
    max_carry_forward_percentage: int
    deduct_weekends: bool
    deduct_holidays: bool
    notify_on_request: bool
    notify_on_approval: bool
    notify_on_rejection: bool
    notify_approvers: bool
    reminder_pending_leaves_days: int
    allow_admin_override: bool
    allow_manual_balance_adjustment: bool
    allow_negative_balance: bool
    updated_by: str
    updated_at: datetime

# ============================================
# HOLIDAY SCHEMAS
# ============================================
class HolidayCreate(BaseModel):
    date: date
    name: str
    description: Optional[str] = None
    is_optional: bool = False

class HolidayUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_optional: Optional[bool] = None

class HolidayResponse(BaseModel):
    id: str
    date: date
    name: str
    description: Optional[str]
    is_optional: bool
    created_at: datetime

# ============================================
# ANALYTICS SCHEMAS
# ============================================
class LeaveAnalytics(BaseModel):
    total_requests: int
    pending_requests: int
    approved_requests: int
    rejected_requests: int
    most_used_leave_type: str
    total_days_used: float
    average_days_per_request: float
    leave_by_type: Dict[str, int]
    leave_by_month: Dict[str, int]
    leave_by_status: Dict[str, int]