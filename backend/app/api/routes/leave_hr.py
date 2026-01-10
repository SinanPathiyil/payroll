from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.core.database import get_database
from app.api.deps import get_current_hr
from app.schemas.leave_request import (
    LeaveRequestResponse, LeaveRequestList, LeaveRequestStats,
    LeaveRequestApprove, LeaveRequestReject
)
from app.schemas.leave_balance import LeaveBalanceResponse, LeaveBalanceSummary, LeaveAllocationRequest
from app.schemas.leave_type import LeaveTypeResponse 
from app.services.leave_service import LeaveService
from bson import ObjectId
from datetime import datetime, date, time

router = APIRouter()

# ==================== LEAVE APPROVAL ====================

@router.get("/pending-approvals", response_model=LeaveRequestList)
async def get_pending_approvals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Get all pending leave requests for HR approval"""
    leave_service = LeaveService(db)
    
    requests = await leave_service.get_pending_hr_approvals()
    
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

@router.post("/requests/{request_id}/approve", response_model=LeaveRequestResponse)
async def approve_leave_request(
    request_id: str,
    approve_data: LeaveRequestApprove,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """HR approves a leave request"""
    leave_service = LeaveService(db)
    
    try:
        approved_request = await leave_service.approve_leave_request(
            request_id=request_id,
            hr_user=current_user,
            notes=approve_data.hr_notes
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve request: {str(e)}"
        )
    
    return LeaveRequestResponse(
        id=str(approved_request["_id"]),
        request_number=approved_request["request_number"],
        user_id=approved_request["user_id"],
        user_name=approved_request["user_name"],
        user_email=approved_request["user_email"],
        user_role=approved_request["user_role"],
        team_lead_id=approved_request.get("team_lead_id"),
        team_lead_name=approved_request.get("team_lead_name"),
        leave_type_code=approved_request["leave_type_code"],
        leave_type_name=approved_request["leave_type_name"],
        leave_type_color=approved_request["leave_type_color"],
        start_date=approved_request["start_date"],
        end_date=approved_request["end_date"],
        is_half_day=approved_request["is_half_day"],
        half_day_period=approved_request.get("half_day_period"),
        total_days=approved_request["total_days"],
        excluded_dates=approved_request["excluded_dates"],
        reason=approved_request["reason"],
        attachment_url=approved_request.get("attachment_url"),
        status=approved_request["status"],
        reviewed_by_hr_id=approved_request.get("reviewed_by_hr_id"),
        reviewed_by_hr_name=approved_request.get("reviewed_by_hr_name"),
        hr_action=approved_request.get("hr_action"),
        hr_notes=approved_request.get("hr_notes"),
        hr_action_at=approved_request.get("hr_action_at"),
        cancelled_by=approved_request.get("cancelled_by"),
        cancelled_at=approved_request.get("cancelled_at"),
        cancelled_reason=approved_request.get("cancelled_reason"),
        requested_at=approved_request["requested_at"]
    )

@router.post("/requests/{request_id}/reject", response_model=LeaveRequestResponse)
async def reject_leave_request(
    request_id: str,
    reject_data: LeaveRequestReject,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """HR rejects a leave request"""
    leave_service = LeaveService(db)
    
    try:
        rejected_request = await leave_service.reject_leave_request(
            request_id=request_id,
            hr_user=current_user,
            notes=reject_data.hr_notes
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject request: {str(e)}"
        )
    
    return LeaveRequestResponse(
        id=str(rejected_request["_id"]),
        request_number=rejected_request["request_number"],
        user_id=rejected_request["user_id"],
        user_name=rejected_request["user_name"],
        user_email=rejected_request["user_email"],
        user_role=rejected_request["user_role"],
        team_lead_id=rejected_request.get("team_lead_id"),
        team_lead_name=rejected_request.get("team_lead_name"),
        leave_type_code=rejected_request["leave_type_code"],
        leave_type_name=rejected_request["leave_type_name"],
        leave_type_color=rejected_request["leave_type_color"],
        start_date=rejected_request["start_date"],
        end_date=rejected_request["end_date"],
        is_half_day=rejected_request["is_half_day"],
        half_day_period=rejected_request.get("half_day_period"),
        total_days=rejected_request["total_days"],
        excluded_dates=rejected_request["excluded_dates"],
        reason=rejected_request["reason"],
        attachment_url=rejected_request.get("attachment_url"),
        status=rejected_request["status"],
        reviewed_by_hr_id=rejected_request.get("reviewed_by_hr_id"),
        reviewed_by_hr_name=rejected_request.get("reviewed_by_hr_name"),
        hr_action=rejected_request.get("hr_action"),
        hr_notes=rejected_request.get("hr_notes"),
        hr_action_at=rejected_request.get("hr_action_at"),
        cancelled_by=rejected_request.get("cancelled_by"),
        cancelled_at=rejected_request.get("cancelled_at"),
        cancelled_reason=rejected_request.get("cancelled_reason"),
        requested_at=rejected_request["requested_at"]
    )

# ==================== ALL LEAVE REQUESTS ====================

@router.get("/requests", response_model=LeaveRequestList)
async def get_all_leave_requests(
    status_filter: Optional[str] = Query(None, pattern="^(pending|approved|rejected|cancelled)$"),
    user_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Get all leave requests with filters"""
    leave_service = LeaveService(db)
    
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    if user_id:
        filters["user_id"] = user_id
    if start_date:
        filters["start_date"] = {"$gte": start_date}
    if end_date:
        if "start_date" in filters:
            filters["start_date"]["$lte"] = end_date
        else:
            filters["start_date"] = {"$lte": end_date}
    
    all_requests = await leave_service.get_leave_requests(filters, skip=skip, limit=limit)
    
    # Get total count
    total = await db.leave_requests.count_documents(filters)
    
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
            for req in all_requests
        ]
    )

@router.get("/requests/{request_id}", response_model=LeaveRequestResponse)
async def get_leave_request_details(
    request_id: str,
    current_user: dict = Depends(get_current_hr),
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

# ==================== LEAVE STATISTICS ====================

@router.get("/stats", response_model=LeaveRequestStats)
async def get_leave_statistics(
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Get leave statistics for HR dashboard"""
    leave_service = LeaveService(db)
    
    stats = await leave_service.get_leave_stats()
    
    return LeaveRequestStats(
        pending_count=stats["pending_count"],
        approved_today_count=stats["approved_today_count"],
        on_leave_today_count=stats["on_leave_today_count"],
        total_requests=stats["total_requests"]
    )

@router.get("/on-leave-today")
async def get_employees_on_leave_today(
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Get list of employees currently on leave"""
    leave_service = LeaveService(db)
    
    employees = await leave_service.get_employees_on_leave_today()
    
    return {
        "date": date.today().isoformat(),
        "total_on_leave": len(employees),
        "employees": [
            {
                "request_number": emp["request_number"],
                "user_name": emp["user_name"],
                "user_email": emp["user_email"],
                "leave_type": emp["leave_type_name"],
                "start_date": emp["start_date"].isoformat(),
                "end_date": emp["end_date"].isoformat(),
                "total_days": emp["total_days"]
            }
            for emp in employees
        ]
    }

# ==================== LEAVE BALANCE MANAGEMENT ====================

@router.post("/allocate-leaves")
async def allocate_leaves_to_employee(
    allocation_data: LeaveAllocationRequest,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Allocate additional leaves to an employee"""
    leave_service = LeaveService(db)
    
    # Verify user exists
    try:
        user = await db.users.find_one({"_id": ObjectId(allocation_data.user_id)})
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
    
    # Verify leave type exists
    leave_type = await leave_service.get_leave_type_by_code(allocation_data.leave_type_code)
    if not leave_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid leave type code"
        )
    
    balance = await leave_service.allocate_leaves(
        user_id=allocation_data.user_id,
        year=allocation_data.year,
        leave_type_code=allocation_data.leave_type_code,
        days=allocation_data.days
    )
    
    return {
        "message": f"Successfully allocated {allocation_data.days} days of {leave_type['name']}",
        "balance": {
            "user_id": balance["user_id"],
            "user_name": user["full_name"],
            "year": balance["year"],
            "leave_type": leave_type["name"],
            "allocated": balance["allocated"],
            "available": balance["available"]
        }
    }

@router.get("/balances/{user_id}")
async def get_employee_leave_balances(
    user_id: str,
    year: int = Query(..., description="Year"),
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Get leave balances for a specific employee"""
    leave_service = LeaveService(db)
    
    # Verify user exists
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
    
    balances = await leave_service.get_user_balances(user_id, year)
    
    return LeaveBalanceSummary(
        user_id=user_id,
        user_name=user["full_name"],
        year=year,
        balances=[
            LeaveBalanceResponse(
                id=str(bal["_id"]),
                user_id=bal["user_id"],
                user_name=user["full_name"],
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

# ==================== COMPANY CALENDAR ====================

@router.get("/company-calendar")
async def get_company_leave_calendar(
    start_date: date = Query(..., description="Start date"),
    end_date: date = Query(..., description="End date"),
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Get company-wide leave calendar with public holidays"""
    
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before end date"
        )
    
    # Convert date to datetime for MongoDB compatibility
    start_datetime = datetime.combine(start_date, time.min)
    end_datetime = datetime.combine(end_date, time.max)
    
    # ==================== GET APPROVED LEAVES ====================
    leaves_cursor = db.leave_requests.find({
        "status": "approved",
        "start_date": {"$lte": end_datetime},
        "end_date": {"$gte": start_datetime}
    }).sort("start_date", 1)
    
    leaves = await leaves_cursor.to_list(length=None)
    
    calendar_events = []
    
    # Add employee leaves
    for leave in leaves:
        start = leave["start_date"]
        end = leave["end_date"]
        
        start_str = start.date().isoformat() if isinstance(start, datetime) else start.isoformat()
        end_str = end.date().isoformat() if isinstance(end, datetime) else end.isoformat()
        
        calendar_events.append({
            "id": str(leave["_id"]),
            "type": "leave",
            "request_number": leave["request_number"],
            "user_name": leave["user_name"],
            "user_email": leave["user_email"],
            "leave_type": leave["leave_type_name"],
            "color": leave["leave_type_color"],
            "start_date": start_str,
            "end_date": end_str,
            "total_days": leave["total_days"],
            "is_half_day": leave["is_half_day"]
        })
    
    # ==================== GET PUBLIC HOLIDAYS ====================
    # FIXED: Use datetime objects for MongoDB query
    holidays_cursor = db.public_holidays.find({
        "is_active": True,
        "date": {
            "$gte": start_datetime,  # ← Changed from start_date
            "$lte": end_datetime      # ← Changed from end_date
        }
    }).sort("date", 1)
    
    holidays = await holidays_cursor.to_list(length=None)
    
    # Add public holidays
    for holiday in holidays:
        holiday_date = holiday["date"]
        date_str = holiday_date.date().isoformat() if isinstance(holiday_date, datetime) else holiday_date.isoformat()
        
        calendar_events.append({
            "id": str(holiday["_id"]),
            "type": "holiday",
            "name": holiday["name"],
            "description": holiday.get("description"),
            "date": date_str,
            "is_optional": holiday["is_optional"],
            "color": "#10b981" if not holiday["is_optional"] else "#f59e0b",
            "country": holiday.get("country")
        })
    
    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_events": len(calendar_events),
        "total_leaves": len(leaves),
        "total_holidays": len(holidays),
        "events": calendar_events
    }
    
# ==================== LEAVE TYPES (READ-ONLY FOR HR) ====================

@router.get("/leave-types", response_model=List[LeaveTypeResponse])
async def get_leave_types_for_hr(
    active_only: bool = True,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Get all leave types (read-only for HR)"""
    leave_service = LeaveService(db)
    leave_types = await leave_service.get_leave_types(active_only)
    
    return [
        LeaveTypeResponse(
            id=str(lt["_id"]),
            name=lt["name"],
            code=lt["code"],
            description=lt.get("description"),
            max_days_per_year=lt["max_days_per_year"],
            requires_document=lt["requires_document"],
            can_carry_forward=lt["can_carry_forward"],
            carry_forward_limit=lt["carry_forward_limit"],
            allow_half_day=lt["allow_half_day"],
            color=lt["color"],
            is_paid=lt["is_paid"],
            is_active=lt["is_active"],
            created_by=lt.get("created_by"),
            created_at=lt["created_at"],
            updated_at=lt.get("updated_at")
        )
        for lt in leave_types
    ]