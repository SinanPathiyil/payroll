import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/common/Layout";
import {
  Users,
  UserPlus,
  CheckCircle,
  MessageSquare,
  TrendingUp,
  Clock,
  Calendar,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { getEmployees, getMyMessages } from "../services/api";
import '../styles/hr-dashboard.css';

export default function HRDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesRes, messagesRes] = await Promise.all([
        getEmployees(),
        getMyMessages(),
      ]);
      setEmployees(employeesRes.data || []);
      setMessages(messagesRes.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalEmployees: employees.length,
    activeToday: employees.filter((e) => e.today_status === "active").length,
    unreadMessages: messages.filter((m) => !m.is_read).length,
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

  return (
    <Layout>
      <div className="hr-dashboard">
        {/* Header */}
        <div className="hr-dashboard-header">
          <div>
            <h1 className="hr-dashboard-title">HR Dashboard</h1>
            <p className="hr-dashboard-subtitle">
              Welcome back, <strong>{user?.full_name}</strong>
            </p>
          </div>
          <div className="hr-dashboard-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/hr/employees/create")}
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="hr-stats-grid">
          {/* Total Employees */}
          <div className="hr-stat-card" onClick={() => navigate("/hr/employees")}>
            <div className="hr-stat-content">
              <div className="hr-stat-info">
                <p className="hr-stat-label">Total Employees</p>
                <p className="hr-stat-value">{stats.totalEmployees}</p>
                <p className="hr-stat-hint">
                  <span className="hr-stat-badge success">
                    {stats.activeToday} active today
                  </span>
                </p>
              </div>
              <div className="hr-stat-icon hr-stat-icon-blue">
                <Users className="w-8 h-8" />
              </div>
            </div>
            <div className="hr-stat-footer">
              <span>View all employees</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Attendance */}
          <div className="hr-stat-card" onClick={() => navigate("/hr/attendance")}>
            <div className="hr-stat-content">
              <div className="hr-stat-info">
                <p className="hr-stat-label">Active Today</p>
                <p className="hr-stat-value">{stats.activeToday}</p>
                <p className="hr-stat-hint">
                  <span className="hr-stat-badge info">
                    {stats.totalEmployees - stats.activeToday} offline
                  </span>
                </p>
              </div>
              <div className="hr-stat-icon hr-stat-icon-green">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            <div className="hr-stat-footer">
              <span>View attendance</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Messages */}
          <div className="hr-stat-card" onClick={() => navigate("/hr/messages")}>
            <div className="hr-stat-content">
              <div className="hr-stat-info">
                <p className="hr-stat-label">New Messages</p>
                <p className="hr-stat-value">{stats.unreadMessages}</p>
                <p className="hr-stat-hint">
                  <span className="hr-stat-badge info">
                    {messages.length} total
                  </span>
                </p>
              </div>
              <div className="hr-stat-icon hr-stat-icon-orange">
                <MessageSquare className="w-8 h-8" />
              </div>
            </div>
            <div className="hr-stat-footer">
              <span>View messages</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="hr-content-grid">
          {/* Recent Employees */}
          <div className="hr-card">
            <div className="hr-card-header">
              <div className="hr-card-title">
                <Users className="w-5 h-5" />
                <span>Active Employees Today</span>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => navigate("/hr/employees")}
              >
                View All
              </button>
            </div>
            <div className="hr-card-body">
              {employees.filter(e => e.today_status === "active").length === 0 ? (
                <div className="hr-empty-state">
                  <Clock className="hr-empty-icon" />
                  <p>No active employees today</p>
                </div>
              ) : (
                <div className="hr-activity-list">
                  {employees
                    .filter((e) => e.today_status === "active")
                    .slice(0, 5)
                    .map((employee) => (
                      <div 
                        key={employee.id} 
                        className="hr-activity-item"
                        onClick={() => navigate(`/hr/employees/${employee.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="hr-activity-indicator" style={{ backgroundColor: '#10b981' }} />
                        <div className="hr-activity-content">
                          <p className="hr-activity-message">
                            <strong>{employee.full_name}</strong>
                          </p>
                          <p className="hr-activity-time">
                            {employee.today_hours?.toFixed(2) || "0.00"} hours today
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="hr-card">
            <div className="hr-card-header">
              <div className="hr-card-title">
                <MessageSquare className="w-5 h-5" />
                <span>Recent Messages</span>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => navigate("/hr/messages")}
              >
                View All
              </button>
            </div>
            <div className="hr-card-body">
              {messages.length === 0 ? (
                <div className="hr-empty-state">
                  <MessageSquare className="hr-empty-icon" />
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="hr-activity-list">
                  {messages.slice(0, 5).map((message) => (
                    <div key={message.id} className="hr-activity-item">
                      <div 
                        className="hr-activity-indicator" 
                        style={{ 
                          backgroundColor: message.is_read ? '#9ca3af' : '#3b82f6'
                        }} 
                      />
                      <div className="hr-activity-content">
                        <p className="hr-activity-message">
                          <strong>{message.sender_name}</strong>
                        </p>
                        <p className="hr-activity-time">
                          {message.subject || message.content?.substring(0, 50)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="hr-card">
          <div className="hr-card-header">
            <div className="hr-card-title">
              <TrendingUp className="w-5 h-5" />
              <span>Quick Actions</span>
            </div>
          </div>
          <div className="hr-card-body">
            <div className="hr-quick-actions">
              <button
                className="hr-quick-action-btn"
                onClick={() => navigate("/hr/employees/create")}
              >
                <UserPlus className="w-5 h-5" />
                <span>Add New Employee</span>
              </button>
              <button
                className="hr-quick-action-btn"
                onClick={() => navigate("/hr/attendance")}
              >
                <Calendar className="w-5 h-5" />
                <span>View Attendance</span>
              </button>
              <button
                className="hr-quick-action-btn"
                onClick={() => navigate("/hr/reports")}
              >
                <Activity className="w-5 h-5" />
                <span>Generate Report</span>
              </button>
              <button
                className="hr-quick-action-btn"
                onClick={() => navigate("/hr/messages")}
              >
                <MessageSquare className="w-5 h-5" />
                <span>View Messages</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}