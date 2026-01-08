from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.core.database import get_database
from app.api.deps import get_current_hr
from app.schemas.leave import (
    LeaveRequestResponse, LeaveApprovalAction, AdminLeaveOverride,
    LeaveBalanceResponse, LeaveAnalytics
)
from bson import ObjectId
from datetime import datetime, date, timedelta
import calendar

router = APIRouter()

# ============================================
# PENDING APPROVALS
# ============================================

@router.get("/leave/pending-approvals", response_model=List[LeaveRequestResponse])
async def get_pending_leave_approvals(
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Get all leave requests pending HR approval"""
    
    hr_id = str(current_user["_id"])
    
    # Find requests where HR is in approval chain and status is pending
    requests = await db.leave_requests.find({
        "final_status": "pending",
        "approval_chain": {
            "$elemMatch": {
                "role": "hr",
                "user_id": hr_id,
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
# ALL LEAVE REQUESTS
# ============================================

@router.get("/leave/all-requests", response_model=List[LeaveRequestResponse])
async def get_all_leave_requests(
    status: Optional[str] = None,
    leave_type: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Get all leave requests with filters"""
    
    query = {}
    
    if status:
        query["final_status"] = status
    
    if leave_type:
        query["leave_type_code"] = leave_type
    
    if user_id:
        query["user_id"] = user_id
    
    if start_date and end_date:
        query["start_date"] = {"$gte": start_date, "$lte": end_date}
    
    requests = await db.leave_requests.find(query).sort("requested_at", -1).to_list(length=None)
    
    result = []
    for req in requests:
        user = await db.users.find_one({"_id": ObjectId(req["user_id"])})
        leave_type_obj = await db.leave_types.find_one({"code": req["leave_type_code"]})
        
        if user and leave_type_obj:
            result.append(
                LeaveRequestResponse(
                    id=str(req["_id"]),
                    user_id=req["user_id"],
                    user_name=user["full_name"],
                    user_email=user["email"],
                    leave_type_code=leave_type_obj["code"],
                    leave_type_name=leave_type_obj["name"],
                    leave_type_color=leave_type_obj["color"],
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
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Approve or reject leave request"""
    
    hr_id = str(current_user["_id"])
    
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
    
    # Find HR in approval chain
    approval_chain = leave_request["approval_chain"]
    current_level = leave_request["current_approval_level"]
    
    if current_level >= len(approval_chain):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending approvals"
        )
    
    current_approver = approval_chain[current_level]
    
    if current_approver["role"] != "hr" or current_approver["user_id"] != hr_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your turn to approve or you are not the assigned approver"
        )
    
    # Update approval chain
    approval_chain[current_level]["status"] = action.action + "d"  # "approved" or "rejected"
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
        # Check if there are more approvers
        if current_level + 1 < len(approval_chain):
            # Move to next level
            final_status = "pending"
            current_level += 1
        else:
            # All approvals done
            final_status = "approved"
            
            # Move from pending to used in balance
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
            "from_user": hr_id,
            "to_user": leave_request["user_id"],
            "content": f"Your {leave_type['name'] if leave_type else 'leave'} request has been {final_status}",
            "leave_request_id": request_id,
            "is_read": False,
            "created_at": datetime.now()
        }
        await db.messages.insert_one(notification)
    
    # If approved and there's a next approver, notify them
    if final_status == "pending" and current_level < len(approval_chain):
        next_approver = approval_chain[current_level]
        leave_type = await db.leave_types.find_one({"code": leave_request["leave_type_code"]})
        user = await db.users.find_one({"_id": ObjectId(leave_request["user_id"])})
        
        notification = {
            "from_user": hr_id,
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
# ADMIN OVERRIDE
# ============================================

@router.post("/leave/{request_id}/override")
async def admin_override_leave(
    request_id: str,
    override: AdminLeaveOverride,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """HR Admin can force approve/reject any leave request"""
    
    # Check if admin override is enabled
    settings = await db.leave_system_settings.find_one()
    if settings and not settings.get("allow_admin_override", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin override is disabled"
        )
    
    hr_id = str(current_user["_id"])
    
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
    
    if leave_request["final_status"] in ["approved", "rejected", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot override {leave_request['final_status']} request"
        )
    
    final_status = override.action + "d"  # "approved" or "rejected"
    
    # Update leave request with override
    await db.leave_requests.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "final_status": final_status,
                "admin_override": True,
                "override_by": hr_id,
                "override_reason": override.reason
            }
        }
    )
    
    # Update balance
    user_id = leave_request["user_id"]
    current_year = datetime.now().year
    balance = await db.leave_balances.find_one({
        "user_id": user_id,
        "year": current_year,
        "leave_type_code": leave_request["leave_type_code"]
    })
    
    if balance:
        total_days = leave_request["total_days"]
        
        if override.action == "approve":
            # Move from pending to used
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
        elif override.action == "reject":
            # Restore to available
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
    
    # Send notification
    leave_type = await db.leave_types.find_one({"code": leave_request["leave_type_code"]})
    notification = {
        "from_user": hr_id,
        "to_user": leave_request["user_id"],
        "content": f"Your {leave_type['name'] if leave_type else 'leave'} request has been {final_status} by HR Admin",
        "leave_request_id": request_id,
        "is_read": False,
        "created_at": datetime.now()
    }
    await db.messages.insert_one(notification)
    
    return {
        "message": f"Leave request {override.action}d by admin override",
        "final_status": final_status
    }

# ============================================
# EMPLOYEE LEAVE BALANCE
# ============================================

@router.get("/leave/employee/{employee_id}/balance", response_model=List[LeaveBalanceResponse])
async def get_employee_leave_balance(
    employee_id: str,
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Get specific employee's leave balance"""
    
    if not year:
        year = datetime.now().year
    
    try:
        employee = await db.users.find_one({"_id": ObjectId(employee_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid employee ID"
        )
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    balances = await db.leave_balances.find({
        "user_id": employee_id,
        "year": year
    }).to_list(length=None)
    
    result = []
    for balance in balances:
        leave_type = await db.leave_types.find_one({"code": balance["leave_type_code"]})
        if leave_type:
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
# COMPANY CALENDAR
# ============================================

@router.get("/leave/company-calendar")
async def get_company_leave_calendar(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Get company-wide leave calendar"""
    
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
    
    # Get all approved leaves for the month
    leaves = await db.leave_requests.find({
        "final_status": "approved",
        "$or": [
            {"start_date": {"$lte": end_date}, "end_date": {"$gte": start_date}}
        ]
    }).to_list(length=None)
    
    result = []
    for leave in leaves:
        user = await db.users.find_one({"_id": ObjectId(leave["user_id"])})
        leave_type = await db.leave_types.find_one({"code": leave["leave_type_code"]})
        
        if user and leave_type:
            result.append({
                "id": str(leave["_id"]),
                "user_id": leave["user_id"],
                "user_name": user["full_name"],
                "user_email": user["email"],
                "department": user.get("department", "N/A"),
                "leave_type": leave_type["name"],
                "color": leave_type["color"],
                "start_date": leave["start_date"],
                "end_date": leave["end_date"],
                "total_days": leave["total_days"],
                "is_half_day": leave["is_half_day"]
            })
    
    return {"leaves": result, "month": month, "year": year}

# ============================================
# LEAVE ANALYTICS
# ============================================

@router.get("/leave/analytics", response_model=LeaveAnalytics)
async def get_leave_analytics(
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Get leave analytics for HR dashboard"""
    
    if not year:
        year = datetime.now().year
    
    start_date = date(year, 1, 1)
    end_date = date(year, 12, 31)
    
    requests = await db.leave_requests.find({
        "start_date": {"$gte": start_date, "$lte": end_date}
    }).to_list(length=None)
    
    total_requests = len(requests)
    pending_requests = sum(1 for r in requests if r["final_status"] == "pending")
    approved_requests = sum(1 for r in requests if r["final_status"] == "approved")
    rejected_requests = sum(1 for r in requests if r["final_status"] == "rejected")
    
    total_days_used = sum(r.get("total_days", 0) for r in requests if r["final_status"] == "approved")
    avg_days = total_days_used / approved_requests if approved_requests > 0 else 0
    
    # Leave by type
    leave_by_type = {}
    for request in requests:
        if request["final_status"] == "approved":
            leave_type = request["leave_type_code"]
            leave_by_type[leave_type] = leave_by_type.get(leave_type, 0) + 1
    
    most_used = max(leave_by_type.items(), key=lambda x: x[1])[0] if leave_by_type else "None"
    
    # Leave by month
    leave_by_month = {}
    for request in requests:
        if request["final_status"] == "approved":
            month = request["start_date"].strftime("%B")
            leave_by_month[month] = leave_by_month.get(month, 0) + 1
    
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

# ============================================
# ALLOCATE LEAVES TO EMPLOYEES
# ============================================

@router.post("/leave/allocate-balances")
async def allocate_leave_balances(
    year: int = Query(..., description="Year for allocation"),
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """Allocate leave balances to all employees based on policies"""
    
    # Get all active employees
    employees = await db.users.find({"role": "employee", "is_active": True}).to_list(length=None)
    
    # Get all policies
    policies = await db.leave_policies.find().to_list(length=None)
    
    allocated_count = 0
    
    for employee in employees:
        employee_id = str(employee["_id"])
        employee_role = employee.get("role", "employee")
        
        for policy in policies:
            # Check if policy applies to this employee
            if policy["applies_to_all"] or policy.get("role") == employee_role:
                # Check if balance already exists
                existing = await db.leave_balances.find_one({
                    "user_id": employee_id,
                    "year": year,
                    "leave_type_code": policy["leave_type_code"]
                })
                
                if not existing:
                    # Create new balance
                    allocated = policy["allocated_days"]
                    
                    # Pro-rate if needed based on joining date
                    if policy.get("pro_rated", True) and employee.get("created_at"):
                        joining_date = employee["created_at"]
                        if joining_date.year == year:
                            # Calculate pro-rated amount
                            months_remaining = 12 - joining_date.month + 1
                            allocated = (policy["allocated_days"] / 12) * months_remaining
                    
                    balance = {
                        "user_id": employee_id,
                        "year": year,
                        "leave_type_code": policy["leave_type_code"],
                        "allocated": allocated,
                        "used": 0.0,
                        "pending": 0.0,
                        "available": allocated,
                        "carried_forward": 0.0,
                        "manually_adjusted": 0.0,
                        "updated_at": datetime.now()
                    }
                    
                    await db.leave_balances.insert_one(balance)
                    allocated_count += 1
    
    return {
        "message": f"Leave balances allocated for {year}",
        "employees_processed": len(employees),
        "balances_created": allocated_count
    }