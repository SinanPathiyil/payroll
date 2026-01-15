from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from app.api.deps import get_current_ba, get_current_user, get_database
from app.schemas.project import ProjectResponse, ProjectDetailResponse
from app.schemas.payment import MilestoneCreate, MilestoneResponse, MilestoneUpdate
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
import base64
import uuid

router = APIRouter(prefix="/ba/projects", tags=["Business Analyst - Projects"])

# ============= HELPER FUNCTIONS =============

async def get_user_details(user_id: str, db) -> dict:
    """Get user details"""
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return user
    except:
        return None

async def get_client_details(client_id: str, db) -> dict:
    """Get client details"""
    try:
        client = await db.clients.find_one({"_id": ObjectId(client_id)})
        return client
    except:
        return None

async def get_team_details(team_id: str, db) -> dict:
    """Get team details"""
    try:
        team = await db.teams.find_one({"_id": ObjectId(team_id)})
        return team
    except:
        return None

async def validate_team_lead_for_ba(team_lead_id: str, db) -> bool:
    """Validate that user is a team lead"""
    user = await get_user_details(team_lead_id, db)
    if not user:
        return False
    return user.get("role") == "team_lead"

def save_document_to_db(file_content: bytes, filename: str, file_type: str) -> str:
    """Save document as base64"""
    encoded_content = base64.b64encode(file_content).decode('utf-8')
    return f"data:{file_type};base64,{encoded_content}"

def get_file_type(filename: str) -> str:
    """Get MIME type from filename"""
    extension = filename.split('.')[-1].lower()
    mime_types = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'txt': 'text/plain',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png'
    }
    return mime_types.get(extension, 'application/octet-stream')

# ============= PROJECT SCHEMAS (BA-SPECIFIC) =============

from pydantic import BaseModel

class BAProjectCreate(BaseModel):
    project_name: str
    description: Optional[str] = None
    client_id: str
    assigned_to_team_lead: str
    estimated_budget: float
    total_contract_value: float
    priority: str = "medium"
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    milestones: List[MilestoneCreate] = []  # Custom milestones

class BAProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    description: Optional[str] = None
    assigned_to_team_lead: Optional[str] = None
    estimated_budget: Optional[float] = None
    total_contract_value: Optional[float] = None
    priority: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None

class RequirementDocumentUpload(BaseModel):
    version: str  # e.g., "v1.0", "v1.1"
    notes: Optional[str] = None

class RequirementDocumentResponse(BaseModel):
    doc_id: str
    version: str
    filename: str
    file_path: str
    file_size: int
    uploaded_by: str
    uploaded_by_name: str
    uploaded_at: datetime
    shared_with_team_lead: bool
    shared_at: Optional[datetime]
    team_lead_approved: bool
    approved_at: Optional[datetime]
    rejected_at: Optional[datetime]
    approval_notes: Optional[str]
    is_latest: bool

# ============= BA PROJECT CRUD =============

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_ba_project(
    project_data: BAProjectCreate,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Create a new project (BA only)"""
    
    # Validate client exists and belongs to this BA
    client = await get_client_details(project_data.client_id, db)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    if client["managed_by"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client not managed by you"
        )
    
    if client["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create project for inactive client"
        )
    
    # Validate team lead
    if not await validate_team_lead_for_ba(project_data.assigned_to_team_lead, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team lead. User must have 'team_lead' role"
        )
    
    # Get team lead details
    team_lead = await get_user_details(project_data.assigned_to_team_lead, db)
    
    # Validate priority
    valid_priorities = ["low", "medium", "high", "critical"]
    if project_data.priority not in valid_priorities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority. Must be one of: {', '.join(valid_priorities)}"
        )
    
    # Validate milestones
    if not project_data.milestones:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one milestone is required"
        )
    
    # Validate milestone percentages and amounts
    total_percentage = sum(m.percentage for m in project_data.milestones)
    total_amount = sum(m.amount for m in project_data.milestones)
    
    if abs(total_percentage - 100.0) > 0.01:  # Allow small floating point errors
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Milestone percentages must sum to 100%. Current total: {total_percentage}%"
        )
    
    if abs(total_amount - project_data.total_contract_value) > 0.01:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Milestone amounts must sum to total contract value. Expected: {project_data.total_contract_value}, Got: {total_amount}"
        )
    
    # Create milestones
    milestones = []
    for milestone_data in project_data.milestones:
        milestone = {
            "milestone_id": str(uuid.uuid4()),
            "name": milestone_data.name,
            "percentage": milestone_data.percentage,
            "amount": milestone_data.amount,
            "status": "pending",
            "reached_at": None,
            "payment_received_at": None,
            "meeting_scheduled_at": None,
            "meeting_completed_at": None,
            "notes": None
        }
        milestones.append(milestone)
    
    # Create project
    new_project = {
        "project_name": project_data.project_name,
        "description": project_data.description,
        "client_id": project_data.client_id,
        "managed_by_ba": str(current_user["_id"]),
        "assigned_to_team_lead": project_data.assigned_to_team_lead,
        "team_id": team_lead.get("team_id"),  # Get team from team lead
        "created_by": str(current_user["_id"]),
        "requirement_documents": [],
        "requirements_approved": False,
        "documents": [],
        "status": "requirement_gathering",
        "priority": project_data.priority,
        "estimated_budget": project_data.estimated_budget,
        "total_contract_value": project_data.total_contract_value,
        "milestones": milestones,
        "start_date": project_data.start_date,
        "due_date": project_data.due_date,
        "completion_date": None,
        "created_at": datetime.now(),
        "updated_at": None,
        "progress_percentage": 0.0,
        "total_tasks": 0,
        "completed_tasks": 0
    }
    
    result = await db.projects.insert_one(new_project)
    project_id = str(result.inserted_id)
    
    # Send notification to Team Lead
    notification = {
        "from_user": str(current_user["_id"]),
        "to_user": project_data.assigned_to_team_lead,
        "content": f"New project assigned: {project_data.project_name}\nClient: {client['company_name']}\nPlease wait for requirement documents.",
        "project_id": project_id,
        "is_read": False,
        "created_at": datetime.now()
    }
    await db.messages.insert_one(notification)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "ba_project_created",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "project_id": project_id,
            "project_name": project_data.project_name,
            "client_id": project_data.client_id,
            "team_lead_id": project_data.assigned_to_team_lead,
            "total_contract_value": project_data.total_contract_value
        },
        "timestamp": datetime.now()
    })
    
    return ProjectResponse(
        id=project_id,
        project_name=new_project["project_name"],
        description=new_project["description"],
        project_id=None,
        project_name_display=new_project["project_name"],
        assigned_to_team_lead=new_project["assigned_to_team_lead"],
        team_lead_name=team_lead["full_name"] if team_lead else None,
        team_id=new_project["team_id"],
        team_name=None,  # BA doesn't need team name
        created_by=new_project["created_by"],
        created_by_name=current_user["full_name"],
        status=new_project["status"],
        priority=new_project["priority"],
        progress_percentage=new_project["progress_percentage"],
        total_tasks=new_project["total_tasks"],
        completed_tasks=new_project["completed_tasks"],
        document_count=len(new_project["documents"]),
        start_date=new_project["start_date"],
        due_date=new_project["due_date"],
        completion_date=new_project["completion_date"],
        created_at=new_project["created_at"],
        updated_at=new_project["updated_at"]
    )

@router.get("/", response_model=List[ProjectResponse])
async def get_ba_projects(
    status_filter: Optional[str] = None,
    client_id: Optional[str] = None,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get all projects managed by current BA"""
    
    query = {"managed_by_ba": str(current_user["_id"])}
    
    if status_filter:
        query["status"] = status_filter
    
    if client_id:
        query["client_id"] = client_id
    
    projects = await db.projects.find(query).sort("created_at", -1).to_list(length=None)
    
    result = []
    for project in projects:
        # Get team lead details
        team_lead = await get_user_details(project["assigned_to_team_lead"], db)
        
        # Get client details
        client = await get_client_details(project["client_id"], db)
        
        result.append(ProjectResponse(
            id=str(project["_id"]),
            project_name=project["project_name"],
            description=project.get("description"),
            project_id=None,
            project_name_display=f"{project['project_name']} ({client['company_name'] if client else 'Unknown Client'})",
            client_id=project.get("client_id"), 
            client_name=client['company_name'] if client else None,
            assigned_to_team_lead=project["assigned_to_team_lead"],
            team_lead_name=team_lead["full_name"] if team_lead else "Unknown",
            team_id=project.get("team_id"),
            team_name=None,
            created_by=project["created_by"],
            created_by_name=current_user["full_name"],
            status=project["status"],
            priority=project.get("priority", "medium"),
            progress_percentage=project.get("progress_percentage", 0.0),
            total_tasks=project.get("total_tasks", 0),
            completed_tasks=project.get("completed_tasks", 0),
            document_count=len(project.get("documents", [])) + len(project.get("requirement_documents", [])),
            start_date=project.get("start_date"),
            due_date=project.get("due_date"),
            completion_date=project.get("completion_date"),
            created_at=project["created_at"],
            updated_at=project.get("updated_at"),
            estimated_budget=project.get("estimated_budget"), 
            total_contract_value=project.get("total_contract_value")
        ))
    
    return result

@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_ba_project_details(
    project_id: str,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get detailed project information (BA only)"""
    
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify BA owns this project
    if project.get("managed_by_ba") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this project"
        )
    
    # Get team lead details
    team_lead = await get_user_details(project["assigned_to_team_lead"], db)
    team_lead_details = None
    if team_lead:
        team_lead_details = {
            "id": str(team_lead["_id"]),
            "email": team_lead["email"],
            "full_name": team_lead["full_name"],
            "role": team_lead["role"]
        }
    
    # Get client details
    client = await get_client_details(project["client_id"], db)
    client_details = None
    if client:
        client_details = {
            "id": str(client["_id"]),
            "company_name": client["company_name"],
            "status": client["status"]
        }
    
    # Get requirement documents
    requirement_docs = []
    for doc in project.get("requirement_documents", []):
        uploader = await get_user_details(doc["uploaded_by"], db)
        requirement_docs.append({
            "doc_id": doc["doc_id"],
            "version": doc["version"],
            "filename": doc["filename"],
            "file_path": doc.get("file_path"),
            "file_size": doc.get("file_size"),
            "uploaded_at": doc["uploaded_at"],
            "shared_with_team_lead": doc.get("shared_with_team_lead", False),
            "team_lead_approved": doc.get("team_lead_approved", False),
            "rejected_at": doc.get("rejected_at"),
            "is_latest": doc.get("is_latest", False)
        })
    
    # Get other documents
    documents = []
    for doc in project.get("documents", []):
        uploader = await get_user_details(doc["uploaded_by"], db)
        documents.append({
            "doc_id": doc["doc_id"],
            "filename": doc["filename"],
            "uploaded_by_name": uploader["full_name"] if uploader else "Unknown",
            "uploaded_at": doc["uploaded_at"]
        })
    
    # Get milestones
    milestones = []
    for milestone in project.get("milestones", []):
        milestones.append(MilestoneResponse(
            milestone_id=milestone["milestone_id"],
            name=milestone["name"],
            percentage=milestone["percentage"],
            amount=milestone["amount"],
            status=milestone["status"],
            reached_at=milestone.get("reached_at"),
            payment_received_at=milestone.get("payment_received_at"),
            meeting_scheduled_at=milestone.get("meeting_scheduled_at"),
            meeting_completed_at=milestone.get("meeting_completed_at"),
            notes=milestone.get("notes")
        ))
    
    return ProjectDetailResponse(
        id=str(project["_id"]),
        project_name=project["project_name"],
        description=project.get("description"),
        project_id=None,
        project_name_display=project["project_name"],
        assigned_to_team_lead=project["assigned_to_team_lead"],
        team_lead_name=team_lead["full_name"] if team_lead else "Unknown",
        team_id=project.get("team_id"),
        team_name=None,
        created_by=project["created_by"],
        created_by_name=current_user["full_name"],
        status=project["status"],
        priority=project.get("priority", "medium"),
        progress_percentage=project.get("progress_percentage", 0.0),
        total_tasks=project.get("total_tasks", 0),
        completed_tasks=project.get("completed_tasks", 0),
        document_count=len(project.get("documents", [])) + len(requirement_docs),
        start_date=project.get("start_date"),
        due_date=project.get("due_date"),
        completion_date=project.get("completion_date"),
        created_at=project["created_at"],
        updated_at=project.get("updated_at"),
        documents=[],  # Regular docs
        team_lead_details=team_lead_details,
        project_details=None,
        client_details=client_details,
        requirement_documents=requirement_docs,
        milestones=milestones,
        estimated_budget=project.get("estimated_budget"),
        total_contract_value=project.get("total_contract_value")
    )

@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_ba_project(
    project_id: str,
    project_data: BAProjectUpdate,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Update project information (BA only)"""
    
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify BA owns this project
    if project.get("managed_by_ba") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this project"
        )
    
    update_data = {}
    
    if project_data.project_name is not None:
        update_data["project_name"] = project_data.project_name
    
    if project_data.description is not None:
        update_data["description"] = project_data.description
    
    if project_data.assigned_to_team_lead is not None:
        if not await validate_team_lead_for_ba(project_data.assigned_to_team_lead, db):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid team lead"
            )
        update_data["assigned_to_team_lead"] = project_data.assigned_to_team_lead
        
        # Update team_id from new team lead
        new_tl = await get_user_details(project_data.assigned_to_team_lead, db)
        if new_tl:
            update_data["team_id"] = new_tl.get("team_id")
    
    if project_data.estimated_budget is not None:
        update_data["estimated_budget"] = project_data.estimated_budget
    
    if project_data.total_contract_value is not None:
        update_data["total_contract_value"] = project_data.total_contract_value
    
    if project_data.priority is not None:
        valid_priorities = ["low", "medium", "high", "critical"]
        if project_data.priority not in valid_priorities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid priority"
            )
        update_data["priority"] = project_data.priority
    
    if project_data.start_date is not None:
        update_data["start_date"] = project_data.start_date
    
    if project_data.due_date is not None:
        update_data["due_date"] = project_data.due_date
    
    if project_data.status is not None:
        # BA can only update to certain statuses
        ba_allowed_statuses = [
            "requirement_gathering", "requirement_uploaded", 
            "on_hold", "cancelled", "completed"
        ]
        if project_data.status not in ba_allowed_statuses: #project_data.status != project["status"] and use this when editing neeed to be done in all statuses
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"BA can only set status to: {', '.join(ba_allowed_statuses)}"
            )
        update_data["status"] = project_data.status
    
    if update_data:
        update_data["updated_at"] = datetime.now()
        await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": update_data}
        )
        
        # Create audit log
        await db.audit_logs.insert_one({
            "action_type": "ba_project_updated",
            "performed_by": str(current_user["_id"]),
            "user_role": current_user["role"],
            "details": {
                "project_id": project_id,
                "updated_fields": list(update_data.keys())
            },
            "timestamp": datetime.now()
        })
    
    # Get updated project
    updated_project = await db.projects.find_one({"_id": ObjectId(project_id)})
    
    # Get details
    team_lead = await get_user_details(updated_project["assigned_to_team_lead"], db)
    client = await get_client_details(updated_project["client_id"], db)
    
    return ProjectResponse(
        id=str(updated_project["_id"]),
        project_name=updated_project["project_name"],
        description=updated_project.get("description"),
        project_id=None,
        project_name_display=f"{updated_project['project_name']} ({client['company_name'] if client else 'Unknown'})",
        assigned_to_team_lead=updated_project["assigned_to_team_lead"],
        team_lead_name=team_lead["full_name"] if team_lead else "Unknown",
        team_id=updated_project.get("team_id"),
        team_name=None,
        created_by=updated_project["created_by"],
        created_by_name=current_user["full_name"],
        status=updated_project["status"],
        priority=updated_project.get("priority", "medium"),
        progress_percentage=updated_project.get("progress_percentage", 0.0),
        total_tasks=updated_project.get("total_tasks", 0),
        completed_tasks=updated_project.get("completed_tasks", 0),
        document_count=len(updated_project.get("documents", [])),
        start_date=updated_project.get("start_date"),
        due_date=updated_project.get("due_date"),
        completion_date=updated_project.get("completion_date"),
        created_at=updated_project["created_at"],
        updated_at=updated_project.get("updated_at")
    )
    
@router.delete("/{project_id}")
async def delete_ba_project(
    project_id: str,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Delete (cancel) a project (BA only)"""
    
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify BA owns this project
    if project.get("managed_by_ba") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this project"
        )
    
    # Don't actually delete - just set status to cancelled
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {
            "$set": {
                "status": "cancelled",
                "updated_at": datetime.now()
            }
        }
    )
    
    # Notify Team Lead
    notification = {
        "from_user": str(current_user["_id"]),
        "to_user": project["assigned_to_team_lead"],
        "content": f"Project '{project['project_name']}' has been cancelled by Business Analyst.",
        "project_id": project_id,
        "is_read": False,
        "created_at": datetime.now()
    }
    await db.messages.insert_one(notification)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "ba_project_cancelled",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "project_id": project_id,
            "project_name": project["project_name"]
        },
        "timestamp": datetime.now()
    })
    
    return {
        "message": "Project cancelled successfully",
        "project_id": project_id
    }

# ============= REQUIREMENT DOCUMENT MANAGEMENT =============

@router.post("/{project_id}/requirements/upload", response_model=RequirementDocumentResponse)
async def upload_requirement_document(
    project_id: str,
    version: str,
    file: UploadFile = File(...),
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Upload requirement document (BA only)"""
    
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify BA owns this project
    if project.get("managed_by_ba") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload requirements for this project"
        )
    
    # Read file
    file_content = await file.read()
    file_size = len(file_content)
    
    # Check file size (5MB limit)
    MAX_FILE_SIZE = 5 * 1024 * 1024
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds 5MB limit. Current size: {file_size / (1024*1024):.2f}MB"
        )
    
    # Get file type
    file_type = get_file_type(file.filename)
    
    # Save to database
    file_path = save_document_to_db(file_content, file.filename, file_type)
    
    # Mark all previous versions as not latest
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": {"requirement_documents.$[].is_latest": False}}
    )
    
    # Create requirement document
    doc_id = str(uuid.uuid4())
    new_doc = {
        "doc_id": doc_id,
        "version": version,
        "filename": file.filename,
        "file_path": file_path,
        "file_size": file_size,
        "uploaded_by": str(current_user["_id"]),
        "uploaded_at": datetime.now(),
        "shared_with_team_lead": False,
        "shared_at": None,
        "team_lead_approved": False,
        "approved_at": None,
        "rejected_at": None,
        "approval_notes": notes,
        "is_latest": True
    }
    
    # Add to project
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {
            "$push": {"requirement_documents": new_doc},
            "$set": {
                "status": "requirement_uploaded",
                "requirements_approved": False,  # ← ADD THIS - reset when new doc uploaded
                "updated_at": datetime.now()
            }
        }
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "requirement_document_uploaded",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "project_id": project_id,
            "version": version,
            "filename": file.filename
        },
        "timestamp": datetime.now()
    })
    
    return RequirementDocumentResponse(
        doc_id=doc_id,
        version=version,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        uploaded_by=str(current_user["_id"]),
        uploaded_by_name=current_user["full_name"],
        uploaded_at=new_doc["uploaded_at"],
        shared_with_team_lead=False,
        shared_at=None,
        team_lead_approved=False,
        approved_at=None,
        rejected_at=None,
        approval_notes=notes,
        is_latest=True
    )

@router.post("/{project_id}/requirements/{doc_id}/share")
async def share_requirement_with_team_lead(
    project_id: str,
    doc_id: str,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Share requirement document with Team Lead (BA only)"""
    
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify BA owns this project
    if project.get("managed_by_ba") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Find document
    doc_found = False
    for doc in project.get("requirement_documents", []):
        if doc["doc_id"] == doc_id:
            doc_found = True
            if doc.get("shared_with_team_lead"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Document already shared"
                )
            break
    
    if not doc_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement document not found"
        )
    
    # Update document
    await db.projects.update_one(
        {
            "_id": ObjectId(project_id),
            "requirement_documents.doc_id": doc_id
        },
        {
            "$set": {
                "requirement_documents.$.shared_with_team_lead": True,
                "requirement_documents.$.shared_at": datetime.now(),
                "status": "pending_tl_approval",
                "updated_at": datetime.now()
            }
        }
    )
    
    # Notify Team Lead
    notification = {
        "from_user": str(current_user["_id"]),
        "to_user": project["assigned_to_team_lead"],
        "content": f"Requirement document shared for project: {project['project_name']}\nPlease review and approve to start development.",
        "project_id": project_id,
        "is_read": False,
        "created_at": datetime.now()
    }
    await db.messages.insert_one(notification)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "requirement_shared_with_tl",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "target_user": project["assigned_to_team_lead"],
        "details": {
            "project_id": project_id,
            "doc_id": doc_id
        },
        "timestamp": datetime.now()
    })
    
    return {"message": "Requirement document shared with Team Lead successfully"}

@router.get("/{project_id}/requirements", response_model=List[RequirementDocumentResponse])
async def get_requirement_documents(
    project_id: str,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get all requirement documents for a project"""
    
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify BA owns this project
    if project.get("managed_by_ba") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    result = []
    for doc in project.get("requirement_documents", []):
        uploader = await get_user_details(doc["uploaded_by"], db)
        result.append(RequirementDocumentResponse(
            doc_id=doc["doc_id"],
            version=doc["version"],
            filename=doc["filename"],
            file_path=doc["file_path"],
            file_size=doc.get("file_size"),
            uploaded_by=doc["uploaded_by"],
            uploaded_by_name=uploader["full_name"] if uploader else "Unknown",
            uploaded_at=doc["uploaded_at"],
            shared_with_team_lead=doc.get("shared_with_team_lead", False),
            shared_at=doc.get("shared_at"),
            team_lead_approved=doc.get("team_lead_approved", False),
            approved_at=doc.get("approved_at"),
            rejected_at=doc.get("rejected_at"),
            approval_notes=doc.get("approval_notes"),
            is_latest=doc.get("is_latest", False)
        ))
    
    return result

# ============= MILESTONE MANAGEMENT =============

@router.get("/{project_id}/milestones", response_model=List[MilestoneResponse])
async def get_project_milestones(
    project_id: str,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get all milestones for a project"""
    
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify BA owns this project
    if project.get("managed_by_ba") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    milestones = []
    for milestone in project.get("milestones", []):
        milestones.append(MilestoneResponse(
            milestone_id=milestone["milestone_id"],
            name=milestone["name"],
            percentage=milestone["percentage"],
            amount=milestone["amount"],
            status=milestone["status"],
            reached_at=milestone.get("reached_at"),
            payment_received_at=milestone.get("payment_received_at"),
            meeting_scheduled_at=milestone.get("meeting_scheduled_at"),
            meeting_completed_at=milestone.get("meeting_completed_at"),
            notes=milestone.get("notes")
        ))
    
    return milestones

@router.patch("/{project_id}/milestones/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(
    project_id: str,
    milestone_id: str,
    milestone_data: MilestoneUpdate,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Update milestone (BA only - limited fields)"""
    
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify BA owns this project
    if project.get("managed_by_ba") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Find milestone
    milestone_index = None
    milestone = None
    for idx, m in enumerate(project.get("milestones", [])):
        if m["milestone_id"] == milestone_id:
            milestone_index = idx
            milestone = m
            break
    
    if milestone_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found"
        )
    
    # BA can only update name and notes
    if milestone_data.name is not None:
        await db.projects.update_one(
            {"_id": ObjectId(project_id), f"milestones.milestone_id": milestone_id},
            {"$set": {f"milestones.{milestone_index}.name": milestone_data.name}}
        )
    
    # Get updated milestone
    updated_project = await db.projects.find_one({"_id": ObjectId(project_id)})
    updated_milestone = None
    for m in updated_project.get("milestones", []):
        if m["milestone_id"] == milestone_id:
            updated_milestone = m
            break
    
    return MilestoneResponse(
        milestone_id=updated_milestone["milestone_id"],
        name=updated_milestone["name"],
        percentage=updated_milestone["percentage"],
        amount=updated_milestone["amount"],
        status=updated_milestone["status"],
        reached_at=updated_milestone.get("reached_at"),
        payment_received_at=updated_milestone.get("payment_received_at"),
        meeting_scheduled_at=updated_milestone.get("meeting_scheduled_at"),
        meeting_completed_at=updated_milestone.get("meeting_completed_at"),
        notes=updated_milestone.get("notes")
    )

# ============= PROJECT STATISTICS =============

@router.get("/{project_id}/stats")
async def get_ba_project_statistics(
    project_id: str,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get project statistics for BA"""
    
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify BA owns this project
    if project.get("managed_by_ba") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Calculate payment statistics
    total_paid = 0.0
    pending_payment = 0.0
    next_milestone = None
    
    for milestone in project.get("milestones", []):
        if milestone.get("payment_received_at"):
            total_paid += milestone["amount"]
        elif milestone["status"] == "reached":
            pending_payment += milestone["amount"]
            if not next_milestone:
                next_milestone = {
                    "name": milestone["name"],
                    "amount": milestone["amount"],
                    "percentage": milestone["percentage"]
                }
        elif milestone["status"] == "pending" and not next_milestone:
            next_milestone = {
                "name": milestone["name"],
                "amount": milestone["amount"],
                "percentage": milestone["percentage"],
                "target_percentage": milestone["percentage"]
            }
    
    # Days until due
    days_until_due = None
    if project.get("due_date"):
        delta = project["due_date"] - datetime.now()
        days_until_due = delta.days
    
    # Project duration
    project_duration_days = None
    if project.get("start_date"):
        if project.get("completion_date"):
            delta = project["completion_date"] - project["start_date"]
        else:
            delta = datetime.now() - project["start_date"]
        project_duration_days = delta.days
    
    return {
        "project_id": project_id,
        "project_name": project["project_name"],
        "status": project["status"],
        "progress_percentage": project.get("progress_percentage", 0.0),
        "total_contract_value": project.get("total_contract_value", 0.0),
        "total_paid": total_paid,
        "pending_payment": pending_payment,
        "remaining_payment": project.get("total_contract_value", 0.0) - total_paid,
        "next_milestone": next_milestone,
        "total_tasks": project.get("total_tasks", 0),
        "completed_tasks": project.get("completed_tasks", 0),
        "days_until_due": days_until_due,
        "project_duration_days": project_duration_days,
        "requirements_approved": project.get("requirements_approved", False),
        "is_overdue": days_until_due < 0 if days_until_due is not None else False
    }