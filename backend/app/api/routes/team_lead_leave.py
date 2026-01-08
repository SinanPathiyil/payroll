from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.core.database import get_database
from app.api.deps import get_current_team_lead
from app.schemas.leave import LeaveRequestResponse, LeaveApprovalAction
from bson import ObjectId
from datetime import datetime, date
import calendar

router = APIRouter()

# ============================================
# PENDING APPROVALS
# ============================================

@router.get("/leave/pending-approvals", response_model=List[LeaveRequestResponse])
async def get_pending_leave_approvals(
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Get all leave requests pending TL approval"""
    
    tl_id = str(current_user["_id"])
    
    # Find requests where TL is in approval chain and status is pending
    requests = await db.leave_requests.find({
        "final_status": "pending",
        "approval_chain": {
            "$elemMatch": {
                "role": "team_lead",
                "user_id": tl_id,
                "status": "pending"
            }
        }
    }).sort("requested_at", 1).to_list(length=None)
    
    result = []
    for req in requests:
        user = await db.users.find_one({"_id": ObjectId(req["user_id"])})
        leave_type = await db.leave_types.find_one({"code": req["leave_type_code"]})
        
        if user and leave_type:
            result.append(
                LeaveRequestResponse(
                    id=str(req["_id"]),
                    user_id=req["user_id"],
                    user_name=user["full_name"],
                    user_email=user["email"],
                    leave_type_code=leave_type["code"],
                    leave_type_name=leave_type["name"],
                    leave_type_color=leave_type["color"],
                    **{k: v for k, v in req.items() if k not in ["_id", "user_id", "leave_type_code"]}
                )
            )
    
    return result

# ============================================
# TEAM LEAVE REQUESTS
# ============================================

@router.get("/leave/team-requests", response_model=List[LeaveRequestResponse])
async def get_team_leave_requests(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Get all leave requests from team members"""
    
    tl_id = str(current_user["_id"])
    
    # Get team members
    team_members = await db.users.find({"team_lead_id": tl_id}).to_list(length=None)
    team_member_ids = [str(member["_id"]) for member in team_members]
    
    query = {"user_id": {"$in": team_member_ids}}
    
    if status:
        query["final_status"] = status
    
    requests = await db.leave_requests.find(query).sort("requested_at", -1).to_list(length=None)
    
    result = []
    for req in requests:
        user = await db.users.find_one({"_id": ObjectId(req["user_id"])})
        leave_type = await db.leave_types.find_one({"code": req["leave_type_code"]})
        
        if user and leave_type:
            result.append(
                LeaveRequestResponse(
                    id=str(req["_id"]),
                    user_id=req["user_id"],
                    user_name=user["full_name"],
                    user_email=user["email"],
                    leave_type_code=leave_type["code"],
                    leave_type_name=leave_type["name"],
                    leave_type_color=leave_type["color"],
                    **{k: v for k, v in req.items() if k not in ["_id", "user_id", "leave_type_code"]}
                )
            )
    
    return result

# ============================================
# APPROVE/REJECT LEAVE
# ============================================

@router.post("/leave/{request_id}/approve-reject")
async def approve_or_reject_leave(
    request_id: str,
    action: LeaveApprovalAction,
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Approve or reject team member's leave request"""
    
    tl_id = str(current_user["_id"])
    
    try:
        leave_request = await db.leave_requests.find_one({"_id": ObjectId(request_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request ID"
        )
    
    if not leave_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    
    if leave_request["final_status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot process {leave_request['final_status']} request"
        )
    
    # Find TL in approval chain
    approval_chain = leave_request["approval_chain"]
    current_level = leave_request["current_approval_level"]
    
    if current_level >= len(approval_chain):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending approvals"
        )
    
    current_approver = approval_chain[current_level]
    
    if current_approver["role"] != "team_lead" or current_approver["user_id"] != tl_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your turn to approve or you are not the assigned approver"
        )
    
    # Update approval chain
    approval_chain[current_level]["status"] = action.action + "d"
    approval_chain[current_level]["approved_at"] = datetime.now()
    approval_chain[current_level]["notes"] = action.notes
    
    # Determine final status
    if action.action == "reject":
        final_status = "rejected"
        
        # Restore leave balance
        user_id = leave_request["user_id"]
        current_year = datetime.now().year
        balance = await db.leave_balances.find_one({
            "user_id": user_id,
            "year": current_year,
            "leave_type_code": leave_request["leave_type_code"]
        })
        
        if balance:
            total_days = leave_request["total_days"]
            await db.leave_balances.update_one(
                {"_id": balance["_id"]},
                {
                    "$inc": {
                        "pending": -total_days,
                        "available": total_days
                    },
                    "$set": {"updated_at": datetime.now()}
                }
            )
    
    elif action.action == "approve":
        if current_level + 1 < len(approval_chain):
            final_status = "pending"
            current_level += 1
        else:
            final_status = "approved"
            
            # Move from pending to used
            user_id = leave_request["user_id"]
            current_year = datetime.now().year
            balance = await db.leave_balances.find_one({
                "user_id": user_id,
                "year": current_year,
                "leave_type_code": leave_request["leave_type_code"]
            })
            
            if balance:
                total_days = leave_request["total_days"]
                await db.leave_balances.update_one(
                    {"_id": balance["_id"]},
                    {
                        "$inc": {
                            "pending": -total_days,
                            "used": total_days
                        },
                        "$set": {"updated_at": datetime.now()}
                    }
                )
    
    # Update leave request
    await db.leave_requests.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "approval_chain": approval_chain,
                "current_approval_level": current_level,
                "final_status": final_status
            }
        }
    )
    
    # Send notification to employee
    settings = await db.leave_system_settings.find_one()
    if settings and settings.get("notify_on_approval" if action.action == "approve" else "notify_on_rejection", True):
        leave_type = await db.leave_types.find_one({"code": leave_request["leave_type_code"]})
        notification = {
            "from_user": tl_id,
            "to_user": leave_request["user_id"],
            "content": f"Your {leave_type['name'] if leave_type else 'leave'} request has been {final_status}",
            "leave_request_id": request_id,
            "is_read": False,
            "created_at": datetime.now()
        }
        await db.messages.insert_one(notification)
    
    # Notify next approver if needed
    if final_status == "pending" and current_level < len(approval_chain):
        next_approver = approval_chain[current_level]
        leave_type = await db.leave_types.find_one({"code": leave_request["leave_type_code"]})
        user = await db.users.find_one({"_id": ObjectId(leave_request["user_id"])})
        
        notification = {
            "from_user": tl_id,
            "to_user": next_approver["user_id"],
            "content": f"Leave request from {user['full_name'] if user else 'employee'} for {leave_type['name'] if leave_type else 'leave'} needs your approval",
            "leave_request_id": request_id,
            "is_read": False,
            "created_at": datetime.now()
        }
        await db.messages.insert_one(notification)
    
    return {
        "message": f"Leave request {action.action}d successfully",
        "final_status": final_status
    }

# ============================================
# TEAM CALENDAR
# ============================================

@router.get("/leave/team-calendar")
async def get_team_leave_calendar(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Get team leave calendar"""
    
    settings = await db.leave_system_settings.find_one()
    if settings and not settings.get("enable_leave_calendar", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Leave calendar is disabled"
        )
    
    if not month:
        month = datetime.now().month
    if not year:
        year = datetime.now().year
    
    tl_id = str(current_user["_id"])
    
    # Get first and last day of month
    _, last_day = calendar.monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)
    
    # Get team members
    team_members = await db.users.find({"team_lead_id": tl_id}).to_list(length=None)
    team_member_ids = [str(member["_id"]) for member in team_members]
    
    # Get approved leaves
    leaves = await db.leave_requests.find({
        "user_id": {"$in": team_member_ids},
        "final_status": "approved",
        "$or": [
            {"start_date": {"$lte": end_date}, "end_date": {"$gte": start_date}}
        ]
    }).to_list(length=None)
    
    result = []
    for leave in leaves:
        user = next((m for m in team_members if str(m["_id"]) == leave["user_id"]), None)
        leave_type = await db.leave_types.find_one({"code": leave["leave_type_code"]})
        
        if user and leave_type:
            result.append({
                "id": str(leave["_id"]),
                "user_name": user["full_name"],
                "user_email": user["email"],
                "leave_type": leave_type["name"],
                "color": leave_type["color"],
                "start_date": leave["start_date"],
                "end_date": leave["end_date"],
                "total_days": leave["total_days"],
                "is_half_day": leave["is_half_day"]
            })
    
    return {"leaves": result, "month": month, "year": year}