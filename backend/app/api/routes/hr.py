from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.database import get_database
from app.api.deps import get_current_hr
from app.core.security import get_password_hash
from app.schemas.user import UserCreate, UserResponse
from app.services.activity_tracker import ActivityTrackerService  # <<< ADD THIS IMPORT
from bson import ObjectId
from datetime import datetime, timedelta, date  # <<< ADD 'date' to imports

router = APIRouter()

@router.post("/create-user", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "role": user_data.role,
        "hashed_password": get_password_hash(user_data.password),
        "is_active": True,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.now(),
        "office_hours": {"start": "09:00", "end": "18:00"},
        "required_hours": user_data.required_hours
    }
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    return {
        "id": str(user_dict["_id"]),
        "email": user_dict["email"],
        "full_name": user_dict["full_name"],
        "role": user_dict["role"],
        "is_active": user_dict["is_active"],
        "office_hours": user_dict["office_hours"],
        "required_hours": user_dict["required_hours"]
    }

@router.get("/employees")
async def get_employees(
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    employees = []
    cursor = db.users.find({"role": "employee"})
    
    async for employee in cursor:
        # Get today's attendance
        today = datetime.now().strftime("%Y-%m-%d")
        attendance = await db.attendance.find_one({
            "user_id": str(employee["_id"]),
            "date": today
        })
        
        # Get activity stats
        activity_stats = await db.activities.find_one(
            {"user_id": str(employee["_id"])},
            sort=[("timestamp", -1)]
        )
        
        employees.append({
            "id": str(employee["_id"]),
            "email": employee["email"],
            "full_name": employee["full_name"],
            "is_active": employee["is_active"],
            "today_status": "active" if attendance and not attendance.get("logout_time") else "inactive",
            "login_time": attendance.get("login_time") if attendance else None,
            "logout_time": attendance.get("logout_time") if attendance else None,
            "total_hours": attendance.get("total_hours", 0) if attendance else 0,
            "productivity_score": activity_stats.get("productivity_score", 0) if activity_stats else 0
        })
    
    return employees

@router.get("/employee/{employee_id}/stats")
async def get_employee_stats(
    employee_id: str,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    # Last 7 days attendance
    seven_days_ago = datetime.now() - timedelta(days=7)
    
    attendance_records = []
    cursor = db.attendance.find({
        "user_id": employee_id,
        "login_time": {"$gte": seven_days_ago}
    }).sort("date", -1)
    
    total_hours = 0
    async for record in cursor:
        hours = record.get("total_hours", 0) or 0
        total_hours += hours
        attendance_records.append({
            "date": record["date"],
            "login_time": record["login_time"],
            "logout_time": record.get("logout_time"),
            "total_hours": hours,
            "status": record["status"]
        })
    
    # Get ALL activities for the last 7 days to calculate ACTUAL active/idle time
    total_active_seconds = 0
    total_idle_seconds = 0
    productivity_scores = []
    
    activity_cursor = db.activities.find({
        "user_id": employee_id,
        "recorded_at": {"$gte": seven_days_ago}
    })
    
    # Get the LATEST record for cumulative counts
    latest_activity = await db.activities.find_one(
        {"user_id": employee_id},
        sort=[("recorded_at", -1)]
    )
    
    # Process each interval
    async for activity in activity_cursor:
        # These are PER INTERVAL (30 seconds each)
        total_active_seconds = activity.get("active_time", 0) or activity.get("active_time_seconds", 0)
        total_idle_seconds = activity.get("idle_time", 0) or activity.get("idle_time_seconds", 0)
        
        
        score = activity.get("productivity_score", 0)
        if score > 0:
            productivity_scores.append(score)
    
    # Get cumulative mouse/keyboard from LATEST record only
    total_mouse_events = 0
    total_keyboard_events = 0
    if latest_activity:
        total_mouse_events = latest_activity.get("mouse_events", 0) or latest_activity.get("total_mouse_movements", 0)
        total_keyboard_events = latest_activity.get("keyboard_events", 0) or latest_activity.get("total_key_presses", 0)
    
    # Calculate average productivity
    avg_productivity = 0
    if productivity_scores:
        avg_productivity = sum(productivity_scores) / len(productivity_scores)
    
    # Tasks stats
    total_tasks = await db.tasks.count_documents({"assigned_to": employee_id})
    completed_tasks = await db.tasks.count_documents({
        "assigned_to": employee_id,
        "status": "completed"
    })
    
    # Calculate averages
    avg_hours = total_hours / len(attendance_records) if attendance_records else 0
    
    return {
        "attendance": {
            "records": attendance_records,
            "total_hours": round(total_hours, 2),
            "average_hours": round(avg_hours, 2),
            "total_days": len(attendance_records)
        },
        "activity_summary": {
            "total_active_time": round(total_active_seconds / 3600, 2),  
            "total_idle_time": round(total_idle_seconds / 3600, 2),      
            "total_mouse_events": total_mouse_events,      # Latest cumulative value
            "total_keyboard_events": total_keyboard_events, # Latest cumulative value
            "avg_productivity_score": round(avg_productivity, 2)
        },
        "tasks_summary": {
            "total": total_tasks,
            "completed": completed_tasks,
            "pending": total_tasks - completed_tasks
        }
    }

# <<<<<<< NEW ENDPOINT ADDED HERE >>>>>>>
@router.get("/employee/{employee_id}/app-breakdown")
async def get_employee_app_breakdown(
    employee_id: str,
    start_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """
    Get per-application activity breakdown for an employee.
    Groups browser activities by site (e.g., Chrome - facebook.com).
    """
    
    # Validate employee exists
    employee = await db.users.find_one({"_id": ObjectId(employee_id)})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Validate date range
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    # Get employee email for querying activities
    employee_email = employee.get("email")
    if not employee_email:
        raise HTTPException(status_code=400, detail="Employee email not found")
    
    # Use the service to get breakdown
    activity_service = ActivityTrackerService(db)
    breakdown_data = await activity_service.get_app_activity_breakdown(
        employee_email=employee_email,
        start_date=start_date,
        end_date=end_date
    )
    
    return {
        "employee_id": employee_id,
        "employee_name": employee.get("full_name"),
        "employee_email": employee_email,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "breakdown": breakdown_data,
        "total_apps": len(breakdown_data)
    }
# <<<<<<< END OF NEW ENDPOINT >>>>>>>

@router.put("/settings")
async def update_settings(
    settings: dict,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    # Update office hours for all employees or specific employee
    if "employee_id" in settings:
        await db.users.update_one(
            {"_id": ObjectId(settings["employee_id"])},
            {"$set": {
                "office_hours": settings.get("office_hours", {}),
                "required_hours": settings.get("required_hours", 8.0)
            }}
        )
    else:
        # Update for all employees
        await db.users.update_many(
            {"role": "employee"},
            {"$set": {
                "office_hours": settings.get("office_hours", {}),
                "required_hours": settings.get("required_hours", 8.0)
            }}
        )
    
    return {"message": "Settings updated successfully"}