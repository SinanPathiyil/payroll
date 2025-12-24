from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime
from os import getenv

# Optional: load .env if python-dotenv is installed
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Read from environment
MONGODB_URL = getenv("MONGODB_URL") or getenv("MONGO_URL")
DATABASE_NAME = getenv("MONGODB_DB") or getenv("DATABASE_NAME")

def create_all_users():
    try:
        print("🔄 Connecting to MongoDB...")
        client = MongoClient(MONGODB_URL)
        
        # Test connection
        client.admin.command('ping')
        print("✅ Connected to MongoDB successfully!")
        
        db = client[DATABASE_NAME]
        
        # Define all users to create
        users_to_create = [
            {
                "email": "hr@company.com",
                "full_name": "HR Admin",
                "role": "hr",
                "password": "password123"
            },
            {
                "email": "employee@company.com",
                "full_name": "John Doe",
                "role": "employee",
                "password": "password123"
            },
            {
                "email": "tl@company.com",
                "full_name": "Team Lead",
                "role": "team_lead",
                "password": "password123"
            },
            {
                "email": "ba@company.com",
                "full_name": "Business Analyst",
                "role": "business_analyst",
                "password": "password123"
            },
            {
                "email": "admin@company.com",
                "full_name": "Super Admin",
                "role": "super_admin",
                "password": "password123"
            }
        ]
        
        print("\n" + "="*50)
        print("👥 Creating Users...")
        print("="*50 + "\n")
        
        for user_data in users_to_create:
            existing = db.users.find_one({"email": user_data["email"]})
            
            if not existing:
                user = {
                    "email": user_data["email"],
                    "full_name": user_data["full_name"],
                    "role": user_data["role"],
                    "hashed_password": pwd_context.hash(user_data["password"]),
                    "is_active": True,
                    "created_at": datetime.now(),
                    "office_hours": {"start": "09:00", "end": "18:00"},
                    "required_hours": 8.0,
                    "base_salary": 50000.0 if user_data["role"] == "employee" else 0.0
                }
                
                result = db.users.insert_one(user)
                print(f"✅ {user_data['role'].upper():<15} created! ({user_data['email']})")
            else:
                print(f"⚠️  {user_data['role'].upper():<15} already exists ({user_data['email']})")
        
        client.close()
        
        print("\n" + "="*50)
        print("🎉 Setup Complete!")
        print("="*50)
        print("\n📋 Login Credentials (All passwords: password123):")
        print("="*50)
        
        for user_data in users_to_create:
            print(f"\n   {user_data['role'].upper().replace('_', ' ')}:")
            print(f"   └─ Email: {user_data['email']}")
        
        print("\n" + "="*50)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n💡 Troubleshooting:")
        print("   1. Check your MongoDB connection string")
        print("   2. Verify your IP is whitelisted in Atlas")
        print("   3. Ensure username/password are correct")

if __name__ == "__main__":
    create_all_users()