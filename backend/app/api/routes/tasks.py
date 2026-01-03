from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_database
from app.api.deps import get_current_user
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from bson import ObjectId
from datetime import datetime

router = APIRouter()

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
        
        # Notify the person who assigned the task (TL or HR)
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