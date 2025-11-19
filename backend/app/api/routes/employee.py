# backend/app/api/routes/employee.py

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from app.core.database import get_database
from app.api.deps import get_current_user
from datetime import datetime, timedelta
from bson import ObjectId
from typing import Optional
import logging
from datetime import datetime 


# UNCOMMENT THIS LINE: if have a classifier
from app.services.smart_classifier import smart_classifier

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/login")
async def employee_login(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Clock in - Employee starts their workday"""
    if current_user["role"] != "employee":
        raise HTTPException(status_code=403, detail="Only employees can clock in")
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    # First, clean up any stale active records from previous days
    await db.attendance.update_many(
        {
            "user_id": str(current_user["_id"]),
            "status": "active",
            "date": {"$ne": today}
        },
        {
            "$set": {
                "status": "completed",
                "logout_time": datetime.now()
            }
        }
    )
    
    # Now check if already logged in TODAY
    existing_attendance = await db.attendance.find_one({
        "user_id": str(current_user["_id"]),
        "date": today,
        "status": "active"
    })
    
    if existing_attendance:
        raise HTTPException(status_code=400, detail="Already clocked in today")
    
    # Create new attendance record
    attendance = {
        "user_id": str(current_user["_id"]),
        "login_time": datetime.now(),
        "logout_time": None,
        "total_hours": None,
        "date": today,
        "status": "active"
    }
    
    result = await db.attendance.insert_one(attendance)
    attendance["_id"] = result.inserted_id
    
    logger.info(f"Employee {current_user['email']} clocked in")
    
    return {
        "message": "Clocked in successfully",
        "login_time": attendance["login_time"],
        "attendance_id": str(attendance["_id"])
    }


@router.post("/logout")
async def employee_logout(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Clock out - Employee ends their workday"""
    if current_user["role"] != "employee":
        raise HTTPException(status_code=403, detail="Only employees can clock out")
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Find active attendance for TODAY
    attendance = await db.attendance.find_one({
        "user_id": str(current_user["_id"]),
        "date": today,
        "status": "active"
    })
    
    if not attendance:
        raise HTTPException(status_code=400, detail="No active clock-in found for today")
    
    logout_time = datetime.now()
    login_time = attendance.get("login_time")
    
    if not login_time:
        raise HTTPException(status_code=400, detail="Invalid attendance record")
    
    # Calculate total hours
    if isinstance(login_time, str):
        from dateutil import parser
        login_time = parser.parse(login_time)
    
    time_diff = logout_time - login_time
    total_seconds = int(time_diff.total_seconds())
    total_hours = total_seconds / 3600 
    
    # Update attendance
    result = await db.attendance.update_one(
        {"_id": attendance["_id"]},
        {"$set": {
            "logout_time": logout_time,
            "total_hours": round(total_hours, 4),
            "status": "completed"
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update attendance")
    
    logger.info(f"Employee {current_user['email']} clocked out - {total_hours:.2f} hours")
    
    return {
        "message": "Clocked out successfully",
        "total_hours": round(total_hours, 2),
        "login_time": login_time.isoformat() if hasattr(login_time, 'isoformat') else str(login_time),
        "logout_time": logout_time.isoformat()
    }


@router.get("/status")
async def get_status(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get current clock-in status"""
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Check for active attendance TODAY (not just any active record)
    attendance = await db.attendance.find_one({
        "user_id": str(current_user["_id"]),
        "date": today,
        "status": "active"
    })
    
    is_clocked_in = bool(attendance and attendance.get("status") == "active")
    
    current_hours = 0.0
    login_time = None
    
    if is_clocked_in and attendance.get("login_time"):
        time_diff = datetime.now() - attendance["login_time"]
        current_hours = time_diff.total_seconds() / 3600
        login_time = attendance["login_time"]
    
    return {
        "is_clocked_in": is_clocked_in,
        "login_time": login_time,
        "current_hours": round(current_hours, 2),
        "date": today
    }


@router.post("/cleanup-stale")
async def cleanup_stale_attendance(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Clean up any stale active attendance records (not from today)"""
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Find any active records that are NOT from today
    stale_records = await db.attendance.find({
        "user_id": str(current_user["_id"]),
        "status": "active",
        "date": {"$ne": today}
    }).to_list(length=100)
    
    if stale_records:
        # Auto-clock out stale records
        for record in stale_records:
            if record.get("login_time"):
                logout_time = datetime.now()
                time_diff = logout_time - record["login_time"]
                total_hours = time_diff.total_seconds() / 3600
                
                await db.attendance.update_one(
                    {"_id": record["_id"]},
                    {"$set": {
                        "logout_time": logout_time,
                        "total_hours": round(total_hours, 2),
                        "status": "completed"
                    }}
                )
        
        return {
            "message": f"Cleaned up {len(stale_records)} stale attendance record(s)",
            "cleaned": len(stale_records)
        }
    
    return {"message": "No stale records found"}


@router.post("/activity")
async def log_activity(
    activity_data: dict,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Log detailed employee activity from desktop agent
    Includes per-application breakdown
    """
    try:
        timestamp = datetime.now()
        
        # ===============================
        # ADD EMPLOYEE INFO
        # ===============================
        activity_data["employee_email"] = current_user["email"]
        activity_data["employee_name"] = current_user.get("full_name", "")
        activity_data["user_id"] = str(current_user["_id"])
        activity_data["recorded_at"] = timestamp
        activity_data["date"] = timestamp.strftime("%Y-%m-%d")
        activity_data["source"] = activity_data.get("source", "desktop_agent")
        
        # Ensure timestamp exists
        if "timestamp" not in activity_data:
            activity_data["timestamp"] = timestamp.isoformat()
        
        # ===============================
        # CALCULATE PRODUCTIVITY SCORE
        # ===============================
        session_active = int(activity_data.get("active_time", 0))
        session_idle = int(activity_data.get("idle_time", 0))
        session_total = session_active + session_idle
        
        if session_total > 0:
            activity_data["productivity_score"] = min(100, int((session_active / session_total) * 100))
        else:
            activity_data["productivity_score"] = 0
        
        # Add session_time_seconds for backward compatibility
        activity_data["session_time_seconds"] = session_total
        
        # Ensure is_idle is boolean
        activity_data["is_idle"] = bool(activity_data.get("is_idle", False))

        # ===============================
        # NORMALIZE APPLICATIONS LIST
        # ===============================
        applications = activity_data.get("applications", [])
        normalized_apps = []
        total_app_time = 0

        for app in applications:
            app_entry = {
                "application": app.get("application", "Unknown"),
                "window_title": app.get("window_title", ""),
                "url": app.get("url", ""),
                "mouse_movements": int(app.get("mouse_movements", 0)),
                "key_presses": int(app.get("key_presses", 0)),
                "time_spent_seconds": int(app.get("time_spent_seconds", 0)),
            }
            total_app_time += app_entry["time_spent_seconds"]
            normalized_apps.append(app_entry)

        activity_data["applications"] = normalized_apps
        activity_data["applications_total_time_seconds"] = total_app_time

        # ===============================
        # STORE IN DATABASE
        # ===============================
        result = await db.activities.insert_one(activity_data)
        
        print(f"✅ Activity logged for {current_user['email']}")
        
        # ===============================
        # RETURN SUCCESS
        # ===============================
        return {
            "message": "Activity logged successfully",
            "id": str(result.inserted_id),
            "apps_tracked": len(normalized_apps),
            "active_time": session_active,
            "idle_time": session_idle,
            "active_time_seconds": activity_data.get("active_time_seconds", 0),
            "idle_time_seconds": activity_data.get("idle_time_seconds", 0)
        }
    
    except Exception as e:
        print(f"❌ Error logging activity: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/activity/smart")
async def log_smart_activity(
    activity_data: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database),
    user_agent: Optional[str] = Header(None)
):
    """
    Smart activity logging with AI classification
    Used by desktop agent
    """
    
    # Detect client type
    is_desktop_agent = user_agent and 'Electron' in user_agent
    
    # Validate required fields
    required_fields = ['application', 'duration']
    if not all(field in activity_data for field in required_fields):
        raise HTTPException(
            status_code=400,
            detail=f"Missing required fields: {required_fields}"
        )
          
    # Extract activity data
    app_name = activity_data.get("application", "Unknown")
    window_title = activity_data.get("window_title", "")
    url = activity_data.get("url")
    duration = activity_data.get("duration", 0)
    keyboard_events = activity_data.get("keyboard_events", 0)
    mouse_events = activity_data.get("mouse_events", 0)
    idle_time = activity_data.get("idle_time", 0)
    
    # Skip if duration too short
    if duration < 10:
        return {
            "message": "Activity duration too short, skipped",
            "productivity_score": 0
        }
    
    try:
        # Get AI/ML classification (FIXED INDENTATION)
        classification = await smart_classifier.classify(
            app_name=app_name,
            window_title=window_title,
            url=url,
            duration=duration,
            keyboard_events=keyboard_events,
            mouse_events=mouse_events,
            idle_time=idle_time,
            db=db
        )
        
        # LOG THE CLASSIFICATION (for verification)
        logger.info(f"🤖 AI Classification for {app_name}: {classification}")
        
        # Calculate productivity score
        productivity_score = smart_classifier.calculate_productivity_score(
            classification=classification,
            duration=duration,
            idle_time=idle_time,
            keyboard_events=keyboard_events,
            mouse_events=mouse_events
        )
        
        logger.info(f"📊 Productivity Score: {productivity_score}")
        
        activity_record = {
            "user_id": str(current_user["_id"]),
            "timestamp": datetime.now(),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "application": app_name,
            "window_title": window_title,
            "url": url,
            "duration": duration,
            "idle_time": idle_time,
            "keyboard_events": keyboard_events,
            "mouse_events": mouse_events,
            "classification": classification,
            "productivity_score": productivity_score,
            "source": "desktop" if is_desktop_agent else "web",
            "user_agent": user_agent
        }
        
        result = await db.activities.insert_one(activity_record)
        
        logger.info(
            f"Activity logged for {current_user['email']}: "
            f"{app_name} - Score: {productivity_score}"
        )
        
        # Train models in background if enough data
        background_tasks.add_task(check_and_train, db)
        
        return {
            "success": True,
            "activity_id": str(result.inserted_id),
            "classification": classification,
            "productivity_score": productivity_score
        }
        
    except Exception as e:
        logger.error(f"Error logging smart activity: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to log activity: {str(e)}")


@router.get("/productivity-insights")
async def get_productivity_insights(
    days: int = 7,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get detailed productivity insights for current user
    """
    
    # Get data for specified days
    start_date = datetime.now() - timedelta(days=days)
    
    activities = await db.activities.find({
        "user_id": str(current_user["_id"]),
        "timestamp": {"$gte": start_date}
    }).to_list(length=10000)
    
    if not activities:
        return {
            "period": f"last_{days}_days",
            "total_activities": 0,
            "total_time_hours": 0,
            "average_productivity_score": 0,
            "category_breakdown": {},
            "top_apps": []
        }
    
    # Aggregate by category
    category_stats = {}
    total_time = 0
    total_score = 0
    
    for activity in activities:
        classification = activity.get('classification', {})
        category = classification.get('category', 'other')
        duration = activity.get('duration', 0)
        score = activity.get('productivity_score', 0)
        
        if category not in category_stats:
            category_stats[category] = {
                'time': 0,
                'count': 0,
                'avg_score': 0,
                'total_score': 0
            }
        
        category_stats[category]['time'] += duration
        category_stats[category]['count'] += 1
        category_stats[category]['total_score'] += score
        
        total_time += duration
        total_score += score
    
    # Calculate averages
    for category in category_stats:
        stats = category_stats[category]
        stats['avg_score'] = round(stats['total_score'] / stats['count'], 2)
        stats['time_percentage'] = round((stats['time'] / total_time * 100), 2) if total_time > 0 else 0
        stats['time_hours'] = round(stats['time'] / 3600, 2)
    
    # Overall average
    overall_avg = round(total_score / len(activities), 2) if activities else 0
    
    # Top apps
    app_stats = {}
    for activity in activities:
        app = activity.get('application', 'Unknown')
        if app not in app_stats:
            app_stats[app] = {'time': 0, 'count': 0}
        app_stats[app]['time'] += activity.get('duration', 0)
        app_stats[app]['count'] += 1
    
    top_apps = sorted(app_stats.items(), key=lambda x: x[1]['time'], reverse=True)[:10]
    
    return {
        "period": f"last_{days}_days",
        "total_activities": len(activities),
        "total_time_hours": round(total_time / 3600, 2),
        "average_productivity_score": overall_avg,
        "category_breakdown": category_stats,
        "top_apps": [
            {
                "app": app,
                "time_hours": round(stats['time'] / 3600, 2),
                "sessions": stats['count']
            }
            for app, stats in top_apps
        ]
    }


@router.post("/train-models")
async def train_ml_models(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Manual endpoint to trigger ML model training
    Can be called by employees or HR
    """
    try:
        success = await smart_classifier.train_models(db, min_samples=50)
        
        if success:
            return {
                "success": True,
                "message": "ML models trained successfully"
            }
        else:
            return {
                "success": False,
                "message": "Insufficient data for training (minimum 50 samples required)"
            }
    except Exception as e:
        logger.error(f"Error training models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.get("/activity-history")
async def get_activity_history(
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get activity history for TODAY
    Returns cumulative totals from the LATEST session (which contains all day's data)
    """
    # Use today's date if not provided
    if date:
        target_date = date
    else:
        target_date = datetime.now().strftime("%Y-%m-%d")
    
    # Get all activities for today
    activities = await db.activities.find({
        "user_id": str(current_user["_id"]),
        "date": target_date
    }).sort("recorded_at", -1).to_list(length=1000)
    
    if not activities:
        return {
            "date": target_date,
            "total_activities": 0,
            "summary": {
                "total_mouse_movements": 0,
                "total_key_presses": 0,
                "total_idle_time_seconds": 0,
                "total_active_time_seconds": 0,
                "total_session_time_seconds": 0,
                "activity_count": 0
            },
            "activities": []
        }
    
    # ✅ Get the LATEST record (first in the sorted list)
    # This record contains cumulative totals for the entire day
    latest_activity = activities[0]
    
    # Extract cumulative totals from the LATEST record ONLY
    total_mouse = int(latest_activity.get("total_mouse_movements", 0))
    total_keys = int(latest_activity.get("total_key_presses", 0))
    total_idle_seconds = int(latest_activity.get("idle_time_seconds", 0))
    total_active_seconds = int(latest_activity.get("active_time_seconds", 0))
    total_session_seconds = int(latest_activity.get("session_time_seconds", 0))
    
    # Format all activities for history view
    formatted_activities = []
    for activity in activities:
        formatted_activities.append({
            "id": str(activity["_id"]),
            "session_number": activity.get("session_number"),
            "application": activity.get("current_application"),
            "productivity_score": activity.get("productivity_score"),
            "timestamp": activity.get("timestamp"),
            "recorded_at": activity.get("recorded_at"),
            "source": activity.get("source", "desktop_agent"),
            "idle_time_seconds": int(activity.get("idle_time_seconds", 0)),
            "active_time_seconds": int(activity.get("active_time_seconds", 0)),
            "session_time_seconds": int(activity.get("session_time_seconds", 0)),
            "total_mouse_movements": int(activity.get("total_mouse_movements", 0)),
            "total_key_presses": int(activity.get("total_key_presses", 0))
        })
    
    summary = {
        "total_mouse_movements": total_mouse,
        "total_key_presses": total_keys,
        "total_idle_time_seconds": total_idle_seconds,
        "total_active_time_seconds": total_active_seconds,
        "total_session_time_seconds": total_session_seconds,
        "activity_count": len(formatted_activities)
    }

    return {
        "date": target_date,
        "total_activities": len(formatted_activities),
        "summary": summary,
        "activities": formatted_activities
    }

@router.get("/activity/breakdown/{employee_id}")
async def get_employee_activity_breakdown(
    employee_id: str,
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Get per-application activity breakdown for an employee
    HR ONLY - Shows detailed app usage, mouse/keyboard events per app
    """
    # Check HR permission
    if current_user["role"] != "hr":
        raise HTTPException(status_code=403, detail="HR access only")
    
    # Default to today if no date provided
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    
    try:
        # Find employee
        from bson import ObjectId
        try:
            employee = await db.users.find_one({"_id": ObjectId(employee_id)})
        except:
            raise HTTPException(status_code=400, detail="Invalid employee ID")
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Get all activities for the date
        activities = await db.activities.find({
            "employee_email": employee["email"],
            "timestamp": {"$regex": f"^{date}"}
        }).to_list(1000)
        
        if not activities:
            return {
                "employee": {
                    "id": employee_id,
                    "name": employee.get("full_name", "Unknown"),
                    "email": employee["email"]
                },
                "date": date,
                "total_time_minutes": 0,
                "total_mouse_movements": 0,
                "total_key_presses": 0,
                "applications": []
            }
        
        # Aggregate by application
        app_stats = {}
        total_mouse = 0
        total_keys = 0
        
        for activity in activities:
            total_mouse += activity.get("total_mouse_movements", 0)
            total_keys += activity.get("total_key_presses", 0)
            
            # Process each application in the activity
            for app in activity.get("applications", []):
                app_name = app["application"]
                
                if app_name not in app_stats:
                    app_stats[app_name] = {
                        "application": app_name,
                        "url": app.get("url", ""),
                        "window_title": app.get("window_title", ""),
                        "time_spent_seconds": 0,
                        "mouse_movements": 0,
                        "key_presses": 0
                    }
                
                app_stats[app_name]["time_spent_seconds"] += app.get("time_spent_seconds", 0)
                app_stats[app_name]["mouse_movements"] += app.get("mouse_movements", 0)
                app_stats[app_name]["key_presses"] += app.get("key_presses", 0)
                
                # Update URL if it's more specific
                if app.get("url") and len(app.get("url", "")) > len(app_stats[app_name]["url"]):
                    app_stats[app_name]["url"] = app["url"]
        
        # Convert to list and sort by time
        applications = list(app_stats.values())
        applications.sort(key=lambda x: x["time_spent_seconds"], reverse=True)
        
        # Convert seconds to minutes
        total_time_minutes = sum(app["time_spent_seconds"] for app in applications) // 60
        
        for app in applications:
            app["time_minutes"] = app["time_spent_seconds"] // 60
            del app["time_spent_seconds"]
        
        return {
            "employee": {
                "id": employee_id,
                "name": employee.get("full_name", "Unknown"),
                "email": employee["email"]
            },
            "date": date,
            "total_time_minutes": total_time_minutes,
            "total_mouse_movements": total_mouse,
            "total_key_presses": total_keys,
            "applications": applications
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting activity breakdown: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/last-lifetime-totals")
async def get_last_lifetime_totals(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get lifetime cumulative totals from the user's last completed session"""
    
    # Find the most recent COMPLETED attendance session for this user
    last_session = await db.attendance.find_one(
        {
            "user_id": str(current_user["_id"]),
            "status": "completed"  # Only completed sessions
        },
        sort=[("logout_time", -1)]
    )
    
    if not last_session:
        print(f"[DEBUG] No previous completed session found for user {current_user['email']}")
        return {
            "found": False,
            "lifetime_mouse": 0,
            "lifetime_keys": 0,
            "lifetime_active_seconds": 0,
            "lifetime_idle_seconds": 0
        }
    
    print(f"[DEBUG] Found last session: {last_session['date']}")
    
    # Get the LAST activity record from that session (highest values)
    last_activity = await db.activities.find_one(
        {
            "user_id": str(current_user["_id"]),
            "date": last_session["date"]  # From that specific session date
        },
        sort=[("recorded_at", -1)]
    )
    
    if last_activity:
        totals = {
            "found": True,
            "lifetime_mouse": last_activity.get("total_mouse_movements", 0),
            "lifetime_keys": last_activity.get("total_key_presses", 0),
            "lifetime_active_seconds": last_activity.get("active_time_seconds", 0),
            "lifetime_idle_seconds": last_activity.get("idle_time_seconds", 0),
            "last_session_date": last_session["date"]
        }
        print(f"[DEBUG] Returning totals: mouse={totals['lifetime_mouse']}, active={totals['lifetime_active_seconds']}")
        return totals
    else:
        print(f"[DEBUG] No activity found for session {last_session['date']}")
        return {
            "found": False,
            "lifetime_mouse": 0,
            "lifetime_keys": 0,
            "lifetime_active_seconds": 0,
            "lifetime_idle_seconds": 0
        }
        
@router.get("/session-count")
async def get_session_count(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get current session number (count of attendance records for this employee)"""
    try:
        # Count total attendance records for this employee (including active)
        total_sessions = await db.attendance.count_documents({
            "user_id": str(current_user["_id"])
        })
        
        # Current session number is total + 1 if currently clocked in
        today = datetime.now().strftime("%Y-%m-%d")
        active_session = await db.attendance.find_one({
            "user_id": str(current_user["_id"]),
            "date": today,
            "status": "active"
        })
        
        if active_session:
            session_number = total_sessions
        else:
            session_number = total_sessions + 1
        
        return {
            "session_count": session_number,
            "total_sessions": total_sessions,
            "has_active_session": bool(active_session)
        }
        
    except Exception as e:
        print(f"[ERROR] Session count error: {str(e)}")
        return {"session_count": 1, "total_sessions": 0, "has_active_session": False}

# Background task to check and train models
async def check_and_train(db):
    """Background task to retrain models periodically"""
    try:
        count = await db.activities.count_documents({
            "classification": {"$exists": True}
        })
        
        # Retrain every 500 new records
        if count > 0 and count % 500 == 0:
            logger.info(f"Auto-training triggered at {count} samples")
            await smart_classifier.train_models(db)
    except Exception as e:
        logger.error(f"Background training error: {str(e)}")