import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/common/Layout";
import axios from "axios";
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Briefcase,
  UserCog,
  AlertCircle,
  Activity,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Settings,
  CheckCircle,
} from "lucide-react";
import "../styles/super-admin-dashboard.css";

export default function SuperAdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/super-admin/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load system statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="ba-dashboard">
          <div className="ba-alert ba-alert-error">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header" style={{ marginBottom: "2rem" }}>
          <div>
            <h1 className="ba-dashboard-title">Super Admin Dashboard</h1>
            <p className="ba-dashboard-subtitle">
              Welcome back, <strong>{user?.full_name}</strong> - System Overview
              & Management
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="ba-stats-grid" style={{ marginBottom: "2rem" }}>
          {/* Total Users */}
          <div
            className="ba-stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/admin/users")}
          >
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Users</p>
                <p className="ba-stat-value">{stats?.total_users || 0}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge success">
                    {stats?.active_users || 0} active
                  </span>
                  <span className="ba-stat-badge warning">
                    {stats?.inactive_users || 0} inactive
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Users className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>Manage all users</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Active Users */}
          <div
            className="ba-stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/admin/users")}
          >
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Active Users</p>
                <p className="ba-stat-value">{stats?.active_users || 0}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge info">
                    Currently logged in
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <UserCheck className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>View active users</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Pending Requests */}
          <div
            className="ba-stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/admin/override-requests")}
          >
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Override Requests</p>
                <p className="ba-stat-value">
                  {stats?.pending_override_requests || 0}
                </p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge warning">
                    Pending approval
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
                <AlertCircle className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>Review requests</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Teams */}
          <div
            className="ba-stat-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/admin/teams")}
          >
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Teams</p>
                <p className="ba-stat-value">{stats?.total_teams || 0}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge info">
                    Organization structure
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-purple">
                <Briefcase className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>Manage teams</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="ba-content-grid" style={{ marginBottom: "2rem" }}>
          {/* Role Distribution */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <TrendingUp className="w-5 h-5" />
                <span>Role Distribution</span>
              </div>
            </div>
            <div className="ba-card-body">
              <div style={{ display: "grid", gap: "1rem" }}>
                {[
                  {
                    title: "Super Admins",
                    value: stats?.role_distribution?.super_admin || 0,
                    icon: Shield,
                    color: "#8b5cf6",
                  },
                  {
                    title: "HR Managers",
                    value: stats?.role_distribution?.hr || 0,
                    icon: UserCog,
                    color: "#6366f1",
                  },
                  {
                    title: "Team Leads",
                    value: stats?.role_distribution?.team_lead || 0,
                    icon: Briefcase,
                    color: "#3b82f6",
                  },
                  {
                    title: "Business Analysts",
                    value: stats?.role_distribution?.business_analyst || 0,
                    icon: Activity,
                    color: "#14b8a6",
                  },
                  {
                    title: "Employees",
                    value: stats?.role_distribution?.employee || 0,
                    icon: Users,
                    color: "#6b7280",
                  },
                ].map((role, index) => {
                  const Icon = role.icon;
                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "1rem",
                        backgroundColor: "#f9fafb",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "8px",
                            backgroundColor: `${role.color}15`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: role.color,
                          }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span style={{ fontWeight: "500", color: "#374151" }}>
                          {role.title}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "700",
                          color: "#111827",
                        }}
                      >
                        {role.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* System Activity */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Activity className="w-5 h-5" />
                <span>System Activity</span>
              </div>
            </div>
            <div className="ba-card-body">
              <div style={{ display: "grid", gap: "1rem" }}>
                {/* Today's Logins */}
                <div
                  style={{
                    padding: "1.25rem",
                    backgroundColor: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: "#22c55e20",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#22c55e",
                      }}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#15803d",
                          margin: 0,
                          fontWeight: "600",
                          textTransform: "uppercase",
                        }}
                      >
                        Today's Logins
                      </p>
                      <p
                        style={{
                          fontSize: "1.75rem",
                          fontWeight: "700",
                          color: "#15803d",
                          margin: 0,
                        }}
                      >
                        {stats?.todays_logins || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Active Now */}
                <div
                  style={{
                    padding: "1.25rem",
                    backgroundColor: "#eff6ff",
                    borderRadius: "8px",
                    border: "1px solid #dbeafe",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: "#3b82f620",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#3b82f6",
                      }}
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#1e40af",
                          margin: 0,
                          fontWeight: "600",
                          textTransform: "uppercase",
                        }}
                      >
                        Active Now
                      </p>
                      <p
                        style={{
                          fontSize: "1.75rem",
                          fontWeight: "700",
                          color: "#1e40af",
                          margin: 0,
                        }}
                      >
                        {stats?.active_users || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* System Health */}
                <div
                  style={{
                    padding: "1.25rem",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          margin: "0 0 0.25rem 0",
                          fontWeight: "600",
                          textTransform: "uppercase",
                        }}
                      >
                        System Health
                      </p>
                      <p
                        style={{
                          fontSize: "1rem",
                          fontWeight: "600",
                          color: "#22c55e",
                          margin: 0,
                        }}
                      >
                        All Systems Operational
                      </p>
                    </div>
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: "#22c55e",
                        boxShadow: "0 0 0 4px #22c55e30",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="ba-card" style={{ marginBottom: "2rem" }}>
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Settings className="w-5 h-5" />
              <span>Quick Actions</span>
            </div>
          </div>
          <div className="ba-card-body">
            <div className="ba-quick-actions">
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate("/admin/users")}
              >
                <Users className="w-5 h-5" />
                <span>Manage Users</span>
              </button>
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate("/admin/teams")}
              >
                <Briefcase className="w-5 h-5" />
                <span>Manage Teams</span>
              </button>
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate("/admin/override-requests")}
              >
                <AlertCircle className="w-5 h-5" />
                <span>Override Requests</span>
              </button>
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate("/admin/audit-logs")}
              >
                <Activity className="w-5 h-5" />
                <span>Audit Logs</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
