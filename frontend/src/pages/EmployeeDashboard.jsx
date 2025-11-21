// frontend/src/pages/EmployeeDashboard.jsx

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
} from "lucide-react";

export default function EmployeeDashboard() {
  const { user } = useContext(AuthContext);

  // Initialize with default structure to prevent undefined errors
  const [status, setStatus] = useState({
    is_clocked_in: false,
    today_total_hours: 0, // From attendance (all completed sessions)
    current_active_hours: 0, // From activity tracking (current session)
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

    // Auto-refresh every 30 seconds (always - for real-time updates)
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing status...");
      loadData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []); // Removed dependency - always runs

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

      // Debug logging
      console.log("═══════════════════════════════════");
      console.log("📦 Full status response:", statusRes);
      console.log("📊 Status data:", statusRes.data);
      console.log("🔍 is_clocked_in value:", statusRes.data?.is_clocked_in);
      console.log(
        "🔍 is_clocked_in type:",
        typeof statusRes.data?.is_clocked_in
      );
      console.log("═══════════════════════════════════");

      // Ensure we have valid data structure
      const statusData = statusRes.data || statusRes;

      // Validate and set status with defaults
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
      console.error("❌ Error response:", error.response?.data);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-xl">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 text-xl font-bold mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Employee Dashboard
          </h1>
          <p className="text-gray-600">Welcome back, {user?.full_name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Today's Hours</p>
                <p className="text-3xl font-bold text-blue-600">
                  {status.today_total_hours?.toFixed(2) || "0.00"} hrs
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {status.is_clocked_in
                    ? "Real-time (includes current session)"
                    : "All sessions completed"}
                </p>
              </div>
              <ClockIcon className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Tasks</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.pendingTasks}
                </p>
              </div>
              <ListTodo className="w-12 h-12 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Completed Tasks</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.completedTasks}
                </p>
              </div>
              <Activity className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">New Messages</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.unreadMessages}
                </p>
              </div>
              <MessageSquare className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
          <div className="space-y-6">
            {/* Clock */}
            <Clock />

            {/* Messages */}
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
