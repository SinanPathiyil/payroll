from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "employee"
    required_hours: float = 8.0
    base_salary: float = 0.0

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
    base_salary: Optional[float] = 0.0  # ✅ CHANGED: Made Optional with default 0.0

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse