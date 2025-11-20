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
    """Get all messages for current user"""
    messages = []
    cursor = db.messages.find({
        "to_user": str(current_user["_id"])
    }).sort("created_at", -1)
    
    async for message in cursor:
        # Get sender info
        sender = await db.users.find_one({"_id": ObjectId(message["from_user"])})
        
        messages.append({
            "id": str(message["_id"]),
            "from_user": message["from_user"],
            "from_name": sender.get("full_name", "Unknown") if sender else "Unknown",
            "content": message["content"],
            "is_read": message["is_read"],
            "created_at": message["created_at"]
        })
    
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