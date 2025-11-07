from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime
from os import getenv

# Optional: load .env if python-dotenv is installed (pip install python-dotenv)
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Read from environment (fallbacks provided for local/dev)
MONGODB_URL = getenv("MONGODB_URL") or getenv("MONGO_URL")
DATABASE_NAME = getenv("MONGODB_DB") or getenv("DATABASE_NAME")
def create_hr_user():
    try:
        print("🔄 Connecting to MongoDB...")
        client = MongoClient(MONGODB_URL)
        
        # Test connection
        client.admin.command('ping')
        print("✅ Connected to MongoDB successfully!")
        
        db = client[DATABASE_NAME]
        
        # Create HR user
        existing = db.users.find_one({"email": "hr@company.com"})
        
        if not existing:
            hr_user = {
                "email": "hr@company.com",
                "full_name": "HR Admin",
                "role": "hr",
                "hashed_password": pwd_context.hash("password123"),
                "is_active": True,
                "created_at": datetime.utcnow(),
                "office_hours": {"start": "09:00", "end": "18:00"},
                "required_hours": 8.0
            }
            
            result = db.users.insert_one(hr_user)
            print(f"✅ HR user created! ID: {result.inserted_id}")
        else:
            print("⚠️  HR user already exists")
        
        # Create test employee
        existing_emp = db.users.find_one({"email": "employee@company.com"})
        
        if not existing_emp:
            employee_user = {
                "email": "employee@company.com",
                "full_name": "John Doe",
                "role": "employee",
                "hashed_password": pwd_context.hash("password123"),
                "is_active": True,
                "created_by": None,
                "created_at": datetime.utcnow(),
                "office_hours": {"start": "09:00", "end": "18:00"},
                "required_hours": 8.0
            }
            
            result = db.users.insert_one(employee_user)
            print(f"✅ Employee user created! ID: {result.inserted_id}")
        else:
            print("⚠️  Employee user already exists")
        
        client.close()
        
        print("\n" + "="*50)
        print("🎉 Setup Complete!")
        print("="*50)
        print("\n📋 Login Credentials:")
        print("   HR Portal:")
        print("   └─ Email: hr@company.com")
        print("   └─ Password: password123")
        print("\n   Employee Portal:")
        print("   └─ Email: employee@company.com")
        print("   └─ Password: password123")
        print("\n" + "="*50)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n💡 Troubleshooting:")
        print("   1. Check your MongoDB connection string")
        print("   2. Verify your IP is whitelisted in Atlas")
        print("   3. Ensure username/password are correct")

if __name__ == "__main__":
    create_hr_user()