from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_ba, get_current_user, get_database
from app.schemas.client import (
    ClientCreate, ClientUpdate, ClientResponse, ClientDetailResponse,
    ClientContactResponse, CommunicationLogCreate, CommunicationLogResponse
)
from bson import ObjectId
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/ba/clients", tags=["Business Analyst - Clients"])

# ============= HELPER FUNCTIONS =============

async def get_user_details(user_id: str, db) -> dict:
    """Get user details"""
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return user
    except:
        return None

async def calculate_client_statistics(client_id: str, db) -> dict:
    """Calculate client statistics"""
    # Count projects
    total_projects = await db.projects.count_documents({"client_id": client_id})
    active_projects = await db.projects.count_documents({
        "client_id": client_id,
        "status": {"$nin": ["completed", "cancelled"]}
    })
    
    # Calculate revenue
    projects = await db.projects.find({"client_id": client_id}).to_list(length=None)
    
    total_revenue = 0.0
    pending_payments = 0.0
    
    for project in projects:
        # Sum up all milestone payments received
        for milestone in project.get("milestones", []):
            if milestone.get("payment_received_at"):
                total_revenue += milestone.get("amount", 0.0)
            elif milestone.get("status") == "reached":
                # Milestone reached but payment not received
                pending_payments += milestone.get("amount", 0.0)
    
    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "total_revenue": total_revenue,
        "pending_payments": pending_payments
    }

async def update_client_last_contact(client_id: str, db):
    """Update last contact date for client"""
    await db.clients.update_one(
        {"_id": ObjectId(client_id)},
        {"$set": {"last_contact_date": datetime.now()}}
    )

# ============= CLIENT CRUD ENDPOINTS =============

@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_data: ClientCreate,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Create a new client (BA only)"""
    
    # Check if client with same company name already exists
    existing_client = await db.clients.find_one({
        "company_name": client_data.company_name,
        "managed_by": str(current_user["_id"])
    })
    
    if existing_client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Client with this company name already exists in your portfolio"
        )
    
    # Validate status
    if client_data.status and client_data.status not in ["active", "inactive", "on_hold"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be: active, inactive, or on_hold"
        )
    
    # Create client
    new_client = {
        "company_name": client_data.company_name,
        "industry": client_data.industry,
        "address": client_data.address,
        "city": client_data.city,
        "state": client_data.state,
        "country": client_data.country,
        "website": client_data.website,
        "contacts": [contact.dict() for contact in client_data.contacts],
        "managed_by": str(current_user["_id"]),
        "status": "active",
        "contract_start_date": client_data.contract_start_date,
        "contract_end_date": client_data.contract_end_date,
        "payment_terms": client_data.payment_terms,
        "created_at": datetime.now(),
        "created_by": str(current_user["_id"]),
        "updated_at": None,
        "last_contact_date": None,
        "notes": client_data.notes,
        "total_projects": 0,
        "active_projects": 0,
        "total_revenue": 0.0,
        "pending_payments": 0.0
    }
    
    result = await db.clients.insert_one(new_client)
    client_id = str(result.inserted_id)
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "client_created",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "client_id": client_id,
            "company_name": client_data.company_name
        },
        "timestamp": datetime.now()
    })
    
    return ClientResponse(
        id=client_id,
        company_name=new_client["company_name"],
        industry=new_client["industry"],
        address=new_client["address"],
        city=new_client["city"],
        state=new_client["state"],
        country=new_client["country"],
        website=new_client["website"],
        contacts=[ClientContactResponse(**contact) for contact in new_client["contacts"]],
        managed_by=new_client["managed_by"],
        manager_name=current_user["full_name"],
        status=new_client["status"],
        contract_start_date=new_client["contract_start_date"],
        contract_end_date=new_client["contract_end_date"],
        payment_terms=new_client["payment_terms"],
        created_at=new_client["created_at"],
        updated_at=new_client["updated_at"],
        last_contact_date=new_client["last_contact_date"],
        notes=new_client["notes"],
        total_projects=new_client["total_projects"],
        active_projects=new_client["active_projects"],
        total_revenue=new_client["total_revenue"],
        pending_payments=new_client["pending_payments"]
    )

@router.get("/", response_model=List[ClientResponse])
async def get_clients(
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get all clients managed by current BA"""
    
    query = {"managed_by": str(current_user["_id"])}
    
    if status_filter:
        query["status"] = status_filter
    
    if search:
        # Search in company name or industry
        query["$or"] = [
            {"company_name": {"$regex": search, "$options": "i"}},
            {"industry": {"$regex": search, "$options": "i"}}
        ]
    
    clients = await db.clients.find(query).sort("company_name", 1).to_list(length=None)
    
    result = []
    for client in clients:
        # Calculate real-time statistics
        stats = await calculate_client_statistics(str(client["_id"]), db)
        
        # Update client document with latest stats (optional - for caching)
        await db.clients.update_one(
            {"_id": client["_id"]},
            {"$set": stats}
        )
        
        result.append(ClientResponse(
            id=str(client["_id"]),
            company_name=client["company_name"],
            industry=client.get("industry"),
            address=client.get("address"),
            city=client.get("city"),
            state=client.get("state"),
            country=client.get("country"),
            website=client.get("website"),
            contacts=[ClientContactResponse(**contact) for contact in client.get("contacts", [])],
            managed_by=client["managed_by"],
            manager_name=current_user["full_name"],
            status=client["status"],
            contract_start_date=client.get("contract_start_date"),
            contract_end_date=client.get("contract_end_date"),
            payment_terms=client.get("payment_terms"),
            created_at=client["created_at"],
            updated_at=client.get("updated_at"),
            last_contact_date=client.get("last_contact_date"),
            notes=client.get("notes"),
            total_projects=stats["total_projects"],
            active_projects=stats["active_projects"],
            total_revenue=stats["total_revenue"],
            pending_payments=stats["pending_payments"]
        ))
    
    return result

@router.get("/{client_id}", response_model=ClientDetailResponse)
async def get_client_details(
    client_id: str,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get detailed client information"""
    
    try:
        client = await db.clients.find_one({"_id": ObjectId(client_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid client ID"
        )
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Verify ownership
    if client["managed_by"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this client"
        )
    
    # Calculate statistics
    stats = await calculate_client_statistics(client_id, db)
    
    # Get recent projects
    recent_projects = await db.projects.find(
        {"client_id": client_id}
    ).sort("created_at", -1).limit(5).to_list(length=5)
    
    recent_projects_list = []
    for project in recent_projects:
        recent_projects_list.append({
            "id": str(project["_id"]),
            "project_name": project["project_name"],
            "status": project["status"],
            "progress_percentage": project.get("progress_percentage", 0.0),
            "created_at": project["created_at"]
        })
    
    # Get communication logs
    communication_logs = await db.communication_logs.find(
        {"client_id": client_id}
    ).sort("created_at", -1).limit(10).to_list(length=10)
    
    communication_logs_list = []
    for log in communication_logs:
        creator = await get_user_details(log["created_by"], db)
        communication_logs_list.append({
            "id": str(log["_id"]),
            "communication_type": log["communication_type"],
            "subject": log["subject"],
            "notes": log.get("notes"),
            "created_by": creator["full_name"] if creator else "Unknown",
            "created_at": log["created_at"]
        })
    
    # Get payment history
    payment_history = await db.payments.find(
        {"client_id": client_id}
    ).sort("payment_date", -1).limit(10).to_list(length=10)
    
    payment_history_list = []
    for payment in payment_history:
        payment_history_list.append({
            "id": str(payment["_id"]),
            "project_name": payment.get("project_name", "Unknown"),
            "milestone_name": payment.get("milestone_name", "Unknown"),
            "amount": payment["amount"],
            "payment_date": payment["payment_date"],
            "payment_method": payment.get("payment_method")
        })
    
    return ClientDetailResponse(
        id=str(client["_id"]),
        company_name=client["company_name"],
        industry=client.get("industry"),
        address=client.get("address"),
        city=client.get("city"),
        state=client.get("state"),
        country=client.get("country"),
        website=client.get("website"),
        contacts=[ClientContactResponse(**contact) for contact in client.get("contacts", [])],
        managed_by=client["managed_by"],
        manager_name=current_user["full_name"],
        status=client["status"],
        contract_start_date=client.get("contract_start_date"),
        contract_end_date=client.get("contract_end_date"),
        payment_terms=client.get("payment_terms"),
        created_at=client["created_at"],
        updated_at=client.get("updated_at"),
        last_contact_date=client.get("last_contact_date"),
        notes=client.get("notes"),
        total_projects=stats["total_projects"],
        active_projects=stats["active_projects"],
        total_revenue=stats["total_revenue"],
        pending_payments=stats["pending_payments"],
        recent_projects=recent_projects_list,
        communication_logs=communication_logs_list,
        payment_history=payment_history_list
    )

@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    client_data: ClientUpdate,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Update client information (BA only)"""
    
    try:
        client = await db.clients.find_one({"_id": ObjectId(client_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid client ID"
        )
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Verify ownership
    if client["managed_by"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this client"
        )
    
    update_data = {}
    
    if client_data.company_name is not None:
        # Check if new name already exists
        existing = await db.clients.find_one({
            "company_name": client_data.company_name,
            "managed_by": str(current_user["_id"]),
            "_id": {"$ne": ObjectId(client_id)}
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Client with this company name already exists"
            )
        update_data["company_name"] = client_data.company_name
    
    if client_data.industry is not None:
        update_data["industry"] = client_data.industry
    
    if client_data.address is not None:
        update_data["address"] = client_data.address
    
    if client_data.city is not None:
        update_data["city"] = client_data.city
    
    if client_data.state is not None:
        update_data["state"] = client_data.state
    
    if client_data.country is not None:
        update_data["country"] = client_data.country
    
    if client_data.website is not None:
        update_data["website"] = client_data.website
    
    if client_data.contacts is not None:
        update_data["contacts"] = [contact.dict() for contact in client_data.contacts]
    
    if client_data.contract_start_date is not None:
        update_data["contract_start_date"] = client_data.contract_start_date
    
    if client_data.contract_end_date is not None:
        update_data["contract_end_date"] = client_data.contract_end_date
    
    if client_data.payment_terms is not None:
        update_data["payment_terms"] = client_data.payment_terms
    
    if client_data.status is not None:
        if client_data.status not in ["active", "inactive", "on_hold"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status"
            )
        update_data["status"] = client_data.status
    
    if client_data.notes is not None:
        update_data["notes"] = client_data.notes
    
    if update_data:
        update_data["updated_at"] = datetime.now()
        await db.clients.update_one(
            {"_id": ObjectId(client_id)},
            {"$set": update_data}
        )
        
        # Create audit log
        await db.audit_logs.insert_one({
            "action_type": "client_updated",
            "performed_by": str(current_user["_id"]),
            "user_role": current_user["role"],
            "details": {
                "client_id": client_id,
                "updated_fields": list(update_data.keys())
            },
            "timestamp": datetime.now()
        })
    
    # Get updated client
    updated_client = await db.clients.find_one({"_id": ObjectId(client_id)})
    
    # Calculate statistics
    stats = await calculate_client_statistics(client_id, db)
    
    return ClientResponse(
        id=str(updated_client["_id"]),
        company_name=updated_client["company_name"],
        industry=updated_client.get("industry"),
        address=updated_client.get("address"),
        city=updated_client.get("city"),
        state=updated_client.get("state"),
        country=updated_client.get("country"),
        website=updated_client.get("website"),
        contacts=[ClientContactResponse(**contact) for contact in updated_client.get("contacts", [])],
        managed_by=updated_client["managed_by"],
        manager_name=current_user["full_name"],
        status=updated_client["status"],
        contract_start_date=updated_client.get("contract_start_date"),
        contract_end_date=updated_client.get("contract_end_date"),
        payment_terms=updated_client.get("payment_terms"),
        created_at=updated_client["created_at"],
        updated_at=updated_client.get("updated_at"),
        last_contact_date=updated_client.get("last_contact_date"),
        notes=updated_client.get("notes"),
        total_projects=stats["total_projects"],
        active_projects=stats["active_projects"],
        total_revenue=stats["total_revenue"],
        pending_payments=stats["pending_payments"]
    )

@router.delete("/{client_id}")
async def delete_client(
    client_id: str,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Deactivate client (soft delete - BA only)"""
    
    try:
        client = await db.clients.find_one({"_id": ObjectId(client_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid client ID"
        )
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Verify ownership
    if client["managed_by"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this client"
        )
    
    # Check for active projects
    active_projects = await db.projects.count_documents({
        "client_id": client_id,
        "status": {"$nin": ["completed", "cancelled"]}
    })
    
    if active_projects > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete client with {active_projects} active project(s)"
        )
    
    # Soft delete - set status to inactive
    await db.clients.update_one(
        {"_id": ObjectId(client_id)},
        {"$set": {"status": "inactive", "updated_at": datetime.now()}}
    )
    
    # Create audit log
    await db.audit_logs.insert_one({
        "action_type": "client_deactivated",
        "performed_by": str(current_user["_id"]),
        "user_role": current_user["role"],
        "details": {
            "client_id": client_id,
            "company_name": client["company_name"]
        },
        "timestamp": datetime.now()
    })
    
    return {"message": "Client deactivated successfully"}

# ============= COMMUNICATION LOG ENDPOINTS =============

@router.post("/{client_id}/communications", response_model=CommunicationLogResponse, status_code=status.HTTP_201_CREATED)
async def create_communication_log(
    client_id: str,
    log_data: CommunicationLogCreate,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Log communication with client (BA only)"""
    
    try:
        client = await db.clients.find_one({"_id": ObjectId(client_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid client ID"
        )
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Verify ownership
    if client["managed_by"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to log communication for this client"
        )
    
    # Validate communication type
    valid_types = ["email", "call", "meeting", "message", "other"]
    if log_data.communication_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid communication type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Create communication log
    new_log = {
        "client_id": client_id,
        "communication_type": log_data.communication_type,
        "subject": log_data.subject,
        "notes": log_data.notes,
        "contact_person": log_data.contact_person,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.now()
    }
    
    result = await db.communication_logs.insert_one(new_log)
    
    # Update client's last_contact_date
    await update_client_last_contact(client_id, db)
    
    return CommunicationLogResponse(
        id=str(result.inserted_id),
        client_id=client_id,
        client_name=client["company_name"],
        communication_type=new_log["communication_type"],
        subject=new_log["subject"],
        notes=new_log["notes"],
        contact_person=new_log["contact_person"],
        created_by=str(current_user["_id"]),
        created_by_name=current_user["full_name"],
        created_at=new_log["created_at"]
    )

@router.get("/{client_id}/communications", response_model=List[CommunicationLogResponse])
async def get_client_communications(
    client_id: str,
    communication_type: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get communication logs for a client"""
    
    try:
        client = await db.clients.find_one({"_id": ObjectId(client_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid client ID"
        )
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Verify ownership
    if client["managed_by"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view communications for this client"
        )
    
    query = {"client_id": client_id}
    if communication_type:
        query["communication_type"] = communication_type
    
    logs = await db.communication_logs.find(query).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    result = []
    for log in logs:
        creator = await get_user_details(log["created_by"], db)
        result.append(CommunicationLogResponse(
            id=str(log["_id"]),
            client_id=log["client_id"],
            client_name=client["company_name"],
            communication_type=log["communication_type"],
            subject=log["subject"],
            notes=log.get("notes"),
            contact_person=log.get("contact_person"),
            created_by=log["created_by"],
            created_by_name=creator["full_name"] if creator else "Unknown",
            created_at=log["created_at"]
        ))
    
    return result

@router.delete("/{client_id}/communications/{log_id}")
async def delete_communication_log(
    client_id: str,
    log_id: str,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Delete communication log (BA only)"""
    
    try:
        log = await db.communication_logs.find_one({"_id": ObjectId(log_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid log ID"
        )
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication log not found"
        )
    
    # Verify ownership
    if log["created_by"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this log"
        )
    
    await db.communication_logs.delete_one({"_id": ObjectId(log_id)})
    
    return {"message": "Communication log deleted successfully"}

# ============= CLIENT STATISTICS =============

@router.get("/{client_id}/stats")
async def get_client_statistics(
    client_id: str,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get detailed statistics for a client"""
    
    try:
        client = await db.clients.find_one({"_id": ObjectId(client_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid client ID"
        )
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Verify ownership
    if client["managed_by"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this client's statistics"
        )
    
    # Calculate comprehensive statistics
    stats = await calculate_client_statistics(client_id, db)
    
    # Get project status breakdown
    projects = await db.projects.find({"client_id": client_id}).to_list(length=None)
    
    status_breakdown = {}
    for project in projects:
        status = project["status"]
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
    
    # Calculate average project duration
    completed_projects = [p for p in projects if p.get("completion_date") and p.get("created_at")]
    avg_duration_days = None
    if completed_projects:
        durations = []
        for project in completed_projects:
            delta = project["completion_date"] - project["created_at"]
            durations.append(delta.days)
        avg_duration_days = sum(durations) / len(durations)
    
    # Get upcoming milestones
    upcoming_milestones = []
    for project in projects:
        if project["status"] not in ["completed", "cancelled"]:
            for milestone in project.get("milestones", []):
                if milestone["status"] == "pending":
                    upcoming_milestones.append({
                        "project_name": project["project_name"],
                        "milestone_name": milestone["name"],
                        "amount": milestone["amount"],
                        "percentage": milestone["percentage"]
                    })
    
    return {
        "client_id": client_id,
        "company_name": client["company_name"],
        "total_projects": stats["total_projects"],
        "active_projects": stats["active_projects"],
        "completed_projects": status_breakdown.get("completed", 0),
        "total_revenue": stats["total_revenue"],
        "pending_payments": stats["pending_payments"],
        "project_status_breakdown": status_breakdown,
        "average_project_duration_days": avg_duration_days,
        "upcoming_milestones": upcoming_milestones,
        "last_contact_date": client.get("last_contact_date"),
        "contract_active": client.get("contract_end_date") > datetime.now() if client.get("contract_end_date") else None
    }