from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_database
from app.api.deps import get_current_user
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse
from datetime import datetime
from bson import ObjectId
from typing import List

router = APIRouter()


@router.post("/", response_model=dict)
async def create_note(
    note_data: NoteCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create a new sticky note"""
    if current_user["role"] != "employee":
        raise HTTPException(status_code=403, detail="Only employees can create notes")
    
    note = {
        "user_id": str(current_user["_id"]),
        "title": note_data.title or "",
        "content": note_data.content,
        "color": note_data.color or "yellow",
        "is_pinned": note_data.is_pinned or False,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    result = await db.notes.insert_one(note)
    note["_id"] = result.inserted_id
    
    return {
        "message": "Note created successfully",
        "id": str(result.inserted_id),
        "note": {
            "id": str(note["_id"]),
            "user_id": note["user_id"],
            "title": note["title"],
            "content": note["content"],
            "color": note["color"],
            "is_pinned": note["is_pinned"],
            "created_at": note["created_at"],
            "updated_at": note["updated_at"]
        }
    }


@router.get("/", response_model=List[dict])
async def get_my_notes(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get all notes for current user"""
    if current_user["role"] != "employee":
        raise HTTPException(status_code=403, detail="Only employees can view notes")
    
    notes = await db.notes.find({
        "user_id": str(current_user["_id"])
    }).sort([("is_pinned", -1), ("updated_at", -1)]).to_list(length=100)
    
    formatted_notes = []
    for note in notes:
        formatted_notes.append({
            "id": str(note["_id"]),
            "user_id": note["user_id"],
            "title": note.get("title", ""),
            "content": note["content"],
            "color": note.get("color", "yellow"),
            "is_pinned": note.get("is_pinned", False),
            "created_at": note["created_at"],
            "updated_at": note["updated_at"]
        })
    
    return formatted_notes


@router.put("/{note_id}", response_model=dict)
async def update_note(
    note_id: str,
    note_data: NoteUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update a note"""
    if current_user["role"] != "employee":
        raise HTTPException(status_code=403, detail="Only employees can update notes")
    
    try:
        note_obj_id = ObjectId(note_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    # Check if note exists and belongs to user
    existing_note = await db.notes.find_one({
        "_id": note_obj_id,
        "user_id": str(current_user["_id"])
    })
    
    if not existing_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Build update data
    update_data = {"updated_at": datetime.now()}
    if note_data.title is not None:
        update_data["title"] = note_data.title
    if note_data.content is not None:
        update_data["content"] = note_data.content
    if note_data.color is not None:
        update_data["color"] = note_data.color
    if note_data.is_pinned is not None:
        update_data["is_pinned"] = note_data.is_pinned
    
    result = await db.notes.update_one(
        {"_id": note_obj_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update note")
    
    # Get updated note
    updated_note = await db.notes.find_one({"_id": note_obj_id})
    
    return {
        "message": "Note updated successfully",
        "note": {
            "id": str(updated_note["_id"]),
            "user_id": updated_note["user_id"],
            "title": updated_note.get("title", ""),
            "content": updated_note["content"],
            "color": updated_note.get("color", "yellow"),
            "is_pinned": updated_note.get("is_pinned", False),
            "created_at": updated_note["created_at"],
            "updated_at": updated_note["updated_at"]
        }
    }


@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete a note"""
    if current_user["role"] != "employee":
        raise HTTPException(status_code=403, detail="Only employees can delete notes")
    
    try:
        note_obj_id = ObjectId(note_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    result = await db.notes.delete_one({
        "_id": note_obj_id,
        "user_id": str(current_user["_id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"message": "Note deleted successfully"}


@router.patch("/{note_id}/pin")
async def toggle_pin(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Toggle pin status of a note"""
    if current_user["role"] != "employee":
        raise HTTPException(status_code=403, detail="Only employees can pin notes")
    
    try:
        note_obj_id = ObjectId(note_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    note = await db.notes.find_one({
        "_id": note_obj_id,
        "user_id": str(current_user["_id"])
    })
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    new_pin_status = not note.get("is_pinned", False)
    
    await db.notes.update_one(
        {"_id": note_obj_id},
        {"$set": {
            "is_pinned": new_pin_status,
            "updated_at": datetime.now()
        }}
    )
    
    return {
        "message": "Pin status updated",
        "is_pinned": new_pin_status
    }