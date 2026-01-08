from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Optional
from app.core.database import get_database
from app.api.deps import get_current_user
from app.schemas.leave import (
    LeaveRequestCreate, LeaveRequestResponse, LeaveBalanceResponse,
    LeaveCancellation, LeaveTypeResponse
)
from bson import ObjectId
from datetime import datetime, date, timedelta
import calendar

router = APIRouter()

# ============================================
# HELPER FUNCTIONS
# ============================================

async def calculate_leave_days(start_date: date, end_date: date, is_half_day: bool, db) -> float:
    """Calculate total leave days excluding weekends/holidays if configured"""
    
    settings = await db.leave_system_settings.find_one()
    deduct_weekends = settings.get("deduct_weekends", False) if settings else False
    deduct_holidays = settings.get("deduct_holidays", False) if settings else False
    
    if is_half_day:
        return 0.5
    
    total_days = 0.0
    current = start_date
    
    while current <= end_date:
        # Check if weekend
        if deduct_weekends and current.weekday() >= 5:  # Saturday = 5, Sunday = 6
            current += timedelta(days=1)
            continue
        
        # Check if holiday
        if deduct_holidays:
            holiday = await db.leave_holidays.find_one({"date": current})
            if holiday and not holiday.get("is_optional", False):
                current += timedelta(days=1)
                continue
        
        total_days += 1.0
        current += timedelta(days=1)
    
    return total_days

async def build_approval_chain(user_id: str, db) -> List[dict]:
    """Build approval chain based on workflow settings"""
    
    settings = await db.leave_system_settings.find_one()
    workflow_type = settings.get("workflow_type", "tl_then_hr") if settings else "tl_then_hr"
    
    approval_chain = []
    
    # Get user details
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return []
    
    if workflow_type == "none":
        # Auto-approve, no chain needed
        return []
    
    elif workflow_type == "tl_only":
        # Only Team Lead approval
        team_lead_id = user.get("team_lead_id")
        if team_lead_id:
            approval_chain.append({
                "role": "team_lead",
                "user_id": team_lead_id,
                "status": "pending",
                "approved_at": None,
                "notes": None
            })
    
    elif workflow_type == "hr_only":
        # Only HR approval - get any HR user
        hr_user = await db.users.find_one({"role": "hr", "is_active": True})
        if hr_user:
            approval_chain.append({
                "role": "hr",
                "user_id": str(hr_user["_id"]),
                "status": "pending",
                "approved_at": None,
                "notes": None
            })
    
    elif workflow_type == "tl_then_hr":
        # Team Lead first, then HR
        team_lead_id = user.get("team_lead_id")
        if team_lead_id:
            approval_chain.append({
                "role": "team_lead",
                "user_id": team_lead_id,
                "status": "pending",
                "approved_at": None,
                "notes": None
            })
        
        hr_user = await db.users.find_one({"role": "hr", "is_active": True})
        if hr_user:
            approval_chain.append({
                "role": "hr",
                "user_id": str(hr_user["_id"]),
                "status": "pending",
                "approved_at": None,
                "notes": None
            })
    
    elif workflow_type == "hr_then_tl":
        # HR first, then Team Lead
        hr_user = await db.users.find_one({"role": "hr", "is_active": True})
        if hr_user:
            approval_chain.append({
                "role": "hr",
                "user_id": str(hr_user["_id"]),
                "status": "pending",
                "approved_at": None,
                "notes": None
            })
        
        team_lead_id = user.get("team_lead_id")
        if team_lead_id:
            approval_chain.append({
                "role": "team_lead",
                "user_id": team_lead_id,
                "status": "pending",
                "approved_at": None,
                "notes": None
            })
    
    return approval_chain

async def check_leave_balance(user_id: str, leave_type_code: str, days_requested: float, db) -> dict:
    """Check if user has sufficient leave balance"""
    
    current_year = datetime.now().year
    balance = await db.leave_balances.find_one({
        "user_id": user_id,
        "year": current_year,
        "leave_type_code": leave_type_code
    })
    
    if not balance:
        return {"sufficient": False, "available": 0.0, "requested": days_requested}
    
    available = balance.get("available", 0.0)
    
    # Check if negative balance is allowed
    settings = await db.leave_system_settings.find_one()
    allow_negative = settings.get("allow_negative_balance", False) if settings else False
    
    if allow_negative:
        return {"sufficient": True, "available": available, "requested": days_requested}
    
    return {
        "sufficient": available >= days_requested,
        "available": available,
        "requested": days_requested
    }

# ============================================
# LEAVE BALANCE
# ============================================

@router.get("/leave/balance", response_model=List[LeaveBalanceResponse])
async def get_my_leave_balance(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get employee's leave balance for current year"""
    
    current_year = datetime.now().year
    user_id = str(current_user["_id"])
    
    balances = await db.leave_balances.find({
        "user_id": user_id,
        "year": current_year
    }).to_list(length=None)
    
    result = []
    for balance in balances:
        leave_type = await db.leave_types.find_one({"code": balance["leave_type_code"]})
        if leave_type and leave_type.get("is_active", True):
            result.append(
                LeaveBalanceResponse(
                    leave_type_code=balance["leave_type_code"],
                    leave_type_name=leave_type["name"],
                    color=leave_type["color"],
                    allocated=balance.get("allocated", 0.0),
                    used=balance.get("used", 0.0),
                    pending=balance.get("pending", 0.0),
                    available=balance.get("available", 0.0),
                    carried_forward=balance.get("carried_forward", 0.0),
                    manually_adjusted=balance.get("manually_adjusted", 0.0)
                )
            )
    
    return result

# ============================================
# LEAVE TYPES (Available to Employee)
# ============================================

@router.get("/leave/types", response_model=List[LeaveTypeResponse])
async def get_available_leave_types(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all active leave types available for application"""
    
    leave_types = await db.leave_types.find({"is_active": True}).to_list(length=None)
    
    return [
        LeaveTypeResponse(
            id=str(lt["_id"]),
            **{k: v for k, v in lt.items() if k not in ["_id", "created_by", "updated_at"]}
        )
        for lt in leave_types
    ]

# ============================================
# APPLY FOR LEAVE
# ============================================

@router.post("/leave/apply", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_leave(
    leave_request: LeaveRequestCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Apply for leave"""
    
    user_id = str(current_user["_id"])
    
    # Check if leave system is enabled
    settings = await db.leave_system_settings.find_one()
    if settings and not settings.get("enable_leave_system", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Leave system is currently disabled"
        )
    
    # Validate leave type
    leave_type = await db.leave_types.find_one({
        "code": leave_request.leave_type_code,
        "is_active": True
    })
    if not leave_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave type not found or inactive"
        )
    
    # Check if half-day is allowed
    if leave_request.is_half_day:
        if settings and not settings.get("enable_half_day_leave", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Half-day leave is not allowed"
            )
        if not leave_type.get("allow_half_day", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Half-day is not allowed for {leave_type['name']}"
            )
    
    # Validate dates
    if leave_request.start_date > leave_request.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after or equal to start date"
        )
    
    # Check backdated requests
    if settings and not settings.get("enable_backdated_requests", False):
        if leave_request.start_date < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Backdated leave requests are not allowed"
            )
    
    # Check advance booking limit
    if settings:
        max_advance_days = settings.get("max_advance_days", 90)
        if (leave_request.start_date - date.today()).days > max_advance_days:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot apply for leave more than {max_advance_days} days in advance"
            )
        
        # Check minimum notice
        min_notice_days = settings.get("min_notice_days", 1)
        if (leave_request.start_date - date.today()).days < min_notice_days:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Minimum {min_notice_days} days notice required"
            )
    
    # Calculate total days
    total_days = await calculate_leave_days(
        leave_request.start_date,
        leave_request.end_date,
        leave_request.is_half_day,
        db
    )
    
    # Check max days per request
    if leave_type.get("max_days_per_request"):
        if total_days > leave_type["max_days_per_request"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum {leave_type['max_days_per_request']} days allowed per request for {leave_type['name']}"
            )
    
    # Check leave balance
    balance_check = await check_leave_balance(user_id, leave_request.leave_type_code, total_days, db)
    if not balance_check["sufficient"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient leave balance. Available: {balance_check['available']}, Requested: {balance_check['requested']}"
        )
    
    # Build approval chain
    approval_chain = await build_approval_chain(user_id, db)
    
    # Determine initial status
    if not approval_chain:  # Auto-approve (workflow_type = "none")
        final_status = "approved"
        current_approval_level = -1
    else:
        final_status = "pending"
        current_approval_level = 0
    
    # Auto-approve WFH if enabled
    if leave_request.leave_type_code == "WFH" and settings and settings.get("auto_approve_wfh", False):
        final_status = "approved"
        current_approval_level = -1
        approval_chain = []
    
    # Create leave request
    leave_dict = {
        "user_id": user_id,
        "leave_type_code": leave_request.leave_type_code,
        "start_date": leave_request.start_date,
        "end_date": leave_request.end_date,
        "total_days": total_days,
        "is_half_day": leave_request.is_half_day,
        "half_day_period": leave_request.half_day_period,
        "reason": leave_request.reason,
        "status": final_status,
        "requested_at": datetime.now(),
        "approval_chain": approval_chain,
        "current_approval_level": current_approval_level,
        "final_status": final_status,
        "attachments": leave_request.attachments or [],
        "cancelled_at": None,
        "cancelled_by": None,
        "cancellation_reason": None,
        "admin_override": False,
        "override_by": None,
        "override_reason": None
    }
    
    result = await db.leave_requests.insert_one(leave_dict)
    leave_dict["_id"] = result.inserted_id
    
    # Update leave balance (add to pending or used if auto-approved)
    current_year = datetime.now().year
    balance = await db.leave_balances.find_one({
        "user_id": user_id,
        "year": current_year,
        "leave_type_code": leave_request.leave_type_code
    })
    
    if balance:
        if final_status == "approved":
            # Directly deduct from available and add to used
            await db.leave_balances.update_one(
                {"_id": balance["_id"]},
                {
                    "$inc": {
                        "used": total_days,
                        "available": -total_days
                    },
                    "$set": {"updated_at": datetime.now()}
                }
            )
        else:
            # Add to pending, deduct from available
            await db.leave_balances.update_one(
                {"_id": balance["_id"]},
                {
                    "$inc": {
                        "pending": total_days,
                        "available": -total_days
                    },
                    "$set": {"updated_at": datetime.now()}
                }
            )
    
    # Send notifications if enabled
    if settings and settings.get("notify_approvers", True) and approval_chain:
        for approver in approval_chain:
            notification = {
                "from_user": user_id,
                "to_user": approver["user_id"],
                "content": f"New leave request from {current_user['full_name']} for {leave_type['name']}",
                "leave_request_id": str(leave_dict["_id"]),
                "is_read": False,
                "created_at": datetime.now()
            }
            await db.messages.insert_one(notification)
    
    return LeaveRequestResponse(
        id=str(leave_dict["_id"]),
        user_id=user_id,
        user_name=current_user["full_name"],
        user_email=current_user["email"],
        leave_type_code=leave_type["code"],
        leave_type_name=leave_type["name"],
        leave_type_color=leave_type["color"],
        **{k: v for k, v in leave_dict.items() if k not in ["_id", "user_id", "leave_type_code"]}
    )

# ============================================
# VIEW LEAVE HISTORY
# ============================================

@router.get("/leave/history", response_model=List[LeaveRequestResponse])
async def get_my_leave_history(
    status: Optional[str] = None,
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get employee's leave request history"""
    
    user_id = str(current_user["_id"])
    
    query = {"user_id": user_id}
    
    if status:
        query["final_status"] = status
    
    if year:
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)
        query["start_date"] = {"$gte": start_date, "$lte": end_date}
    
    requests = await db.leave_requests.find(query).sort("requested_at", -1).to_list(length=None)
    
    result = []
    for req in requests:
        leave_type = await db.leave_types.find_one({"code": req["leave_type_code"]})
        if leave_type:
            result.append(
                LeaveRequestResponse(
                    id=str(req["_id"]),
                    user_id=user_id,
                    user_name=current_user["full_name"],
                    user_email=current_user["email"],
                    leave_type_code=leave_type["code"],
                    leave_type_name=leave_type["name"],
                    leave_type_color=leave_type["color"],
                    **{k: v for k, v in req.items() if k not in ["_id", "user_id", "leave_type_code"]}
                )
            )
    
    return result

# ============================================
# CANCEL LEAVE REQUEST
# ============================================

@router.post("/leave/{request_id}/cancel")
async def cancel_leave_request(
    request_id: str,
    cancellation: LeaveCancellation,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Cancel pending leave request"""
    
    user_id = str(current_user["_id"])
    
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
    
    # Verify ownership
    if leave_request["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this request"
        )
    
    # Can only cancel pending requests
    if leave_request["final_status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel {leave_request['final_status']} request"
        )
    
    # Update request status
    await db.leave_requests.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "final_status": "cancelled",
                "cancelled_at": datetime.now(),
                "cancelled_by": user_id,
                "cancellation_reason": cancellation.cancellation_reason
            }
        }
    )
    
    # Restore leave balance
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
    
    return {"message": "Leave request cancelled successfully"}

# ============================================
# VIEW TEAM CALENDAR (For awareness)
# ============================================

@router.get("/leave/team-calendar")
async def get_team_leave_calendar(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get team leave calendar for the month"""
    
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
    
    # Get first and last day of month
    _, last_day = calendar.monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)
    
    # Get user's team
    user_team_id = current_user.get("team_id")
    if not user_team_id:
        return {"leaves": [], "message": "Not assigned to any team"}
    
    # Get team members
    team_members = await db.users.find({"team_id": user_team_id}).to_list(length=None)
    team_member_ids = [str(member["_id"]) for member in team_members]
    
    # Get approved leaves for the month
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
                "leave_type": leave_type["name"],
                "color": leave_type["color"],
                "start_date": leave["start_date"],
                "end_date": leave["end_date"],
                "total_days": leave["total_days"],
                "is_half_day": leave["is_half_day"]
            })
    
    return {"leaves": result, "month": month, "year": year}