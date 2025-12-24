from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_ba, get_current_user, get_database
from app.schemas.payment import PaymentRecord, PaymentResponse
from bson import ObjectId
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/ba/payments", tags=["Business Analyst - Payments"])

# ============= HELPER FUNCTIONS =============

async def get_user_details(user_id: str, db) -> dict:
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return user
    except:
        return None

async def get_project_details(project_id: str, db) -> dict:
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
        return project
    except:
        return None

async def get_client_details(client_id: str, db) -> dict:
    try:
        client = await db.clients.find_one({"_id": ObjectId(client_id)})
        return client
    except:
        return None

# ============= PAYMENT RECORDING =============

@router.post("/record", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def record_payment(
    payment_data: PaymentRecord,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Record milestone payment (BA only)"""
    
    # Get project
    project = await get_project_details(payment_data.project_id, db)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify BA owns this project
    ba_id = project.get("managed_by_ba") or project["created_by"]
    if ba_id != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to record payments for this project"
        )
    
    # Find milestone
    milestone_index = None
    milestone = None
    for idx, m in enumerate(project.get("milestones", [])):
        if m["milestone_id"] == payment_data.milestone_id:
            milestone_index = idx
            milestone = m
            break
    
    if milestone_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found"
        )
    
    # Validate milestone is reached
    if milestone["status"] != "reached":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot record payment for milestone in '{milestone['status']}' status. Milestone must be 'reached' first."
        )
    
    # Check if payment already recorded
    if milestone.get("payment_received_at"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment has already been recorded for this milestone"
        )
    
    # Validate payment amount
    if payment_data.amount != milestone["amount"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment amount ({payment_data.amount}) does not match milestone amount ({milestone['amount']})"
        )
    
    # Update milestone
    await db.projects.update_one(
        {
            "_id": ObjectId(payment_data.project_id),
            "milestones.milestone_id": payment_data.milestone_id
        },
        {
            "$set": {
                f"milestones.{milestone_index}.status": "payment_received",
                f"milestones.{milestone_index}.payment_received_at": payment_data.payment_date,
                "status": "in_development",  # Back to development
                "updated_at": datetime.now()
            }
        }
    )
    
    # Create payment record
    client = await get_client_details(project["client_id"], db)
    
    payment_record = {
        "project_id": payment_data.project_id,
        "project_name": project["project_name"],
        "client_id": project["client_id"],
        "client_name": client["company_name"] if client else "Unknown",
        "milestone_id": payment_data.milestone_id,
        "milestone_name": milestone["name"],
        "amount": payment_data.amount,
        "payment_method": payment_data.payment_method,
        "transaction_id": payment_data.transaction_id,
        "payment_date": payment_data.payment_date,
        "notes": payment_data.notes,
        "recorded_by": str(current_user["_id"]),
        "recorded_at": datetime.now()
    }
    
    result = await db.payments.insert_one(payment_record)
    
    # Update client statistics
    await db.clients.update_one(
        {"_id": ObjectId(project["client_id"])},
        {"$inc": {"total_revenue": payment_data.amount}}
    )
    
    # Notify Team Lead
    notification = {
        "from_user": str(current_user["_id"]),
        "to_user": project["assigned_to_team_lead"],
        "content": f"Payment received for {milestone['name']} ({milestone['percentage']}%)\nProject: {project['project_name']}\nAmount: ${payment_data.amount:,.2f}\n\nYou can continue development.",
        "project_id": payment_data.project_id,
        "is_read": False,
        "created_at": datetime.now()
    }
    await db.messages.insert_one(notification)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "payment_recorded",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "project_id": payment_data.project_id,
            "milestone_id": payment_data.milestone_id,
            "amount": payment_data.amount,
            "payment_method": payment_data.payment_method,
            "transaction_id": payment_data.transaction_id
        },
        "timestamp": datetime.now()
    })
    
    return PaymentResponse(
        id=str(result.inserted_id),
        project_id=payment_record["project_id"],
        project_name=payment_record["project_name"],
        client_id=payment_record["client_id"],
        client_name=payment_record["client_name"],
        milestone_id=payment_record["milestone_id"],
        milestone_name=payment_record["milestone_name"],
        amount=payment_record["amount"],
        payment_method=payment_record["payment_method"],
        transaction_id=payment_record["transaction_id"],
        payment_date=payment_record["payment_date"],
        notes=payment_record["notes"],
        recorded_by=payment_record["recorded_by"],
        recorded_by_name=current_user["full_name"],
        recorded_at=payment_record["recorded_at"]
    )

@router.get("/", response_model=List[PaymentResponse])
async def get_payments(
    project_id: Optional[str] = None,
    client_id: Optional[str] = None,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get payment history (BA only - their own payments)"""
    
    query = {"recorded_by": str(current_user["_id"])}
    
    if project_id:
        query["project_id"] = project_id
    
    if client_id:
        query["client_id"] = client_id
    
    payments = await db.payments.find(query).sort("payment_date", -1).to_list(length=None)
    
    result = []
    for payment in payments:
        result.append(PaymentResponse(
            id=str(payment["_id"]),
            project_id=payment["project_id"],
            project_name=payment["project_name"],
            client_id=payment["client_id"],
            client_name=payment["client_name"],
            milestone_id=payment["milestone_id"],
            milestone_name=payment["milestone_name"],
            amount=payment["amount"],
            payment_method=payment["payment_method"],
            transaction_id=payment.get("transaction_id"),
            payment_date=payment["payment_date"],
            notes=payment.get("notes"),
            recorded_by=payment["recorded_by"],
            recorded_by_name=current_user["full_name"],
            recorded_at=payment["recorded_at"]
        ))
    
    return result

@router.get("/pending")
async def get_pending_payments(
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get milestones reached but payment not yet received"""
    
    projects = await db.projects.find({
        "managed_by_ba": str(current_user["_id"]),
        "status": {"$nin": ["completed", "cancelled"]}
    }).to_list(length=None)
    
    pending_payments = []
    
    for project in projects:
        client = await get_client_details(project["client_id"], db)
        
        for milestone in project.get("milestones", []):
            if milestone["status"] == "reached" and not milestone.get("payment_received_at"):
                pending_payments.append({
                    "project_id": str(project["_id"]),
                    "project_name": project["project_name"],
                    "client_name": client["company_name"] if client else "Unknown",
                    "milestone_id": milestone["milestone_id"],
                    "milestone_name": milestone["name"],
                    "percentage": milestone["percentage"],
                    "amount": milestone["amount"],
                    "reached_at": milestone.get("reached_at"),
                    "days_pending": (datetime.now() - milestone.get("reached_at")).days if milestone.get("reached_at") else 0
                })
    
    return sorted(pending_payments, key=lambda x: x["days_pending"], reverse=True)

@router.get("/stats")
async def get_payment_statistics(
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get payment statistics for BA"""
    
    # Total payments recorded
    payments = await db.payments.find({
        "recorded_by": str(current_user["_id"])
    }).to_list(length=None)
    
    total_collected = sum(p["amount"] for p in payments)
    total_transactions = len(payments)
    
    # Pending payments
    projects = await db.projects.find({
        "managed_by_ba": str(current_user["_id"])
    }).to_list(length=None)
    
    total_pending = 0
    for project in projects:
        for milestone in project.get("milestones", []):
            if milestone["status"] == "reached" and not milestone.get("payment_received_at"):
                total_pending += milestone["amount"]
    
    # This month statistics
    now = datetime.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    this_month_payments = [p for p in payments if p["payment_date"] >= month_start]
    this_month_total = sum(p["amount"] for p in this_month_payments)
    
    return {
        "total_collected": total_collected,
        "total_transactions": total_transactions,
        "pending_payments": total_pending,
        "this_month_collected": this_month_total,
        "this_month_transactions": len(this_month_payments),
        "average_payment": total_collected / total_transactions if total_transactions > 0 else 0
    }