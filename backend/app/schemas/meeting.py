from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ============= MEETING ATTENDEE SCHEMAS =============

class MeetingAttendeeCreate(BaseModel):
    name: str
    email: EmailStr
    role: str

class MeetingAttendeeResponse(BaseModel):
    name: str
    email: str
    role: str
    attended: bool

# ============= AGENDA & ACTION ITEMS =============

class AgendaItemCreate(BaseModel):
    item: str

class AgendaItemResponse(BaseModel):
    item: str
    completed: bool
    notes: Optional[str]

class ActionItemCreate(BaseModel):
    action: str
    assigned_to: str
    due_date: Optional[datetime] = None

class ActionItemResponse(BaseModel):
    action: str
    assigned_to: str
    due_date: Optional[datetime]
    status: str

# ============= MEETING SCHEMAS =============

class MeetingCreate(BaseModel):
    project_id: str
    meeting_type: str
    milestone_id: Optional[str] = None
    scheduled_at: datetime
    duration_minutes: int = 60
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    attendees: List[MeetingAttendeeCreate] = []
    agenda: List[AgendaItemCreate] = []

class MeetingUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    attendees: Optional[List[MeetingAttendeeCreate]] = None
    agenda: Optional[List[AgendaItemCreate]] = None
    status: Optional[str] = None

class MeetingNotesUpdate(BaseModel):
    meeting_notes: str
    action_items: List[ActionItemCreate] = []
    client_feedback: Optional[str] = None
    decisions_made: List[str] = []
    attendees_attended: List[str] = []  # List of emails who attended

class MeetingResponse(BaseModel):
    id: str
    project_id: str
    project_name: str
    client_id: str
    client_name: str
    meeting_type: str
    milestone_id: Optional[str]
    milestone_name: Optional[str]
    scheduled_by: str
    scheduled_by_name: str
    scheduled_at: datetime
    duration_minutes: int
    meeting_link: Optional[str]
    location: Optional[str]
    status: str
    created_at: datetime

class MeetingDetailResponse(MeetingResponse):
    attendees: List[MeetingAttendeeResponse]
    agenda: List[AgendaItemResponse]
    meeting_notes: Optional[str]
    action_items: List[ActionItemResponse]
    client_feedback: Optional[str]
    decisions_made: List[str]
    completed_at: Optional[datetime]
    completed_by: Optional[str]
    completed_by_name: Optional[str]