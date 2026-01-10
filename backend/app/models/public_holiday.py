from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class PublicHoliday(BaseModel):
    name: str  # "New Year", "Independence Day", etc.
    date: date  # Holiday date
    country: Optional[str] = None  # "US", "UK", etc. (if imported)
    is_optional: bool = False  # Optional holiday (employees can choose)
    description: Optional[str] = None
    is_active: bool = True
    imported: bool = False  # Auto-imported or manually added
    created_by: Optional[str] = None  # Admin user_id
    created_at: datetime = datetime.now()
    updated_at: Optional[datetime] = None