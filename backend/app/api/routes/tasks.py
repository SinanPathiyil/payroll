from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_database
from app.api.deps import get_current_user, get_current_hr
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.post("/create", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    task_dict = {
        "title": task_data.title,
        "description": task_data.description,
        "assigned_to": task_data.assigned_to,
        "assigned_by": str(current_user["_id"]),
        "status": "pending",
        "due_date": task_data.due_date,
        "created_at": datetime.now(),
        "completed_at": None
    }
    
    result = await db.tasks.insert_one(task_dict)
    task_dict["_id"] = result.inserted_id
    
    # Send notification to employee
    notification = {
        "from_user": str(current_user["_id"]),
        "to_user": task_data.assigned_to,
        "content": f"New task assigned: {task_data.title}",
        "task_id": str(result.inserted_id),  # <<< ADD THIS LINE
        "is_read": False,
        "created_at": datetime.now()
    }
    await db.messages.insert_one(notification)
    
    
    return {
        "id": str(task_dict["_id"]),
        "title": task_dict["title"],
        "description": task_dict["description"],
        "assigned_to": task_dict["assigned_to"],
        "assigned_by": task_dict["assigned_by"],
        "status": task_dict["status"],
        "due_date": task_dict["due_date"],
        "created_at": task_dict["created_at"],
        "completed_at": task_dict["completed_at"]
    }

@router.get("/my-tasks")
async def get_my_tasks(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    tasks = []
    cursor = db.tasks.find({"assigned_to": str(current_user["_id"])}).sort("created_at", -1)
    
    async for task in cursor:
        tasks.append({
            "id": str(task["_id"]),
            "title": task["title"],
            "description": task["description"],
            "status": task["status"],
            "due_date": task.get("due_date"),
            "created_at": task["created_at"],
            "completed_at": task.get("completed_at")
        })
    
    return tasks

@router.patch("/{task_id}")
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {"status": task_update.status}
    
    if task_update.status == "completed":
        update_data["completed_at"] = datetime.now()
        
        # Notify HR
        notification = {
            "from_user": str(current_user["_id"]),
            "to_user": task["assigned_by"],
            "content": f"Task completed: {task['title']}",
            "task_id": task_id,
            "is_read": False,
            "created_at": datetime.now()
        }
        await db.messages.insert_one(notification)
    
    await db.tasks.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_data}
    )
    
    return {"message": "Task updated successfully"}

@router.get("/all")
async def get_all_tasks(
    current_user: dict = Depends(get_current_hr),
    db = Depends(get_database)
):
    tasks = []
    cursor = db.tasks.find().sort("created_at", -1)
    
    async for task in cursor:
        # Get employee name
        employee = await db.users.find_one({"_id": ObjectId(task["assigned_to"])})
        
        tasks.append({
            "id": str(task["_id"]),
            "title": task["title"],
            "description": task["description"],
            "assigned_to": task["assigned_to"],
            "employee_name": employee.get("full_name", "Unknown") if employee else "Unknown",
            "status": task["status"],
            "due_date": task.get("due_date"),
            "created_at": task["created_at"],
            "completed_at": task.get("completed_at")
        })
    
    return tasks