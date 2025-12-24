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

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* 👇 ADD THIS BA ROUTE */}
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

        <Route
          path="/hr-dashboard"
          element={
            <ProtectedRoute role="hr">
              <HRDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute role="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
