from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class ClientContact(BaseModel):
    name: str
    designation: str
    email: EmailStr
    phone: str
    is_primary: bool = False

class Client(BaseModel):
    company_name: str
    industry: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    
    contacts: List[ClientContact] = []  # Multiple contacts per client
    
    managed_by: str  # BA user_id who manages this client
    
    status: str = "active"  # active, inactive, on_hold
    
    # Contract details
    contract_start_date: Optional[datetime] = None
    contract_end_date: Optional[datetime] = None
    payment_terms: Optional[str] = None  # "Net 30", "Milestone-based", etc.
    
    # Metadata
    created_at: datetime = datetime.now()
    created_by: str  # BA user_id
    updated_at: Optional[datetime] = None
    
    # Communication
    last_contact_date: Optional[datetime] = None
    notes: Optional[str] = None
    
    # Statistics (calculated)
    total_projects: int = 0
    active_projects: int = 0
    total_revenue: float = 0.0
    pending_payments: float = 0.0