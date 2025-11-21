from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_database
from app.api.deps import get_current_user
from app.schemas.message import MessageCreate, MessageResponse
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.get("/my-messages")
async def get_my_messages(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all messages for current user (both received and sent)"""
    messages = []
    
    # Get received messages
    received_cursor = db.messages.find({
        "to_user": str(current_user["_id"])
    }).sort("created_at", -1)
    
    async for message in received_cursor:
        # Get sender info
        sender = await db.users.find_one({"_id": ObjectId(message["from_user"])})
        
        messages.append({
            "id": str(message["_id"]),
            "from_user": message["from_user"],
            "to_user": message["to_user"],
            "from_name": sender.get("full_name", "Unknown") if sender else "Unknown",
            "content": message["content"],
            "is_read": message["is_read"],
            "created_at": message["created_at"],
            "task_id": message.get("task_id"),
            "direction": "received"  # <<< THIS IS NEW
        })
    
    # Get sent messages
    sent_cursor = db.messages.find({
        "from_user": str(current_user["_id"])
    }).sort("created_at", -1)
    
    async for message in sent_cursor:
        # Get recipient info
        recipient = await db.users.find_one({"_id": ObjectId(message["to_user"])})
        
        messages.append({
            "id": str(message["_id"]),
            "from_user": message["from_user"],
            "to_user": message["to_user"],
            "to_name": recipient.get("full_name", "Unknown") if recipient else "Unknown",
            "content": message["content"],
            "is_read": message["is_read"],
            "created_at": message["created_at"],
            "task_id": message.get("task_id"),
            "direction": "sent"  # <<< THIS IS NEW
        })
    
    # Sort all messages by date (most recent first)
    messages.sort(key=lambda x: x["created_at"], reverse=True)
    
    return messages

@router.put("/{message_id}/read")
async def mark_as_read(
    message_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Mark message as read"""
    result = await db.messages.update_one(
        {
            "_id": ObjectId(message_id),
            "to_user": str(current_user["_id"])
        },
        {"$set": {"is_read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return {"message": "Marked as read"}

@router.post("/send")
async def send_message(
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Send a message to user"""
    # Verify recipient exists
    recipient = await db.users.find_one({"_id": ObjectId(message_data.to_user)})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    message = {
        "from_user": str(current_user["_id"]),
        "to_user": message_data.to_user,
        "content": message_data.content,
        "is_read": False,
        "created_at": datetime.now()
    }
    
    # Add task_id if provided (optional)
    if hasattr(message_data, 'task_id') and message_data.task_id:
        message["task_id"] = message_data.task_id
    
    result = await db.messages.insert_one(message)
    message["_id"] = result.inserted_id
    
    return {
        "id": str(message["_id"]),
        "message": "Message sent successfully"
    }

@router.get("/unread-count")
async def get_unread_count(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get count of unread messages"""
    count = await db.messages.count_documents({
        "to_user": str(current_user["_id"]),
        "is_read": False
    })
    
    return {"unread_count": count}