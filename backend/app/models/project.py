from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProjectDocument(BaseModel):
    doc_id: str
    filename: str
    file_path: str  # Storage path or URL
    file_size: Optional[int] = None  # in bytes
    file_type: Optional[str] = None  # e.g., "pdf", "docx"
    uploaded_by: str  # User ID (typically HR)
    uploaded_at: datetime = datetime.now()

class Project(BaseModel):
    project_name: str
    description: Optional[str] = None
    assigned_to_team_lead: str  # Team Lead user ID
    team_id: str  # Which team owns this project
    created_by: str  # HR user ID who created this
    documents: List[ProjectDocument] = []
    status: str = "active"  # "active", "completed", "on_hold", "cancelled"
    priority: Optional[str] = "medium"  # "low", "medium", "high", "critical"
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    created_at: datetime = datetime.now()
    updated_at: Optional[datetime] = None
    
    # Progress tracking (will be updated by Team Lead in Phase 2)
    progress_percentage: float = 0.0  # 0-100
    total_tasks: int = 0  # Total tasks created for this project
    completed_tasks: int = 0  # Tasks marked as completed
    
class ProjectMilestone(BaseModel):
    milestone_id: str
    name: str
    percentage: float  # e.g., 50.0 for 50%
    amount: float
    status: str = "pending"  # pending, reached, payment_received, completed
    reached_at: Optional[datetime] = None
    payment_received_at: Optional[datetime] = None
    meeting_scheduled_at: Optional[datetime] = None
    meeting_completed_at: Optional[datetime] = None
    notes: Optional[str] = None

class RequirementDocument(BaseModel):
    doc_id: str
    version: str  # v1.0, v1.1, v2.0
    filename: str
    file_path: str
    file_size: int
    uploaded_by: str  # BA user_id
    uploaded_at: datetime
    shared_with_team_lead: bool = False
    shared_at: Optional[datetime] = None
    team_lead_approved: bool = False
    approved_at: Optional[datetime] = None
    approval_notes: Optional[str] = None
    is_latest: bool = True

class Project(BaseModel):
    project_name: str
    description: Optional[str] = None
    
    # CLIENT & BA FIELDS (NEW)
    client_id: str  # NEW - Link to Client
    managed_by_ba: str  # NEW - BA user_id who manages this project
    
    assigned_to_team_lead: str  # Team Lead user ID
    team_id: str  # Which team owns this project
    created_by: str  # BA user ID (not HR anymore)
    
    # REQUIREMENTS (NEW)
    requirement_documents: List[RequirementDocument] = []
    requirements_approved: bool = False  # NEW - TL must approve before starting
    
    # PROJECT DETAILS
    documents: List[ProjectDocument] = []  # Other project docs
    status: str = "requirement_gathering"  # NEW STATUSES BELOW
    priority: Optional[str] = "medium"
    
    # BUDGET & PAYMENT (NEW)
    estimated_budget: float
    total_contract_value: float
    milestones: List[ProjectMilestone] = []  # CUSTOM MILESTONES
    
    # DATES
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    created_at: datetime = datetime.now()
    updated_at: Optional[datetime] = None
    
    # PROGRESS
    progress_percentage: float = 0.0
    total_tasks: int = 0
    completed_tasks: int = 0

# NEW PROJECT STATUSES
"""
requirement_gathering - BA gathering requirements
requirement_uploaded - BA uploaded requirement doc
pending_tl_approval - Waiting for Team Lead to approve requirements
approved_ready_to_start - TL approved, ready for task creation
in_development - Tasks created, work in progress
milestone_reached - Waiting for BA to schedule meeting
client_review - Client reviewing milestone
payment_pending - Waiting for milestone payment
completed - Project finished
on_hold - Temporarily paused
cancelled - Project cancelled
"""