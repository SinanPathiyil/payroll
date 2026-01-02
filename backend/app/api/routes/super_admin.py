from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_super_admin, get_database
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.core.security import get_password_hash
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/super-admin", tags=["Super Admin"])

# ============= SCHEMAS =============

class CreateHRRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    required_hours: float = 8.0
    base_salary: float = 0.0

class CreateSuperAdminRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class PasswordResetRequest(BaseModel):
    user_id: str
    new_password: str
    reason: str

class RoleChangeApproval(BaseModel):
    review_notes: Optional[str] = None

class OverrideRequestResponse(BaseModel):
    id: str
    request_type: str
    requested_by: str
    requested_by_name: str
    reason: str
    details: dict
    status: str
    reviewed_by: Optional[str] = None
    reviewer_name: Optional[str] = None
    review_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

class AuditLogResponse(BaseModel):
    id: str
    action_type: str
    performed_by: str
    performer_name: str
    user_role: str
    target_user: Optional[str] = None
    target_user_name: Optional[str] = None
    details: dict
    ip_address: Optional[str] = None
    timestamp: datetime

# Add this after the existing CreateSuperAdminRequest class (around line 23)

class CreateEmployeeRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    required_hours: float = 8.0
    base_salary: float = 0.0
    team_id: Optional[str] = None

class CreateTeamLeadRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    required_hours: float = 8.0
    base_salary: float = 0.0
    team_id: Optional[str] = None  # Existing team or will be created
    team_name: Optional[str] = None  # For creating new team

class CreateBusinessAnalystRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    required_hours: float = 8.0
    base_salary: float = 0.0
    
# ============= HELPER FUNCTIONS =============

async def create_audit_log(
    db,
    action_type: str,
    performed_by: str,
    user_role: str,
    details: dict,
    target_user: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """Helper function to create audit log entries"""
    audit_entry = {
        "action_type": action_type,
        "performed_by": performed_by,
        "user_role": user_role,
        "target_user": target_user,
        "details": details,
        "ip_address": ip_address,
        "timestamp": datetime.now()
    }
    await db.audit_logs.insert_one(audit_entry)

# ============= USER MANAGEMENT ENDPOINTS =============

@router.post("/users/hr", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_hr_account(
    user_data: CreateHRRequest,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Create a new HR account (Super Admin only)"""
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create HR user
    new_user = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": get_password_hash(user_data.password),
        "role": "hr",
        "is_active": True,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.now(),
        "office_hours": {"start": "09:00", "end": "18:00"},
        "required_hours": user_data.required_hours,
        "base_salary": user_data.base_salary,
        "team_id": None,
        "reporting_to": None,
        "managed_teams": []
    }
    
    result = await db.users.insert_one(new_user)
    
    # Create audit log
    await create_audit_log(
        db=db,
        action_type="hr_account_created",
        performed_by=str(current_user["_id"]),
        user_role=current_user["role"],
        target_user=str(result.inserted_id),
        details={"email": user_data.email, "full_name": user_data.full_name}
    )
    
    new_user["_id"] = result.inserted_id
    
    return UserResponse(
        id=str(new_user["_id"]),
        email=new_user["email"],
        full_name=new_user["full_name"],
        role=new_user["role"],
        is_active=new_user["is_active"],
        office_hours=new_user["office_hours"],
        required_hours=new_user["required_hours"],
        base_salary=new_user.get("base_salary", 0.0),
        team_id=new_user.get("team_id"),
        reporting_to=new_user.get("reporting_to"),
        managed_teams=new_user.get("managed_teams", [])
    )

@router.post("/users/super-admin", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_super_admin_account(
    user_data: CreateSuperAdminRequest,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Create a new Super Admin account (Super Admin only)"""
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create Super Admin user
    new_user = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": get_password_hash(user_data.password),
        "role": "super_admin",
        "is_active": True,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.now(),
        "office_hours": {"start": "09:00", "end": "18:00"},
        "required_hours": 0.0,  # Super Admin doesn't track hours
        "base_salary": 0.0,
        "team_id": None,
        "reporting_to": None,
        "managed_teams": []
    }
    
    result = await db.users.insert_one(new_user)
    
    # Create audit log
    await create_audit_log(
        db=db,
        action_type="super_admin_created",
        performed_by=str(current_user["_id"]),
        user_role=current_user["role"],
        target_user=str(result.inserted_id),
        details={"email": user_data.email, "full_name": user_data.full_name}
    )
    
    new_user["_id"] = result.inserted_id
    
    return UserResponse(
        id=str(new_user["_id"]),
        email=new_user["email"],
        full_name=new_user["full_name"],
        role=new_user["role"],
        is_active=new_user["is_active"],
        office_hours=new_user["office_hours"],
        required_hours=new_user["required_hours"],
        base_salary=new_user.get("base_salary", 0.0),
        team_id=new_user.get("team_id"),
        reporting_to=new_user.get("reporting_to"),
        managed_teams=new_user.get("managed_teams", [])
    )

@router.post("/users/employee", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_employee_account(
    user_data: CreateEmployeeRequest,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Create a new Employee account (Super Admin only)"""
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Get team and team lead if team is provided
    team_lead_id = None
    if user_data.team_id:
        try:
            team = await db.teams.find_one({"_id": ObjectId(user_data.team_id)})
            if not team:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid team ID"
                )
            if not team.get("is_active", True):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot assign employee to inactive team"
                )
            team_lead_id = team.get("team_lead_id")
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid team ID format"
            )
    
    # Create Employee user
    new_user = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": get_password_hash(user_data.password),
        "role": "employee",
        "is_active": True,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.now(),
        "office_hours": {"start": "09:00", "end": "18:00"},
        "required_hours": user_data.required_hours,
        "base_salary": user_data.base_salary,
        "team_id": user_data.team_id,
        "reporting_to": team_lead_id,
        "managed_teams": []
    }
    
    result = await db.users.insert_one(new_user)
    user_id = str(result.inserted_id)
    
    # Add employee to team's members list
    if user_data.team_id:
        await db.teams.update_one(
            {"_id": ObjectId(user_data.team_id)},
            {"$addToSet": {"members": user_id}}
        )
    
    # Create audit log
    await create_audit_log(
        db=db,
        action_type="employee_account_created",
        performed_by=str(current_user["_id"]),
        user_role=current_user["role"],
        target_user=user_id,
        details={
            "email": user_data.email,
            "full_name": user_data.full_name,
            "team_id": user_data.team_id
        }
    )
    
    new_user["_id"] = result.inserted_id
    
    return UserResponse(
        id=str(new_user["_id"]),
        email=new_user["email"],
        full_name=new_user["full_name"],
        role=new_user["role"],
        is_active=new_user["is_active"],
        office_hours=new_user["office_hours"],
        required_hours=new_user["required_hours"],
        base_salary=new_user.get("base_salary", 0.0),
        team_id=new_user.get("team_id"),
        reporting_to=new_user.get("reporting_to"),
        managed_teams=new_user.get("managed_teams", [])
    )


@router.post("/users/team-lead", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_team_lead_account(
    user_data: CreateTeamLeadRequest,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Create a new Team Lead account (Super Admin only)"""
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    team_id = user_data.team_id
    
    # If team_name is provided but no team_id, create new team
    if user_data.team_name and not user_data.team_id:
        # Check if team name already exists
        existing_team = await db.teams.find_one({"team_name": user_data.team_name})
        if existing_team:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team name already exists"
            )
        
        # Create placeholder - will update with team_lead_id after user creation
        new_team = {
            "team_name": user_data.team_name,
            "description": f"Team led by {user_data.full_name}",
            "team_lead_id": None,  # Will be updated
            "created_by": str(current_user["_id"]),
            "members": [],
            "is_active": True,
            "created_at": datetime.now()
        }
        team_result = await db.teams.insert_one(new_team)
        team_id = str(team_result.inserted_id)
    
    # Validate existing team if provided
    elif user_data.team_id:
        team = await db.teams.find_one({"_id": ObjectId(user_data.team_id)})
        if not team:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid team ID"
            )
    
    # Create Team Lead user
    new_user = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": get_password_hash(user_data.password),
        "role": "team_lead",
        "is_active": True,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.now(),
        "office_hours": {"start": "09:00", "end": "18:00"},
        "required_hours": user_data.required_hours,
        "base_salary": user_data.base_salary,
        "team_id": team_id,
        "reporting_to": None,
        "managed_teams": [team_id] if team_id else []
    }
    
    result = await db.users.insert_one(new_user)
    
    # Update team with team_lead_id if we created a new team
    if user_data.team_name and team_id:
        await db.teams.update_one(
            {"_id": ObjectId(team_id)},
            {"$set": {"team_lead_id": str(result.inserted_id)}}
        )
    
    # Create audit log
    await create_audit_log(
        db=db,
        action_type="team_lead_account_created",
        performed_by=str(current_user["_id"]),
        user_role=current_user["role"],
        target_user=str(result.inserted_id),
        details={
            "email": user_data.email,
            "full_name": user_data.full_name,
            "team_id": team_id,
            "new_team": user_data.team_name if user_data.team_name else None
        }
    )
    
    new_user["_id"] = result.inserted_id
    
    return UserResponse(
        id=str(new_user["_id"]),
        email=new_user["email"],
        full_name=new_user["full_name"],
        role=new_user["role"],
        is_active=new_user["is_active"],
        office_hours=new_user["office_hours"],
        required_hours=new_user["required_hours"],
        base_salary=new_user.get("base_salary", 0.0),
        team_id=new_user.get("team_id"),
        reporting_to=new_user.get("reporting_to"),
        managed_teams=new_user.get("managed_teams", [])
    )


@router.post("/users/business-analyst", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_business_analyst_account(
    user_data: CreateBusinessAnalystRequest,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Create a new Business Analyst account (Super Admin only)"""
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create Business Analyst user
    new_user = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": get_password_hash(user_data.password),
        "role": "business_analyst",
        "is_active": True,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.now(),
        "office_hours": {"start": "09:00", "end": "18:00"},
        "required_hours": user_data.required_hours,
        "base_salary": user_data.base_salary,
        "team_id": None,
        "reporting_to": None,
        "managed_teams": []
    }
    
    result = await db.users.insert_one(new_user)
    
    # Create audit log
    await create_audit_log(
        db=db,
        action_type="business_analyst_created",
        performed_by=str(current_user["_id"]),
        user_role=current_user["role"],
        target_user=str(result.inserted_id),
        details={"email": user_data.email, "full_name": user_data.full_name}
    )
    
    new_user["_id"] = result.inserted_id
    
    return UserResponse(
        id=str(new_user["_id"]),
        email=new_user["email"],
        full_name=new_user["full_name"],
        role=new_user["role"],
        is_active=new_user["is_active"],
        office_hours=new_user["office_hours"],
        required_hours=new_user["required_hours"],
        base_salary=new_user.get("base_salary", 0.0),
        team_id=new_user.get("team_id"),
        reporting_to=new_user.get("reporting_to"),
        managed_teams=new_user.get("managed_teams", [])
    )


# Add endpoint to get all teams (for dropdown)
@router.get("/teams")
async def get_all_teams(
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get all teams for dropdown selection"""
    teams = await db.teams.find({"is_active": True}).to_list(length=None)
    
    return [
        {
            "id": str(team["_id"]),
            "team_name": team["team_name"],
            "team_lead_id": team.get("team_lead_id")
        }
        for team in teams
    ]

# Add endpoint to get all team leads (for dropdown)
@router.get("/team-leads")
async def get_all_team_leads(
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get all team leads for dropdown selection"""
    team_leads = await db.users.find({
        "role": "team_lead",
        "is_active": True
    }).to_list(length=None)
    
    return [
        {
            "id": str(tl["_id"]),
            "full_name": tl["full_name"],
            "email": tl["email"],
            "team_id": tl.get("team_id")
        }
        for tl in team_leads
    ]

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get all users with optional filters"""
    
    query = {}
    if role:
        query["role"] = role
    if is_active is not None:
        query["is_active"] = is_active
    
    users = await db.users.find(query).to_list(length=None)
    
    return [
        UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            is_active=user["is_active"],
            office_hours=user.get("office_hours", {"start": "09:00", "end": "18:00"}),
            required_hours=user.get("required_hours", 8.0),
            base_salary=user.get("base_salary", 0.0),
            team_id=user.get("team_id"),
            reporting_to=user.get("reporting_to"),
            managed_teams=user.get("managed_teams", [])
        )
        for user in users
    ]

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get specific user details"""
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        is_active=user["is_active"],
        office_hours=user.get("office_hours", {"start": "09:00", "end": "18:00"}),
        required_hours=user.get("required_hours", 8.0),
        base_salary=user.get("base_salary", 0.0),
        team_id=user.get("team_id"),
        reporting_to=user.get("reporting_to"),
        managed_teams=user.get("managed_teams", [])
    )

@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Update user information (Super Admin only)"""
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Build update dict
    update_data = {}
    if user_data.full_name is not None:
        update_data["full_name"] = user_data.full_name
    if user_data.role is not None:
        update_data["role"] = user_data.role
        
    # UPDATED: Handle team_id changes
    if user_data.team_id is not None:
        old_team_id = user.get("team_id")
        
        # Remove from old team if exists
        if old_team_id:
            await db.teams.update_one(
                {"_id": ObjectId(old_team_id)},
                {"$pull": {"members": user_id}}
            )
        
        # Add to new team and get team lead
        if user_data.team_id:
            team = await db.teams.find_one({"_id": ObjectId(user_data.team_id)})
            if team:
                await db.teams.update_one(
                    {"_id": ObjectId(user_data.team_id)},
                    {"$addToSet": {"members": user_id}}
                )
                update_data["team_id"] = user_data.team_id
                update_data["reporting_to"] = team.get("team_lead_id")
        else:
            update_data["team_id"] = None
            update_data["reporting_to"] = None

    # Remove the old reporting_to logic - it's now handled above
    # if user_data.reporting_to is not None:
    #     update_data["reporting_to"] = user_data.reporting_to
        
    if user_data.required_hours is not None:
        update_data["required_hours"] = user_data.required_hours
    if user_data.base_salary is not None:
        update_data["base_salary"] = user_data.base_salary
    if user_data.is_active is not None:
        update_data["is_active"] = user_data.is_active
    
    if update_data:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        # Create audit log
        await create_audit_log(
            db=db,
            action_type="user_updated",
            performed_by=str(current_user["_id"]),
            user_role=current_user["role"],
            target_user=user_id,
            details={"updated_fields": list(update_data.keys())}
        )
    
    # Fetch updated user
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    return UserResponse(
        id=str(updated_user["_id"]),
        email=updated_user["email"],
        full_name=updated_user["full_name"],
        role=updated_user["role"],
        is_active=updated_user["is_active"],
        office_hours=updated_user.get("office_hours", {"start": "09:00", "end": "18:00"}),
        required_hours=updated_user.get("required_hours", 8.0),
        base_salary=updated_user.get("base_salary", 0.0),
        team_id=updated_user.get("team_id"),
        reporting_to=updated_user.get("reporting_to"),
        managed_teams=updated_user.get("managed_teams", [])
    )

@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: str,
    reset_data: PasswordResetRequest,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Reset user password (Super Admin only)"""
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    new_hashed_password = get_password_hash(reset_data.new_password)
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"hashed_password": new_hashed_password}}
    )
    
    # Create audit log
    await create_audit_log(
        db=db,
        action_type="password_reset",
        performed_by=str(current_user["_id"]),
        user_role=current_user["role"],
        target_user=user_id,
        details={"reason": reset_data.reason}
    )
    
    return {"message": "Password reset successfully"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Permanently delete user (Super Admin only) - USE WITH CAUTION"""
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent self-deletion
    if str(user["_id"]) == str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Create audit log before deletion
    await create_audit_log(
        db=db,
        action_type="user_deleted",
        performed_by=str(current_user["_id"]),
        user_role=current_user["role"],
        target_user=user_id,
        details={"email": user["email"], "full_name": user["full_name"], "role": user["role"]}
    )
    
    # Delete user
    await db.users.delete_one({"_id": ObjectId(user_id)})
    
    return {"message": "User deleted successfully"}

# ============= OVERRIDE REQUEST MANAGEMENT =============

@router.get("/override-requests", response_model=List[OverrideRequestResponse])
async def get_override_requests(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get all override requests with optional status filter"""
    
    query = {}
    if status_filter:
        query["status"] = status_filter
    
    requests = await db.override_requests.find(query).sort("created_at", -1).to_list(length=None)
    
    result = []
    for req in requests:
        # Get requester details
        requester = await db.users.find_one({"_id": ObjectId(req["requested_by"])})
        requester_name = requester["full_name"] if requester else "Unknown"
        
        # Get reviewer details if reviewed
        reviewer_name = None
        if req.get("reviewed_by"):
            reviewer = await db.users.find_one({"_id": ObjectId(req["reviewed_by"])})
            reviewer_name = reviewer["full_name"] if reviewer else "Unknown"
        
        result.append(OverrideRequestResponse(
            id=str(req["_id"]),
            request_type=req["request_type"],
            requested_by=req["requested_by"],
            requested_by_name=requester_name,
            reason=req["reason"],
            details=req["details"],
            status=req["status"],
            reviewed_by=req.get("reviewed_by"),
            reviewer_name=reviewer_name,
            review_notes=req.get("review_notes"),
            created_at=req["created_at"],
            reviewed_at=req.get("reviewed_at")
        ))
    
    return result

@router.post("/override-requests/{request_id}/approve")
async def approve_override_request(
    request_id: str,
    approval_data: RoleChangeApproval,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Approve an override request"""
    
    try:
        request = await db.override_requests.find_one({"_id": ObjectId(request_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request ID"
        )
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    if request["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request already processed"
        )
    
    # Update request status
    await db.override_requests.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": "approved",
                "reviewed_by": str(current_user["_id"]),
                "review_notes": approval_data.review_notes,
                "reviewed_at": datetime.now()
            }
        }
    )
    
    # Execute the requested action
    if request["request_type"] == "role_change":
        user_id = request["details"]["user_id"]
        new_role = request["details"]["requested_role"]
        
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"role": new_role}}
        )
        
        # Create audit log
        await create_audit_log(
            db=db,
            action_type="role_change_approved",
            performed_by=str(current_user["_id"]),
            user_role=current_user["role"],
            target_user=user_id,
            details={
                "request_id": request_id,
                "old_role": request["details"]["current_role"],
                "new_role": new_role
            }
        )
    
    return {"message": "Request approved successfully"}

@router.post("/override-requests/{request_id}/reject")
async def reject_override_request(
    request_id: str,
    approval_data: RoleChangeApproval,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Reject an override request"""
    
    try:
        request = await db.override_requests.find_one({"_id": ObjectId(request_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request ID"
        )
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    if request["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request already processed"
        )
    
    # Update request status
    await db.override_requests.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": "rejected",
                "reviewed_by": str(current_user["_id"]),
                "review_notes": approval_data.review_notes,
                "reviewed_at": datetime.now()
            }
        }
    )
    
    # Create audit log
    await create_audit_log(
        db=db,
        action_type="override_request_rejected",
        performed_by=str(current_user["_id"]),
        user_role=current_user["role"],
        details={
            "request_id": request_id,
            "request_type": request["request_type"],
            "reason": approval_data.review_notes
        }
    )
    
    return {"message": "Request rejected successfully"}

# ============= AUDIT LOG MANAGEMENT =============

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    action_type: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get audit logs with optional filters"""
    
    query = {}
    if action_type:
        query["action_type"] = action_type
    if user_id:
        query["performed_by"] = user_id
    
    logs = await db.audit_logs.find(query).sort("timestamp", -1).limit(limit).to_list(length=None)
    
    result = []
    for log in logs:
        # Get performer details
        performer = await db.users.find_one({"_id": ObjectId(log["performed_by"])})
        performer_name = performer["full_name"] if performer else "Unknown"
        
        # Get target user details if exists
        target_user_name = None
        if log.get("target_user"):
            target = await db.users.find_one({"_id": ObjectId(log["target_user"])})
            target_user_name = target["full_name"] if target else "Deleted User"
        
        result.append(AuditLogResponse(
            id=str(log["_id"]),
            action_type=log["action_type"],
            performed_by=log["performed_by"],
            performer_name=performer_name,
            user_role=log["user_role"],
            target_user=log.get("target_user"),
            target_user_name=target_user_name,
            details=log["details"],
            ip_address=log.get("ip_address"),
            timestamp=log["timestamp"]
        ))
    
    return result

# ============= SYSTEM STATISTICS =============

@router.get("/stats")
async def get_system_stats(
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get system-wide statistics"""
    
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": True})
    hr_count = await db.users.count_documents({"role": "hr"})
    team_lead_count = await db.users.count_documents({"role": "team_lead"})
    employee_count = await db.users.count_documents({"role": "employee"})
    super_admin_count = await db.users.count_documents({"role": "super_admin"})
    
    pending_requests = await db.override_requests.count_documents({"status": "pending"})
    
    recent_logins = await db.audit_logs.count_documents({
        "action_type": "login",
        "timestamp": {"$gte": datetime.now().replace(hour=0, minute=0, second=0)}
    })
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "role_distribution": {
            "super_admin": super_admin_count,
            "hr": hr_count,
            "team_lead": team_lead_count,
            "employee": employee_count
        },
        "pending_override_requests": pending_requests,
        "todays_logins": recent_logins
    }