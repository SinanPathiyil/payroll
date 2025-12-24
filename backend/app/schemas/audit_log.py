from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: str
    action_type: str
    performed_by: str
    performer_name: str
    user_role: str
    target_user: Optional[str] = None
    target_user_name: Optional[str] = None
    details: Dict[str, Any]
    ip_address: Optional[str] = None
    timestamp: datetime

class AuditLogFilter(BaseModel):
    action_type: Optional[str] = None
    user_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = 100