from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ============= CLIENT CONTACT SCHEMAS =============

class ClientContactCreate(BaseModel):
    name: str
    designation: str
    email: EmailStr
    phone: str
    is_primary: bool = False

class ClientContactResponse(BaseModel):
    name: str
    designation: str
    email: EmailStr
    phone: str
    is_primary: bool

# ============= CLIENT SCHEMAS =============

class ClientCreate(BaseModel):
    company_name: str
    industry: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    contacts: List[ClientContactCreate] = []
    contract_start_date: Optional[datetime] = None
    contract_end_date: Optional[datetime] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None

class ClientUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    contacts: Optional[List[ClientContactCreate]] = None
    contract_start_date: Optional[datetime] = None
    contract_end_date: Optional[datetime] = None
    payment_terms: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class ClientResponse(BaseModel):
    id: str
    company_name: str
    industry: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    website: Optional[str]
    contacts: List[ClientContactResponse]
    managed_by: str
    manager_name: str
    status: str
    contract_start_date: Optional[datetime]
    contract_end_date: Optional[datetime]
    payment_terms: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    last_contact_date: Optional[datetime]
    notes: Optional[str]
    total_projects: int
    active_projects: int
    total_revenue: float
    pending_payments: float

class ClientDetailResponse(ClientResponse):
    recent_projects: List[dict] = []
    communication_logs: List[dict] = []
    payment_history: List[dict] = []

# ============= COMMUNICATION LOG SCHEMAS =============

class CommunicationLogCreate(BaseModel):
    client_id: str
    communication_type: str  # "email", "call", "meeting", "message"
    subject: str
    notes: str
    contact_person: Optional[str] = None

class CommunicationLogResponse(BaseModel):
    id: str
    client_id: str
    client_name: str
    communication_type: str
    subject: str
    notes: str
    contact_person: Optional[str]
    created_by: str
    created_by_name: str
    created_at: datetime