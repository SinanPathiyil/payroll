from os import error
from exceptiongroup import catch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.routes import auth, hr, employee, tasks, messages, agent, notes
from app.api.routes import super_admin, teams, projects, clients, ba_projects, team_lead, payments, meetings, ba_dashboard

# ==================== NEW LEAVE MANAGEMENT ROUTES ====================
from app.api.routes import leave_admin, leave_hr, leave_team_lead, leave_employee, leave_ba

app = FastAPI(title="Employee Tracker API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://payroll-frontend-boehm.netlify.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    conn = connect_to_mongo()
except:
    print("Exception db connection unsuccessful")

# Events
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(super_admin.router, prefix="/api", tags=["super-admin"])
app.include_router(clients.router, prefix="/api", tags=["ba-clients"]) 
app.include_router(ba_projects.router, prefix="/api", tags=["ba-projects"])
app.include_router(team_lead.router, prefix="/api/team-lead", tags=["team-lead"])
app.include_router(payments.router, prefix="/api", tags=["ba-payments"])
app.include_router(meetings.router, prefix="/api", tags=["ba-meetings"])
app.include_router(ba_dashboard.router, prefix="/api", tags=["ba-dashboard"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(hr.router, prefix="/api/hr", tags=["hr"])
app.include_router(employee.router, prefix="/api/employee", tags=["employee"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])

# ==================== NEW LEAVE MANAGEMENT ROUTES ====================
app.include_router(leave_admin.router, prefix="/api/admin/leave", tags=["Admin - Leave Management"])
app.include_router(leave_hr.router, prefix="/api/hr/leave", tags=["HR - Leave Management"])
app.include_router(leave_team_lead.router, prefix="/api/team-lead/leave", tags=["Team Lead - Leave Management"])
app.include_router(leave_employee.router, prefix="/api/employee/leave", tags=["Employee - Leave Management"])
app.include_router(leave_ba.router, prefix="/api/ba/leave", tags=["Business Analyst - Leave Management"])

@app.get("/")
async def root():
    return {"message": "Employee Tracker API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}