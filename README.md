
```
payroll
├─ backend
│  ├─ app
│  │  ├─ api
│  │  │  ├─ deps.py
│  │  │  └─ routes
│  │  │     ├─ agent.py
│  │  │     ├─ auth.py
│  │  │     ├─ ba_dashboard.py
│  │  │     ├─ ba_projects.py
│  │  │     ├─ clients.py
│  │  │     ├─ employee.py
│  │  │     ├─ hr.py
│  │  │     ├─ meetings.py
│  │  │     ├─ messages.py
│  │  │     ├─ notes.py
│  │  │     ├─ payments.py
│  │  │     ├─ projects.py
│  │  │     ├─ super_admin.py
│  │  │     ├─ tasks.py
│  │  │     ├─ teams.py
│  │  │     ├─ team_lead.py
│  │  │     └─ __init__.py
│  │  ├─ core
│  │  │  ├─ config.py
│  │  │  ├─ database.py
│  │  │  └─ security.py
│  │  ├─ main.py
│  │  ├─ models
│  │  │  ├─ activity.py
│  │  │  ├─ attendance.py
│  │  │  ├─ audit_log.py
│  │  │  ├─ client.py
│  │  │  ├─ meeting.py
│  │  │  ├─ message.py
│  │  │  ├─ note.py
│  │  │  ├─ override_request.py
│  │  │  ├─ project.py
│  │  │  ├─ task.py
│  │  │  ├─ team.py
│  │  │  └─ user.py
│  │  ├─ schemas
│  │  │  ├─ activity.py
│  │  │  ├─ attendance.py
│  │  │  ├─ audit_log.py
│  │  │  ├─ client.py
│  │  │  ├─ meeting.py
│  │  │  ├─ message.py
│  │  │  ├─ note.py
│  │  │  ├─ override_request.py
│  │  │  ├─ payment.py
│  │  │  ├─ project.py
│  │  │  ├─ task.py
│  │  │  ├─ team.py
│  │  │  └─ user.py
│  │  ├─ services
│  │  │  ├─ activity_tracker.py
│  │  │  ├─ ai_productivity_service.py
│  │  │  ├─ auth_service.py
│  │  │  ├─ employee_service.py
│  │  │  ├─ hr_service.py
│  │  │  └─ smart_classifier.py
│  │  └─ utils
│  │     └─ helpers.py
│  ├─ Dockerfile
│  ├─ requirements.txt
│  └─ runtime.txt
├─ create_hr.py
├─ desktop-agent
│  ├─ activity_tracker.py
│  ├─ agent.py
│  ├─ build
│  ├─ config.json
│  ├─ config.py
│  ├─ dist
│  ├─ electron
│  │  ├─ api.js
│  │  ├─ main.js
│  │  ├─ newFile.js
│  │  ├─ preload.js
│  │  ├─ tracker.js
│  │  └─ tray.js
│  ├─ electron-builder.yml
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ electron.js
│  │  ├─ icons
│  │  │  ├─ icon.icns
│  │  │  ├─ icon.ico
│  │  │  └─ icon.png
│  │  └─ index.html
│  ├─ README.md
│  ├─ requirements.txt
│  ├─ screenshot.txt
│  └─ src
│     └─ index.js
├─ docker-compose.yml
├─ frontend
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  │  └─ favico.ico
│  ├─ src
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  ├─ boehm-bg-full.png
│  │  │  ├─ boehm-logo.png
│  │  │  └─ logo.svg
│  │  ├─ components
│  │  │  ├─ common
│  │  │  │  ├─ Clock.jsx
│  │  │  │  ├─ Layout.jsx
│  │  │  │  ├─ Loader.jsx
│  │  │  │  ├─ Navbar.jsx
│  │  │  │  └─ Sidebar.jsx
│  │  │  ├─ employee
│  │  │  │  ├─ DesktopStats.jsx
│  │  │  │  ├─ MessageBoard.jsx
│  │  │  │  ├─ StickyNotes.jsx
│  │  │  │  ├─ TaskList.jsx
│  │  │  │  ├─ TimeTracker.jsx
│  │  │  │  └─ Widgets.jsx
│  │  │  ├─ hr
│  │  │  │  ├─ AIProductivityScore.jsx
│  │  │  │  ├─ AttendanceTable.jsx
│  │  │  │  ├─ CreateTaskModal.jsx
│  │  │  │  ├─ CreateUserModal.jsx
│  │  │  │  ├─ EmployeeActivityBreakdown.jsx
│  │  │  │  ├─ EmployeeList.jsx
│  │  │  │  ├─ EmployeeStatsModal.jsx
│  │  │  │  ├─ HRMessageBoard.jsx
│  │  │  │  ├─ SendMessageModal.jsx
│  │  │  │  └─ SettingsPanel.jsx
│  │  │  └─ ProtectedRoute.jsx
│  │  ├─ context
│  │  │  └─ AuthContext.jsx
│  │  ├─ hooks
│  │  │  ├─ useActivityTracker.js
│  │  │  ├─ useAuth.js
│  │  │  └─ useWebSocket.js
│  │  ├─ index.css
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ BAClients.jsx
│  │  │  ├─ BADashboard.jsx
│  │  │  ├─ BAMeetings.jsx
│  │  │  ├─ BAPayments.jsx
│  │  │  ├─ BAProjects.jsx
│  │  │  ├─ EmployeeDashboard.jsx
│  │  │  ├─ EmployeeNotes.jsx
│  │  │  ├─ EmployeeTasks.jsx
│  │  │  ├─ EmployeeTimeTracking.jsx
│  │  │  ├─ HRDashboard.jsx
│  │  │  ├─ Login.jsx
│  │  │  ├─ TLDashboard.jsx
│  │  │  └─ TLRequirements.jsx
│  │  ├─ services
│  │  │  ├─ api.js
│  │  │  └─ websocket.js
│  │  ├─ styles
│  │  │  ├─ ba-clients.css
│  │  │  ├─ ba-dashboard.css
│  │  │  ├─ ba-meetings.css
│  │  │  ├─ ba-payments.css
│  │  │  ├─ ba-projects.css
│  │  │  ├─ global.css
│  │  │  ├─ Layout.css
│  │  │  ├─ sidebar.css
│  │  │  ├─ tl-dashboard.css
│  │  │  └─ tl-requirements.css
│  │  └─ utils
│  │     ├─ constants.js
│  │     ├─ electron.js
│  │     └─ helpers.js
│  ├─ tailwind.config.js
│  └─ vite.config.js
└─ README.md

```