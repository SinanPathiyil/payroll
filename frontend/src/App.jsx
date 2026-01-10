import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth
import Login from './pages/Login';

// Employee Pages
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeLeaveBalance from './pages/EmployeeLeaveBalance';
import EmployeeLeaveHistory from './pages/EmployeeLeaveHistory';
import EmployeeLeaveCalendar from './pages/EmployeeLeaveCalendar';
import EmployeeMessages from './pages/EmployeeMessages';
import EmployeeNotes from './pages/EmployeeNotes';
import EmployeeTasks from './pages/EmployeeTasks';
import EmployeeTimeTracking from './pages/EmployeeTimeTracking';

// Team Lead Pages
import TLDashboard from './pages/TLDashboard';
import TLLeaveRequests from './pages/TLLeaveRequests';
import TLTeamCalendar from './pages/TLTeamCalendar';
import TLMyLeave from './pages/TLMyLeave';
import TLMessages from './pages/TLMessages';
import TLProjects from './pages/TLProjects';
import TLRequirements from './pages/TLRequirements';
import TLTasks from './pages/TLTasks';
import TLTeam from './pages/TLTeam';

// HR Pages
import HRDashboard from './pages/HRDashboard';
import HRLeaveManagement from './pages/HRLeaveManagement';
import HRLeaveApprovals from './pages/HRLeaveApprovals';
import HRCompanyCalendar from './pages/HRCompanyCalendar';
import HRLeaveAllocation from './pages/HRLeaveAllocation';
import HRLeaveAllRequests from './pages/HRLeaveAllRequests';
import HRAttendance from './pages/HRAttendance';
import HRCreateEmployee from './pages/HRCreateEmployee';
import HREmployeeActivityBreakdown from './pages/HREmployeeActivityBreakdown';
import HREmployeeDetails from './pages/HREmployeeDetails';
import HREmployees from './pages/HREmployees';
import HRMessages from './pages/HRMessages';
import HROverrideRequests from './pages/HROverrideRequests';
import HRReports from './pages/HRReports';

// Admin Pages
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminLeaveTypes from './pages/SuperAdminLeaveTypes';
import SuperAdminPublicHolidays from './pages/SuperAdminPublicHolidays';
import SuperAdminLeavePolicies from './pages/SuperAdminLeavePolicies';
import SuperAdminAuditLogs from './pages/SuperAdminAuditLogs';
import SuperAdminSystemStats from './pages/SuperAdminSystemStats';
import SuperAdminTeams from './pages/SuperAdminTeams';
import SuperAdminUsers from './pages/SuperAdminUsers';
import SuperAdminOverrideRequests from './pages/SuperAdminOverrideRequests';

// BA Pages
import BADashboard from './pages/BADashboard';
import BAClients from './pages/BAClients';
import BAClientDetails from './pages/BAClientDetails';
import BAProjects from './pages/BAProjects';
import BAProjectDetails from './pages/BAProjectDetails';
import BAPayments from './pages/BAPayments';
import BAMeetings from './pages/BAMeetings';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Employee Routes */}
        <Route path="/employee-dashboard" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>} />
        <Route path="/employee/leave/balance" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeLeaveBalance /></ProtectedRoute>} />
        <Route path="/employee/leave/history" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeLeaveHistory /></ProtectedRoute>} />
        <Route path="/employee/leave/calendar" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeLeaveCalendar /></ProtectedRoute>} />
        <Route path="/employee/messages" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeMessages /></ProtectedRoute>} />
        <Route path="/employee/notes" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeNotes /></ProtectedRoute>} />
        <Route path="/employee/tasks" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeTasks /></ProtectedRoute>} />
        <Route path="/employee/time-tracking" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeTimeTracking /></ProtectedRoute>} />

        {/* Team Lead Routes */}
        <Route path="/tl-dashboard" element={<ProtectedRoute allowedRoles={['team_lead']}><TLDashboard /></ProtectedRoute>} />
        <Route path="/tl/leave/team-requests" element={<ProtectedRoute allowedRoles={['team_lead']}><TLLeaveRequests /></ProtectedRoute>} />
        <Route path="/tl/leave/team-calendar" element={<ProtectedRoute allowedRoles={['team_lead']}><TLTeamCalendar /></ProtectedRoute>} />
        <Route path="/tl/leave/my-leave" element={<ProtectedRoute allowedRoles={['team_lead']}><TLMyLeave /></ProtectedRoute>} />
        <Route path="/tl/messages" element={<ProtectedRoute allowedRoles={['team_lead']}><TLMessages /></ProtectedRoute>} />
        <Route path="/tl/projects" element={<ProtectedRoute allowedRoles={['team_lead']}><TLProjects /></ProtectedRoute>} />
        <Route path="/tl/requirements" element={<ProtectedRoute allowedRoles={['team_lead']}><TLRequirements /></ProtectedRoute>} />
        <Route path="/tl/tasks" element={<ProtectedRoute allowedRoles={['team_lead']}><TLTasks /></ProtectedRoute>} />
        <Route path="/tl/team" element={<ProtectedRoute allowedRoles={['team_lead']}><TLTeam /></ProtectedRoute>} />

        {/* HR Routes */}
        <Route path="/hr-dashboard" element={<ProtectedRoute role="hr"><HRDashboard /></ProtectedRoute>} />
        <Route path="/hr/employees" element={<ProtectedRoute role="hr"><HREmployees /></ProtectedRoute>} />
        <Route path="/hr/employees/:employeeId" element={<ProtectedRoute role="hr"><HREmployeeDetails /></ProtectedRoute>} />
        <Route path="/hr/employees/:employeeId/activity-breakdown" element={<ProtectedRoute role="hr"><HREmployeeActivityBreakdown /></ProtectedRoute>} />
        <Route path="/hr/employees/create" element={<ProtectedRoute role="hr"><HRCreateEmployee /></ProtectedRoute>} />
        <Route path="/hr/attendance" element={<ProtectedRoute role="hr"><HRAttendance /></ProtectedRoute>} />

        {/* HR Leave Routes */}
        <Route path="/hr/leave" element={<ProtectedRoute role="hr"><HRLeaveManagement /></ProtectedRoute>} />
        <Route path="/hr/leave/approvals" element={<ProtectedRoute role="hr"><HRLeaveApprovals /></ProtectedRoute>} />
        <Route path="/hr/leave/all-requests" element={<ProtectedRoute role="hr"><HRLeaveAllRequests /></ProtectedRoute>} />
        <Route path="/hr/leave/calendar" element={<ProtectedRoute role="hr"><HRCompanyCalendar /></ProtectedRoute>} />
        <Route path="/hr/leave/allocation" element={<ProtectedRoute role="hr"><HRLeaveAllocation /></ProtectedRoute>} />

        <Route path="/hr/messages" element={<ProtectedRoute role="hr"><HRMessages /></ProtectedRoute>} />
        <Route path="/hr/reports" element={<ProtectedRoute role="hr"><HRReports /></ProtectedRoute>} />
        <Route path="/hr/override-requests" element={<ProtectedRoute role="hr"><HROverrideRequests /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/super-admin-dashboard" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/leave/types" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminLeaveTypes /></ProtectedRoute>} />
        <Route path="/admin/leave/holidays" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminPublicHolidays /></ProtectedRoute>} />
        <Route path="/admin/leave/policies" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminLeavePolicies /></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminAuditLogs /></ProtectedRoute>} />
        <Route path="/admin/stats" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminSystemStats /></ProtectedRoute>} />
        <Route path="/admin/teams" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminTeams /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminUsers /></ProtectedRoute>} />
        <Route path="/admin/override-requests" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminOverrideRequests /></ProtectedRoute>} />

        {/* BA Routes */}
        <Route path="/ba-dashboard" element={<ProtectedRoute allowedRoles={['business_analyst']}><BADashboard /></ProtectedRoute>} />
        <Route path="/ba/clients" element={<ProtectedRoute allowedRoles={['business_analyst']}><BAClients /></ProtectedRoute>} />
        <Route path="/ba/clients/:id" element={<ProtectedRoute allowedRoles={['business_analyst']}><BAClientDetails /></ProtectedRoute>} />
        <Route path="/ba/projects" element={<ProtectedRoute allowedRoles={['business_analyst']}><BAProjects /></ProtectedRoute>} />
        <Route path="/ba/projects/:id" element={<ProtectedRoute allowedRoles={['business_analyst']}><BAProjectDetails /></ProtectedRoute>} />
        <Route path="/ba/payments" element={<ProtectedRoute allowedRoles={['business_analyst']}><BAPayments /></ProtectedRoute>} />
        <Route path="/ba/meetings" element={<ProtectedRoute allowedRoles={['business_analyst']}><BAMeetings /></ProtectedRoute>} />

        {/* Redirect root based on role - handle in Login component */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;