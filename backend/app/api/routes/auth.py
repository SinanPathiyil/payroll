from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_database
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.user import UserLogin, UserResponse, Token
from datetime import datetime

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db = Depends(get_database)):
    user = await db.users.find_one({"email": user_data.email})
    
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    access_token = create_access_token(data={"sub": str(user["_id"]), "role": user["role"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "is_active": user["is_active"],
            "office_hours": user.get("office_hours", {"start": "09:00", "end": "18:00"}),
            "required_hours": user.get("required_hours", 8.0)
        }
    }

@router.post("/logout")
async def logout():
    # In a real app, you'd invalidate the token
    return {"message": "Logged out successfully"}