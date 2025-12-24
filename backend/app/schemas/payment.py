from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MilestoneCreate(BaseModel):
    name: str
    percentage: float  # 0-100
    amount: float

class MilestoneUpdate(BaseModel):
    name: Optional[str] = None
    percentage: Optional[float] = None
    amount: Optional[float] = None
    status: Optional[str] = None

class MilestoneResponse(BaseModel):
    milestone_id: str
    name: str
    percentage: float
    amount: float
    status: str
    reached_at: Optional[datetime]
    payment_received_at: Optional[datetime]
    meeting_scheduled_at: Optional[datetime]
    meeting_completed_at: Optional[datetime]
    notes: Optional[str]

class PaymentRecord(BaseModel):
    milestone_id: str
    amount: float
    payment_method: str  # "Bank Transfer", "Check", "Online", etc.
    transaction_id: Optional[str] = None
    payment_date: datetime
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: str
    project_id: str
    project_name: str
    client_id: str
    client_name: str
    milestone_id: str
    milestone_name: str
    amount: float
    payment_method: str
    transaction_id: Optional[str]
    payment_date: datetime
    notes: Optional[str]
    recorded_by: str
    recorded_by_name: str
    recorded_at: datetime