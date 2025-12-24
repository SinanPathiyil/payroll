import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/common/Layout";
import {
  Users,
  UserPlus,
  CheckCircle,
  ListTodo,
  MessageSquare,
  TrendingUp,
  Clock,
  Calendar,
  Activity,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { getEmployees, getAllTasks, getMyMessages } from "../services/api";

export default function HRDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesRes, tasksRes, messagesRes] = await Promise.all([
        getEmployees(),
        getAllTasks(),
        getMyMessages(),
      ]);
      setEmployees(employeesRes.data || []);
      setTasks(tasksRes.data || []);
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
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === "completed").length,
    pendingTasks: tasks.filter((t) => t.status === "pending").length,
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
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div>
            <h1 className="ba-dashboard-title">HR Dashboard</h1>
            <p className="ba-dashboard-subtitle">
              Welcome back, <strong>{user?.full_name}</strong>
            </p>
          </div>
          <div className="ba-dashboard-actions">
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/hr/tasks")}
            >
              <ListTodo className="w-4 h-4" />
              <span>Assign Task</span>
            </button>
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
        <div className="ba-stats-grid">
          {/* Total Employees */}
          <div className="ba-stat-card" onClick={() => navigate("/hr/employees")}>
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Employees</p>
                <p className="ba-stat-value">{stats.totalEmployees}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge success">
                    {stats.activeToday} active today
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Users className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>View all employees</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Tasks */}
          <div className="ba-stat-card" onClick={() => navigate("/hr/tasks")}>
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Tasks</p>
                <p className="ba-stat-value">{stats.totalTasks}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge warning">
                    {stats.pendingTasks} pending
                  </span>
                  <span className="ba-stat-badge success">
                    {stats.completedTasks} completed
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-purple">
                <ListTodo className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>Manage tasks</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Attendance */}
          <div className="ba-stat-card" onClick={() => navigate("/hr/attendance")}>
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Active Today</p>
                <p className="ba-stat-value">{stats.activeToday}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge info">
                    {stats.totalEmployees - stats.activeToday} offline
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>View attendance</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Messages */}
          <div className="ba-stat-card" onClick={() => navigate("/hr/messages")}>
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">New Messages</p>
                <p className="ba-stat-value">{stats.unreadMessages}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge info">
                    {messages.length} total
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
                <MessageSquare className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>View messages</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="ba-content-grid">
          {/* Recent Employees */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
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
            <div className="ba-card-body">
              {employees.filter(e => e.today_status === "active").length === 0 ? (
                <div className="ba-empty-state">
                  <Clock className="ba-empty-icon" />
                  <p>No active employees today</p>
                </div>
              ) : (
                <div className="ba-activity-list">
                  {employees
                    .filter((e) => e.today_status === "active")
                    .slice(0, 5)
                    .map((employee) => (
                      <div 
                        key={employee.id} 
                        className="ba-activity-item"
                        onClick={() => navigate(`/hr/employees/${employee.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="ba-activity-indicator" style={{ backgroundColor: '#10b981' }} />
                        <div className="ba-activity-content">
                          <p className="ba-activity-message">
                            <strong>{employee.full_name}</strong>
                          </p>
                          <p className="ba-activity-time">
                            {employee.today_hours?.toFixed(2) || "0.00"} hours today
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <ListTodo className="w-5 h-5" />
                <span>Recent Tasks</span>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => navigate("/hr/tasks")}
              >
                View All
              </button>
            </div>
            <div className="ba-card-body">
              {tasks.length === 0 ? (
                <div className="ba-empty-state">
                  <ListTodo className="ba-empty-icon" />
                  <p>No tasks assigned yet</p>
                </div>
              ) : (
                <div className="ba-activity-list">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="ba-activity-item">
                      <div 
                        className="ba-activity-indicator" 
                        style={{ 
                          backgroundColor: 
                            task.status === 'completed' ? '#10b981' : 
                            task.status === 'in_progress' ? '#3b82f6' : '#f59e0b' 
                        }} 
                      />
                      <div className="ba-activity-content">
                        <p className="ba-activity-message">
                          <strong>{task.title}</strong>
                        </p>
                        <p className="ba-activity-time">
                          Assigned to: {task.employee_name} | Status: {task.status}
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
        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <TrendingUp className="w-5 h-5" />
              <span>Quick Actions</span>
            </div>
          </div>
          <div className="ba-card-body">
            <div className="ba-quick-actions">
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate("/hr/employees/create")}
              >
                <UserPlus className="w-5 h-5" />
                <span>Add New Employee</span>
              </button>
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate("/hr/tasks")}
              >
                <ListTodo className="w-5 h-5" />
                <span>Assign Task</span>
              </button>
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate("/hr/attendance")}
              >
                <Calendar className="w-5 h-5" />
                <span>View Attendance</span>
              </button>
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate("/hr/reports")}
              >
                <Activity className="w-5 h-5" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}