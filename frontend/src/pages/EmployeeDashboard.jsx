import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import Clock from "../components/common/Clock";
import TaskList from "../components/employee/TaskList";
import MessageBoard from "../components/employee/MessageBoard";
import TimeTracker from "../components/employee/TimeTracker";
import {
  getEmployeeStatus,
  getMyTasks,
  getMyMessages,
  getActivityHistory,
} from "../services/api";
import {
  Clock as ClockIcon,
  ListTodo,
  MessageSquare,
  Activity,
  CheckCircle,
} from "lucide-react";

export default function EmployeeDashboard() {
  const { user } = useContext(AuthContext);

  const [status, setStatus] = useState({
    is_clocked_in: false,
    today_total_hours: 0,
    current_active_hours: 0,
    login_time: null,
    date: null,
  });

  const [highlightTaskId, setHighlightTaskId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityStats, setActivityStats] = useState({
    mouseEvents: 0,
    keyboardEvents: 0,
    activeTime: 0,
    idleTime: 0,
  });

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setError(null);

      const [statusRes, tasksRes, messagesRes, activityRes] = await Promise.all(
        [
          getEmployeeStatus(),
          getMyTasks(),
          getMyMessages(),
          getActivityHistory(),
        ]
      );

      const statusData = statusRes.data || statusRes;

      setStatus({
        is_clocked_in: statusData.is_clocked_in === true,
        today_total_hours: statusData.today_total_hours || 0,
        current_active_hours: statusData.current_active_hours || 0,
        login_time: statusData.login_time || null,
        date: statusData.date || null,
      });

      setTasks(tasksRes.data || []);
      setMessages(messagesRes.data || []);

      const activityData = activityRes.data || activityRes || {};
      const summary = activityData.summary || {};
      setActivityStats({
        mouseEvents: summary.total_mouse_movements || 0,
        keyboardEvents: summary.total_key_presses || 0,
        activeTime: summary.total_active_time_seconds || 0,
        idleTime: summary.total_idle_time_seconds || 0,
      });
    } catch (error) {
      console.error("❌ Failed to load data:", error);
      setError(error.response?.data?.detail || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalTasks: tasks.length,
    pendingTasks: tasks.filter((t) => t.status === "pending").length,
    completedTasks: tasks.filter((t) => t.status === "completed").length,
    unreadMessages: messages.filter((m) => !m.is_read).length,
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner spinner-lg"></div>
        <p className="dashboard-loading-text">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <Navbar />
        <div className="dashboard-content">
          <div className="error-card">
            <h2 className="error-card-title">Error Loading Dashboard</h2>
            <p className="error-card-text">{error}</p>
            <button onClick={loadData} className="btn btn-danger">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar />

      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Employee Dashboard</h1>
            <p className="dashboard-subtitle">
              Welcome back, <strong>{user?.full_name}</strong>
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid stats-grid-4">
          <div className="stat-card stat-card-primary">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p className="stat-card-label">Today's Hours</p>
                <p className="stat-card-value stat-card-value-primary">
                  {status.today_total_hours?.toFixed(2) || "0.00"}
                </p>
                <p className="stat-card-hint">
                  {status.is_clocked_in
                    ? "Real-time tracking"
                    : ""}
                </p>
              </div>
              <div className="stat-card-icon stat-card-icon-blue">
                <ClockIcon className="w-7 h-7" />
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-warning">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p className="stat-card-label">Pending Tasks</p>
                <p className="stat-card-value stat-card-value-warning">
                  {stats.pendingTasks}
                </p>
              </div>
              <div className="stat-card-icon stat-card-icon-orange">
                <ListTodo className="w-7 h-7" />
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-success">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p className="stat-card-label">Completed Tasks</p>
                <p className="stat-card-value stat-card-value-success">
                  {stats.completedTasks}
                </p>
              </div>
              <div className="stat-card-icon stat-card-icon-green">
                <CheckCircle className="w-7 h-7" />
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-info">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p className="stat-card-label">New Messages</p>
                <p className="stat-card-value stat-card-value-info">
                  {stats.unreadMessages}
                </p>
              </div>
              <div className="stat-card-icon stat-card-icon-purple">
                <MessageSquare className="w-7 h-7" />
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Main Content */}
          <div className="dashboard-main">
            {/* Time Tracker */}
            <TimeTracker
              status={status}
              onStatusChange={loadData}
              activityStats={activityStats}
            />

            {/* Tasks */}
            <TaskList
              tasks={tasks}
              onTaskUpdate={loadData}
              highlightTaskId={highlightTaskId}
            />
          </div>

          {/* Sidebar */}
          <div className="dashboard-sidebar">
            <Clock />
            <MessageBoard
              messages={messages}
              onMessageRead={loadData}
              onTaskMessageClick={setHighlightTaskId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}