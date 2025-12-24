# backend/app/models/audit_log.py
from pydantic import BaseModel
from datetime import datetime

class AuditLog(BaseModel):
    action_type: str  # "login", "role_change", "override_approved", "critical_action"
    performed_by: str  # User ID
    user_role: str
    target_user: Optional[str] = None
    details: dict
    ip_address: Optional[str] = None
    timestamp: datetime = datetime.now()