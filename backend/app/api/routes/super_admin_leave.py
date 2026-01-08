from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.core.database import get_database
from app.api.deps import get_current_super_admin
from app.schemas.leave import (
    LeaveTypeCreate, LeaveTypeUpdate, LeaveTypeResponse,
    LeavePolicyCreate, LeavePolicyUpdate, LeavePolicyResponse,
    LeaveSystemSettingsUpdate, LeaveSystemSettingsResponse,
    HolidayCreate, HolidayUpdate, HolidayResponse,
    ManualBalanceAdjustment, LeaveAnalytics
)
from bson import ObjectId
from datetime import datetime, date
import calendar

router = APIRouter()

# ============================================
# LEAVE SYSTEM SETTINGS (MASTER CONTROL)
# ============================================

@router.get("/leave/settings", response_model=LeaveSystemSettingsResponse)
async def get_leave_system_settings(
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get current leave system settings"""
    settings = await db.leave_system_settings.find_one()
    
    if not settings:
        # Create default settings if not exists
        default_settings = {
            "enable_leave_system": True,
            "enable_half_day_leave": True,
            "enable_carry_forward": True,
            "enable_document_attachment": True,
            "enable_leave_calendar": True,
            "enable_leave_notifications": True,
            "enable_backdated_requests": False,
            "enable_leave_encashment": False,
            "workflow_type": "tl_then_hr",
            "auto_approve_wfh": False,
            "require_tl_approval": True,
            "require_hr_approval": True,
            "max_advance_days": 90,
            "min_notice_days": 1,
            "require_document_after_days": 3,
            "max_consecutive_days": None,
            "block_weekend_sandwich": False,
            "leave_year_start_month": 1,
            "leave_year_start_day": 1,
            "carry_forward_deadline_days": 90,
            "max_carry_forward_percentage": 50,
            "deduct_weekends": False,
            "deduct_holidays": False,
            "notify_on_request": True,
            "notify_on_approval": True,
            "notify_on_rejection": True,
            "notify_approvers": True,
            "reminder_pending_leaves_days": 7,
            "allow_admin_override": True,
            "allow_manual_balance_adjustment": True,
            "allow_negative_balance": False,
            "updated_by": str(current_user["_id"]),
            "updated_at": datetime.now()
        }
        result = await db.leave_system_settings.insert_one(default_settings)
        default_settings["_id"] = result.inserted_id
        settings = default_settings
    
    return LeaveSystemSettingsResponse(
        id=str(settings["_id"]),
        **{k: v for k, v in settings.items() if k != "_id"}
    )

@router.put("/leave/settings", response_model=LeaveSystemSettingsResponse)
async def update_leave_system_settings(
    settings_update: LeaveSystemSettingsUpdate,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Update leave system settings - Super Admin controls everything"""
    
    settings = await db.leave_system_settings.find_one()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settings not found. Please initialize first."
        )
    
    # Build update dict (only include provided fields)
    update_data = settings_update.dict(exclude_unset=True)
    update_data["updated_by"] = str(current_user["_id"])
    update_data["updated_at"] = datetime.now()
    
    await db.leave_system_settings.update_one(
        {"_id": settings["_id"]},
        {"$set": update_data}
    )
    
    # Fetch updated settings
    updated_settings = await db.leave_system_settings.find_one({"_id": settings["_id"]})
    
    return LeaveSystemSettingsResponse(
        id=str(updated_settings["_id"]),
        **{k: v for k, v in updated_settings.items() if k != "_id"}
    )

# ============================================
# LEAVE TYPES MANAGEMENT
# ============================================

@router.post("/leave/types", response_model=LeaveTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_leave_type(
    leave_type: LeaveTypeCreate,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Create a new leave type"""
    
    # Check if code already exists
    existing = await db.leave_types.find_one({"code": leave_type.code.upper()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Leave type with code '{leave_type.code}' already exists"
        )
    
    leave_type_dict = {
        **leave_type.dict(),
        "code": leave_type.code.upper(),
        "is_active": True,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    result = await db.leave_types.insert_one(leave_type_dict)
    leave_type_dict["_id"] = result.inserted_id
    
    return LeaveTypeResponse(
        id=str(leave_type_dict["_id"]),
        **{k: v for k, v in leave_type_dict.items() if k not in ["_id", "created_by", "updated_at"]}
    )

@router.get("/leave/types", response_model=List[LeaveTypeResponse])
async def get_all_leave_types(
    include_inactive: bool = False,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get all leave types"""
    
    query = {} if include_inactive else {"is_active": True}
    leave_types = await db.leave_types.find(query).to_list(length=None)
    
    return [
        LeaveTypeResponse(
            id=str(lt["_id"]),
            **{k: v for k, v in lt.items() if k not in ["_id", "created_by", "updated_at"]}
        )
        for lt in leave_types
    ]

@router.get("/leave/types/{leave_type_id}", response_model=LeaveTypeResponse)
async def get_leave_type(
    leave_type_id: str,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get specific leave type"""
    
    try:
        leave_type = await db.leave_types.find_one({"_id": ObjectId(leave_type_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid leave type ID"
        )
    
    if not leave_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave type not found"
        )
    
    return LeaveTypeResponse(
        id=str(leave_type["_id"]),
        **{k: v for k, v in leave_type.items() if k not in ["_id", "created_by", "updated_at"]}
    )

@router.put("/leave/types/{leave_type_id}", response_model=LeaveTypeResponse)
async def update_leave_type(
    leave_type_id: str,
    leave_type_update: LeaveTypeUpdate,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Update leave type - Admin can change any configuration"""
    
    try:
        leave_type = await db.leave_types.find_one({"_id": ObjectId(leave_type_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid leave type ID"
        )
    
    if not leave_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave type not found"
        )
    
    update_data = leave_type_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.now()
    
    await db.leave_types.update_one(
        {"_id": ObjectId(leave_type_id)},
        {"$set": update_data}
    )
    
    updated_leave_type = await db.leave_types.find_one({"_id": ObjectId(leave_type_id)})
    
    return LeaveTypeResponse(
        id=str(updated_leave_type["_id"]),
        **{k: v for k, v in updated_leave_type.items() if k not in ["_id", "created_by", "updated_at"]}
    )

@router.delete("/leave/types/{leave_type_id}")
async def delete_leave_type(
    leave_type_id: str,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Delete leave type (soft delete - set inactive)"""
    
    try:
        leave_type = await db.leave_types.find_one({"_id": ObjectId(leave_type_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid leave type ID"
        )
    
    if not leave_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave type not found"
        )
    
    # Check if any active policies exist
    policies = await db.leave_policies.find_one({"leave_type_code": leave_type["code"]})
    if policies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete leave type with active policies. Delete policies first."
        )
    
    # Soft delete
    await db.leave_types.update_one(
        {"_id": ObjectId(leave_type_id)},
        {"$set": {"is_active": False, "updated_at": datetime.now()}}
    )
    
    return {"message": "Leave type deactivated successfully"}

# ============================================
# LEAVE POLICIES MANAGEMENT
# ============================================

@router.post("/leave/policies", response_model=LeavePolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_leave_policy(
    policy: LeavePolicyCreate,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Create leave policy - Admin defines allocations"""
    
    # Verify leave type exists
    leave_type = await db.leave_types.find_one({"code": policy.leave_type_code, "is_active": True})
    if not leave_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Leave type '{policy.leave_type_code}' not found or inactive"
        )
    
    # Check for duplicate policy
    existing = await db.leave_policies.find_one({
        "leave_type_code": policy.leave_type_code,
        "role": policy.role
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Policy already exists for {policy.leave_type_code} - {policy.role or 'All Roles'}"
        )
    
    policy_dict = {
        **policy.dict(),
        "created_by": str(current_user["_id"]),
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    result = await db.leave_policies.insert_one(policy_dict)
    policy_dict["_id"] = result.inserted_id
    
    return LeavePolicyResponse(
        id=str(policy_dict["_id"]),
        leave_type_name=leave_type["name"],
        **{k: v for k, v in policy_dict.items() if k not in ["_id", "created_by", "updated_at"]}
    )

@router.get("/leave/policies", response_model=List[LeavePolicyResponse])
async def get_all_leave_policies(
    leave_type_code: Optional[str] = None,
    role: Optional[str] = None,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get all leave policies with optional filters"""
    
    query = {}
    if leave_type_code:
        query["leave_type_code"] = leave_type_code
    if role:
        query["role"] = role
    
    policies = await db.leave_policies.find(query).to_list(length=None)
    
    result = []
    for policy in policies:
        leave_type = await db.leave_types.find_one({"code": policy["leave_type_code"]})
        result.append(
            LeavePolicyResponse(
                id=str(policy["_id"]),
                leave_type_name=leave_type["name"] if leave_type else "Unknown",
                **{k: v for k, v in policy.items() if k not in ["_id", "created_by", "updated_at"]}
            )
        )
    
    return result

@router.put("/leave/policies/{policy_id}", response_model=LeavePolicyResponse)
async def update_leave_policy(
    policy_id: str,
    policy_update: LeavePolicyUpdate,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Update leave policy - Admin can change allocations anytime"""
    
    try:
        policy = await db.leave_policies.find_one({"_id": ObjectId(policy_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid policy ID"
        )
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    update_data = policy_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.now()
    
    await db.leave_policies.update_one(
        {"_id": ObjectId(policy_id)},
        {"$set": update_data}
    )
    
    updated_policy = await db.leave_policies.find_one({"_id": ObjectId(policy_id)})
    leave_type = await db.leave_types.find_one({"code": updated_policy["leave_type_code"]})
    
    return LeavePolicyResponse(
        id=str(updated_policy["_id"]),
        leave_type_name=leave_type["name"] if leave_type else "Unknown",
        **{k: v for k, v in updated_policy.items() if k not in ["_id", "created_by", "updated_at"]}
    )

@router.delete("/leave/policies/{policy_id}")
async def delete_leave_policy(
    policy_id: str,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Delete leave policy"""
    
    try:
        policy = await db.leave_policies.find_one({"_id": ObjectId(policy_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid policy ID"
        )
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    await db.leave_policies.delete_one({"_id": ObjectId(policy_id)})
    
    return {"message": "Policy deleted successfully"}

# ============================================
# HOLIDAYS MANAGEMENT
# ============================================

@router.post("/leave/holidays", response_model=HolidayResponse, status_code=status.HTTP_201_CREATED)
async def create_holiday(
    holiday: HolidayCreate,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Add public holiday"""
    
    # Check if holiday already exists on this date
    existing = await db.leave_holidays.find_one({"date": holiday.date})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Holiday already exists on {holiday.date}"
        )
    
    holiday_dict = {
        **holiday.dict(),
        "created_by": str(current_user["_id"]),
        "created_at": datetime.now()
    }
    
    result = await db.leave_holidays.insert_one(holiday_dict)
    holiday_dict["_id"] = result.inserted_id
    
    return HolidayResponse(
        id=str(holiday_dict["_id"]),
        **{k: v for k, v in holiday_dict.items() if k not in ["_id", "created_by"]}
    )

@router.get("/leave/holidays", response_model=List[HolidayResponse])
async def get_holidays(
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get all holidays with optional year filter"""
    
    query = {}
    if year:
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)
        query["date"] = {"$gte": start_date, "$lte": end_date}
    
    holidays = await db.leave_holidays.find(query).sort("date", 1).to_list(length=None)
    
    return [
        HolidayResponse(
            id=str(h["_id"]),
            **{k: v for k, v in h.items() if k not in ["_id", "created_by"]}
        )
        for h in holidays
    ]

@router.put("/leave/holidays/{holiday_id}", response_model=HolidayResponse)
async def update_holiday(
    holiday_id: str,
    holiday_update: HolidayUpdate,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Update holiday"""
    
    try:
        holiday = await db.leave_holidays.find_one({"_id": ObjectId(holiday_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid holiday ID"
        )
    
    if not holiday:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Holiday not found"
        )
    
    update_data = holiday_update.dict(exclude_unset=True)
    
    await db.leave_holidays.update_one(
        {"_id": ObjectId(holiday_id)},
        {"$set": update_data}
    )
    
    updated_holiday = await db.leave_holidays.find_one({"_id": ObjectId(holiday_id)})
    
    return HolidayResponse(
        id=str(updated_holiday["_id"]),
        **{k: v for k, v in updated_holiday.items() if k not in ["_id", "created_by"]}
    )

@router.delete("/leave/holidays/{holiday_id}")
async def delete_holiday(
    holiday_id: str,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Delete holiday"""
    
    try:
        result = await db.leave_holidays.delete_one({"_id": ObjectId(holiday_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid holiday ID"
        )
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Holiday not found"
        )
    
    return {"message": "Holiday deleted successfully"}

# ============================================
# MANUAL BALANCE ADJUSTMENTS
# ============================================

@router.post("/leave/balances/adjust")
async def adjust_leave_balance(
    adjustment: ManualBalanceAdjustment,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Manually adjust employee leave balance - Admin privilege"""
    
    # Check if system allows manual adjustments
    settings = await db.leave_system_settings.find_one()
    if settings and not settings.get("allow_manual_balance_adjustment", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manual balance adjustments are disabled"
        )
    
    # Verify user exists
    try:
        user = await db.users.find_one({"_id": ObjectId(adjustment.user_id)})
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
    leave_type = await db.leave_types.find_one({"code": adjustment.leave_type_code})
    if not leave_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave type not found"
        )
    
    # Get or create balance
    current_year = datetime.now().year
    balance = await db.leave_balances.find_one({
        "user_id": adjustment.user_id,
        "year": current_year,
        "leave_type_code": adjustment.leave_type_code
    })
    
    if not balance:
        # Create new balance
        balance = {
            "user_id": adjustment.user_id,
            "year": current_year,
            "leave_type_code": adjustment.leave_type_code,
            "allocated": 0.0,
            "used": 0.0,
            "pending": 0.0,
            "available": 0.0,
            "carried_forward": 0.0,
            "manually_adjusted": 0.0,
            "updated_at": datetime.now()
        }
        result = await db.leave_balances.insert_one(balance)
        balance["_id"] = result.inserted_id
    
    # Apply adjustment
    new_adjustment = balance.get("manually_adjusted", 0.0) + adjustment.adjustment
    new_available = balance.get("available", 0.0) + adjustment.adjustment
    
    await db.leave_balances.update_one(
        {"_id": balance["_id"]},
        {
            "$set": {
                "manually_adjusted": new_adjustment,
                "available": new_available,
                "updated_at": datetime.now()
            }
        }
    )
    
    # Log the adjustment
    await db.leave_balance_adjustments.insert_one({
        "user_id": adjustment.user_id,
        "leave_type_code": adjustment.leave_type_code,
        "adjustment": adjustment.adjustment,
        "reason": adjustment.reason,
        "adjusted_by": str(current_user["_id"]),
        "adjusted_at": datetime.now()
    })
    
    return {
        "message": "Balance adjusted successfully",
        "user_id": adjustment.user_id,
        "leave_type": adjustment.leave_type_code,
        "adjustment": adjustment.adjustment,
        "new_available": new_available
    }

# ============================================
# ANALYTICS & REPORTS
# ============================================

@router.get("/leave/analytics", response_model=LeaveAnalytics)
async def get_leave_analytics(
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get comprehensive leave analytics"""
    
    if not year:
        year = datetime.now().year
    
    # Get all leave requests for the year
    start_date = date(year, 1, 1)
    end_date = date(year, 12, 31)
    
    requests = await db.leave_requests.find({
        "start_date": {"$gte": start_date, "$lte": end_date}
    }).to_list(length=None)
    
    total_requests = len(requests)
    pending_requests = sum(1 for r in requests if r["final_status"] == "pending")
    approved_requests = sum(1 for r in requests if r["final_status"] == "approved")
    rejected_requests = sum(1 for r in requests if r["final_status"] == "rejected")
    
    # Calculate total days used
    total_days_used = sum(r.get("total_days", 0) for r in requests if r["final_status"] == "approved")
    
    # Average days per request
    avg_days = total_days_used / approved_requests if approved_requests > 0 else 0
    
    # Leave by type
    leave_by_type = {}
    for request in requests:
        if request["final_status"] == "approved":
            leave_type = request["leave_type_code"]
            leave_by_type[leave_type] = leave_by_type.get(leave_type, 0) + 1
    
    # Most used leave type
    most_used = max(leave_by_type.items(), key=lambda x: x[1])[0] if leave_by_type else "None"
    
    # Leave by month
    leave_by_month = {}
    for request in requests:
        if request["final_status"] == "approved":
            month = request["start_date"].strftime("%B")
            leave_by_month[month] = leave_by_month.get(month, 0) + 1
    
    # Leave by status
    leave_by_status = {
        "pending": pending_requests,
        "approved": approved_requests,
        "rejected": rejected_requests
    }
    
    return LeaveAnalytics(
        total_requests=total_requests,
        pending_requests=pending_requests,
        approved_requests=approved_requests,
        rejected_requests=rejected_requests,
        most_used_leave_type=most_used,
        total_days_used=total_days_used,
        average_days_per_request=round(avg_days, 2),
        leave_by_type=leave_by_type,
        leave_by_month=leave_by_month,
        leave_by_status=leave_by_status
    )