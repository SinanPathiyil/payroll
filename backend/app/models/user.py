from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class User(BaseModel):
    email: EmailStr
    full_name: str
    role: str  # "hr" or "employee"
    hashed_password: str
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = datetime.now()
    office_hours: dict = {"start": "09:00", "end": "18:00"}
    required_hours: float = 8.0