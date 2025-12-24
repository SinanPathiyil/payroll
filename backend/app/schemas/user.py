from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "employee"  # "super_admin", "hr", "team_lead", "employee"
    required_hours: float = 8.0
    base_salary: float = 0.0
    team_id: Optional[str] = None
    reporting_to: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    office_hours: dict
    required_hours: float
    base_salary: Optional[float] = 0.0
    team_id: Optional[str] = None  # NEW
    reporting_to: Optional[str] = None  # NEW
    managed_teams: Optional[List[str]] = []  # NEW - for team leads

class UserUpdate(BaseModel):  # NEW - for updating existing users
    full_name: Optional[str] = None
    role: Optional[str] = None
    team_id: Optional[str] = None
    reporting_to: Optional[str] = None
    required_hours: Optional[float] = None
    base_salary: Optional[float] = None
    is_active: Optional[bool] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse