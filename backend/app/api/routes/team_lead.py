from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_team_lead, get_current_user, get_database
from app.schemas.project import ProjectResponse, ProjectDetailResponse
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/team-lead", tags=["Team Lead"])

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

# ============= REQUEST SCHEMAS =============

class RequirementApprovalRequest(BaseModel):
    doc_id: str
    approved: bool
    approval_notes: Optional[str] = None

class MilestoneNotification(BaseModel):
    milestone_id: str
    completion_notes: Optional[str] = None
    demo_link: Optional[str] = None
    completed_features: List[str] = []

# ============= REQUIREMENT APPROVAL =============

@router.get("/projects/pending-approval", response_model=List[ProjectResponse])
async def get_projects_pending_approval(
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Get projects assigned to TL that are pending requirement approval"""
    
    query = {
        "assigned_to_team_lead": str(current_user["_id"]),
        "status": "pending_tl_approval"
    }
    
    projects = await db.projects.find(query).sort("updated_at", -1).to_list(length=None)
    
    result = []
    for project in projects:
        # Get BA details
        ba = await get_user_details(project.get("managed_by_ba") or project["created_by"], db)
        
        # Get client details
        client = await get_client_details(project.get("client_id"), db) if project.get("client_id") else None
        
        result.append(ProjectResponse(
            id=str(project["_id"]),
            project_name=project["project_name"],
            description=project.get("description"),
            project_id=None,
            project_name_display=f"{project['project_name']} ({client['company_name'] if client else 'No Client'})",
            assigned_to_team_lead=project["assigned_to_team_lead"],
            team_lead_name=current_user["full_name"],
            team_id=project.get("team_id"),
            team_name=None,
            created_by=project["created_by"],
            created_by_name=ba["full_name"] if ba else "Unknown",
            status=project["status"],
            priority=project.get("priority", "medium"),
            progress_percentage=project.get("progress_percentage", 0.0),
            total_tasks=project.get("total_tasks", 0),
            completed_tasks=project.get("completed_tasks", 0),
            document_count=len(project.get("requirement_documents", [])),
            start_date=project.get("start_date"),
            due_date=project.get("due_date"),
            completion_date=project.get("completion_date"),
            created_at=project["created_at"],
            updated_at=project.get("updated_at")
        ))
    
    return result

@router.get("/projects/{project_id}/requirements")
async def get_project_requirements(
    project_id: str,
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Get requirement documents for a project (TL only sees shared docs)"""
    
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
    
    # Verify TL is assigned to this project
    if project["assigned_to_team_lead"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this project's requirements"
        )
    
    # Get only shared requirement documents
    result = []
    for doc in project.get("requirement_documents", []):
        if doc.get("shared_with_team_lead"):
            uploader = await get_user_details(doc["uploaded_by"], db)
            result.append({
                "doc_id": doc["doc_id"],
                "version": doc["version"],
                "filename": doc["filename"],
                "file_path": doc["file_path"],
                "file_size": doc.get("file_size"),
                "uploaded_by": uploader["full_name"] if uploader else "Unknown",
                "uploaded_at": doc["uploaded_at"],
                "shared_at": doc.get("shared_at"),
                "team_lead_approved": doc.get("team_lead_approved", False),
                "approved_at": doc.get("approved_at"),
                "approval_notes": doc.get("approval_notes"),
                "is_latest": doc.get("is_latest", False)
            })
    
    return result

@router.post("/projects/{project_id}/requirements/approve")
async def approve_requirement_document(
    project_id: str,
    approval_data: RequirementApprovalRequest,
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Approve or reject requirement document (Team Lead only)"""
    
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
    
    # Verify TL is assigned to this project
    if project["assigned_to_team_lead"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to approve requirements for this project"
        )
    
    # Find the requirement document
    doc_found = False
    doc_index = None
    for idx, doc in enumerate(project.get("requirement_documents", [])):
        if doc["doc_id"] == approval_data.doc_id:
            doc_found = True
            doc_index = idx
            
            if not doc.get("shared_with_team_lead"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This requirement document has not been shared with you yet"
                )
            
            if doc.get("team_lead_approved"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This requirement document has already been approved"
                )
            break
    
    if not doc_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement document not found"
        )
    
    if approval_data.approved:
        # Approve requirements
        await db.projects.update_one(
            {
                "_id": ObjectId(project_id),
                "requirement_documents.doc_id": approval_data.doc_id
            },
            {
                "$set": {
                    f"requirement_documents.{doc_index}.team_lead_approved": True,
                    f"requirement_documents.{doc_index}.approved_at": datetime.now(),
                    f"requirement_documents.{doc_index}.approval_notes": approval_data.approval_notes,
                    "requirements_approved": True,
                    "status": "approved_ready_to_start",
                    "updated_at": datetime.now()
                }
            }
        )
        
        message_content = f"Requirements approved for project: {project['project_name']}\n"
        if approval_data.approval_notes:
            message_content += f"Notes: {approval_data.approval_notes}\n"
        message_content += "You can now start creating tasks and begin development."
        
        log_action = "requirement_approved"
        
    else:
        # Reject requirements - send back to BA
        await db.projects.update_one(
            {
                "_id": ObjectId(project_id),
                "requirement_documents.doc_id": approval_data.doc_id
            },
            {
                "$set": {
                    f"requirement_documents.{doc_index}.team_lead_approved": False,
                    f"requirement_documents.{doc_index}.approval_notes": approval_data.approval_notes,
                    "status": "requirement_uploaded",  # Back to uploaded status
                    "updated_at": datetime.now()
                }
            }
        )
        
        message_content = f"Requirements need revision for project: {project['project_name']}\n"
        if approval_data.approval_notes:
            message_content += f"Reason: {approval_data.approval_notes}"
        
        log_action = "requirement_rejected"
    
    # Notify BA
    ba_id = project.get("managed_by_ba") or project["created_by"]
    notification = {
        "from_user": str(current_user["_id"]),
        "to_user": ba_id,
        "content": message_content,
        "project_id": project_id,
        "is_read": False,
        "created_at": datetime.now()
    }
    await db.messages.insert_one(notification)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": log_action,
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "target_user": ba_id,
        "details": {
            "project_id": project_id,
            "doc_id": approval_data.doc_id,
            "approved": approval_data.approved,
            "notes": approval_data.approval_notes
        },
        "timestamp": datetime.now()
    })
    
    return {
        "message": "Requirements approved successfully" if approval_data.approved else "Requirements sent back for revision",
        "approved": approval_data.approved,
        "new_status": "approved_ready_to_start" if approval_data.approved else "requirement_uploaded"
    }

# ============= MILESTONE NOTIFICATIONS =============

@router.get("/projects/active", response_model=List[ProjectResponse])
async def get_active_projects(
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Get all active projects assigned to current Team Lead"""
    
    query = {
        "assigned_to_team_lead": str(current_user["_id"]),
        "status": {"$nin": ["completed", "cancelled", "on_hold"]}
    }
    
    projects = await db.projects.find(query).sort("created_at", -1).to_list(length=None)
    
    result = []
    for project in projects:
        # Get BA details
        ba = await get_user_details(project.get("managed_by_ba") or project["created_by"], db)
        
        # Get client details
        client = await get_client_details(project.get("client_id"), db) if project.get("client_id") else None
        
        result.append(ProjectResponse(
            id=str(project["_id"]),
            project_name=project["project_name"],
            description=project.get("description"),
            project_id=None,
            project_name_display=f"{project['project_name']} ({client['company_name'] if client else 'No Client'})",
            assigned_to_team_lead=project["assigned_to_team_lead"],
            team_lead_name=current_user["full_name"],
            team_id=project.get("team_id"),
            team_name=None,
            created_by=project["created_by"],
            created_by_name=ba["full_name"] if ba else "Unknown",
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

@router.get("/projects/{project_id}/milestones")
async def get_project_milestones_for_tl(
    project_id: str,
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Get milestones for a project (Team Lead view)"""
    
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
    
    # Verify TL is assigned to this project
    if project["assigned_to_team_lead"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this project's milestones"
        )
    
    milestones = []
    for milestone in project.get("milestones", []):
        milestones.append({
            "milestone_id": milestone["milestone_id"],
            "name": milestone["name"],
            "percentage": milestone["percentage"],
            "amount": milestone["amount"],
            "status": milestone["status"],
            "reached_at": milestone.get("reached_at"),
            "payment_received_at": milestone.get("payment_received_at"),
            "notes": milestone.get("notes"),
            "can_notify": milestone["status"] == "pending" and project.get("progress_percentage", 0) >= milestone["percentage"]
        })
    
    return milestones

@router.post("/projects/{project_id}/milestones/notify")
async def notify_milestone_reached(
    project_id: str,
    notification_data: MilestoneNotification,
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Notify BA that a milestone has been reached (Team Lead only)"""
    
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
    
    # Verify TL is assigned to this project
    if project["assigned_to_team_lead"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to notify milestones for this project"
        )
    
    # Find milestone
    milestone_index = None
    milestone = None
    for idx, m in enumerate(project.get("milestones", [])):
        if m["milestone_id"] == notification_data.milestone_id:
            milestone_index = idx
            milestone = m
            break
    
    if milestone_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found"
        )
    
    if milestone["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Milestone is already in '{milestone['status']}' status"
        )
    
    # Check if progress is sufficient
    if project.get("progress_percentage", 0) < milestone["percentage"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project progress ({project.get('progress_percentage', 0)}%) is less than milestone requirement ({milestone['percentage']}%)"
        )
    
    # Update milestone status
    await db.projects.update_one(
        {
            "_id": ObjectId(project_id),
            "milestones.milestone_id": notification_data.milestone_id
        },
        {
            "$set": {
                f"milestones.{milestone_index}.status": "reached",
                f"milestones.{milestone_index}.reached_at": datetime.now(),
                f"milestones.{milestone_index}.notes": notification_data.completion_notes,
                "status": "milestone_reached",
                "updated_at": datetime.now()
            }
        }
    )
    
    # Build notification message
    message_content = f"🎉 Milestone reached for project: {project['project_name']}\n\n"
    message_content += f"Milestone: {milestone['name']} ({milestone['percentage']}%)\n"
    message_content += f"Amount: ${milestone['amount']:,.2f}\n\n"
    
    if notification_data.completion_notes:
        message_content += f"Notes: {notification_data.completion_notes}\n\n"
    
    if notification_data.demo_link:
        message_content += f"Demo Link: {notification_data.demo_link}\n\n"
    
    if notification_data.completed_features:
        message_content += "Completed Features:\n"
        for feature in notification_data.completed_features:
            message_content += f"✓ {feature}\n"
        message_content += "\n"
    
    message_content += "Please schedule a client review meeting and collect payment."
    
    # Notify BA
    ba_id = project.get("managed_by_ba") or project["created_by"]
    notification = {
        "from_user": str(current_user["_id"]),
        "to_user": ba_id,
        "content": message_content,
        "project_id": project_id,
        "is_read": False,
        "created_at": datetime.now()
    }
    await db.messages.insert_one(notification)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "milestone_reached_notification",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "target_user": ba_id,
        "details": {
            "project_id": project_id,
            "milestone_id": notification_data.milestone_id,
            "milestone_name": milestone["name"],
            "percentage": milestone["percentage"],
            "amount": milestone["amount"],
            "demo_link": notification_data.demo_link,
            "completed_features": notification_data.completed_features
        },
        "timestamp": datetime.now()
    })
    
    return {
        "message": "BA notified of milestone completion successfully",
        "milestone_name": milestone["name"],
        "milestone_percentage": milestone["percentage"],
        "milestone_amount": milestone["amount"]
    }

@router.post("/projects/{project_id}/complete")
async def notify_project_completion(
    project_id: str,
    completion_notes: Optional[str] = None,
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Notify BA that project is 100% completed (Team Lead only)"""
    
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
    
    # Verify TL is assigned to this project
    if project["assigned_to_team_lead"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to complete this project"
        )
    
    # Check if all tasks are completed
    incomplete_tasks = await db.tasks.count_documents({
        "project_id": project_id,
        "status": {"$nin": ["completed", "cancelled"]}
    })
    
    if incomplete_tasks > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot complete project with {incomplete_tasks} incomplete task(s)"
        )
    
    # Check if project progress is 100%
    if project.get("progress_percentage", 0) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project progress must be 100% to mark as complete. Current: {project.get('progress_percentage', 0)}%"
        )
    
    # Update project
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {
            "$set": {
                "status": "completed",
                "completion_date": datetime.now(),
                "updated_at": datetime.now()
            }
        }
    )
    
    # Build notification message
    message_content = f"🎊 Project completed: {project['project_name']}\n\n"
    message_content += "All development work has been finished.\n"
    
    if completion_notes:
        message_content += f"\nNotes: {completion_notes}\n"
    
    message_content += "\nPlease schedule final client meeting for project closure and collect remaining payment."
    
    # Notify BA
    ba_id = project.get("managed_by_ba") or project["created_by"]
    notification = {
        "from_user": str(current_user["_id"]),
        "to_user": ba_id,
        "content": message_content,
        "project_id": project_id,
        "is_read": False,
        "created_at": datetime.now()
    }
    await db.messages.insert_one(notification)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "project_completed_by_tl",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "target_user": ba_id,
        "details": {
            "project_id": project_id,
            "project_name": project["project_name"],
            "completion_notes": completion_notes
        },
        "timestamp": datetime.now()
    })
    
    return {
        "message": "Project marked as completed and BA notified",
        "completion_date": datetime.now()
    }

# ============= TEAM LEAD DASHBOARD DATA =============

@router.get("/dashboard/summary")
async def get_team_lead_dashboard_summary(
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Get dashboard summary for Team Lead"""
    
    # Projects assigned to this TL
    total_projects = await db.projects.count_documents({
        "assigned_to_team_lead": str(current_user["_id"])
    })
    
    active_projects = await db.projects.count_documents({
        "assigned_to_team_lead": str(current_user["_id"]),
        "status": {"$nin": ["completed", "cancelled"]}
    })
    
    pending_approval = await db.projects.count_documents({
        "assigned_to_team_lead": str(current_user["_id"]),
        "status": "pending_tl_approval"
    })
    
    # Tasks in managed teams
    managed_teams = current_user.get("managed_teams", [])
    
    total_tasks = await db.tasks.count_documents({
        "team_id": {"$in": managed_teams}
    })
    
    pending_tasks = await db.tasks.count_documents({
        "team_id": {"$in": managed_teams},
        "status": "pending"
    })
    
    in_progress_tasks = await db.tasks.count_documents({
        "team_id": {"$in": managed_teams},
        "status": "in_progress"
    })
    
    completed_tasks = await db.tasks.count_documents({
        "team_id": {"$in": managed_teams},
        "status": "completed"
    })
    
    # Pending validations (tasks marked completed but not validated)
    pending_validations = await db.tasks.count_documents({
        "team_id": {"$in": managed_teams},
        "status": "completed",
        "validated_by": None
    })
    
    # Get projects with milestones ready to notify
    projects_with_milestones = await db.projects.find({
        "assigned_to_team_lead": str(current_user["_id"]),
        "status": {"$nin": ["completed", "cancelled"]}
    }).to_list(length=None)
    
    milestones_ready = 0
    for project in projects_with_milestones:
        for milestone in project.get("milestones", []):
            if (milestone["status"] == "pending" and 
                project.get("progress_percentage", 0) >= milestone["percentage"]):
                milestones_ready += 1
    
    return {
        "projects": {
            "total": total_projects,
            "active": active_projects,
            "pending_approval": pending_approval
        },
        "tasks": {
            "total": total_tasks,
            "pending": pending_tasks,
            "in_progress": in_progress_tasks,
            "completed": completed_tasks,
            "pending_validation": pending_validations
        },
        "milestones_ready_to_notify": milestones_ready,
        "team_count": len(managed_teams)
    }