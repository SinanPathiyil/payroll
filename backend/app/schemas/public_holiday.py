from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date

# Request schemas
class PublicHolidayCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    date: date
    country: Optional[str] = Field(None, max_length=2)  # ISO country code
    is_optional: bool = False
    description: Optional[str] = None

class PublicHolidayUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    date: Optional[date] = None
    country: Optional[str] = Field(None, max_length=2)
    is_optional: Optional[bool] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PublicHolidayBulkImport(BaseModel):
    country: str = Field(..., description="Country code (US, UK, etc.)")
    year: int = Field(..., ge=2020, le=2100)

# Response schemas
class PublicHolidayResponse(BaseModel):
    id: str
    name: str
    date: date
    country: Optional[str]
    is_optional: bool
    description: Optional[str]
    is_active: bool
    imported: bool
    created_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

class PublicHolidayList(BaseModel):
    total: int
    year: int
    holidays: list[PublicHolidayResponse]