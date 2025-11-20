from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.core.database import get_database
from app.api.deps import get_current_user
from datetime import datetime
import os

router = APIRouter()

@router.post("/activity")
async def log_agent_activity(
    activity_data: dict,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Log activity from desktop agent"""
    
    # Add user_id and timestamp
    activity_record = {
        "user_id": str(current_user["_id"]),
        "mouse_events": activity_data.get("mouse_events", 0),
        "keyboard_events": activity_data.get("keyboard_events", 0),
        "active_window": activity_data.get("active_window"),
        "running_apps": activity_data.get("running_apps", {}),
        "is_idle": activity_data.get("is_idle", False),
        "idle_time": activity_data.get("idle_time", 0),
        "timestamp": datetime.now(),
        "source": "desktop_agent"
    }
    
    await db.activities.insert_one(activity_record)
    
    return {"message": "Activity logged", "timestamp": activity_record["timestamp"]}

@router.post("/screenshot")
async def upload_agent_screenshot(
    screenshot: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Upload screenshot from desktop agent"""
    
    # Create directory
    screenshots_dir = "agent_screenshots"
    os.makedirs(screenshots_dir, exist_ok=True)
    
    # Save file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{current_user['_id']}_{timestamp}.jpg"
    filepath = os.path.join(screenshots_dir, filename)
    
    with open(filepath, "wb") as f:
        content = await screenshot.read()
        f.write(content)
    
    # Save record
    screenshot_record = {
        "user_id": str(current_user["_id"]),
        "filename": filename,
        "filepath": filepath,
        "timestamp": datetime.now(),
        "source": "desktop_agent"
    }
    
    await db.screenshots.insert_one(screenshot_record)
    
    return {"message": "Screenshot uploaded", "filename": filename}

@router.get("/screenshots/list")
async def list_screenshots(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """List all screenshots for HR"""
    if current_user["role"] != "hr":
        raise HTTPException(status_code=403, detail="Only HR can view screenshots")
    
    screenshots = []
    cursor = db.screenshots.find().sort("timestamp", -1).limit(100)
    
    async for screenshot in cursor:
        screenshots.append({
            "id": str(screenshot["_id"]),
            "user_id": screenshot["user_id"],
            "filename": screenshot["filename"],
            "timestamp": screenshot["timestamp"]
        })
    
    return screenshots