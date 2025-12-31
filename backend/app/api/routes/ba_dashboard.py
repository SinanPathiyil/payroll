from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_ba, get_database
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter(prefix="/ba/dashboard", tags=["Business Analyst - Dashboard"])

@router.get("/summary")
async def get_ba_dashboard_summary(
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get comprehensive BA dashboard summary"""
    
    ba_id = str(current_user["_id"])
    
    # ============= CLIENT STATISTICS =============
    total_clients = await db.clients.count_documents({"managed_by": ba_id})
    active_clients = await db.clients.count_documents({"managed_by": ba_id, "status": "active"})
    
    # ============= PROJECT STATISTICS =============
    total_projects = await db.projects.count_documents({"managed_by_ba": ba_id})
    
    active_projects = await db.projects.count_documents({
        "managed_by_ba": ba_id,
        "status": {"$nin": ["completed", "cancelled"]}
    })
    
    completed_projects = await db.projects.count_documents({
        "managed_by_ba": ba_id,
        "status": "completed"
    })
    
    pending_approval = await db.projects.count_documents({
        "managed_by_ba": ba_id,
        "status": "pending_tl_approval"
    })
    
    # ============= FINANCIAL STATISTICS =============
    # Total payments collected
    payments = await db.payments.find({"recorded_by": ba_id}).to_list(length=None)
    total_revenue = sum(p["amount"] for p in payments)
    
    # Pending payments (milestones reached but not paid)
    projects = await db.projects.find({"managed_by_ba": ba_id}).to_list(length=None)
    
    pending_payments = 0
    total_contract_value = 0
    
    for project in projects:
        total_contract_value += project.get("total_contract_value", 0)
        for milestone in project.get("milestones", []):
            if milestone["status"] == "reached" and not milestone.get("payment_received_at"):
                pending_payments += milestone["amount"]
    
    # This month revenue
    now = datetime.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_payments = [p for p in payments if p["payment_date"] >= month_start]
    this_month_revenue = sum(p["amount"] for p in this_month_payments)
    
    # ============= MEETING STATISTICS =============
    upcoming_meetings = await db.meetings.count_documents({
        "scheduled_by": ba_id,
        "scheduled_at": {"$gte": datetime.now()},
        "status": "scheduled"
    })
    
    total_meetings = await db.meetings.count_documents({"scheduled_by": ba_id})
    completed_meetings = await db.meetings.count_documents({
        "scheduled_by": ba_id,
        "status": "completed"
    })
    
    # ============= MILESTONE STATISTICS =============
    milestones_awaiting_payment = 0
    milestones_in_progress = 0
    
    for project in projects:
        if project["status"] not in ["completed", "cancelled"]:
            for milestone in project.get("milestones", []):
                if milestone["status"] == "reached":
                    milestones_awaiting_payment += 1
                elif milestone["status"] == "pending":
                    milestones_in_progress += 1
    
    # ============= RECENT ACTIVITY =============
    # Get recent projects
    recent_projects = await db.projects.find(
        {"managed_by_ba": ba_id}
    ).sort("created_at", -1).limit(5).to_list(length=5)
    
    recent_projects_list = []
    for project in recent_projects:
        client = await db.clients.find_one({"_id": ObjectId(project["client_id"])})
        recent_projects_list.append({
            "id": str(project["_id"]),
            "project_name": project["project_name"],
            "client_name": client["company_name"] if client else "Unknown",
            "status": project["status"],
            "progress_percentage": project.get("progress_percentage", 0),
            "created_at": project["created_at"]
        })
    
    # Get recent payments
    recent_payments = sorted(payments, key=lambda x: x["payment_date"], reverse=True)[:5]
    recent_payments_list = [{
        "id": str(p["_id"]),
        "project_name": p["project_name"],
        "milestone_name": p["milestone_name"],
        "amount": p["amount"],
        "payment_date": p["payment_date"]
    } for p in recent_payments]
    
    # Get today's meetings
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    todays_meetings = await db.meetings.find({
        "scheduled_by": ba_id,
        "scheduled_at": {"$gte": today_start, "$lt": today_end},
        "status": "scheduled"
    }).sort("scheduled_at", 1).to_list(length=None)
    
    todays_meetings_list = []
    for meeting in todays_meetings:
        project = await db.projects.find_one({"_id": ObjectId(meeting["project_id"])})
        client = await db.clients.find_one({"_id": ObjectId(meeting["client_id"])})
        todays_meetings_list.append({
            "id": str(meeting["_id"]),
            "project_name": project["project_name"] if project else "Unknown",
            "client_name": client["company_name"] if client else "Unknown",
            "meeting_type": meeting["meeting_type"],
            "scheduled_at": meeting["scheduled_at"]
        })
    
    return {
        "clients": {
            "total": total_clients,
            "active": active_clients
        },
        "projects": {
            "total": total_projects,
            "active": active_projects,
            "completed": completed_projects,
            "pending_approval": pending_approval
        },
        "financials": {
            "total_revenue": total_revenue,
            "pending_payments": pending_payments,
            "total_contract_value": total_contract_value,
            "collection_rate": (total_revenue / total_contract_value * 100) if total_contract_value > 0 else 0,
            "this_month_revenue": this_month_revenue
        },
        "meetings": {
            "upcoming": upcoming_meetings,
            "total": total_meetings,
            "completed": completed_meetings
        },
        "milestones": {
            "awaiting_payment": milestones_awaiting_payment,
            "in_progress": milestones_in_progress
        },
        "recent_activity": {
            "projects": recent_projects_list,
            "payments": recent_payments_list,
            "todays_meetings": todays_meetings_list
        }
    }

@router.get("/revenue-analytics")
async def get_revenue_analytics(
    months: int = 6,
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get revenue analytics over time"""
    
    ba_id = str(current_user["_id"])
    
    # Get payments
    payments = await db.payments.find({"recorded_by": ba_id}).to_list(length=None)
    
    # Group by month
    now = datetime.now()
    monthly_data = []
    
    for i in range(months):
        month_start = (now.replace(day=1) - timedelta(days=30*i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        
        month_payments = [p for p in payments if month_start <= p["payment_date"] <= month_end]
        month_total = sum(p["amount"] for p in month_payments)
        
        monthly_data.append({
            "month": month_start.strftime("%B %Y"),
            "revenue": month_total,
            "transaction_count": len(month_payments)
        })
    
    return {
        "monthly_data": list(reversed(monthly_data)),
        "total_revenue": sum(p["amount"] for p in payments),
        "average_monthly_revenue": sum(p["amount"] for p in payments) / months if payments else 0
    }

@router.get("/project-analytics")
async def get_project_analytics(
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get project status distribution and analytics"""
    
    ba_id = str(current_user["_id"])
    
    projects = await db.projects.find({"managed_by_ba": ba_id}).to_list(length=None)
    
    # Status distribution
    status_distribution = {}
    for project in projects:
        status = project["status"]
        status_distribution[status] = status_distribution.get(status, 0) + 1
    
    # Priority distribution
    priority_distribution = {}
    for project in projects:
        priority = project.get("priority", "medium")
        priority_distribution[priority] = priority_distribution.get(priority, 0) + 1
    
    # Completion rate
    total = len(projects)
    completed = status_distribution.get("completed", 0)
    completion_rate = (completed / total * 100) if total > 0 else 0
    
    # Average project progress
    active_projects = [p for p in projects if p["status"] not in ["completed", "cancelled"]]
    avg_progress = sum(p.get("progress_percentage", 0) for p in active_projects) / len(active_projects) if active_projects else 0
    
    return {
        "total_projects": total,
        "status_distribution": status_distribution,
        "priority_distribution": priority_distribution,
        "completion_rate": completion_rate,
        "average_progress": avg_progress,
        "active_projects_count": len(active_projects)
    }

@router.get("/alerts")
async def get_ba_alerts(
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get important alerts for BA"""
    
    ba_id = str(current_user["_id"])
    alerts = []
    
    # Pending payments
    projects = await db.projects.find({"managed_by_ba": ba_id}).to_list(length=None)
    
    for project in projects:
        for milestone in project.get("milestones", []):
            if milestone["status"] == "reached" and not milestone.get("payment_received_at"):
                days_pending = (datetime.now() - milestone.get("reached_at")).days if milestone.get("reached_at") else 0
                
                severity = "high" if days_pending > 7 else "medium"
                
                alerts.append({
                    "type": "pending_payment",
                    "severity": severity,
                    "message": f"Payment pending for {milestone['name']} in project '{project['project_name']}' ({days_pending} days)",
                    "project_id": str(project["_id"]),
                    "amount": milestone["amount"]
                })
    
    # Projects pending approval
    pending_projects = await db.projects.find({
        "managed_by_ba": ba_id,
        "status": "pending_tl_approval"
    }).to_list(length=None)
    
    for project in pending_projects:
        alerts.append({
            "type": "pending_approval",
            "severity": "medium",
            "message": f"Project '{project['project_name']}' is awaiting Team Lead approval",
            "project_id": str(project["_id"])
        })
    
    # Upcoming meetings (next 24 hours)
    tomorrow = datetime.now() + timedelta(days=1)
    upcoming_meetings = await db.meetings.find({
        "scheduled_by": ba_id,
        "scheduled_at": {"$gte": datetime.now(), "$lte": tomorrow},
        "status": "scheduled"
    }).to_list(length=None)
    
    for meeting in upcoming_meetings:
        project = await db.projects.find_one({"_id": ObjectId(meeting["project_id"])})
        alerts.append({
            "type": "upcoming_meeting",
            "severity": "low",
            "message": f"Meeting scheduled for project '{project['project_name'] if project else 'Unknown'}' at {meeting['scheduled_at'].strftime('%Y-%m-%d %H:%M')}",
            "meeting_id": str(meeting["_id"])
        })
    
    # Overdue projects
    overdue_projects = [p for p in projects if p.get("due_date") and p["due_date"] < datetime.now() and p["status"] not in ["completed", "cancelled"]]
    
    for project in overdue_projects:
        alerts.append({
            "type": "overdue_project",
            "severity": "high",
            "message": f"Project '{project['project_name']}' is overdue",
            "project_id": str(project["_id"])
        })
    
    # Sort by severity
    severity_order = {"high": 0, "medium": 1, "low": 2}
    alerts.sort(key=lambda x: severity_order[x["severity"]])
    
    return {
        "total_alerts": len(alerts),
        "high_priority": len([a for a in alerts if a["severity"] == "high"]),
        "alerts": alerts
    }
    
@router.get("/team-leads")
async def get_team_leads_for_ba(
    current_user: dict = Depends(get_current_ba),
    db = Depends(get_database)
):
    """Get all team leads available for project assignment"""
    
    # Fetch all users with team_lead role
    team_leads = await db.users.find({
        "role": "team_lead"
    }).to_list(length=None)
    
    result = []
    for tl in team_leads:
        result.append({
            "id": str(tl["_id"]),
            "full_name": tl["full_name"],
            "email": tl["email"],
            "team_id": tl.get("team_id")
        })
    
    return result