
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
│  │  │  ├─ ba
│  │  │  │  ├─ AddClientModal.jsx
│  │  │  │  ├─ AddProjectModal.jsx
│  │  │  │  ├─ DeleteClientModal.jsx
│  │  │  │  ├─ DeleteMeetingModal.jsx
│  │  │  │  ├─ DeleteProjectModal.jsx
│  │  │  │  ├─ EditClientModal.jsx
│  │  │  │  ├─ EditMeetingModal.jsx
│  │  │  │  ├─ EditProjectModal.jsx
│  │  │  │  ├─ ExportModal.jsx
│  │  │  │  ├─ MeetingDetailsModal.jsx
│  │  │  │  ├─ RecordPaymentModal.jsx
│  │  │  │  ├─ RequirementsModal.jsx
│  │  │  │  └─ ScheduleMeetingModal.jsx
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
│  │  │  ├─ ProtectedRoute.jsx
│  │  │  └─ tl
│  │  │     └─ SendMessageModal.jsx
│  │  ├─ context
│  │  │  └─ AuthContext.jsx
│  │  ├─ hooks
│  │  │  ├─ useActivityTracker.js
│  │  │  ├─ useAuth.js
│  │  │  └─ useWebSocket.js
│  │  ├─ index.css
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ BAClientDetails.jsx
│  │  │  ├─ BAClients.jsx
│  │  │  ├─ BADashboard.jsx
│  │  │  ├─ BAMeetings.jsx
│  │  │  ├─ BAPayments.jsx
│  │  │  ├─ BAProjectDetails.jsx
│  │  │  ├─ BAProjects.jsx
│  │  │  ├─ EmployeeDashboard.jsx
│  │  │  ├─ EmployeeMessages.jsx
│  │  │  ├─ EmployeeNotes.jsx
│  │  │  ├─ EmployeeTasks.jsx
│  │  │  ├─ EmployeeTimeTracking.jsx
│  │  │  ├─ HRAttendance.jsx
│  │  │  ├─ HRCreateEmployee.jsx
│  │  │  ├─ HRDashboard.jsx
│  │  │  ├─ HREmployeeActivityBreakdown.jsx
│  │  │  ├─ HREmployeeDetails.jsx
│  │  │  ├─ HREmployees.jsx
│  │  │  ├─ HRMessages.jsx
│  │  │  ├─ HRReports.jsx
│  │  │  ├─ HRTasks.jsx
│  │  │  ├─ Login.jsx
│  │  │  ├─ SuperAdminAuditLogs.jsx
│  │  │  ├─ SuperAdminDashboard.jsx
│  │  │  ├─ SuperAdminOverrideRequests.jsx
│  │  │  ├─ SuperAdminSystemStats.jsx
│  │  │  ├─ SuperAdminTeams.jsx
│  │  │  ├─ SuperAdminUsers.jsx
│  │  │  ├─ TLDashboard.jsx
│  │  │  ├─ TLMessages.jsx
│  │  │  ├─ TLProjects.jsx
│  │  │  ├─ TLRequirements.jsx
│  │  │  ├─ TLTasks.jsx
│  │  │  └─ TLTeam.jsx
│  │  ├─ services
│  │  │  ├─ api.js
│  │  │  └─ websocket.js
│  │  ├─ styles
│  │  │  ├─ ba-client-details.css
│  │  │  ├─ ba-clients.css
│  │  │  ├─ ba-dashboard.css
│  │  │  ├─ ba-meetings.css
│  │  │  ├─ ba-modal.css
│  │  │  ├─ ba-payments.css
│  │  │  ├─ ba-project-details.css
│  │  │  ├─ ba-projects.css
│  │  │  ├─ global.css
│  │  │  ├─ hr-dashboard.css
│  │  │  ├─ Layout.css
│  │  │  ├─ sidebar.css
│  │  │  ├─ super-admin-audit.css
│  │  │  ├─ super-admin-dashboard.css
│  │  │  ├─ super-admin-override.css
│  │  │  ├─ super-admin-stats.css
│  │  │  ├─ super-admin-teams.css
│  │  │  ├─ super-admin-users.css
│  │  │  ├─ tl-dashboard.css
│  │  │  ├─ tl-requirements.css
│  │  │  └─ tl-team.css
│  │  └─ utils
│  │     ├─ constants.js
│  │     ├─ electron.js
│  │     └─ helpers.js
│  ├─ tailwind.config.js
│  └─ vite.config.js
└─ README.md

```