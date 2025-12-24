from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class OverrideRequest(BaseModel):
    request_type: str  # "role_change", "project_extension", "employee_exception", "policy_override"
    requested_by: str  # HR user ID
    reason: str
    details: Dict[str, Any]  # Context-specific data
    status: str = "pending"  # "pending", "approved", "rejected"
    reviewed_by: Optional[str] = None  # Super Admin user ID
    review_notes: Optional[str] = None
    created_at: datetime = datetime.now()
    reviewed_at: Optional[datetime] = None

# Example details structure for role_change:
# {
#     "user_id": "employee_123",
#     "current_role": "employee",
#     "requested_role": "team_lead",
#     "justification": "High performer, ready for leadership"
# }