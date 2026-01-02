from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_ba, get_current_user, get_database
from app.schemas.meeting import (
    MeetingCreate, MeetingUpdate, MeetingResponse, MeetingDetailResponse,
    MeetingNotesUpdate, MeetingAttendeeCreate, MeetingAttendeeResponse,
    AgendaItemResponse, ActionItemResponse
)
from bson import ObjectId
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/ba/meetings", tags=["Business Analyst - Meetings"])

# ============= HELPER FUNCTIONS =============

async def get_user_details(user_id: str, db) -> dict:
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return user
    except:
        return None

async def get_project_details(project_id: str, db) -> dict:
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        return project
    except:
        return None

async def get_client_details(client_id: str, db) -> dict:
    try:
        client = await db.clients.find_one({"_id": ObjectId(client_id)})
        return client
    except:
        return None

# ============= MEETING CRUD =============

@router.post("/", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
async def schedule_meeting(
    meeting_data: MeetingCreate,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Schedule a client meeting (BA only)"""
    
    # Validate project
    project = await get_project_details(meeting_data.project_id, db)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify BA owns this project
    ba_id = project.get("managed_by_ba") or project["created_by"]
    if ba_id != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to schedule meetings for this project"
        )
    
    # Get client
    client = await get_client_details(project["client_id"], db)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Validate meeting type
    valid_types = ["requirement_discussion", "milestone_review", "final_review", "general"]
    if meeting_data.meeting_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid meeting type. Must be one of: {', '.join(valid_types)}"
        )
    
    # If milestone review, validate milestone exists
    if meeting_data.meeting_type == "milestone_review" and meeting_data.milestone_id:
        milestone_found = False
        milestone = None
        milestone_index = None
        
        for idx, m in enumerate(project.get("milestones", [])):
            if m["milestone_id"] == meeting_data.milestone_id:
                milestone_found = True
                milestone = m
                milestone_index = idx
                break
        
        if not milestone_found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Milestone not found"
            )
        
        if milestone["status"] != "reached":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only schedule review for reached milestones"
            )
    
    # Create meeting
    new_meeting = {
        "project_id": meeting_data.project_id,
        "client_id": project["client_id"],
        "meeting_type": meeting_data.meeting_type,
        "milestone_id": meeting_data.milestone_id,
        "scheduled_by": str(current_user["_id"]),
        "scheduled_at": meeting_data.scheduled_at,
        "duration_minutes": meeting_data.duration_minutes,
        "meeting_link": meeting_data.meeting_link,
        "location": meeting_data.location,
        "attendees": [{**attendee.dict(), "attended": False} for attendee in meeting_data.attendees],
        "agenda": [{**item.dict(), "completed": False, "notes": None} for item in meeting_data.agenda],
        "status": "scheduled",
        "meeting_notes": None,
        "action_items": [],
        "client_feedback": None,
        "decisions_made": [],
        "completed_at": None,
        "completed_by": None,
        "created_at": datetime.now(),
        "updated_at": None
    }
    
    result = await db.meetings.insert_one(new_meeting)
    meeting_id = str(result.inserted_id)
    
    # Update milestone with meeting scheduled time
    if meeting_data.meeting_type == "milestone_review" and meeting_data.milestone_id:
        await db.projects.update_one(
            {
                "_id": ObjectId(meeting_data.project_id),
                "milestones.milestone_id": meeting_data.milestone_id
            },
            {
                "$set": {
                    f"milestones.{milestone_index}.meeting_scheduled_at": meeting_data.scheduled_at,
                    "status": "client_review"
                }
            }
        )
    
    # Update client last contact
    await db.clients.update_one(
        {"_id": ObjectId(project["client_id"])},
        {"$set": {"last_contact_date": datetime.now()}}
    )
    
    # Notify Team Lead
    notification = {
        "from_user": str(current_user["_id"]),
        "to_user": project["assigned_to_team_lead"],
        "content": f"Client meeting scheduled for project: {project['project_name']}\nType: {meeting_data.meeting_type}\nDate: {meeting_data.scheduled_at.strftime('%Y-%m-%d %H:%M')}",
        "project_id": meeting_data.project_id,
        "is_read": False,
        "created_at": datetime.now()
    }
    await db.messages.insert_one(notification)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "meeting_scheduled",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "meeting_id": meeting_id,
            "project_id": meeting_data.project_id,
            "meeting_type": meeting_data.meeting_type,
            "scheduled_at": meeting_data.scheduled_at
        },
        "timestamp": datetime.now()
    })
    
    return MeetingResponse(
        id=meeting_id,
        project_id=new_meeting["project_id"],
        project_name=project["project_name"],
        client_id=new_meeting["client_id"],
        client_name=client["company_name"],
        meeting_type=new_meeting["meeting_type"],
        milestone_id=new_meeting["milestone_id"],
        milestone_name=milestone["name"] if meeting_data.milestone_id and milestone else None,
        scheduled_by=new_meeting["scheduled_by"],
        scheduled_by_name=current_user["full_name"],
        scheduled_at=new_meeting["scheduled_at"],
        duration_minutes=new_meeting["duration_minutes"],
        meeting_link=new_meeting["meeting_link"],
        location=new_meeting["location"],
        status=new_meeting["status"],
        created_at=new_meeting["created_at"]
    )

@router.get("/", response_model=List[MeetingResponse])
async def get_meetings(
    status_filter: Optional[str] = None,
    project_id: Optional[str] = None,
    upcoming_only: bool = False,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get all meetings scheduled by current BA"""
    
    query = {"scheduled_by": str(current_user["_id"])}
    
    if status_filter:
        query["status"] = status_filter
    
    if project_id:
        query["project_id"] = project_id
    
    if upcoming_only:
        query["scheduled_at"] = {"$gte": datetime.now()}
        query["status"] = "scheduled"
    
    meetings = await db.meetings.find(query).sort("scheduled_at", 1).to_list(length=None)
    
    result = []
    for meeting in meetings:
        # Get project and client details
        project = await get_project_details(meeting["project_id"], db)
        client = await get_client_details(meeting["client_id"], db)
        
        # Get milestone name if exists
        milestone_name = None
        if meeting.get("milestone_id") and project:
            for m in project.get("milestones", []):
                if m["milestone_id"] == meeting["milestone_id"]:
                    milestone_name = m["name"]
                    break
        
        result.append(MeetingResponse(
            id=str(meeting["_id"]),
            project_id=meeting["project_id"],
            project_name=project["project_name"] if project else "Unknown",
            client_id=meeting["client_id"],
            client_name=client["company_name"] if client else "Unknown",
            meeting_type=meeting["meeting_type"],
            milestone_id=meeting.get("milestone_id"),
            milestone_name=milestone_name,
            scheduled_by=meeting["scheduled_by"],
            scheduled_by_name=current_user["full_name"],
            scheduled_at=meeting["scheduled_at"],
            duration_minutes=meeting["duration_minutes"],
            meeting_link=meeting.get("meeting_link"),
            location=meeting.get("location"),
            status=meeting["status"],
            created_at=meeting["created_at"]
        ))
    
    return result

@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
async def get_meeting_details(
    meeting_id: str,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get detailed meeting information"""
    
    try:
        meeting = await db.meetings.find_one({"_id": ObjectId(meeting_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid meeting ID"
        )
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    # Verify BA scheduled this meeting
    if meeting["scheduled_by"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this meeting"
        )
    
    # Get project and client details
    project = await get_project_details(meeting["project_id"], db)
    client = await get_client_details(meeting["client_id"], db)
    
    # Get milestone name
    milestone_name = None
    if meeting.get("milestone_id") and project:
        for m in project.get("milestones", []):
            if m["milestone_id"] == meeting["milestone_id"]:
                milestone_name = m["name"]
                break
    
    # Get completed by details
    completed_by_name = None
    if meeting.get("completed_by"):
        completer = await get_user_details(meeting["completed_by"], db)
        completed_by_name = completer["full_name"] if completer else "Unknown"
    
    # Convert attendees - Add defaults for missing fields
    attendees = []
    for att in meeting.get("attendees", []):
        attendee_data = {
            "name": att.get("name", ""),
            "email": att.get("email", ""),
            "role": att.get("role", ""),
            "attended": att.get("attended", False)
        }
        attendees.append(MeetingAttendeeResponse(**attendee_data))
    
    # Convert agenda - Add defaults for missing fields
    agenda = []
    for item in meeting.get("agenda", []):
        agenda_data = {
            "item": item.get("item", ""),
            "completed": item.get("completed", False),
            "notes": item.get("notes", None)
        }
        agenda.append(AgendaItemResponse(**agenda_data))
    
    # Convert action items
    action_items = [ActionItemResponse(**item) for item in meeting.get("action_items", [])]
    
    return MeetingDetailResponse(
        id=str(meeting["_id"]),
        project_id=meeting["project_id"],
        project_name=project["project_name"] if project else "Unknown",
        client_id=meeting["client_id"],
        client_name=client["company_name"] if client else "Unknown",
        meeting_type=meeting["meeting_type"],
        milestone_id=meeting.get("milestone_id"),
        milestone_name=milestone_name,
        scheduled_by=meeting["scheduled_by"],
        scheduled_by_name=current_user["full_name"],
        scheduled_at=meeting["scheduled_at"],
        duration_minutes=meeting["duration_minutes"],
        meeting_link=meeting.get("meeting_link"),
        location=meeting.get("location"),
        status=meeting["status"],
        created_at=meeting["created_at"],
        attendees=attendees,
        agenda=agenda,
        meeting_notes=meeting.get("meeting_notes"),
        action_items=action_items,
        client_feedback=meeting.get("client_feedback"),
        decisions_made=meeting.get("decisions_made", []),
        completed_at=meeting.get("completed_at"),
        completed_by=meeting.get("completed_by"),
        completed_by_name=completed_by_name
    )

@router.patch("/{meeting_id}", response_model=MeetingResponse)
async def update_meeting(
    meeting_id: str,
    meeting_data: MeetingUpdate,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Update meeting details (BA only - before meeting)"""
    
    try:
        meeting = await db.meetings.find_one({"_id": ObjectId(meeting_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid meeting ID"
        )
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    # Verify BA scheduled this meeting
    if meeting["scheduled_by"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this meeting"
        )
    
    # Can't update completed meetings
    if meeting["status"] == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update completed meetings"
        )
    
    update_data = {}
    
    if meeting_data.scheduled_at is not None:
        update_data["scheduled_at"] = meeting_data.scheduled_at
    
    if meeting_data.duration_minutes is not None:
        update_data["duration_minutes"] = meeting_data.duration_minutes
    
    if meeting_data.meeting_link is not None:
        update_data["meeting_link"] = meeting_data.meeting_link
    
    if meeting_data.location is not None:
        update_data["location"] = meeting_data.location
    
    if meeting_data.attendees is not None:
        update_data["attendees"] = [att.dict() for att in meeting_data.attendees]
    
    if meeting_data.agenda is not None:
        update_data["agenda"] = [item.dict() for item in meeting_data.agenda]
    
    if meeting_data.status is not None:
        valid_statuses = ["scheduled", "completed", "cancelled", "rescheduled"]
        if meeting_data.status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        update_data["status"] = meeting_data.status
    
    if update_data:
        update_data["updated_at"] = datetime.now()
        await db.meetings.update_one(
            {"_id": ObjectId(meeting_id)},
            {"$set": update_data}
        )
    
    # Get updated meeting
    updated_meeting = await db.meetings.find_one({"_id": ObjectId(meeting_id)})
    
    # Get details
    project = await get_project_details(updated_meeting["project_id"], db)
    client = await get_client_details(updated_meeting["client_id"], db)
    
    milestone_name = None
    if updated_meeting.get("milestone_id") and project:
        for m in project.get("milestones", []):
            if m["milestone_id"] == updated_meeting["milestone_id"]:
                milestone_name = m["name"]
                break
    
    return MeetingResponse(
        id=str(updated_meeting["_id"]),
        project_id=updated_meeting["project_id"],
        project_name=project["project_name"] if project else "Unknown",
        client_id=updated_meeting["client_id"],
        client_name=client["company_name"] if client else "Unknown",
        meeting_type=updated_meeting["meeting_type"],
        milestone_id=updated_meeting.get("milestone_id"),
        milestone_name=milestone_name,
        scheduled_by=updated_meeting["scheduled_by"],
        scheduled_by_name=current_user["full_name"],
        scheduled_at=updated_meeting["scheduled_at"],
        duration_minutes=updated_meeting["duration_minutes"],
        meeting_link=updated_meeting.get("meeting_link"),
        location=updated_meeting.get("location"),
        status=updated_meeting["status"],
        created_at=updated_meeting["created_at"]
    )

@router.post("/{meeting_id}/complete")
async def complete_meeting(
    meeting_id: str,
    notes_data: MeetingNotesUpdate,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Complete meeting and record notes (BA only)"""
    
    try:
        meeting = await db.meetings.find_one({"_id": ObjectId(meeting_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid meeting ID"
        )
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    # Verify BA scheduled this meeting
    if meeting["scheduled_by"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to complete this meeting"
        )
    
    if meeting["status"] == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting already completed"
        )
    
    # Update attendee attendance
    attendees = meeting.get("attendees", [])
    for attendee in attendees:
        if attendee["email"] in notes_data.attendees_attended:
            attendee["attended"] = True
    
    # Update meeting
    await db.meetings.update_one(
        {"_id": ObjectId(meeting_id)},
        {
            "$set": {
                "meeting_notes": notes_data.meeting_notes,
                "action_items": [item.dict() for item in notes_data.action_items],
                "client_feedback": notes_data.client_feedback,
                "decisions_made": notes_data.decisions_made,
                "attendees": attendees,
                "status": "completed",
                "completed_at": datetime.now(),
                "completed_by": str(current_user["_id"]),
                "updated_at": datetime.now()
            }
        }
    )
    
    # Update milestone if this was a milestone review
    if meeting["meeting_type"] == "milestone_review" and meeting.get("milestone_id"):
        project = await get_project_details(meeting["project_id"], db)
        
        if project:
            for idx, m in enumerate(project.get("milestones", [])):
                if m["milestone_id"] == meeting["milestone_id"]:
                    await db.projects.update_one(
                        {
                            "_id": ObjectId(meeting["project_id"]),
                            "milestones.milestone_id": meeting["milestone_id"]
                        },
                        {
                            "$set": {
                                f"milestones.{idx}.meeting_completed_at": datetime.now()
                            }
                        }
                    )
                    break
    
    # Update client last contact
    await db.clients.update_one(
        {"_id": ObjectId(meeting["client_id"])},
        {"$set": {"last_contact_date": datetime.now()}}
    )
    
    # Log communication
    project = await get_project_details(meeting["project_id"], db)
    
    communication_log = {
        "client_id": meeting["client_id"],
        "communication_type": "meeting",
        "subject": f"{meeting['meeting_type'].replace('_', ' ').title()} - {project['project_name'] if project else 'Project'}",
        "notes": notes_data.meeting_notes,
        "contact_person": ", ".join(notes_data.attendees_attended),
        "created_by": str(current_user["_id"]),
        "created_at": datetime.now()
    }
    await db.communication_logs.insert_one(communication_log)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "meeting_completed",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "meeting_id": meeting_id,
            "project_id": meeting["project_id"],
            "meeting_type": meeting["meeting_type"]
        },
        "timestamp": datetime.now()
    })
    
    return {"message": "Meeting completed and notes recorded successfully"}

@router.delete("/{meeting_id}")
async def cancel_meeting(
    meeting_id: str,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Cancel a scheduled meeting (BA only)"""
    
    try:
        meeting = await db.meetings.find_one({"_id": ObjectId(meeting_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid meeting ID"
        )
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    # Verify BA scheduled this meeting
    if meeting["scheduled_by"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this meeting"
        )
    
    if meeting["status"] == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel completed meetings"
        )
    
    # Update status to cancelled
    await db.meetings.update_one(
        {"_id": ObjectId(meeting_id)},
        {"$set": {"status": "cancelled", "updated_at": datetime.now()}}
    )
    
    return {"message": "Meeting cancelled successfully"}

@router.get("/upcoming/count")
async def get_upcoming_meetings_count(
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get count of upcoming meetings"""
    
    count = await db.meetings.count_documents({
        "scheduled_by": str(current_user["_id"]),
        "scheduled_at": {"$gte": datetime.now()},
        "status": "scheduled"
    })
    
    return {"upcoming_meetings": count}