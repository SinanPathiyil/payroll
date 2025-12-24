import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/common/Layout";
import Clock from "../components/common/Clock";
import TaskList from "../components/employee/TaskList";
import MessageBoard from "../components/employee/MessageBoard";
import TimeTracker from "../components/employee/TimeTracker";
import StickyNotes from "../components/employee/StickyNotes";

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
  Mouse,
  Keyboard,
  Timer,
  Coffee,
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

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
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
          <div className="ba-card">
            <div className="ba-card-body">
              <div className="ba-empty-state">
                <Activity className="ba-empty-icon" style={{ color: '#ef4444' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginTop: '1rem' }}>
                  Error Loading Dashboard
                </h2>
                <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>{error}</p>
                <button onClick={loadData} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Retry
                </button>
              </div>
            </div>
          </div>
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
            <h1 className="ba-dashboard-title">Employee Dashboard</h1>
            <p className="ba-dashboard-subtitle">
              Welcome back, <strong>{user?.full_name}</strong>
            </p>
          </div>
        </div>

        {/* Stats Cards - 4 Column Grid */}
        <div className="ba-stats-grid">
          {/* Today's Hours Card */}
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Today's Hours</p>
                <p className="ba-stat-value">
                  {status.today_total_hours?.toFixed(2) || "0.00"}
                </p>
                <p className="ba-stat-hint">
                  <span className={`ba-stat-badge ${status.is_clocked_in ? 'success' : 'secondary'}`}>
                    {status.is_clocked_in ? "Clocked In" : "Clocked Out"}
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <ClockIcon className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>Real-time tracking</span>
            </div>
          </div>

          {/* Pending Tasks Card */}
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Pending Tasks</p>
                <p className="ba-stat-value">{stats.pendingTasks}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge warning">
                    {stats.totalTasks} total
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
                <ListTodo className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>View all tasks</span>
            </div>
          </div>

          {/* Completed Tasks Card */}
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Completed Tasks</p>
                <p className="ba-stat-value">{stats.completedTasks}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge success">
                    {stats.totalTasks > 0 
                      ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` 
                      : '0%'} complete
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>Keep up the good work!</span>
            </div>
          </div>

          {/* Unread Messages Card */}
          <div className="ba-stat-card">
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
              <div className="ba-stat-icon ba-stat-icon-purple">
                <MessageSquare className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>Check your inbox</span>
            </div>
          </div>
        </div>

        {/* Time Tracker Section */}
        <TimeTracker
          status={status}
          onStatusChange={loadData}
          activityStats={activityStats}
        />

        {/* Activity Stats Overview */}
        <div className="ba-card ba-performance-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Activity className="w-5 h-5" />
              <span>Today's Activity Overview</span>
            </div>
          </div>
          <div className="ba-card-body">
            <div className="ba-performance-grid">
              <div className="ba-performance-item">
                <div className="ba-performance-label">
                  <Mouse className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Mouse Events
                </div>
                <div className="ba-performance-value">
                  {activityStats.mouseEvents.toLocaleString()}
                </div>
              </div>
              <div className="ba-performance-item">
                <div className="ba-performance-label">
                  <Keyboard className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Keyboard Events
                </div>
                <div className="ba-performance-value">
                  {activityStats.keyboardEvents.toLocaleString()}
                </div>
              </div>
              <div className="ba-performance-item">
                <div className="ba-performance-label">
                  <Timer className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Active Time
                </div>
                <div className="ba-performance-value">
                  {formatTime(activityStats.activeTime)}
                </div>
              </div>
              <div className="ba-performance-item">
                <div className="ba-performance-label">
                  <Coffee className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Idle Time
                </div>
                <div className="ba-performance-value">
                  {formatTime(activityStats.idleTime)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - 2 Columns */}
        <div className="ba-content-grid">
          {/* Tasks Section */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <ListTodo className="w-5 h-5" />
                <span>My Tasks</span>
              </div>
              <span className="ba-stat-badge info">{tasks.length}</span>
            </div>
            <div className="ba-card-body" style={{ padding: 0 }}>
              <TaskList
                tasks={tasks}
                onTaskUpdate={loadData}
                highlightTaskId={highlightTaskId}
              />
            </div>
          </div>

          {/* Messages Section */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <MessageSquare className="w-5 h-5" />
                <span>Messages</span>
              </div>
              {stats.unreadMessages > 0 && (
                <span className="ba-stat-badge warning">{stats.unreadMessages} new</span>
              )}
            </div>
            <div className="ba-card-body" style={{ padding: 0 }}>
              <MessageBoard
                messages={messages}
                onMessageRead={loadData}
                onTaskMessageClick={setHighlightTaskId}
              />
            </div>
          </div>
        </div>

        {/* Sticky Notes Section */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Activity className="w-5 h-5" />
              <span>Quick Notes</span>
            </div>
          </div>
          <div className="ba-card-body">
            <StickyNotes />
          </div>
        </div>

        {/* Clock Widget - Bottom */}
        <div className="ba-card">
          <div className="ba-card-body">
            <Clock />
          </div>
        </div>
      </div>
    </Layout>
  );
}