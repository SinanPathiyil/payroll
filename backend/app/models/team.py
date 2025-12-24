from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Team(BaseModel):
    team_name: str
    description: Optional[str] = None
    team_lead_id: str  # User ID with role "team_lead"
    created_by: str  # HR user ID who created this team
    members: List[str] = []  # List of employee user_ids in this team
    is_active: bool = True
    created_at: datetime = datetime.now()
    updated_at: Optional[datetime] = None