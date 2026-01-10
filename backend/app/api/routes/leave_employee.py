from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.core.database import get_database
from app.api.deps import get_current_employee
from app.schemas.leave_request import (
    LeaveRequestCreate, LeaveRequestCancel, LeaveRequestResponse, LeaveRequestList
)
from app.schemas.leave_balance import LeaveBalanceResponse, LeaveBalanceSummary
from app.services.leave_service import LeaveService
from bson import ObjectId
from datetime import datetime, date

router = APIRouter()

# ==================== LEAVE APPLICATION ====================

@router.post("/apply", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_leave(
    leave_data: LeaveRequestCreate,
    current_user: dict = Depends(get_current_employee),
    db = Depends(get_database)
):
    """Employee applies for leave"""
    leave_service = LeaveService(db)
    
    # Check if user is in probation (if policy requires)
    policy = await leave_service.get_current_policy()
    if policy and policy.get("probation_enabled"):
        user_created_at = current_user.get("created_at")
        if user_created_at:
            days_since_joining = (datetime.now() - user_created_at).days
            probation_days = policy.get("probation_period_days", 90)
            
            if days_since_joining < probation_days:
                # Check if leave type is allowed during probation
                # Only emergency leave or unpaid leave typically allowed
                if leave_data.leave_type_code not in ["EMERGENCY", "UNPAID"]:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"You are in probation period ({probation_days - days_since_joining} days remaining). Only Emergency or Unpaid leave allowed."
                    )
    
    try:
        leave_request = await leave_service.create_leave_request(
            request_data=leave_data.dict(),
            user=current_user
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create leave request: {str(e)}"
        )
    
    return LeaveRequestResponse(
        id=str(leave_request["_id"]),
        request_number=leave_request["request_number"],
        user_id=leave_request["user_id"],
        user_name=leave_request["user_name"],
        user_email=leave_request["user_email"],
        user_role=leave_request["user_role"],
        team_lead_id=leave_request.get("team_lead_id"),
        team_lead_name=leave_request.get("team_lead_name"),
        leave_type_code=leave_request["leave_type_code"],
        leave_type_name=leave_request["leave_type_name"],
        leave_type_color=leave_request["leave_type_color"],
        start_date=leave_request["start_date"],
        end_date=leave_request["end_date"],
        is_half_day=leave_request["is_half_day"],
        half_day_period=leave_request.get("half_day_period"),
        total_days=leave_request["total_days"],
        excluded_dates=leave_request["excluded_dates"],
        reason=leave_request["reason"],
        attachment_url=leave_request.get("attachment_url"),
        status=leave_request["status"],
        reviewed_by_hr_id=leave_request.get("reviewed_by_hr_id"),
        reviewed_by_hr_name=leave_request.get("reviewed_by_hr_name"),
        hr_action=leave_request.get("hr_action"),
        hr_notes=leave_request.get("hr_notes"),
        hr_action_at=leave_request.get("hr_action_at"),
        cancelled_by=leave_request.get("cancelled_by"),
        cancelled_at=leave_request.get("cancelled_at"),
        cancelled_reason=leave_request.get("cancelled_reason"),
        requested_at=leave_request["requested_at"]
    )

# ==================== LEAVE BALANCE ====================

@router.get("/balance")
async def get_my_leave_balance(
    year: int = Query(..., description="Year"),
    current_user: dict = Depends(get_current_employee),
    db = Depends(get_database)
):
    """Get employee's leave balance"""
    leave_service = LeaveService(db)
    
    balances = await leave_service.get_user_balances(str(current_user["_id"]), year)
    
    return LeaveBalanceSummary(
        user_id=str(current_user["_id"]),
        user_name=current_user["full_name"],
        year=year,
        balances=[
            LeaveBalanceResponse(
                id=str(bal["_id"]),
                user_id=bal["user_id"],
                user_name=current_user["full_name"],
                year=bal["year"],
                leave_type_code=bal["leave_type_code"],
                leave_type_name=bal.get("leave_type_name", ""),
                allocated=bal["allocated"],
                carried_forward=bal["carried_forward"],
                total_available=bal["total_available"],
                used=bal["used"],
                pending=bal["pending"],
                available=bal["available"],
                carry_forward_expires_on=bal.get("carry_forward_expires_on"),
                last_updated=bal["last_updated"]
            )
            for bal in balances
        ],
        total_allocated=sum(bal["allocated"] for bal in balances),
        total_used=sum(bal["used"] for bal in balances),
        total_available=sum(bal["available"] for bal in balances)
    )

# ==================== LEAVE HISTORY ====================

@router.get("/history", response_model=LeaveRequestList)
async def get_my_leave_history(
    year: Optional[int] = None,
    status_filter: Optional[str] = Query(None, pattern="^(pending|approved|rejected|cancelled)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_employee),
    db = Depends(get_database)
):
    """Get employee's leave history"""
    leave_service = LeaveService(db)
    
    requests = await leave_service.get_user_leave_requests(str(current_user["_id"]), year)
    
    # Filter by status if provided
    if status_filter:
        requests = [req for req in requests if req["status"] == status_filter]
    
    # Apply pagination
    total = len(requests)
    paginated_requests = requests[skip:skip+limit]
    
    return LeaveRequestList(
        total=total,
        requests=[
            LeaveRequestResponse(
                id=str(req["_id"]),
                request_number=req["request_number"],
                user_id=req["user_id"],
                user_name=req["user_name"],
                user_email=req["user_email"],
                user_role=req["user_role"],
                team_lead_id=req.get("team_lead_id"),
                team_lead_name=req.get("team_lead_name"),
                leave_type_code=req["leave_type_code"],
                leave_type_name=req["leave_type_name"],
                leave_type_color=req["leave_type_color"],
                start_date=req["start_date"],
                end_date=req["end_date"],
                is_half_day=req["is_half_day"],
                half_day_period=req.get("half_day_period"),
                total_days=req["total_days"],
                excluded_dates=req["excluded_dates"],
                reason=req["reason"],
                attachment_url=req.get("attachment_url"),
                status=req["status"],
                reviewed_by_hr_id=req.get("reviewed_by_hr_id"),
                reviewed_by_hr_name=req.get("reviewed_by_hr_name"),
                hr_action=req.get("hr_action"),
                hr_notes=req.get("hr_notes"),
                hr_action_at=req.get("hr_action_at"),
                cancelled_by=req.get("cancelled_by"),
                cancelled_at=req.get("cancelled_at"),
                cancelled_reason=req.get("cancelled_reason"),
                requested_at=req["requested_at"]
            )
            for req in paginated_requests
        ]
    )

@router.get("/requests/{request_id}", response_model=LeaveRequestResponse)
async def get_my_leave_request_details(
    request_id: str,
    current_user: dict = Depends(get_current_employee),
    db = Depends(get_database)
):
    """Get specific leave request details"""
    leave_service = LeaveService(db)
    
    request = await leave_service.get_leave_request_by_id(request_id)
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    
    # Verify ownership
    if request["user_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this request"
        )
    
    return LeaveRequestResponse(
        id=str(request["_id"]),
        request_number=request["request_number"],
        user_id=request["user_id"],
        user_name=request["user_name"],
        user_email=request["user_email"],
        user_role=request["user_role"],
        team_lead_id=request.get("team_lead_id"),
        team_lead_name=request.get("team_lead_name"),
        leave_type_code=request["leave_type_code"],
        leave_type_name=request["leave_type_name"],
        leave_type_color=request["leave_type_color"],
        start_date=request["start_date"],
        end_date=request["end_date"],
        is_half_day=request["is_half_day"],
        half_day_period=request.get("half_day_period"),
        total_days=request["total_days"],
        excluded_dates=request["excluded_dates"],
        reason=request["reason"],
        attachment_url=request.get("attachment_url"),
        status=request["status"],
        reviewed_by_hr_id=request.get("reviewed_by_hr_id"),
        reviewed_by_hr_name=request.get("reviewed_by_hr_name"),
        hr_action=request.get("hr_action"),
        hr_notes=request.get("hr_notes"),
        hr_action_at=request.get("hr_action_at"),
        cancelled_by=request.get("cancelled_by"),
        cancelled_at=request.get("cancelled_at"),
        cancelled_reason=request.get("cancelled_reason"),
        requested_at=request["requested_at"]
    )

# ==================== CANCEL LEAVE ====================

@router.delete("/requests/{request_id}")
async def cancel_leave_request(
    request_id: str,
    cancel_data: LeaveRequestCancel,
    current_user: dict = Depends(get_current_employee),
    db = Depends(get_database)
):
    """Employee cancels their own leave request (pending or approved)"""
    leave_service = LeaveService(db)
    
    try:
        cancelled_request = await leave_service.cancel_leave_request(
            request_id=request_id,
            user_id=str(current_user["_id"]),
            reason=cancel_data.cancelled_reason
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel request: {str(e)}"
        )
    
    return {
        "message": "Leave request cancelled successfully",
        "request_number": cancelled_request["request_number"],
        "status": cancelled_request["status"],
        "cancelled_at": cancelled_request["cancelled_at"]
    }

# ==================== TEAM CALENDAR ====================

@router.get("/team-calendar")
async def get_team_leave_calendar(
    start_date: date = Query(..., description="Start date"),
    end_date: date = Query(..., description="End date"),
    current_user: dict = Depends(get_current_employee),
    db = Depends(get_database)
):
    """Get team leave calendar - shows approved leaves for team members"""
    
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before end date"
        )
    
    # Get employee's team_lead_id
    team_lead_id = current_user.get("reporting_to")
    
    if not team_lead_id:
        # No team lead assigned, return empty calendar
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_leaves": 0,
            "leaves": [],
            "message": "No team assigned"
        }
    
    # Get all approved leaves for team members (same team lead) in date range
    cursor = db.leave_requests.find({
        "team_lead_id": team_lead_id,
        "status": "approved",
        "start_date": {"$lte": end_date},
        "end_date": {"$gte": start_date}
    }).sort("start_date", 1)
    
    leaves = await cursor.to_list(length=None)
    
    calendar_events = []
    for leave in leaves:
        calendar_events.append({
            "id": str(leave["_id"]),
            "request_number": leave["request_number"],
            "user_name": leave["user_name"],
            "leave_type": leave["leave_type_name"],
            "color": leave["leave_type_color"],
            "start_date": leave["start_date"].isoformat(),
            "end_date": leave["end_date"].isoformat(),
            "total_days": leave["total_days"],
            "is_half_day": leave["is_half_day"]
        })
    
    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_leaves": len(calendar_events),
        "leaves": calendar_events
    }

# ==================== AVAILABLE LEAVE TYPES ====================

@router.get("/available-leave-types")
async def get_available_leave_types(
    current_user: dict = Depends(get_current_employee),
    db = Depends(get_database)
):
    """Get available leave types for applying leave with current balances"""
    leave_service = LeaveService(db)
    
    leave_types = await leave_service.get_leave_types(active_only=True)
    
    # Get current year balances
    current_year = datetime.now().year
    balances = await leave_service.get_user_balances(str(current_user["_id"]), current_year)
    
    # Map balances by leave type code
    balance_map = {bal["leave_type_code"]: bal["available"] for bal in balances}
    
    # Filter out leave types with 0 balance (except UNPAID)
    available_types = []
    for lt in leave_types:
        available_balance = balance_map.get(lt["code"], 0)
        
        # Always show UNPAID leave regardless of balance
        if lt["code"] == "UNPAID" or available_balance > 0:
            available_types.append({
                "code": lt["code"],
                "name": lt["name"],
                "color": lt["color"],
                "allow_half_day": lt["allow_half_day"],
                "requires_document": lt["requires_document"],
                "available_balance": available_balance,
                "is_paid": lt["is_paid"]
            })
    
    return {
        "leave_types": available_types,
        "message": "Only leave types with available balance are shown (except Unpaid Leave)"
    }

# ==================== LEAVE POLICY INFO ====================

@router.get("/policy-info")
async def get_leave_policy_info(
    current_user: dict = Depends(get_current_employee),
    db = Depends(get_database)
):
    """Get current leave policy information"""
    leave_service = LeaveService(db)
    
    policy = await leave_service.get_current_policy()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No leave policy found for current year"
        )
    
    # Check if user is in probation
    user_created_at = current_user.get("created_at")
    in_probation = False
    probation_days_remaining = 0
    
    if policy.get("probation_enabled") and user_created_at:
        days_since_joining = (datetime.now() - user_created_at).days
        probation_days = policy.get("probation_period_days", 90)
        
        if days_since_joining < probation_days:
            in_probation = True
            probation_days_remaining = probation_days - days_since_joining
    
    return {
        "year": policy["year"],
        "probation": {
            "enabled": policy.get("probation_enabled", False),
            "period_days": policy.get("probation_period_days", 0),
            "in_probation": in_probation,
            "days_remaining": probation_days_remaining
        },
        "carry_forward": {
            "enabled": policy.get("carry_forward_enabled", False),
            "expiry_month": policy.get("carry_forward_expiry_month"),
            "expiry_day": policy.get("carry_forward_expiry_day")
        },
        "request_rules": {
            "advance_notice_days": policy.get("advance_notice_days", 0),
            "max_consecutive_days": policy.get("max_consecutive_days", 30)
        },
        "calculation": {
            "exclude_weekends": policy.get("exclude_weekends", True),
            "exclude_public_holidays": policy.get("exclude_public_holidays", True),
            "weekend_days": policy.get("weekend_days", [])
        }
    }

# ==================== PUBLIC HOLIDAYS ====================

@router.get("/public-holidays")
async def get_public_holidays(
    year: int = Query(..., description="Year"),
    current_user: dict = Depends(get_current_employee),
    db = Depends(get_database)
):
    """Get public holidays for a year"""
    leave_service = LeaveService(db)
    
    holidays = await leave_service.get_holidays_by_year(year)
    
    return {
        "year": year,
        "total_holidays": len(holidays),
        "holidays": [
            {
                "name": h["name"],
                "date": h["date"].isoformat(),
                "is_optional": h["is_optional"],
                "description": h.get("description")
            }
            for h in holidays
        ]
    }