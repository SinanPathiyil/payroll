from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class OverrideRequestCreate(BaseModel):
    request_type: str  # "role_change", "project_extension", "employee_exception", "policy_override"
    reason: str
    details: Dict[str, Any]

class OverrideRequestResponse(BaseModel):
    id: str
    request_type: str
    requested_by: str
    requested_by_name: str
    reason: str
    details: dict
    status: str
    reviewed_by: Optional[str] = None
    reviewer_name: Optional[str] = None
    review_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

# Specific request types for better validation

class RoleChangeRequest(BaseModel):
    user_id: str
    current_role: str
    requested_role: str
    justification: str

class ProjectExtensionRequest(BaseModel):
    project_id: str
    current_due_date: datetime
    requested_due_date: datetime
    justification: str

class EmployeeExceptionRequest(BaseModel):
    employee_id: str
    exception_type: str  # "attendance_waiver", "hour_reduction", etc.
    duration_days: int
    justification: str

class PolicyOverrideRequest(BaseModel):
    policy_name: str
    override_details: str
    affected_users: list[str]
    justification: str