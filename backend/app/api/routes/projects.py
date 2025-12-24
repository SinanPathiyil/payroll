from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from app.api.deps import (
    get_current_hr, 
    get_current_team_lead_or_hr, 
    get_current_user, 
    get_database, 
    verify_project_access
)
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetailResponse,
    ProjectStatusUpdate, ProjectProgressUpdate, ProjectDocumentUpload,
    ProjectDocumentResponse
)
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
import base64
import os
import uuid

router = APIRouter(prefix="/projects", tags=["Projects"])

# ============= HELPER FUNCTIONS =============

async def get_user_details(user_id: str, db) -> dict:
    """Helper to get user details"""
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return user
    except:
        return None

async def get_team_details(team_id: str, db) -> dict:
    """Helper to get team details"""
    try:
        team = await db.teams.find_one({"_id": ObjectId(team_id)})
        return team
    except:
        return None

async def validate_team_lead_assignment(team_lead_id: str, team_id: str, db) -> bool:
    """Validate that team lead is actually the lead of the specified team"""
    team = await get_team_details(team_id, db)
    if not team:
        return False
    return team.get("team_lead_id") == team_lead_id

async def check_project_name_exists(project_name: str, db, exclude_id: Optional[str] = None) -> bool:
    """Check if project name already exists"""
    query = {"project_name": project_name}
    if exclude_id:
        query["_id"] = {"$ne": ObjectId(exclude_id)}
    
    existing = await db.projects.find_one(query)
    return existing is not None

async def save_document_to_db(file_content: bytes, filename: str, file_size: int, file_type: str) -> str:
    """Save document as base64 in database (for files < 5MB)"""
    # Encode file content to base64
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
        'png': 'image/png',
        'gif': 'image/gif'
    }
    return mime_types.get(extension, 'application/octet-stream')

# ============= PROJECT CRUD ENDPOINTS =============

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Create a new project (HR only)"""
    
    # Check if project name already exists
    if await check_project_name_exists(project_data.project_name, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project name already exists"
        )
    
    # Validate team exists
    team = await get_team_details(project_data.team_id, db)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    if not team.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign project to inactive team"
        )
    
    # Validate team lead assignment
    if not await validate_team_lead_assignment(project_data.assigned_to_team_lead, project_data.team_id, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team lead must be the lead of the specified team"
        )
    
    # Get team lead details
    team_lead = await get_user_details(project_data.assigned_to_team_lead, db)
    
    # Create project
    new_project = {
        "project_name": project_data.project_name,
        "description": project_data.description,
        "assigned_to_team_lead": project_data.assigned_to_team_lead,
        "team_id": project_data.team_id,
        "created_by": str(current_user["_id"]),
        "documents": [],
        "status": "active",
        "priority": project_data.priority or "medium",
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
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "project_created",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "project_id": project_id,
            "project_name": project_data.project_name,
            "team_id": project_data.team_id,
            "team_lead_id": project_data.assigned_to_team_lead
        },
        "timestamp": datetime.now()
    })
    
    return ProjectResponse(
        id=project_id,
        project_name=new_project["project_name"],
        description=new_project["description"],
        assigned_to_team_lead=new_project["assigned_to_team_lead"],
        team_lead_name=team_lead["full_name"] if team_lead else None,
        team_id=new_project["team_id"],
        team_name=team["team_name"] if team else None,
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
async def get_projects(
    status_filter: Optional[str] = None,
    team_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get projects based on user role:
    - HR: All projects
    - Team Lead: Only projects assigned to them
    - Employee: No access (they see tasks only)
    """
    
    query = {}
    
    # Role-based filtering
    if current_user["role"] == "hr":
        # HR can see all projects
        if status_filter:
            query["status"] = status_filter
        if team_id:
            query["team_id"] = team_id
    elif current_user["role"] == "team_lead":
        # Team Lead sees only their projects
        query["assigned_to_team_lead"] = str(current_user["_id"])
        if status_filter:
            query["status"] = status_filter
    else:
        # Employees and others don't have direct project access
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view projects"
        )
    
    projects = await db.projects.find(query).sort("created_at", -1).to_list(length=None)
    
    result = []
    for project in projects:
        # Get team lead details
        team_lead = await get_user_details(project["assigned_to_team_lead"], db)
        
        # Get team details
        team = await get_team_details(project["team_id"], db)
        
        # Get creator details
        creator = await get_user_details(project["created_by"], db)
        
        result.append(ProjectResponse(
            id=str(project["_id"]),
            project_name=project["project_name"],
            description=project.get("description"),
            assigned_to_team_lead=project["assigned_to_team_lead"],
            team_lead_name=team_lead["full_name"] if team_lead else "Unknown",
            team_id=project["team_id"],
            team_name=team["team_name"] if team else "Unknown",
            created_by=project["created_by"],
            created_by_name=creator["full_name"] if creator else "Unknown",
            status=project["status"],
            priority=project.get("priority", "medium"),
            progress_percentage=project.get("progress_percentage", 0.0),
            total_tasks=project.get("total_tasks", 0),
            completed_tasks=project.get("completed_tasks", 0),
            document_count=len(project.get("documents", [])),
            start_date=project.get("start_date"),
            due_date=project.get("due_date"),
            completion_date=project.get("completion_date"),
            created_at=project["created_at"],
            updated_at=project.get("updated_at")
        ))
    
    return result

@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project_details(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get detailed project information with documents"""
    
    # Get project
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
    
    # Verify access
    if not await verify_project_access(project_id, current_user, db):
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
    
    # Get team details
    team = await get_team_details(project["team_id"], db)
    team_details = None
    if team:
        team_details = {
            "id": str(team["_id"]),
            "team_name": team["team_name"],
            "description": team.get("description"),
            "member_count": len(team.get("members", []))
        }
    
    # Get creator details
    creator = await get_user_details(project["created_by"], db)
    
    # Get document details with uploader info
    documents = []
    for doc in project.get("documents", []):
        uploader = await get_user_details(doc["uploaded_by"], db)
        documents.append(ProjectDocumentResponse(
            doc_id=doc["doc_id"],
            filename=doc["filename"],
            file_path=doc["file_path"],
            file_size=doc.get("file_size"),
            file_type=doc.get("file_type"),
            uploaded_by=doc["uploaded_by"],
            uploaded_by_name=uploader["full_name"] if uploader else "Unknown",
            uploaded_at=doc["uploaded_at"]
        ))
    
    return ProjectDetailResponse(
        id=str(project["_id"]),
        project_name=project["project_name"],
        description=project.get("description"),
        assigned_to_team_lead=project["assigned_to_team_lead"],
        team_lead_name=team_lead["full_name"] if team_lead else "Unknown",
        team_id=project["team_id"],
        team_name=team["team_name"] if team else "Unknown",
        created_by=project["created_by"],
        created_by_name=creator["full_name"] if creator else "Unknown",
        status=project["status"],
        priority=project.get("priority", "medium"),
        progress_percentage=project.get("progress_percentage", 0.0),
        total_tasks=project.get("total_tasks", 0),
        completed_tasks=project.get("completed_tasks", 0),
        document_count=len(project.get("documents", [])),
        start_date=project.get("start_date"),
        due_date=project.get("due_date"),
        completion_date=project.get("completion_date"),
        created_at=project["created_at"],
        updated_at=project.get("updated_at"),
        documents=documents,
        team_lead_details=team_lead_details,
        team_details=team_details
    )

@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Update project information (HR only)"""
    
    # Get existing project
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
    
    update_data = {}
    
    # Update project name
    if project_data.project_name is not None:
        # Check if new name already exists
        if await check_project_name_exists(project_data.project_name, db, exclude_id=project_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project name already exists"
            )
        update_data["project_name"] = project_data.project_name
    
    # Update description
    if project_data.description is not None:
        update_data["description"] = project_data.description
    
    # Update team lead
    if project_data.assigned_to_team_lead is not None:
        # Validate new team lead assignment
        if not await validate_team_lead_assignment(project_data.assigned_to_team_lead, project["team_id"], db):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team lead must be the lead of the project's team"
            )
        update_data["assigned_to_team_lead"] = project_data.assigned_to_team_lead
    
    # Update status
    if project_data.status is not None:
        valid_statuses = ["active", "completed", "on_hold", "cancelled"]
        if project_data.status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        update_data["status"] = project_data.status
        
        # If marking as completed, set completion date
        if project_data.status == "completed" and not project.get("completion_date"):
            update_data["completion_date"] = project_data.completion_date or datetime.now()
    
    # Update priority
    if project_data.priority is not None:
        valid_priorities = ["low", "medium", "high", "critical"]
        if project_data.priority not in valid_priorities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid priority. Must be one of: {', '.join(valid_priorities)}"
            )
        update_data["priority"] = project_data.priority
    
    # Update dates
    if project_data.start_date is not None:
        update_data["start_date"] = project_data.start_date
    
    if project_data.due_date is not None:
        update_data["due_date"] = project_data.due_date
    
    if project_data.completion_date is not None:
        update_data["completion_date"] = project_data.completion_date
    
    if update_data:
        update_data["updated_at"] = datetime.now()
        await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": update_data}
        )
        
        # Create audit log
        await db.audit_logs.insert_one({
            "action_type": "project_updated",
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
    
    # Get team lead, team, and creator details
    team_lead = await get_user_details(updated_project["assigned_to_team_lead"], db)
    team = await get_team_details(updated_project["team_id"], db)
    creator = await get_user_details(updated_project["created_by"], db)
    
    return ProjectResponse(
        id=str(updated_project["_id"]),
        project_name=updated_project["project_name"],
        description=updated_project.get("description"),
        assigned_to_team_lead=updated_project["assigned_to_team_lead"],
        team_lead_name=team_lead["full_name"] if team_lead else "Unknown",
        team_id=updated_project["team_id"],
        team_name=team["team_name"] if team else "Unknown",
        created_by=updated_project["created_by"],
        created_by_name=creator["full_name"] if creator else "Unknown",
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
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Delete project (HR only) - Permanent deletion"""
    
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
    
    # Check if project has active tasks
    active_tasks = await db.tasks.count_documents({
        "project_id": project_id,
        "status": {"$nin": ["completed", "cancelled"]}
    })
    
    if active_tasks > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete project with {active_tasks} active task(s). Complete or cancel tasks first."
        )
    
    # Create audit log before deletion
    await db.audit_logs.insert_one({
        "action_type": "project_deleted",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "project_id": project_id,
            "project_name": project["project_name"],
            "team_id": project["team_id"]
        },
        "timestamp": datetime.now()
    })
    
    # Delete project
    await db.projects.delete_one({"_id": ObjectId(project_id)})
    
    return {"message": "Project deleted successfully"}

# ============= PROJECT STATUS & PROGRESS MANAGEMENT =============

@router.patch("/{project_id}/status", response_model=ProjectResponse)
async def update_project_status(
    project_id: str,
    status_data: ProjectStatusUpdate,
    current_user: dict = Depends(get_current_team_lead_or_hr),
    db = Depends(get_database)
):
    """
    Update project status:
    - Team Lead: Can submit for HR validation (pending_validation status)
    - HR: Can validate and finalize status
    """
    
    # Get project
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
    
    # Verify access
    if not await verify_project_access(project_id, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this project"
        )
    
    valid_statuses = ["active", "completed", "on_hold", "cancelled"]
    if status_data.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    update_data = {
        "status": status_data.status,
        "updated_at": datetime.now()
    }
    
    # If marking as completed, set completion date
    if status_data.status == "completed":
        update_data["completion_date"] = status_data.completion_date or datetime.now()
    
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_data}
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "project_status_updated",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "project_id": project_id,
            "old_status": project["status"],
            "new_status": status_data.status
        },
        "timestamp": datetime.now()
    })
    
    # Get updated project
    updated_project = await db.projects.find_one({"_id": ObjectId(project_id)})
    
    # Get details for response
    team_lead = await get_user_details(updated_project["assigned_to_team_lead"], db)
    team = await get_team_details(updated_project["team_id"], db)
    creator = await get_user_details(updated_project["created_by"], db)
    
    return ProjectResponse(
        id=str(updated_project["_id"]),
        project_name=updated_project["project_name"],
        description=updated_project.get("description"),
        assigned_to_team_lead=updated_project["assigned_to_team_lead"],
        team_lead_name=team_lead["full_name"] if team_lead else "Unknown",
        team_id=updated_project["team_id"],
        team_name=team["team_name"] if team else "Unknown",
        created_by=updated_project["created_by"],
        created_by_name=creator["full_name"] if creator else "Unknown",
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

@router.patch("/{project_id}/progress")
async def update_project_progress(
    project_id: str,
    progress_data: ProjectProgressUpdate,
    current_user: dict = Depends(get_current_team_lead_or_hr),
    db = Depends(get_database)
):
    """Update project progress (Team Lead or HR)"""
    
    # Get project
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
    
    # Verify access
    if not await verify_project_access(project_id, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this project"
        )
    
    # Validate progress percentage
    if progress_data.progress_percentage < 0 or progress_data.progress_percentage > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Progress percentage must be between 0 and 100"
        )
    
    update_data = {
        "progress_percentage": progress_data.progress_percentage,
        "updated_at": datetime.now()
    }
    
    if progress_data.total_tasks is not None:
        update_data["total_tasks"] = progress_data.total_tasks
    
    if progress_data.completed_tasks is not None:
        update_data["completed_tasks"] = progress_data.completed_tasks
    
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_data}
    )
    
    return {"message": "Project progress updated successfully"}

# ============= DOCUMENT MANAGEMENT =============

@router.post("/{project_id}/documents", response_model=ProjectDocumentResponse)
async def upload_project_document(
    project_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Upload document to project (HR only)"""
    
    # Get project
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
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Check file size (5MB limit for database storage)
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB in bytes
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds 5MB limit. Current size: {file_size / (1024*1024):.2f}MB"
        )
    
    # Get file type
    file_type = get_file_type(file.filename)
    
    # Save document to database as base64
    file_path = await save_document_to_db(file_content, file.filename, file_size, file_type)
    
    # Create document record
    doc_id = str(uuid.uuid4())
    new_document = {
        "doc_id": doc_id,
        "filename": file.filename,
        "file_path": file_path,
        "file_size": file_size,
        "file_type": file_type,
        "uploaded_by": str(current_user["_id"]),
        "uploaded_at": datetime.now()
    }
    
    # Add document to project
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {
            "$push": {"documents": new_document},
            "$set": {"updated_at": datetime.now()}
        }
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "project_document_uploaded",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "project_id": project_id,
            "filename": file.filename,
            "file_size": file_size
        },
        "timestamp": datetime.now()
    })
    
    return ProjectDocumentResponse(
        doc_id=doc_id,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        file_type=file_type,
        uploaded_by=str(current_user["_id"]),
        uploaded_by_name=current_user["full_name"],
        uploaded_at=new_document["uploaded_at"]
    )

@router.get("/{project_id}/documents", response_model=List[ProjectDocumentResponse])
async def get_project_documents(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all documents for a project"""
    
    # Get project
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
    
    # Verify access
    if not await verify_project_access(project_id, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this project"
        )
    
    # Get document details with uploader info
    documents = []
    for doc in project.get("documents", []):
        uploader = await get_user_details(doc["uploaded_by"], db)
        documents.append(ProjectDocumentResponse(
            doc_id=doc["doc_id"],
            filename=doc["filename"],
            file_path=doc["file_path"],
            file_size=doc.get("file_size"),
            file_type=doc.get("file_type"),
            uploaded_by=doc["uploaded_by"],
            uploaded_by_name=uploader["full_name"] if uploader else "Unknown",
            uploaded_at=doc["uploaded_at"]
        ))
    
    return documents

@router.delete("/{project_id}/documents/{doc_id}")
async def delete_project_document(
    project_id: str,
    doc_id: str,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Delete document from project (HR only)"""
    
    # Get project
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
    
    # Find document
    document = None
    for doc in project.get("documents", []):
        if doc["doc_id"] == doc_id:
            document = doc
            break
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Remove document from project
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {
            "$pull": {"documents": {"doc_id": doc_id}},
            "$set": {"updated_at": datetime.now()}
        }
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "project_document_deleted",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "project_id": project_id,
            "doc_id": doc_id,
            "filename": document["filename"]
        },
        "timestamp": datetime.now()
    })
    
    return {"message": "Document deleted successfully"}

# ============= PROJECT STATISTICS =============

@router.get("/{project_id}/stats")
async def get_project_statistics(
    project_id: str,
    current_user: dict = Depends(get_current_team_lead_or_hr),
    db = Depends(get_database)
):
    """Get project statistics (Team Lead or HR)"""
    
    # Get project
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
    
    # Verify access
    if not await verify_project_access(project_id, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this project"
        )
    
    # Get task statistics
    total_tasks = await db.tasks.count_documents({"project_id": project_id})
    completed_tasks = await db.tasks.count_documents({"project_id": project_id, "status": "completed"})
    in_progress_tasks = await db.tasks.count_documents({"project_id": project_id, "status": "in_progress"})
    pending_tasks = await db.tasks.count_documents({"project_id": project_id, "status": "pending"})
    
    # Calculate days until due date
    days_until_due = None
    if project.get("due_date"):
        delta = project["due_date"] - datetime.now()
        days_until_due = delta.days
    
    # Calculate project duration
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
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "in_progress_tasks": in_progress_tasks,
        "pending_tasks": pending_tasks,
        "document_count": len(project.get("documents", [])),
        "days_until_due": days_until_due,
        "project_duration_days": project_duration_days,
        "is_overdue": days_until_due < 0 if days_until_due is not None else False
    }