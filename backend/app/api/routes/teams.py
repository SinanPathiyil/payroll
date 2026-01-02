from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_hr, get_current_team_lead, get_current_user, get_database, verify_team_access, get_current_super_admin
from app.schemas.team import (
    TeamCreate, TeamUpdate, TeamResponse, TeamDetailResponse,
    TeamMemberAdd, TeamMemberRemove, TeamMemberResponse
)
from app.schemas.user import UserResponse
from bson import ObjectId
from typing import List, Optional
from datetime import datetime

router = APIRouter(tags=["Teams"])



# ============= HELPER FUNCTIONS =============

# NEW: Helper to allow both HR and Super Admin
async def get_current_hr_or_super_admin(current_user: dict = Depends(get_current_user)):
    """Verify user is HR or Super Admin"""
    if current_user["role"] not in ["hr", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR or Super Admin can perform this action"
        )
    return current_user

async def get_user_details(user_id: str, db) -> dict:
    """Helper to get user details"""
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return user
    except:
        return None

async def validate_team_lead(user_id: str, db) -> bool:
    """Validate that user has team_lead role"""
    user = await get_user_details(user_id, db)
    if not user:
        return False
    return user.get("role") == "team_lead"

async def check_team_name_exists(team_name: str, db, exclude_id: Optional[str] = None) -> bool:
    """Check if team name already exists"""
    query = {"team_name": team_name, "is_active": True}
    if exclude_id:
        query["_id"] = {"$ne": ObjectId(exclude_id)}
    
    existing = await db.teams.find_one(query)
    return existing is not None

async def update_user_team(user_id: str, team_id: Optional[str], team_lead_id: Optional[str], db):
    """Update user's team_id and reporting_to"""
    update_data = {
        "team_id": team_id,
        "reporting_to": team_lead_id
    }
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )

async def add_team_to_lead(team_lead_id: str, team_id: str, db):
    """Add team to team lead's managed_teams"""
    await db.users.update_one(
        {"_id": ObjectId(team_lead_id)},
        {"$addToSet": {"managed_teams": team_id}}
    )

async def remove_team_from_lead(team_lead_id: str, team_id: str, db):
    """Remove team from team lead's managed_teams"""
    await db.users.update_one(
        {"_id": ObjectId(team_lead_id)},
        {"$pull": {"managed_teams": team_id}}
    )

# ============= TEAM CRUD ENDPOINTS =============

@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: TeamCreate,
    current_user: dict = Depends(get_current_hr_or_super_admin),
    db = Depends(get_database)
):
    """Create a new team (HR or Super Admin only)"""
    
    # Check if team name already exists
    if await check_team_name_exists(team_data.team_name, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team name already exists"
        )
    
    # Validate team lead
    if not await validate_team_lead(team_data.team_lead_id, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team lead. User must have 'team_lead' role"
        )
    
    # Get team lead details
    team_lead = await get_user_details(team_data.team_lead_id, db)
    
    # Create team
    new_team = {
        "team_name": team_data.team_name,
        "description": team_data.description,
        "team_lead_id": team_data.team_lead_id,
        "created_by": str(current_user["_id"]),
        "members": [],  # Empty initially
        "is_active": True,
        "created_at": datetime.now(),
        "updated_at": None
    }
    
    result = await db.teams.insert_one(new_team)
    team_id = str(result.inserted_id)
    
    # Add team to team lead's managed_teams
    await add_team_to_lead(team_data.team_lead_id, team_id, db)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "team_created",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "team_id": team_id,
            "team_name": team_data.team_name,
            "team_lead_id": team_data.team_lead_id
        },
        "timestamp": datetime.now()
    })
    
    return TeamResponse(
        id=team_id,
        team_name=new_team["team_name"],
        description=new_team["description"],
        team_lead_id=new_team["team_lead_id"],
        team_lead_name=team_lead["full_name"] if team_lead else None,
        created_by=new_team["created_by"],
        created_by_name=current_user["full_name"],
        members=new_team["members"],
        member_count=len(new_team["members"]),
        is_active=new_team["is_active"],
        created_at=new_team["created_at"],
        updated_at=new_team["updated_at"]
    )

@router.get("/", response_model=List[TeamResponse])
async def get_teams(
    is_active: Optional[bool] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get teams based on user role:
    - HR: All teams
    - Team Lead: Only teams they lead
    - Employee: Only their team
    """
    
    query = {}
    
    # Role-based filtering
    if current_user["role"] == "super_admin":
        # Super Admin can see all teams
        if is_active is not None:
            query["is_active"] = is_active
    elif current_user["role"] == "hr":
        # HR can see all teams
        if is_active is not None:
            query["is_active"] = is_active
    elif current_user["role"] == "team_lead":
        # Team Lead sees only their teams
        query["team_lead_id"] = str(current_user["_id"])
        if is_active is not None:
            query["is_active"] = is_active
    elif current_user["role"] == "employee":
        # Employee sees only their team
        if not current_user.get("team_id"):
            return []
        query["_id"] = ObjectId(current_user["team_id"])
    else:
        # Other roles - no access to operational teams
        return []
    
    teams = await db.teams.find(query).to_list(length=None)
    
    result = []
    for team in teams:
        # Get team lead details
        team_lead = await get_user_details(team["team_lead_id"], db)
        
        # Get creator details
        creator = await get_user_details(team["created_by"], db)
        
        result.append(TeamResponse(
            id=str(team["_id"]),
            team_name=team["team_name"],
            description=team.get("description"),
            team_lead_id=team["team_lead_id"],
            team_lead_name=team_lead["full_name"] if team_lead else "Unknown",
            created_by=team["created_by"],
            created_by_name=creator["full_name"] if creator else "Unknown",
            members=team.get("members", []),
            member_count=len(team.get("members", [])),
            is_active=team["is_active"],
            created_at=team["created_at"],
            updated_at=team.get("updated_at")
        ))
    
    return result

@router.get("/{team_id}", response_model=TeamDetailResponse)
async def get_team_details(
    team_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get detailed team information with member details"""
    
    # Get team
    try:
        team = await db.teams.find_one({"_id": ObjectId(team_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team ID"
        )
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Verify access
    if not await verify_team_access(team_id, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this team"
        )
    
    # Get team lead details
    team_lead = await get_user_details(team["team_lead_id"], db)
    
    # Get creator details
    creator = await get_user_details(team["created_by"], db)
    
    # Get member details
    members_details = []
    for member_id in team.get("members", []):
        member = await get_user_details(member_id, db)
        if member:
            members_details.append(TeamMemberResponse(
                id=str(member["_id"]),
                email=member["email"],
                full_name=member["full_name"],
                role=member["role"],
                is_active=member["is_active"]
            ))
    
    # Team lead details
    team_lead_details = None
    if team_lead:
        team_lead_details = {
            "id": str(team_lead["_id"]),
            "email": team_lead["email"],
            "full_name": team_lead["full_name"],
            "role": team_lead["role"]
        }
    
    return TeamDetailResponse(
        id=str(team["_id"]),
        team_name=team["team_name"],
        description=team.get("description"),
        team_lead_id=team["team_lead_id"],
        team_lead_name=team_lead["full_name"] if team_lead else "Unknown",
        created_by=team["created_by"],
        created_by_name=creator["full_name"] if creator else "Unknown",
        members=team.get("members", []),
        member_count=len(team.get("members", [])),
        is_active=team["is_active"],
        created_at=team["created_at"],
        updated_at=team.get("updated_at"),
        members_details=members_details,
        team_lead_details=team_lead_details
    )

@router.patch("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: str,
    team_data: TeamUpdate,
    current_user: dict = Depends(get_current_hr_or_super_admin),
    db = Depends(get_database)
):
    """Update team information (HR or Super Admin Only)"""
    
    # Get existing team
    try:
        team = await db.teams.find_one({"_id": ObjectId(team_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team ID"
        )
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    update_data = {}
    
    # Update team name
    if team_data.team_name is not None:
        # Check if new name already exists
        if await check_team_name_exists(team_data.team_name, db, exclude_id=team_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team name already exists"
            )
        update_data["team_name"] = team_data.team_name
    
    # Update description
    if team_data.description is not None:
        update_data["description"] = team_data.description
    
    # Update team lead
    if team_data.team_lead_id is not None:
        # Validate new team lead
        if not await validate_team_lead(team_data.team_lead_id, db):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid team lead. User must have 'team_lead' role"
            )
        
        # Remove team from old lead's managed_teams
        old_lead_id = team["team_lead_id"]
        await remove_team_from_lead(old_lead_id, team_id, db)
        
        # Add team to new lead's managed_teams
        await add_team_to_lead(team_data.team_lead_id, team_id, db)
        
        # Update all team members' reporting_to
        for member_id in team.get("members", []):
            await db.users.update_one(
                {"_id": ObjectId(member_id)},
                {"$set": {"reporting_to": team_data.team_lead_id}}
            )
        
        update_data["team_lead_id"] = team_data.team_lead_id
    
    # Update is_active
    if team_data.is_active is not None:
        update_data["is_active"] = team_data.is_active
    
    if update_data:
        update_data["updated_at"] = datetime.now()
        await db.teams.update_one(
            {"_id": ObjectId(team_id)},
            {"$set": update_data}
        )
        
        # Create audit log
        await db.audit_logs.insert_one({
            "action_type": "team_updated",
            "performed_by": str(current_user["_id"]),
            "user_role": current_user["role"],
            "details": {
                "team_id": team_id,
                "updated_fields": list(update_data.keys())
            },
            "timestamp": datetime.now()
        })
    
    # Get updated team
    updated_team = await db.teams.find_one({"_id": ObjectId(team_id)})
    
    # Get team lead and creator details
    team_lead = await get_user_details(updated_team["team_lead_id"], db)
    creator = await get_user_details(updated_team["created_by"], db)
    
    return TeamResponse(
        id=str(updated_team["_id"]),
        team_name=updated_team["team_name"],
        description=updated_team.get("description"),
        team_lead_id=updated_team["team_lead_id"],
        team_lead_name=team_lead["full_name"] if team_lead else "Unknown",
        created_by=updated_team["created_by"],
        created_by_name=creator["full_name"] if creator else "Unknown",
        members=updated_team.get("members", []),
        member_count=len(updated_team.get("members", [])),
        is_active=updated_team["is_active"],
        created_at=updated_team["created_at"],
        updated_at=updated_team.get("updated_at")
    )

@router.delete("/{team_id}")
async def delete_team(
    team_id: str,
    current_user: dict = Depends(get_current_hr_or_super_admin),
    db = Depends(get_database)
):
    """Soft delete team (HR or Super Admin only) - deactivates team"""
    
    try:
        team = await db.teams.find_one({"_id": ObjectId(team_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team ID"
        )
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if team has active projects
    active_projects = await db.projects.count_documents({
        "team_id": team_id,
        "status": "active"
    })
    
    if active_projects > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete team with {active_projects} active project(s)"
        )
    
    # Soft delete (deactivate)
    await db.teams.update_one(
        {"_id": ObjectId(team_id)},
        {"$set": {"is_active": False, "updated_at": datetime.now()}}
    )
    
    # Remove team from team lead's managed_teams
    await remove_team_from_lead(team["team_lead_id"], team_id, db)
    
    # Remove team assignment from all members
    for member_id in team.get("members", []):
        await db.users.update_one(
            {"_id": ObjectId(member_id)},
            {"$set": {"team_id": None, "reporting_to": None}}
        )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "team_deleted",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "team_id": team_id,
            "team_name": team["team_name"]
        },
        "timestamp": datetime.now()
    })
    
    return {"message": "Team deactivated successfully"}

# ============= TEAM MEMBER MANAGEMENT =============

@router.post("/{team_id}/members", response_model=TeamDetailResponse)
async def add_team_member(
    team_id: str,
    member_data: TeamMemberAdd,
    current_user: dict = Depends(get_current_hr_or_super_admin),
    db = Depends(get_database)
):
    """Add employee to team (HR or Super Admin Only)"""
    
    # Get team
    try:
        team = await db.teams.find_one({"_id": ObjectId(team_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team ID"
        )
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    if not team["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add members to inactive team"
        )
    
    # Get employee
    employee = await get_user_details(member_data.employee_id, db)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Validate employee role (only employees and team_leads can be added)
    if employee["role"] not in ["employee", "team_lead"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only add employees or team leads to teams"
        )
    
    # Check if already in team
    if member_data.employee_id in team.get("members", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee already in this team"
        )
    
    # Check if employee is in another team
    if employee.get("team_id") and employee["team_id"] != team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee already assigned to another team. Remove from current team first."
        )
    
    # Add to team members
    await db.teams.update_one(
        {"_id": ObjectId(team_id)},
        {
            "$addToSet": {"members": member_data.employee_id},
            "$set": {"updated_at": datetime.now()}
        }
    )
    
    # Update employee's team_id and reporting_to
    await update_user_team(
        member_data.employee_id,
        team_id,
        team["team_lead_id"],
        db
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "team_member_added",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "target_user": member_data.employee_id,
        "details": {
            "team_id": team_id,
            "team_name": team["team_name"]
        },
        "timestamp": datetime.now()
    })
    
    # Return updated team details
    return await get_team_details(team_id, current_user, db)

@router.delete("/{team_id}/members/{employee_id}")
async def remove_team_member(
    team_id: str,
    employee_id: str,
    current_user: dict = Depends(get_current_hr_or_super_admin),
    db = Depends(get_database)
):
    """Remove employee from team (HR or Super Admin Only)"""
    
    # Get team
    try:
        team = await db.teams.find_one({"_id": ObjectId(team_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team ID"
        )
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if employee is in team
    if employee_id not in team.get("members", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee not in this team"
        )
    
    # Remove from team members
    await db.teams.update_one(
        {"_id": ObjectId(team_id)},
        {
            "$pull": {"members": employee_id},
            "$set": {"updated_at": datetime.now()}
        }
    )
    
    # Update employee's team_id and reporting_to
    await update_user_team(employee_id, None, None, db)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "team_member_removed",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "target_user": employee_id,
        "details": {
            "team_id": team_id,
            "team_name": team["team_name"]
        },
        "timestamp": datetime.now()
    })
    
    return {"message": "Team member removed successfully"}

@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
async def get_team_members(
    team_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all members of a team"""
    
    # Get team
    try:
        team = await db.teams.find_one({"_id": ObjectId(team_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid team ID"
        )
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Verify access
    if not await verify_team_access(team_id, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this team"
        )
    
    # Get member details
    members_details = []
    for member_id in team.get("members", []):
        member = await get_user_details(member_id, db)
        if member:
            members_details.append(TeamMemberResponse(
                id=str(member["_id"]),
                email=member["email"],
                full_name=member["full_name"],
                role=member["role"],
                is_active=member["is_active"]
            ))
    
    return members_details