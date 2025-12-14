from os import error
from exceptiongroup import catch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.routes import auth, hr, employee, tasks, messages
from app.api.routes import auth, hr, employee, tasks, messages, agent, notes
app = FastAPI(title="Employee Tracker API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ "https://payroll-frontend-boehm.netlify.app",
                   "http://localhost:3000",
           "http://localhost:5173",
           "http://127.0.0.1:3000",
           "http://127.0.0.1:5173",
           "http://127.0.0.1:8000",],  # your frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],

)

try:
    conn = connect_to_mongo()
except:
    print("Execption db connection unsuccessfull")


# Events
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(hr.router, prefix="/api/hr", tags=["hr"])
app.include_router(employee.router, prefix="/api/employee", tags=["employee"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
@app.get("/")
async def root():
    return {"message": "Employee Tracker API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}