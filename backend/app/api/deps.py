from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_access_token
from app.core.database import get_database
from bson import ObjectId
from typing import List

security = HTTPBearer()

# ============= BASE AUTHENTICATION =============

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_database)
):
    """Get currently authenticated user"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user_id = payload.get("sub")
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception as e:
        print(f"Error finding user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    return user

# ============= ROLE-BASED DEPENDENCIES =============

async def get_current_super_admin(current_user: dict = Depends(get_current_user)):
    """Require Super Admin role - GOVERNANCE ONLY"""
    if current_user["role"] != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required"
        )
    return current_user

async def get_current_hr(current_user: dict = Depends(get_current_user)):
    """Require HR role - OPERATIONAL ACCESS"""
    if current_user["role"] != "hr":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR access required"
        )
    return current_user

async def get_current_team_lead(current_user: dict = Depends(get_current_user)):
    """Require Team Lead role"""
    if current_user["role"] != "team_lead":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Team Lead access required"
        )
    return current_user

async def get_current_employee(current_user: dict = Depends(get_current_user)):
    """Require Employee role (base level access)"""
    if current_user["role"] not in ["employee", "team_lead", "hr"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee access required"
        )
    return current_user

# ============= COMPOSITE ROLE DEPENDENCIES =============

async def get_current_team_lead_or_hr(current_user: dict = Depends(get_current_user)):
    """Require Team Lead or HR role - OPERATIONAL ACCESS ONLY"""
    if current_user["role"] not in ["team_lead", "hr"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Team Lead or HR access required"
        )
    return current_user

# ============= CONTEXT-AWARE PERMISSIONS =============

async def verify_team_access(
    team_id: str,
    current_user: dict,
    db
) -> bool:
    """
    Verify if user has access to a specific team:
    - HR: Full access
    - Team Lead: Only their own teams
    - Employee: Only their own team
    """
    role = current_user["role"]
    
    if role == "hr":
        return True
    
    if role == "team_lead":
        # Check if this team is in their managed_teams
        managed_teams = current_user.get("managed_teams", [])
        return team_id in managed_teams
    
    if role == "employee":
        # Check if this is their team
        return current_user.get("team_id") == team_id
    
    return False

async def verify_project_access(
    project_id: str,
    current_user: dict,
    db
) -> bool:
    """
    Verify if user has access to a specific project:
    - HR: Full access
    - Team Lead: Only projects assigned to them
    - Employee: No direct project access (only tasks)
    """
    role = current_user["role"]
    
    if role == "hr":
        return True
    
    if role == "team_lead":
        # Check if project is assigned to them
        try:
            project = await db.projects.find_one({"_id": ObjectId(project_id)})
            if project:
                return project.get("assigned_to_team_lead") == str(current_user["_id"])
        except:
            return False
    
    return False

async def get_current_ba(current_user: dict = Depends(get_current_user)):
    """Require Business Analyst role"""
    if current_user["role"] != "business_analyst":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Business Analyst access required"
        )
    return current_user

async def get_current_ba_or_team_lead(current_user: dict = Depends(get_current_user)):
    """Require Business Analyst or Team Lead role"""
    if current_user["role"] not in ["business_analyst", "team_lead"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Business Analyst or Team Lead access required"
        )
    return current_user