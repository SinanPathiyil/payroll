
```
payroll
├─ backend
│  ├─ app
│  │  ├─ api
│  │  │  ├─ deps.py
│  │  │  └─ routes
│  │  │     ├─ agent.py
│  │  │     ├─ auth.py
│  │  │     ├─ employee.py
│  │  │     ├─ hr.py
│  │  │     ├─ messages.py
│  │  │     ├─ tasks.py
│  │  │     └─ __init__.py
│  │  ├─ core
│  │  │  ├─ config.py
│  │  │  ├─ database.py
│  │  │  └─ security.py
│  │  ├─ main.py
│  │  ├─ models
│  │  │  ├─ activity.py
│  │  │  ├─ attendance.py
│  │  │  ├─ message.py
│  │  │  ├─ task.py
│  │  │  └─ user.py
│  │  ├─ schemas
│  │  │  ├─ activity.py
│  │  │  ├─ attendance.py
│  │  │  ├─ message.py
│  │  │  ├─ task.py
│  │  │  └─ user.py
│  │  ├─ services
│  │  │  ├─ activity_tracker.py
│  │  │  ├─ auth_service.py
│  │  │  ├─ employee_service.py
│  │  │  ├─ hr_service.py
│  │  │  └─ smart_classifier.py
│  │  └─ utils
│  │     └─ helpers.py
│  ├─ Dockerfile
│  └─ requirements.txt
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
│  │  │  │  ├─ Loader.jsx
│  │  │  │  ├─ Navbar.jsx
│  │  │  │  └─ Sidebar.jsx
│  │  │  ├─ employee
│  │  │  │  ├─ DesktopStats.jsx
│  │  │  │  ├─ MessageBoard.jsx
│  │  │  │  ├─ TaskList.jsx
│  │  │  │  ├─ TimeTracker.jsx
│  │  │  │  └─ Widgets.jsx
│  │  │  ├─ hr
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
│  │  │  ├─ EmployeeDashboard.jsx
│  │  │  ├─ HRDashboard.jsx
│  │  │  └─ Login.jsx
│  │  ├─ services
│  │  │  ├─ api.js
│  │  │  └─ websocket.js
│  │  ├─ styles
│  │  │  └─ global.css
│  │  └─ utils
│  │     ├─ constants.js
│  │     ├─ electron.js
│  │     └─ helpers.js
│  ├─ tailwind.config.js
│  └─ vite.config.js
└─ README.md

```