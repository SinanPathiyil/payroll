from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class User(BaseModel):
    email: EmailStr
    full_name: str
    role: str  # "super_admin", "hr", "team_lead", "employee"
    hashed_password: str
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = datetime.now()
    office_hours: dict = {"start": "09:00", "end": "18:00"}
    required_hours: float = 8.0
    base_salary: float = 0.0
    
    # NEW FIELDS FOR PHASE 1
    team_id: Optional[str] = None  # Link to Team collection
    reporting_to: Optional[str] = None  # Manager's user_id
    managed_teams: List[str] = []  # For team_leads: list of team_ids they lead