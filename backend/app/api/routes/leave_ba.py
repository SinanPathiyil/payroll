from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from app.core.database import get_database
from app.api.deps import get_current_user
from app.schemas.leave_request import (
    LeaveRequestCreate, LeaveRequestCancel, LeaveRequestResponse, LeaveRequestList
)
from app.schemas.leave_balance import LeaveBalanceResponse, LeaveBalanceSummary
from app.services.leave_service import LeaveService
from datetime import datetime

router = APIRouter()

# ==================== HELPER FUNCTIONS ===================

def check_ba_role(current_user: dict):
    """Verify user is a business analyst"""
    if current_user.get("role") != "business_analyst":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Business Analysts can access this endpoint"
        )

# ==================== BA - OWN LEAVE MANAGEMENT ====================

@router.post("/requests", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_leave(
    leave_data: LeaveRequestCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Business Analyst applies for leave (goes directly to HR for approval)"""
    check_ba_role(current_user)
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

@router.get("/balance")
async def get_leave_balance(
    year: int = Query(..., description="Year"),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get BA's leave balance"""
    check_ba_role(current_user)
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

@router.get("/history", response_model=LeaveRequestList)
async def get_leave_history(
    year: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get BA's leave history"""
    check_ba_role(current_user)
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

@router.delete("/requests/{request_id}")
async def cancel_leave_request(
    request_id: str,
    cancel_data: LeaveRequestCancel,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """BA cancels their leave request"""
    check_ba_role(current_user)
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
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get available leave types for applying leave"""
    check_ba_role(current_user)
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