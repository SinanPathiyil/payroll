# backend/app/api/routes/employee.py

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from app.core.database import get_database
from app.api.deps import get_current_user
from datetime import datetime, timedelta
from bson import ObjectId
from typing import Optional
import logging

# UNCOMMENT THIS LINE:
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
    
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
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
                "logout_time": datetime.utcnow()
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
        "login_time": datetime.utcnow(),
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
    
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Find active attendance for TODAY
    attendance = await db.attendance.find_one({
        "user_id": str(current_user["_id"]),
        "date": today,
        "status": "active"
    })
    
    if not attendance:
        raise HTTPException(status_code=400, detail="No active clock-in found for today")
    
    logout_time = datetime.utcnow()
    login_time = attendance.get("login_time")
    
    if not login_time:
        raise HTTPException(status_code=400, detail="Invalid attendance record")
    
    # Calculate total hours
    if isinstance(login_time, str):
        from dateutil import parser
        login_time = parser.parse(login_time)
    
    time_diff = logout_time - login_time
    total_hours = time_diff.total_seconds() / 3600
    
    # Update attendance
    result = await db.attendance.update_one(
        {"_id": attendance["_id"]},
        {"$set": {
            "logout_time": logout_time,
            "total_hours": round(total_hours, 2),
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
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
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
        time_diff = datetime.utcnow() - attendance["login_time"]
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
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
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
                logout_time = datetime.utcnow()
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
    Legacy activity logging (web-based)
    For backward compatibility
    """
    # Calculate productivity score based on activity
    mouse_events = activity_data.get("mouse_events", 0)
    keyboard_events = activity_data.get("keyboard_events", 0)
    active_time = activity_data.get("active_time", 0)
    idle_time = activity_data.get("idle_time", 0)
    
    # Simple productivity algorithm
    total_time = active_time + idle_time
    if total_time > 0:
        activity_ratio = active_time / total_time
        event_score = min((mouse_events + keyboard_events) / 100, 1)
        productivity_score = (activity_ratio * 0.7 + event_score * 0.3) * 100
    else:
        productivity_score = 0
    
    activity_record = {
        "user_id": str(current_user["_id"]),
        "session_id": activity_data.get("session_id"),
        "mouse_events": mouse_events,
        "keyboard_events": keyboard_events,
        "idle_time": idle_time,
        "active_time": active_time,
        "productivity_score": round(productivity_score, 2),
        "timestamp": datetime.utcnow(),
        "source": "web",
        "date": datetime.utcnow().strftime("%Y-%m-%d")
    }
    
    await db.activities.insert_one(activity_record)
    
    return {
        "message": "Activity logged",
        "productivity_score": round(productivity_score, 2)
    }


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
            "timestamp": datetime.utcnow(),
            "date": datetime.utcnow().strftime("%Y-%m-%d"),
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
    start_date = datetime.utcnow() - timedelta(days=days)
    
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
    Get activity history for a specific date
    If no date provided, returns today's activities
    """
    if date:
        target_date = date
    else:
        target_date = datetime.utcnow().strftime("%Y-%m-%d")
    
    activities = await db.activities.find({
        "user_id": str(current_user["_id"]),
        "date": target_date
    }).sort("timestamp", -1).to_list(length=1000)
    
    # Format activities
    formatted_activities = []
    for activity in activities:
        formatted_activities.append({
            "id": str(activity["_id"]),
            "application": activity.get("application"),
            "window_title": activity.get("window_title"),
            "duration": activity.get("duration"),
            "productivity_score": activity.get("productivity_score"),
            "category": activity.get("classification", {}).get("category"),
            "timestamp": activity.get("timestamp"),
            "source": activity.get("source", "web")
        })
    
    return {
        "date": target_date,
        "total_activities": len(formatted_activities),
        "activities": formatted_activities
    }


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