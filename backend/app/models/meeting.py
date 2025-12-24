from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MeetingAttendee(BaseModel):
    name: str
    email: str
    role: str  # "client", "ba", "team_lead", "employee"
    attended: bool = False

class MeetingAgendaItem(BaseModel):
    item: str
    completed: bool = False
    notes: Optional[str] = None

class MeetingActionItem(BaseModel):
    action: str
    assigned_to: str  # Name or email
    due_date: Optional[datetime] = None
    status: str = "pending"  # pending, in_progress, completed

class Meeting(BaseModel):
    project_id: str
    client_id: str
    meeting_type: str  # "requirement_discussion", "milestone_review", "final_review", "general"
    milestone_id: Optional[str] = None  # If it's a milestone review meeting
    
    scheduled_by: str  # BA user_id
    scheduled_at: datetime
    duration_minutes: int
    
    meeting_link: Optional[str] = None  # Zoom/Meet link
    location: Optional[str] = None  # Physical location if applicable
    
    attendees: List[MeetingAttendee] = []
    agenda: List[MeetingAgendaItem] = []
    
    status: str = "scheduled"  # scheduled, completed, cancelled, rescheduled
    
    # Meeting notes (filled after meeting)
    meeting_notes: Optional[str] = None
    action_items: List[MeetingActionItem] = []
    client_feedback: Optional[str] = None
    decisions_made: List[str] = []
    
    completed_at: Optional[datetime] = None
    completed_by: Optional[str] = None
    
    created_at: datetime = datetime.now()
    updated_at: Optional[datetime] = None