from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.core.database import get_database
from app.api.deps import get_current_team_lead
from app.schemas.leave_request import (
    LeaveRequestCreate, LeaveRequestCancel, LeaveRequestResponse, LeaveRequestList
)
from app.schemas.leave_balance import LeaveBalanceResponse, LeaveBalanceSummary
from app.services.leave_service import LeaveService
from bson import ObjectId
from datetime import datetime, date

router = APIRouter()

# ==================== TEAM LEAD - VIEW TEAM REQUESTS (READ ONLY) ====================

@router.get("/team-requests", response_model=LeaveRequestList)
async def get_team_leave_requests(
    status_filter: Optional[str] = Query(None, pattern="^(pending|approved|rejected|cancelled)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """
    Team Lead views leave requests from their team members
    VIEW ONLY - Cannot approve/reject
    """
    leave_service = LeaveService(db)
    
    # Get requests where team_lead_id matches current TL
    team_lead_id = str(current_user["_id"])
    
    if status_filter:
        requests = await leave_service.get_team_leave_requests(team_lead_id, status_filter)
    else:
        requests = await leave_service.get_team_leave_requests(team_lead_id)
    
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

@router.get("/team-requests/{request_id}", response_model=LeaveRequestResponse)
async def get_team_leave_request_details(
    request_id: str,
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """View specific team member's leave request details"""
    leave_service = LeaveService(db)
    
    request = await leave_service.get_leave_request_by_id(request_id)
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    
    # Verify this request belongs to TL's team
    if request.get("team_lead_id") != str(current_user["_id"]):
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

@router.get("/team-calendar")
async def get_team_leave_calendar(
    start_date: date = Query(..., description="Start date"),
    end_date: date = Query(..., description="End date"),
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Get team leave calendar - shows approved leaves for team members, TL's own leaves, and public holidays"""
    
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before end date"
        )
    
    # Convert date to datetime for MongoDB query
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    
    team_lead_id = str(current_user["_id"])
    
    calendar_events = []
    
    # Build query to get relevant leaves (team members + TL's own leaves)
    leave_query = {
        "status": "approved",
        "start_date": {"$lte": end_datetime},
        "end_date": {"$gte": start_datetime},
        "$or": [
            {"team_lead_id": team_lead_id},  # Team members' leaves
            {"user_id": team_lead_id}         # TL's own leaves
        ]
    }
    
    cursor = db.leave_requests.find(leave_query).sort("start_date", 1)
    leaves = await cursor.to_list(length=None)
    
    for leave in leaves:
        is_own_leave = leave["user_id"] == team_lead_id
        calendar_events.append({
            "id": str(leave["_id"]),
            "type": "leave",
            "request_number": leave["request_number"],
            "user_name": leave["user_name"],
            "user_id": leave["user_id"],
            "is_own": is_own_leave,
            "user_email": leave["user_email"],
            "leave_type": leave["leave_type_name"],
            "color": leave["leave_type_color"],
            "start_date": leave["start_date"].isoformat() if isinstance(leave["start_date"], datetime) else leave["start_date"],
            "end_date": leave["end_date"].isoformat() if isinstance(leave["end_date"], datetime) else leave["end_date"],
            "total_days": leave["total_days"],
            "is_half_day": leave["is_half_day"]
        })
    
    # Get public holidays in date range
    holiday_cursor = db.public_holidays.find({
        "date": {"$gte": start_datetime, "$lte": end_datetime},
        "is_active": True
    }).sort("date", 1)
    
    holidays = await holiday_cursor.to_list(length=None)
    
    for holiday in holidays:
        calendar_events.append({
            "id": str(holiday["_id"]),
            "type": "holiday",
            "name": holiday["name"],
            "date": holiday["date"].isoformat() if isinstance(holiday["date"], datetime) else holiday["date"],
            "is_optional": holiday.get("is_optional", False),
            "color": "#10b981" if not holiday.get("is_optional", False) else "#f59e0b",
            "description": holiday.get("description")
        })
    
    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_events": len(calendar_events),
        "events": calendar_events,
        "has_team": True
    }

@router.get("/team-members-balances")
async def get_team_members_leave_balances(
    year: int = Query(..., description="Year"),
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """View leave balances for all team members"""
    leave_service = LeaveService(db)
    team_lead_id = str(current_user["_id"])
    
    # Get all team members under this TL
    team_members = []
    cursor = db.users.find({
        "reporting_to": team_lead_id,
        "is_active": True
    })
    
    async for member in cursor:
        balances = await leave_service.get_user_balances(str(member["_id"]), year)
        
        team_members.append({
            "user_id": str(member["_id"]),
            "user_name": member["full_name"],
            "user_email": member["email"],
            "balances": [
                {
                    "leave_type_code": bal["leave_type_code"],
                    "leave_type_name": bal.get("leave_type_name", ""),
                    "allocated": bal["allocated"],
                    "used": bal["used"],
                    "pending": bal["pending"],
                    "available": bal["available"]
                }
                for bal in balances
            ],
            "total_available": sum(bal["available"] for bal in balances)
        })
    
    return {
        "year": year,
        "team_lead": current_user["full_name"],
        "total_members": len(team_members),
        "team_members": team_members
    }

# ==================== TEAM LEAD - OWN LEAVE MANAGEMENT ====================

@router.post("/my-leave/apply", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_leave(
    leave_data: LeaveRequestCreate,
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Team Lead applies for leave (goes directly to HR for approval)"""
    leave_service = LeaveService(db)
    
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

@router.get("/my-leave/balance")
async def get_my_leave_balance(
    year: int = Query(..., description="Year"),
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Get TL's own leave balance"""
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

@router.get("/my-leave/history", response_model=LeaveRequestList)
async def get_my_leave_history(
    year: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Get TL's own leave history"""
    leave_service = LeaveService(db)
    
    requests = await leave_service.get_user_leave_requests(str(current_user["_id"]), year)
    
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

@router.delete("/my-leave/{request_id}")
async def cancel_my_leave_request(
    request_id: str,
    cancel_data: LeaveRequestCancel,
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """TL cancels their own leave request"""
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
        "status": cancelled_request["status"]
    }

# ==================== AVAILABLE LEAVE TYPES ====================

@router.get("/available-leave-types")
async def get_available_leave_types(
    current_user: dict = Depends(get_current_team_lead),
    db = Depends(get_database)
):
    """Get available leave types for applying leave"""
    leave_service = LeaveService(db)
    
    leave_types = await leave_service.get_leave_types(active_only=True)
    
    # Get current year balances
    current_year = datetime.now().year
    balances = await leave_service.get_user_balances(str(current_user["_id"]), current_year)
    
    # Map balances by leave type code
    balance_map = {bal["leave_type_code"]: bal["available"] for bal in balances}
    
    return {
        "leave_types": [
            {
                "code": lt["code"],
                "name": lt["name"],
                "color": lt["color"],
                "allow_half_day": lt["allow_half_day"],
                "requires_document": lt["requires_document"],
                "available_balance": balance_map.get(lt["code"], 0)
            }
            for lt in leave_types
        ]
    }