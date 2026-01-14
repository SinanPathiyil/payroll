from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TeamCreate(BaseModel):
    team_name: str
    description: Optional[str] = None
    team_lead_id: str  # User ID who will lead this team
    member_ids: Optional[List[str]] = []

class TeamUpdate(BaseModel):
    team_name: Optional[str] = None
    description: Optional[str] = None
    team_lead_id: Optional[str] = None
    is_active: Optional[bool] = None

class TeamMemberAdd(BaseModel):
    employee_id: str  # User ID to add to team

class TeamMemberRemove(BaseModel):
    employee_id: str  # User ID to remove from team

class TeamMemberResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool

class TeamResponse(BaseModel):
    id: str
    team_name: str
    description: Optional[str] = None
    team_lead_id: str
    team_lead_name: Optional[str] = None  # For easy display
    created_by: str
    created_by_name: Optional[str] = None  # For easy display
    members: List[str] = []
    member_count: int = 0
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

class TeamDetailResponse(TeamResponse):
    members_details: List[TeamMemberResponse] = []  # Full member info
    team_lead_details: Optional[dict] = None  # Full team lead info