from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from .config import settings
from typing import List, Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============= PASSWORD FUNCTIONS =============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# ============= JWT FUNCTIONS =============

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

# ============= ROLE VALIDATION HELPERS (NEW) =============

VALID_ROLES = ["super_admin", "hr", "business_analyst", "team_lead", "employee"]

def validate_role(role: str) -> bool:
    """Check if role is valid"""
    return role in VALID_ROLES

def has_permission(user_role: str, required_roles: List[str]) -> bool:
    """Check if user has required role permission"""
    return user_role in required_roles

def is_super_admin(user: dict) -> bool:
    """Check if user is super admin"""
    return user.get("role") == "super_admin"

def is_hr(user: dict) -> bool:
    """Check if user is HR"""
    return user.get("role") == "hr"

def is_team_lead(user: dict) -> bool:
    """Check if user is team lead"""
    return user.get("role") == "team_lead"

def is_employee(user: dict) -> bool:
    """Check if user is employee"""
    return user.get("role") == "employee"

def can_manage_teams(user: dict) -> bool:
    """Check if user can manage teams (Super Admin or HR)"""
    return user.get("role") in ["super_admin", "hr"]

def can_manage_projects(user: dict) -> bool:
    """Check if user can manage projects (Super Admin or HR)"""
    return user.get("role") in ["super_admin", "hr"]

def can_assign_tasks(user: dict) -> bool:
    """Check if user can assign tasks (Super Admin, HR, or Team Lead)"""
    return user.get("role") in ["super_admin", "hr", "team_lead"]

def is_business_analyst(user: dict) -> bool:
    """Check if user is Business Analyst"""
    return user.get("role") == "business_analyst"

def can_manage_clients(user: dict) -> bool:
    """Check if user can manage clients (only BA)"""
    return user.get("role") == "business_analyst"

def can_manage_payments(user: dict) -> bool:
    """Check if user can manage payments (BA or HR - but separate data)"""
    return user.get("role") in ["business_analyst", "hr"]