from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.payment import MilestoneResponse

# ============= PROJECT DOCUMENT SCHEMAS =============

class ProjectDocumentUpload(BaseModel):
    filename: str
    file_path: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None

class ProjectDocumentResponse(BaseModel):
    doc_id: str
    filename: str
    file_path: str
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    uploaded_by: str
    uploaded_by_name: Optional[str] = None  # For display
    uploaded_at: datetime

# ============= PROJECT SCHEMAS =============

class ProjectCreate(BaseModel):
    project_name: str
    description: Optional[str] = None
    assigned_to_team_lead: str  # Team Lead user ID
    team_id: str  # Team ID
    priority: Optional[str] = "medium"
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None

class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    description: Optional[str] = None
    assigned_to_team_lead: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None

class ProjectStatusUpdate(BaseModel):
    status: str  # "active", "completed", "on_hold", "cancelled"
    completion_date: Optional[datetime] = None

class ProjectProgressUpdate(BaseModel):
    progress_percentage: float  # 0-100
    total_tasks: Optional[int] = None
    completed_tasks: Optional[int] = None

class ProjectResponse(BaseModel):
    id: str
    project_name: str
    description: Optional[str] = None
    project_id: Optional[str] = None  
    project_name_display: Optional[str] = None 
    client_id: Optional[str] = None  
    client_name: Optional[str] = None
    assigned_to_team_lead: str
    team_lead_name: Optional[str] = None  # For display
    team_id: Optional[str] = None
    team_name: Optional[str] = None  # For display
    created_by: str
    created_by_name: Optional[str] = None  # For display
    status: str
    priority: Optional[str] = "medium"
    progress_percentage: float = 0.0
    total_tasks: int = 0
    completed_tasks: int = 0
    document_count: int = 0
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    estimated_budget: Optional[float] = None  
    total_contract_value: Optional[float] = None

class ProjectDetailResponse(ProjectResponse):
    documents: List[ProjectDocumentResponse] = []
    requirement_documents: List[dict] = [] 
    milestones: List[MilestoneResponse] = []  
    team_lead_details: Optional[dict] = None  # Full team lead info
    team_details: Optional[dict] = None  # Full team info
    client_details: Optional[dict] = None  
    project_id: Optional[str] = None  
    project_name_display: Optional[str] = None