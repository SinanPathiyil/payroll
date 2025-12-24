import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import HRDashboard from "./pages/HRDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import BADashboard from "./pages/BADashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import BAClients from "./pages/BAClients";
import BAProjects from "./pages/BAProjects";
import BAPayments from "./pages/BAPayments";
import BAMeetings from "./pages/BAMeetings";
import TLDashboard from "./pages/TLDashboard";
import TLRequirements from "./pages/TLRequirements";

//Import Employee Pages
import EmployeeTasks from "./pages/EmployeeTasks";
import EmployeeMessages from "./pages/EmployeeMessages";
import EmployeeNotes from "./pages/EmployeeNotes";
import EmployeeTimeTracking from "./pages/EmployeeTimeTracking";

//Import HR Pages
import HREmployees from "./pages/HREmployees";
import HREmployeeDetails from "./pages/HREmployeeDetails";
import HRCreateEmployee from "./pages/HRCreateEmployee";
import HRTasks from "./pages/HRTasks";
import HRAttendance from "./pages/HRAttendance";
import HRMessages from "./pages/HRMessages";
import HRReports from "./pages/HRReports";
import HREmployeeActivityBreakdown from "./pages/HREmployeeActivityBreakdown";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Business Analyst Routes */}
        <Route
          path="/ba-dashboard"
          element={
            <ProtectedRoute role="business_analyst">
              <BADashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ba/clients"
          element={
            <ProtectedRoute role="business_analyst">
              <BAClients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ba/projects"
          element={
            <ProtectedRoute role="business_analyst">
              <BAProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ba/payments"
          element={
            <ProtectedRoute role="business_analyst">
              <BAPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ba/meetings"
          element={
            <ProtectedRoute role="business_analyst">
              <BAMeetings />
            </ProtectedRoute>
          }
        />
        {/* Team Lead Routes */}
        <Route
          path="/tl-dashboard"
          element={
            <ProtectedRoute role="team_lead">
              <TLDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tl/requirements"
          element={
            <ProtectedRoute role="team_lead">
              <TLRequirements />
            </ProtectedRoute>
          }
        />
        {/* HR Routes */}
        <Route
          path="/hr-dashboard"
          element={
            <ProtectedRoute role="hr">
              <HRDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/employees"
          element={
            <ProtectedRoute role="hr">
              <HREmployees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/employees/:employeeId"
          element={
            <ProtectedRoute role="hr">
              <HREmployeeDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/employees/:employeeId/activity-breakdown"
          element={
            <ProtectedRoute role="hr">
              <HREmployeeActivityBreakdown />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/employees/create"
          element={
            <ProtectedRoute role="hr">
              <HRCreateEmployee />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/tasks"
          element={
            <ProtectedRoute role="hr">
              <HRTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/attendance"
          element={
            <ProtectedRoute role="hr">
              <HRAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/messages"
          element={
            <ProtectedRoute role="hr">
              <HRMessages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/reports"
          element={
            <ProtectedRoute role="hr">
              <HRReports />
            </ProtectedRoute>
          }
        />
        {/* ✅ Employee Routes */}
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute role="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/tasks"
          element={
            <ProtectedRoute role="employee">
              <EmployeeTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/messages"
          element={
            <ProtectedRoute role="employee">
              <EmployeeMessages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/notes"
          element={
            <ProtectedRoute role="employee">
              <EmployeeNotes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/time-tracking"
          element={
            <ProtectedRoute role="employee">
              <EmployeeTimeTracking />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
