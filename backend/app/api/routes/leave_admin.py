from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.core.database import get_database
from app.api.deps import get_current_super_admin
from app.schemas.leave_type import (
    LeaveTypeCreate, LeaveTypeUpdate, LeaveTypeResponse, 
    LeaveTypeList, PREDEFINED_LEAVE_TYPES
)
from app.schemas.public_holiday import (
    PublicHolidayCreate, PublicHolidayUpdate, PublicHolidayBulkImport,
    PublicHolidayResponse, PublicHolidayList
)
from app.schemas.leave_policy import (
    LeavePolicyCreate, LeavePolicyUpdate, LeavePolicyResponse
)
from app.services.leave_service import LeaveService
from bson import ObjectId
from datetime import datetime

router = APIRouter()

# ==================== LEAVE TYPE MANAGEMENT ====================

@router.get("/leave-types/predefined")
async def get_predefined_leave_types(
    current_user: dict = Depends(get_current_super_admin)
):
    """Get list of predefined leave types for dropdown"""
    return {
        "leave_types": PREDEFINED_LEAVE_TYPES,
        "total": len(PREDEFINED_LEAVE_TYPES)
    }

@router.post("/leave-types", response_model=LeaveTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_leave_type(
    leave_type_data: LeaveTypeCreate,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Admin creates a new leave type"""
    leave_service = LeaveService(db)
    
    # Check if leave type with this code already exists
    existing = await leave_service.get_leave_type_by_code(leave_type_data.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Leave type with code '{leave_type_data.code}' already exists"
        )
    
    leave_type = await leave_service.create_leave_type(
        leave_type_data.dict(),
        str(current_user["_id"])
    )
    
    return LeaveTypeResponse(
        id=str(leave_type["_id"]),
        name=leave_type["name"],
        code=leave_type["code"],
        description=leave_type.get("description"),
        max_days_per_year=leave_type["max_days_per_year"],
        requires_document=leave_type["requires_document"],
        can_carry_forward=leave_type["can_carry_forward"],
        carry_forward_limit=leave_type["carry_forward_limit"],
        allow_half_day=leave_type["allow_half_day"],
        color=leave_type["color"],
        is_paid=leave_type["is_paid"],
        is_active=leave_type["is_active"],
        created_by=leave_type.get("created_by"),
        created_at=leave_type["created_at"],
        updated_at=leave_type.get("updated_at")
    )

@router.get("/leave-types", response_model=LeaveTypeList)
async def get_leave_types(
    active_only: bool = True,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get all leave types"""
    leave_service = LeaveService(db)
    leave_types = await leave_service.get_leave_types(active_only)
    
    return LeaveTypeList(
        total=len(leave_types),
        leave_types=[
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
    )

@router.put("/leave-types/{leave_type_id}", response_model=LeaveTypeResponse)
async def update_leave_type(
    leave_type_id: str,
    update_data: LeaveTypeUpdate,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Update leave type settings"""
    leave_service = LeaveService(db)
    
    # Verify leave type exists
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
    
    # Update only provided fields
    update_dict = update_data.dict(exclude_unset=True)
    success = await leave_service.update_leave_type(leave_type_id, update_dict)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update leave type"
        )
    
    # Get updated leave type
    updated = await db.leave_types.find_one({"_id": ObjectId(leave_type_id)})
    
    return LeaveTypeResponse(
        id=str(updated["_id"]),
        name=updated["name"],
        code=updated["code"],
        description=updated.get("description"),
        max_days_per_year=updated["max_days_per_year"],
        requires_document=updated["requires_document"],
        can_carry_forward=updated["can_carry_forward"],
        carry_forward_limit=updated["carry_forward_limit"],
        allow_half_day=updated["allow_half_day"],
        color=updated["color"],
        is_paid=updated["is_paid"],
        is_active=updated["is_active"],
        created_by=updated.get("created_by"),
        created_at=updated["created_at"],
        updated_at=updated.get("updated_at")
    )

@router.delete("/leave-types/{leave_type_id}")
async def delete_leave_type(
    leave_type_id: str,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Soft delete leave type"""
    leave_service = LeaveService(db)
    
    success = await leave_service.delete_leave_type(leave_type_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave type not found"
        )
    
    return {"message": "Leave type deactivated successfully"}

# ==================== PUBLIC HOLIDAY MANAGEMENT ====================

@router.post("/holidays", response_model=PublicHolidayResponse, status_code=status.HTTP_201_CREATED)
async def create_holiday(
    holiday_data: PublicHolidayCreate,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Admin manually adds a public holiday"""
    leave_service = LeaveService(db)
    
    holiday = await leave_service.create_holiday(
        holiday_data.dict(),
        str(current_user["_id"])
    )
    
    return PublicHolidayResponse(
        id=str(holiday["_id"]),
        name=holiday["name"],
        date=holiday["date"],
        country=holiday.get("country"),
        is_optional=holiday["is_optional"],
        description=holiday.get("description"),
        is_active=holiday["is_active"],
        imported=holiday["imported"],
        created_by=holiday.get("created_by"),
        created_at=holiday["created_at"],
        updated_at=holiday.get("updated_at")
    )

@router.post("/holidays/import")
async def import_holidays(
    import_data: PublicHolidayBulkImport,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Import public holidays from country calendar"""
    leave_service = LeaveService(db)
    
    imported_count = await leave_service.import_holidays_from_country(
        country=import_data.country,
        year=import_data.year,
        admin_id=str(current_user["_id"])
    )
    
    return {
        "message": f"Successfully imported {imported_count} holidays",
        "country": import_data.country,
        "year": import_data.year,
        "imported_count": imported_count
    }

@router.get("/holidays", response_model=PublicHolidayList)
async def get_holidays(
    year: int = Query(..., description="Year to fetch holidays"),
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get all holidays for a specific year"""
    leave_service = LeaveService(db)
    holidays = await leave_service.get_holidays_by_year(year)
    
    return PublicHolidayList(
        total=len(holidays),
        year=year,
        holidays=[
            PublicHolidayResponse(
                id=str(h["_id"]),
                name=h["name"],
                date=h["date"],
                country=h.get("country"),
                is_optional=h["is_optional"],
                description=h.get("description"),
                is_active=h["is_active"],
                imported=h["imported"],
                created_by=h.get("created_by"),
                created_at=h["created_at"],
                updated_at=h.get("updated_at")
            )
            for h in holidays
        ]
    )

@router.put("/holidays/{holiday_id}", response_model=PublicHolidayResponse)
async def update_holiday(
    holiday_id: str,
    update_data: PublicHolidayUpdate,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Update holiday details"""
    leave_service = LeaveService(db)
    
    # Verify holiday exists
    try:
        holiday = await db.public_holidays.find_one({"_id": ObjectId(holiday_id)})
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
    
    update_dict = update_data.dict(exclude_unset=True)
    success = await leave_service.update_holiday(holiday_id, update_dict)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update holiday"
        )
    
    # Get updated holiday
    updated = await db.public_holidays.find_one({"_id": ObjectId(holiday_id)})
    
    return PublicHolidayResponse(
        id=str(updated["_id"]),
        name=updated["name"],
        date=updated["date"],
        country=updated.get("country"),
        is_optional=updated["is_optional"],
        description=updated.get("description"),
        is_active=updated["is_active"],
        imported=updated["imported"],
        created_by=updated.get("created_by"),
        created_at=updated["created_at"],
        updated_at=updated.get("updated_at")
    )

@router.delete("/holidays/{holiday_id}")
async def delete_holiday(
    holiday_id: str,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Delete a holiday"""
    leave_service = LeaveService(db)
    
    success = await leave_service.delete_holiday(holiday_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Holiday not found"
        )
    
    return {"message": "Holiday deleted successfully"}

# ==================== LEAVE POLICY MANAGEMENT ====================

@router.post("/policies", response_model=LeavePolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_policy(
    policy_data: LeavePolicyCreate,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Create or update leave policy for a year"""
    leave_service = LeaveService(db)
    
    policy = await leave_service.create_or_update_policy(
        year=policy_data.year,
        policy_data=policy_data.dict(),
        admin_id=str(current_user["_id"])
    )
    
    return LeavePolicyResponse(
        id=str(policy["_id"]),
        year=policy["year"],
        probation_enabled=policy["probation_enabled"],
        probation_period_days=policy["probation_period_days"],
        carry_forward_enabled=policy["carry_forward_enabled"],
        carry_forward_expiry_month=policy["carry_forward_expiry_month"],
        carry_forward_expiry_day=policy["carry_forward_expiry_day"],
        advance_notice_days=policy["advance_notice_days"],
        max_consecutive_days=policy["max_consecutive_days"],
        weekend_days=policy["weekend_days"],
        exclude_weekends=policy["exclude_weekends"],
        exclude_public_holidays=policy["exclude_public_holidays"],
        role_allocations=policy["role_allocations"],
        is_active=policy["is_active"],
        updated_by=policy.get("updated_by"),
        created_at=policy["created_at"],
        updated_at=policy.get("updated_at")
    )

@router.get("/policies/{year}", response_model=LeavePolicyResponse)
async def get_policy(
    year: int,
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get leave policy for a specific year"""
    leave_service = LeaveService(db)
    
    policy = await leave_service.get_policy_by_year(year)
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No policy found for year {year}"
        )
    
    return LeavePolicyResponse(
        id=str(policy["_id"]),
        year=policy["year"],
        probation_enabled=policy["probation_enabled"],
        probation_period_days=policy["probation_period_days"],
        carry_forward_enabled=policy["carry_forward_enabled"],
        carry_forward_expiry_month=policy["carry_forward_expiry_month"],
        carry_forward_expiry_day=policy["carry_forward_expiry_day"],
        advance_notice_days=policy["advance_notice_days"],
        max_consecutive_days=policy["max_consecutive_days"],
        weekend_days=policy["weekend_days"],
        exclude_weekends=policy["exclude_weekends"],
        exclude_public_holidays=policy["exclude_public_holidays"],
        role_allocations=policy["role_allocations"],
        is_active=policy["is_active"],
        updated_by=policy.get("updated_by"),
        created_at=policy["created_at"],
        updated_at=policy.get("updated_at")
    )

@router.get("/policies/current/active", response_model=LeavePolicyResponse)
async def get_current_policy(
    current_user: dict = Depends(get_current_super_admin),
    db = Depends(get_database)
):
    """Get current year's leave policy"""
    leave_service = LeaveService(db)
    
    policy = await leave_service.get_current_policy()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No policy found for current year"
        )
    
    return LeavePolicyResponse(
        id=str(policy["_id"]),
        year=policy["year"],
        probation_enabled=policy["probation_enabled"],
        probation_period_days=policy["probation_period_days"],
        carry_forward_enabled=policy["carry_forward_enabled"],
        carry_forward_expiry_month=policy["carry_forward_expiry_month"],
        carry_forward_expiry_day=policy["carry_forward_expiry_day"],
        advance_notice_days=policy["advance_notice_days"],
        max_consecutive_days=policy["max_consecutive_days"],
        weekend_days=policy["weekend_days"],
        exclude_weekends=policy["exclude_weekends"],
        exclude_public_holidays=policy["exclude_public_holidays"],
        role_allocations=policy["role_allocations"],
        is_active=policy["is_active"],
        updated_by=policy.get("updated_by"),
        created_at=policy["created_at"],
        updated_at=policy.get("updated_at")
    )