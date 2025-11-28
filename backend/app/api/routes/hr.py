from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.database import get_database
from app.api.deps import get_current_hr
from app.core.security import get_password_hash
from app.schemas.user import UserCreate, UserResponse
from app.services.activity_tracker import ActivityTrackerService  # <<< ADD THIS IMPORT
from bson import ObjectId
from datetime import datetime, timedelta, date  # <<< ADD 'date' to imports

# ============================================
# TIERED SALARY CALCULATION SYSTEM
# ============================================
def calculate_tiered_salary(base_salary: float, avg_productivity: float) -> dict:
    """
    Calculate salary based on tiered productivity system.
    
    Tiers:
    - 90-100% → 100% of base salary
    - 80-89%  → 95% of base salary
    - 70-79%  → 90% of base salary
    - 60-69%  → 85% of base salary
    - Below 60% → 80% of base salary
    """
    
    if avg_productivity >= 90:
        multiplier = 1.0
        tier = "Excellent (90-100%)"
    elif avg_productivity >= 80:
        multiplier = 0.95
        tier = "Good (80-89%)"
    elif avg_productivity >= 70:
        multiplier = 0.90
        tier = "Average (70-79%)"
    elif avg_productivity >= 60:
        multiplier = 0.85
        tier = "Below Average (60-69%)"
    else:
        multiplier = 0.80
        tier = "Needs Improvement (<60%)"
    
    actual_salary = base_salary * multiplier
    deduction = base_salary - actual_salary
    
    return {
        "base_salary": round(base_salary, 2),
        "avg_productivity": round(avg_productivity, 2),
        "tier": tier,
        "multiplier": multiplier,
        "actual_salary": round(actual_salary, 2),
        "deduction": round(deduction, 2)
    }

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
        "required_hours": user_data.required_hours,
        "base_salary": user_data.base_salary  # ✅ ADDED
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
        "required_hours": user_dict["required_hours"],
        "base_salary": user_dict["base_salary"]  # ✅ ADDED
    }

@router.get("/employees")
async def get_employees(
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    employees = []
    cursor = db.users.find({"role": "employee"})
    
    today = datetime.now().strftime("%Y-%m-%d")
    week_ago = datetime.now() - timedelta(days=7)
    
    async for employee in cursor:
        employee_id = str(employee["_id"])
        
        # ========================================
        # TODAY'S ATTENDANCE - GET ALL SESSIONS
        # ========================================
        today_attendance_cursor = db.attendance.find({
            "user_id": employee_id,
            "date": today
        })
        
        today_sessions = await today_attendance_cursor.to_list(length=None)
        
        # Calculate total hours from ALL sessions today
        is_active = False
        today_hours = 0.0
        active_login_time = None
        
        for session in today_sessions:
            login_time = session.get("login_time")
            logout_time = session.get("logout_time")
            attendance_status = session.get("status")
            
            # Check if THIS session is active
            if attendance_status == "active" and logout_time is None:
                # Currently clocked in (active session)
                is_active = True
                active_login_time = login_time
                
                if login_time:
                    # Calculate current hours for active session
                    if isinstance(login_time, str):
                        from dateutil import parser
                        login_time = parser.parse(login_time)
                    time_diff = datetime.now() - login_time
                    today_hours += time_diff.total_seconds() / 3600
            else:
                # Completed session - add its hours
                session_hours = session.get("total_hours", 0) or 0
                today_hours += session_hours
        
        # ========================================
        # WEEK HOURS (Last 7 days completed)
        # ========================================
        week_cursor = db.attendance.find({
            "user_id": employee_id,
            "login_time": {"$gte": week_ago},
            "status": "completed"
        })
        
        week_hours = 0.0
        async for record in week_cursor:
            hours = record.get("total_hours", 0) or 0
            week_hours += hours
        
        # Add today's hours to week total
        week_hours += today_hours
        
        # ========================================
        # PRODUCTIVITY SCORE (Latest)
        # ========================================
        latest_activity = await db.activities.find_one(
            {"user_id": employee_id},
            sort=[("recorded_at", -1)]
        )
        
        productivity_score = 0
        if latest_activity:
            productivity_score = latest_activity.get("productivity_score", 0)
        
        # ========================================
        # BUILD EMPLOYEE OBJECT
        # ========================================
        employees.append({
            "id": employee_id,
            "email": employee["email"],
            "full_name": employee["full_name"],
            "is_active": employee["is_active"],
            "today_status": "active" if is_active else "inactive",
            "today_hours": round(today_hours, 2),
            "week_hours": round(week_hours, 2),
            "login_time": active_login_time if is_active else None,
            "logout_time": None if is_active else None,
            "productivity_score": productivity_score
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
    
    # Get ALL activities for the last 7 days
    productivity_scores = []
    
    activity_cursor = db.activities.find({
        "user_id": employee_id,
        "recorded_at": {"$gte": seven_days_ago}
    }).sort("recorded_at", 1)  # Sort by time ascending
    
    # Group activities by date and get the last record of each day
    daily_activities = {}
    
    async for activity in activity_cursor:
        date_key = activity.get("date")  # Use the date field
        score = activity.get("productivity_score", 0)
        
        if score > 0:
            productivity_scores.append(score)
        
        # Store the latest activity for each date (overwrites previous)
        daily_activities[date_key] = activity
    
    # Now sum up the cumulative totals from each day
    total_mouse_events = 0
    total_keyboard_events = 0
    total_active_seconds = 0
    total_idle_seconds = 0
    
    for date_key, activity in daily_activities.items():
        total_mouse_events += activity.get("total_mouse_movements", 0)
        total_keyboard_events += activity.get("total_key_presses", 0)
        total_active_seconds += activity.get("active_time_seconds", 0)
        total_idle_seconds += activity.get("idle_time_seconds", 0)
    
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
    
    
        # ========================================
    # SALARY CALCULATION (TIERED SYSTEM)
    # ========================================
    employee = await db.users.find_one({"_id": ObjectId(employee_id)})
    base_salary = employee.get("base_salary", 0.0)
    
    salary_info = calculate_tiered_salary(base_salary, avg_productivity)
    
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
            "total_mouse_events": total_mouse_events,
            "total_keyboard_events": total_keyboard_events,
            "avg_productivity_score": round(avg_productivity, 2),
            "days_tracked": len(daily_activities)
        },
        "tasks_summary": {
            "total": total_tasks,
            "completed": completed_tasks,
            "pending": total_tasks - completed_tasks
        },
        "salary_info": salary_info  # ✅ NEW FIELD ADDED
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



@router.get("/employee/{employee_id}/ai-productivity")
async def get_employee_ai_productivity(
    employee_id: str,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    """
    HR endpoint to get AI productivity analysis for any employee
    """
    print(f"\n🔍 HR AI ENDPOINT CALLED for employee: {employee_id}\n")
    
    from datetime import date
    from app.services.activity_tracker import ActivityTrackerService
    from app.services.ai_productivity_service import ai_productivity_service
    
    # Validate employee exists
    employee = await db.users.find_one({"_id": ObjectId(employee_id)})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get current month range
    today = date.today()
    first_day_of_month = today.replace(day=1)
    
    # Get raw monthly app data
    activity_service = ActivityTrackerService(db)
    raw_apps = await activity_service.get_raw_monthly_app_data(
        employee_email=employee["email"],
        start_date=first_day_of_month,
        end_date=today
    )
    
    if not raw_apps:
        return {
            "success": False,
            "message": "No activity data found for current month",
            "month": today.strftime("%B %Y")
        }
    
    # Get AI analysis
    month_label = today.strftime("%B %Y")
    employee_name = employee.get("full_name", employee["email"])
    
    ai_analysis = await ai_productivity_service.analyze_productivity(
        raw_apps=raw_apps,
        employee_name=employee_name,
        month=month_label
    )
    
    total_seconds = sum(app["total_time_spent_seconds"] for app in raw_apps)
    total_hours = round(total_seconds / 3600, 2)
    
    return {
        "success": True,
        "employee": {
            "id": employee_id,
            "name": employee_name,
            "email": employee["email"]
        },
        "period": {
            "month": month_label,
            "start_date": first_day_of_month.isoformat(),
            "end_date": today.isoformat()
        },
        "activity_summary": {
            "total_hours": total_hours,
            "total_apps": len(raw_apps)
        },
        "ai_analysis": ai_analysis,
         "debug_data": {  # ✅ ADD THIS
            "raw_apps": raw_apps,
            "total_apps": len(raw_apps),
            "total_hours": total_hours
         }
    }