from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Tuple
from bson import ObjectId
import holidays  # pip install holidays

class LeaveService:
    
    def __init__(self, db):
        self.db = db
        self.leave_types_collection = db["leave_types"]
        self.leave_policies_collection = db["leave_policies"]
        self.leave_balances_collection = db["leave_balances"]
        self.leave_requests_collection = db["leave_requests"]
        self.public_holidays_collection = db["public_holidays"]
        self.users_collection = db["users"]
        self.teams_collection = db["teams"]
    
    # ==================== LEAVE TYPE OPERATIONS ====================
    
    async def create_leave_type(self, leave_type_data: dict, admin_id: str) -> dict:
        """Create a new leave type"""
        leave_type_data["created_by"] = admin_id
        leave_type_data["created_at"] = datetime.now()
        leave_type_data["updated_at"] = None
        
        result = await self.leave_types_collection.insert_one(leave_type_data)
        leave_type_data["_id"] = result.inserted_id
        return leave_type_data
    
    async def get_leave_types(self, active_only: bool = True) -> List[dict]:
        """Get all leave types"""
        query = {"is_active": True} if active_only else {}
        cursor = self.leave_types_collection.find(query)
        return await cursor.to_list(length=None)
    
    async def get_leave_type_by_code(self, code: str) -> Optional[dict]:
        """Get leave type by code"""
        return await self.leave_types_collection.find_one({"code": code, "is_active": True})
    
    async def update_leave_type(self, leave_type_id: str, update_data: dict) -> bool:
        """Update leave type"""
        update_data["updated_at"] = datetime.now()
        result = await self.leave_types_collection.update_one(
            {"_id": ObjectId(leave_type_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def delete_leave_type(self, leave_type_id: str) -> bool:
        """Soft delete leave type"""
        result = await self.leave_types_collection.update_one(
            {"_id": ObjectId(leave_type_id)},
            {"$set": {"is_active": False, "updated_at": datetime.now()}}
        )
        return result.modified_count > 0
    
    # ==================== PUBLIC HOLIDAY OPERATIONS ====================
    
    async def create_holiday(self, holiday_data: dict, admin_id: str) -> dict:
        """Create a public holiday"""
        holiday_data["created_by"] = admin_id
        holiday_data["created_at"] = datetime.now()
        holiday_data["updated_at"] = None
        holiday_data["imported"] = False
        
        result = await self.public_holidays_collection.insert_one(holiday_data)
        holiday_data["_id"] = result.inserted_id
        return holiday_data
    
    async def import_holidays_from_country(self, country: str, year: int, admin_id: str) -> int:
        """Import holidays for a country using holidays library"""
        try:
            country_holidays = holidays.country_holidays(country, years=year)
            imported_count = 0
            
            for holiday_date, holiday_name in country_holidays.items():
                # Check if already exists
                exists = await self.public_holidays_collection.find_one({
                    "date": holiday_date,
                    "country": country
                })
                
                if not exists:
                    holiday_data = {
                        "name": holiday_name,
                        "date": holiday_date,
                        "country": country,
                        "is_optional": False,
                        "description": f"Imported from {country} calendar",
                        "is_active": True,
                        "imported": True,
                        "created_by": admin_id,
                        "created_at": datetime.now(),
                        "updated_at": None
                    }
                    await self.public_holidays_collection.insert_one(holiday_data)
                    imported_count += 1
            
            return imported_count
        except Exception as e:
            print(f"Error importing holidays: {e}")
            return 0
    
    async def get_holidays_by_year(self, year: int) -> List[dict]:
        """Get all holidays for a specific year"""
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)
        
        cursor = self.public_holidays_collection.find({
            "date": {"$gte": start_date, "$lte": end_date},
            "is_active": True
        }).sort("date", 1)
        
        return await cursor.to_list(length=None)
    
    async def get_holiday_dates(self, year: int) -> List[date]:
        """Get list of holiday dates for calculations"""
        holidays_list = await self.get_holidays_by_year(year)
        return [h["date"] for h in holidays_list]
    
    async def update_holiday(self, holiday_id: str, update_data: dict) -> bool:
        """Update holiday"""
        update_data["updated_at"] = datetime.now()
        result = await self.public_holidays_collection.update_one(
            {"_id": ObjectId(holiday_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def delete_holiday(self, holiday_id: str) -> bool:
        """Delete holiday"""
        result = await self.public_holidays_collection.delete_one(
            {"_id": ObjectId(holiday_id)}
        )
        return result.deleted_count > 0
    
    # ==================== LEAVE POLICY OPERATIONS ====================
    
    async def create_or_update_policy(self, year: int, policy_data: dict, admin_id: str) -> dict:
        """Create or update leave policy for a year"""
        existing = await self.leave_policies_collection.find_one({"year": year})
        
        if existing:
            # Update existing
            policy_data["updated_by"] = admin_id
            policy_data["updated_at"] = datetime.now()
            await self.leave_policies_collection.update_one(
                {"year": year},
                {"$set": policy_data}
            )
            existing.update(policy_data)
            return existing
        else:
            # Create new
            policy_data["year"] = year
            policy_data["updated_by"] = admin_id
            policy_data["created_at"] = datetime.now()
            policy_data["updated_at"] = None
            policy_data["is_active"] = True
            
            result = await self.leave_policies_collection.insert_one(policy_data)
            policy_data["_id"] = result.inserted_id
            return policy_data
    
    async def get_policy_by_year(self, year: int) -> Optional[dict]:
        """Get leave policy for a specific year"""
        return await self.leave_policies_collection.find_one({"year": year, "is_active": True})
    
    async def get_current_policy(self) -> Optional[dict]:
        """Get current year's policy"""
        current_year = datetime.now().year
        return await self.get_policy_by_year(current_year)
    
    # ==================== LEAVE BALANCE OPERATIONS ====================
    
    async def allocate_leaves(self, user_id: str, year: int, leave_type_code: str, days: float) -> dict:
        """Allocate leaves to a user"""
        # Check if balance already exists
        existing = await self.leave_balances_collection.find_one({
            "user_id": user_id,
            "year": year,
            "leave_type_code": leave_type_code
        })
        
        if existing:
            # Update existing allocation
            new_allocated = existing["allocated"] + days
            new_total = new_allocated + existing["carried_forward"]
            new_available = new_total - existing["used"] - existing["pending"]
            
            await self.leave_balances_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "allocated": new_allocated,
                    "total_available": new_total,
                    "available": new_available,
                    "last_updated": datetime.now()
                }}
            )
            existing["allocated"] = new_allocated
            existing["total_available"] = new_total
            existing["available"] = new_available
            return existing
        else:
            # Create new balance
            balance_data = {
                "user_id": user_id,
                "year": year,
                "leave_type_code": leave_type_code,
                "allocated": days,
                "carried_forward": 0,
                "total_available": days,
                "used": 0,
                "pending": 0,
                "available": days,
                "carry_forward_expires_on": None,
                "last_updated": datetime.now()
            }
            
            result = await self.leave_balances_collection.insert_one(balance_data)
            balance_data["_id"] = result.inserted_id
            return balance_data
    
    async def initialize_user_balances(self, user_id: str, role: str, year: int):
        """Initialize leave balances for a new user based on policy"""
        policy = await self.get_policy_by_year(year)
        if not policy:
            return
        
        # Find role allocations
        for role_allocation in policy.get("role_allocations", []):
            if role_allocation["role"] == role:
                for allocation in role_allocation["allocations"]:
                    await self.allocate_leaves(
                        user_id=user_id,
                        year=year,
                        leave_type_code=allocation["leave_type_code"],
                        days=allocation["days"]
                    )
    
    async def get_user_balances(self, user_id: str, year: int) -> List[dict]:
        """Get all leave balances for a user"""
        cursor = self.leave_balances_collection.find({
            "user_id": user_id,
            "year": year
        })
        balances = await cursor.to_list(length=None)
        
        # Enrich with leave type names
        for balance in balances:
            leave_type = await self.get_leave_type_by_code(balance["leave_type_code"])
            if leave_type:
                balance["leave_type_name"] = leave_type["name"]
        
        return balances
    
    async def get_user_balance_by_type(self, user_id: str, year: int, leave_type_code: str) -> Optional[dict]:
        """Get specific leave balance for a user"""
        return await self.leave_balances_collection.find_one({
            "user_id": user_id,
            "year": year,
            "leave_type_code": leave_type_code
        })
    
    async def update_balance_on_request(self, user_id: str, year: int, leave_type_code: str, days: float, status: str):
        """Update balance when leave is requested/approved/rejected/cancelled"""
        balance = await self.get_user_balance_by_type(user_id, year, leave_type_code)
        if not balance:
            return
        
        if status == "pending":
            # Add to pending, subtract from available
            await self.leave_balances_collection.update_one(
                {"_id": balance["_id"]},
                {"$inc": {
                    "pending": days,
                    "available": -days
                }, "$set": {"last_updated": datetime.now()}}
            )
        elif status == "approved":
            # Move from pending to used
            await self.leave_balances_collection.update_one(
                {"_id": balance["_id"]},
                {"$inc": {
                    "pending": -days,
                    "used": days
                }, "$set": {"last_updated": datetime.now()}}
            )
        elif status in ["rejected", "cancelled"]:
            # Return to available
            await self.leave_balances_collection.update_one(
                {"_id": balance["_id"]},
                {"$inc": {
                    "pending": -days,
                    "available": days
                }, "$set": {"last_updated": datetime.now()}}
            )
    
    # ==================== LEAVE CALCULATION ====================
    
    def calculate_leave_days(
        self,
        start_date: date,
        end_date: date,
        is_half_day: bool,
        exclude_weekends: bool,
        exclude_holidays: bool,
        weekend_days: List[str],
        holiday_dates: List[date]
    ) -> Tuple[float, List[str]]:
        """
        Calculate actual leave days excluding weekends and holidays
        Returns: (total_days, excluded_dates)
        """
        if is_half_day:
            return (0.5, [])
        
        total_days = 0
        excluded_dates = []
        current_date = start_date
        
        # Map weekend days to Python weekday numbers
        weekday_map = {
            "monday": 0, "tuesday": 1, "wednesday": 2,
            "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6
        }
        excluded_weekdays = [weekday_map[day.lower()] for day in weekend_days] if exclude_weekends else []
        
        while current_date <= end_date:
            is_excluded = False
            
            # Check if weekend
            if exclude_weekends and current_date.weekday() in excluded_weekdays:
                excluded_dates.append(current_date.isoformat())
                is_excluded = True
            
            # Check if public holiday
            if exclude_holidays and current_date in holiday_dates:
                excluded_dates.append(current_date.isoformat())
                is_excluded = True
            
            if not is_excluded:
                total_days += 1
            
            current_date += timedelta(days=1)
        
        return (float(total_days), excluded_dates)
    
    # ==================== LEAVE REQUEST OPERATIONS ====================
    
    async def generate_request_number(self, year: int) -> str:
        """Generate unique request number: LR-2024-00001"""
        # Count requests for this year
        count = await self.leave_requests_collection.count_documents({
            "request_number": {"$regex": f"^LR-{year}-"}
        })
        return f"LR-{year}-{str(count + 1).zfill(5)}"
    
    async def create_leave_request(self, request_data: dict, user: dict) -> dict:
        """Create a new leave request"""
        # Get policy
        year = request_data["start_date"].year
        policy = await self.get_policy_by_year(year)
        if not policy:
            raise ValueError("No leave policy found for this year")
        
        # Get leave type
        leave_type = await self.get_leave_type_by_code(request_data["leave_type_code"])
        if not leave_type:
            raise ValueError("Invalid leave type")
        
        # Get holiday dates
        holiday_dates = await self.get_holiday_dates(year)
        
        # Calculate leave days
        total_days, excluded_dates = self.calculate_leave_days(
            start_date=request_data["start_date"],
            end_date=request_data["end_date"],
            is_half_day=request_data.get("is_half_day", False),
            exclude_weekends=policy["exclude_weekends"],
            exclude_holidays=policy["exclude_public_holidays"],
            weekend_days=policy["weekend_days"],
            holiday_dates=holiday_dates
        )
        
        # Check balance
        balance = await self.get_user_balance_by_type(user["_id"], year, request_data["leave_type_code"])
        if balance and balance["available"] < total_days:
            # Check if unpaid leave is allowed
            if request_data["leave_type_code"] != "UNPAID":
                raise ValueError(f"Insufficient leave balance. Available: {balance['available']}, Required: {total_days}")
        
        # Get team lead info
        team_lead_id = None
        team_lead_name = None
        if user.get("team_id"):
            team = await self.teams_collection.find_one({"_id": ObjectId(user["team_id"])})
            if team:
                team_lead_id = team.get("team_lead_id")
                if team_lead_id:
                    tl = await self.users_collection.find_one({"_id": ObjectId(team_lead_id)})
                    if tl:
                        team_lead_name = tl.get("full_name")
        
        # Generate request number
        request_number = await self.generate_request_number(year)
        
        # Create request
        leave_request = {
            "request_number": request_number,
            "user_id": str(user["_id"]),
            "user_name": user["full_name"],
            "user_email": user["email"],
            "user_role": user["role"],
            "team_lead_id": team_lead_id,
            "team_lead_name": team_lead_name,
            "leave_type_code": request_data["leave_type_code"],
            "leave_type_name": leave_type["name"],
            "leave_type_color": leave_type["color"],
            "start_date": request_data["start_date"],
            "end_date": request_data["end_date"],
            "is_half_day": request_data.get("is_half_day", False),
            "half_day_period": request_data.get("half_day_period"),
            "total_days": total_days,
            "excluded_dates": excluded_dates,
            "reason": request_data["reason"],
            "attachment_url": request_data.get("attachment_url"),
            "status": "pending",
            "reviewed_by_hr_id": None,
            "reviewed_by_hr_name": None,
            "hr_action": None,
            "hr_notes": None,
            "hr_action_at": None,
            "cancelled_by": None,
            "cancelled_at": None,
            "cancelled_reason": None,
            "requested_at": datetime.now(),
            "tl_notified": False,
            "hr_notified": False,
            "user_notified": False
        }
        
        result = await self.leave_requests_collection.insert_one(leave_request)
        leave_request["_id"] = result.inserted_id
        
        # Update balance
        await self.update_balance_on_request(
            user_id=str(user["_id"]),
            year=year,
            leave_type_code=request_data["leave_type_code"],
            days=total_days,
            status="pending"
        )
        
        return leave_request
    
    async def approve_leave_request(self, request_id: str, hr_user: dict, notes: Optional[str] = None) -> dict:
        """Approve leave request"""
        leave_request = await self.leave_requests_collection.find_one({"_id": ObjectId(request_id)})
        if not leave_request:
            raise ValueError("Leave request not found")
        
        if leave_request["status"] != "pending":
            raise ValueError(f"Cannot approve request with status: {leave_request['status']}")
        
        # Update request
        update_data = {
            "status": "approved",
            "reviewed_by_hr_id": str(hr_user["_id"]),
            "reviewed_by_hr_name": hr_user["full_name"],
            "hr_action": "approved",
            "hr_notes": notes,
            "hr_action_at": datetime.now(),
            "user_notified": False  # Will be notified
        }
        
        await self.leave_requests_collection.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": update_data}
        )
        
        # Update balance (from pending to used)
        year = leave_request["start_date"].year
        await self.update_balance_on_request(
            user_id=leave_request["user_id"],
            year=year,
            leave_type_code=leave_request["leave_type_code"],
            days=leave_request["total_days"],
            status="approved"
        )
        
        leave_request.update(update_data)
        return leave_request
    
    async def reject_leave_request(self, request_id: str, hr_user: dict, notes: str) -> dict:
        """Reject leave request"""
        leave_request = await self.leave_requests_collection.find_one({"_id": ObjectId(request_id)})
        if not leave_request:
            raise ValueError("Leave request not found")
        
        if leave_request["status"] != "pending":
            raise ValueError(f"Cannot reject request with status: {leave_request['status']}")
        
        # Update request
        update_data = {
            "status": "rejected",
            "reviewed_by_hr_id": str(hr_user["_id"]),
            "reviewed_by_hr_name": hr_user["full_name"],
            "hr_action": "rejected",
            "hr_notes": notes,
            "hr_action_at": datetime.now(),
            "user_notified": False
        }
        
        await self.leave_requests_collection.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": update_data}
        )
        
        # Return balance
        year = leave_request["start_date"].year
        await self.update_balance_on_request(
            user_id=leave_request["user_id"],
            year=year,
            leave_type_code=leave_request["leave_type_code"],
            days=leave_request["total_days"],
            status="rejected"
        )
        
        leave_request.update(update_data)
        return leave_request
    
    async def cancel_leave_request(self, request_id: str, user_id: str, reason: str) -> dict:
        """Cancel leave request (by employee)"""
        leave_request = await self.leave_requests_collection.find_one({"_id": ObjectId(request_id)})
        if not leave_request:
            raise ValueError("Leave request not found")
        
        if leave_request["user_id"] != user_id:
            raise ValueError("Unauthorized to cancel this request")
        
        if leave_request["status"] == "cancelled":
            raise ValueError("Request already cancelled")
        
        # Update request
        update_data = {
            "status": "cancelled",
            "cancelled_by": user_id,
            "cancelled_at": datetime.now(),
            "cancelled_reason": reason
        }
        
        await self.leave_requests_collection.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": update_data}
        )
        
        # Return balance
        year = leave_request["start_date"].year
        await self.update_balance_on_request(
            user_id=leave_request["user_id"],
            year=year,
            leave_type_code=leave_request["leave_type_code"],
            days=leave_request["total_days"],
            status="cancelled"
        )
        
        leave_request.update(update_data)
        return leave_request
    
    async def get_leave_requests(self, filters: dict = {}, skip: int = 0, limit: int = 100) -> List[dict]:
        """Get leave requests with filters"""
        cursor = self.leave_requests_collection.find(filters).sort("requested_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=None)
    
    async def get_leave_request_by_id(self, request_id: str) -> Optional[dict]:
        """Get single leave request"""
        return await self.leave_requests_collection.find_one({"_id": ObjectId(request_id)})
    
    async def get_user_leave_requests(self, user_id: str, year: Optional[int] = None) -> List[dict]:
        """Get all leave requests for a user"""
        filters = {"user_id": user_id}
        if year:
            start_date = date(year, 1, 1)
            end_date = date(year, 12, 31)
            filters["start_date"] = {"$gte": start_date, "$lte": end_date}
        
        return await self.get_leave_requests(filters)
    
    async def get_team_leave_requests(self, team_lead_id: str, status: Optional[str] = None) -> List[dict]:
        """Get leave requests for team members (TL view)"""
        filters = {"team_lead_id": team_lead_id}
        if status:
            filters["status"] = status
        
        return await self.get_leave_requests(filters)
    
    async def get_pending_hr_approvals(self) -> List[dict]:
        """Get all pending leave requests for HR"""
        return await self.get_leave_requests({"status": "pending"})
    
    async def get_leave_stats(self) -> dict:
        """Get leave statistics for HR dashboard"""
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)  # ← FIX: datetime object
        
        # Pending approvals
        pending_count = await self.leave_requests_collection.count_documents({"status": "pending"})
        
        # Approved today
        tomorrow = today + timedelta(days=1)
        approved_today_count = await self.leave_requests_collection.count_documents({
            "status": "approved",
            "hr_action_at": {
                "$gte": today,
                "$lt": tomorrow
            }
        })
        
        # On leave today
        on_leave_today_count = await self.leave_requests_collection.count_documents({
            "status": "approved",
            "start_date": {"$lte": today},  # ← Now works with datetime
            "end_date": {"$gte": today}      # ← Now works with datetime
        })
        
        # Total requests
        total_requests = await self.leave_requests_collection.count_documents({})
        
        return {
            "pending_count": pending_count,
            "approved_today_count": approved_today_count,
            "on_leave_today_count": on_leave_today_count,
            "total_requests": total_requests
        }
    
    async def get_employees_on_leave_today(self) -> List[dict]:
        """Get list of employees on leave today"""
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)  # ← FIX
        
        cursor = self.leave_requests_collection.find({
            "status": "approved",
            "start_date": {"$lte": today},
            "end_date": {"$gte": today}
        })
        
        return await cursor.to_list(length=None)