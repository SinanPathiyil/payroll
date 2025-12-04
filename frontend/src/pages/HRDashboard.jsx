import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import Clock from "../components/common/Clock";
import CreateUserModal from "../components/hr/CreateUserModal";
import CreateTaskModal from "../components/hr/CreateTaskModal";
import EmployeeStatsModal from "../components/hr/EmployeeStatsModal";
import HRMessageBoard from "../components/hr/HRMessageBoard";
import { getEmployees, getAllTasks, getMyMessages } from "../services/api";
import {
  Users,
  UserPlus,
  Clock as ClockIcon,
  CheckCircle,
  ListTodo,
  Plus,
  MessageSquare,
  TrendingUp,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { formatDateTime } from "../utils/helpers";

export default function HRDashboard() {
  const [messages, setMessages] = useState([]);
  const [highlightTaskId, setHighlightTaskId] = useState(null);
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const taskRefs = useRef({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (highlightTaskId && taskRefs.current[highlightTaskId]) {
      taskRefs.current[highlightTaskId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      taskRefs.current[highlightTaskId].classList.add("highlight-task");

      setTimeout(() => {
        taskRefs.current[highlightTaskId]?.classList.remove("highlight-task");
      }, 3000);
    }
  }, [highlightTaskId, tasks]);

  const loadData = async () => {
    try {
      const [employeesRes, tasksRes, messagesRes] = await Promise.all([
        getEmployees(),
        getAllTasks(),
        getMyMessages(),
      ]);
      setEmployees(employeesRes.data);
      setTasks(tasksRes.data);
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
    unreadMessages: messages.filter(
      (m) => !m.is_read && m.direction === "received"
    ).length,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "status-chip success";
      case "in_progress":
        return "status-chip info";
      default:
        return "status-chip warning";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5" />;
      case "in_progress":
        return <ClockIcon className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "task-status-completed";
      case "in_progress":
        return "task-status-progress";
      default:
        return "task-status-pending";
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner spinner-lg"></div>
        <p className="dashboard-loading-text">Loading Dashboard...</p>
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
            <h1 className="dashboard-title">HR Dashboard</h1>
            <p className="dashboard-subtitle">
              Welcome back, <strong>{user?.full_name}</strong>
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-card-primary">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p className="stat-card-label">Total Employees</p>
                <p className="stat-card-value">{stats.totalEmployees}</p>
              </div>
              <div className="stat-card-icon stat-card-icon-blue">
                <Users className="w-7 h-7" />
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-success">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p className="stat-card-label">Active Employees</p>
                <p className="stat-card-value stat-card-value-success">
                  {stats.activeToday}
                </p>
              </div>
              <div className="stat-card-icon stat-card-icon-green">
                <CheckCircle className="w-7 h-7" />
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-warning">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p className="stat-card-label">
                  Total <br /> Tasks
                </p>
                <p className="stat-card-value">{stats.totalTasks}</p>
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
                <TrendingUp className="w-7 h-7" />
              </div>
            </div>
          </div>

          <div className="stat-card stat-card-info">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p className="stat-card-label">New Notifications</p>
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
            {/* Employees Table */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">Employees</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Employee</span>
                </button>
              </div>
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Hours Today</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td>
                          <div className="employee-name">
                            {employee.full_name}
                          </div>
                        </td>
                        <td className="employee-email">{employee.email}</td>
                        <td>
                          <span
                            className={
                              employee.today_status === "active"
                                ? "status-chip active"
                                : "status-chip inactive"
                            }
                          >
                            {employee.today_status === "active"
                              ? "Active"
                              : "Offline"}
                          </span>
                        </td>
                        <td className="employee-hours">
                          {employee.today_hours?.toFixed(2) || "0.00"} hrs
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedEmployee(employee)}
                            className="btn-link"
                          >
                            View Stats
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tasks List */}
            <div className="task-list-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">
                  <ListTodo className="w-5 h-5" />
                  <span>All Tasks</span>
                </h2>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="btn btn-success"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign Task</span>
                </button>
              </div>
              <div className="task-list-body">
                {tasks.length === 0 ? (
                  <div className="task-list-empty">
                    <AlertCircle className="task-list-empty-icon" />
                    <p className="task-list-empty-text">
                      No tasks assigned yet
                    </p>
                  </div>
                ) : (
                  <div className="task-list-content">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        ref={(el) => (taskRefs.current[task.id] = el)}
                        className={`task-item ${getStatusClass(task.status)}`}
                      >
                        <div className="task-item-content">
                          <div className="task-item-main">
                            <div className="task-item-header">
                              <div className="task-item-icon">
                                {getStatusIcon(task.status)}
                              </div>
                              <h3 className="task-item-title">{task.title}</h3>
                            </div>
                            <p className="task-item-description">
                              {task.description}
                            </p>
                            <div className="task-item-meta">
                              <span className="task-meta-item">
                                <User className="w-4 h-4" />
                                <span>{task.employee_name}</span>
                              </span>
                              <span className="task-meta-item">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Created: {formatDateTime(task.created_at)}
                                </span>
                              </span>
                              {task.due_date && (
                                <span className="task-meta-item">
                                  <ClockIcon className="w-4 h-4" />
                                  <span>
                                    Due: {formatDateTime(task.due_date)}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="task-item-badge">
                            <span
                              className={`status-chip ${
                                task.status === "completed"
                                  ? "success"
                                  : task.status === "in_progress"
                                    ? "info"
                                    : "warning"
                              }`}
                            >
                              {task.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="dashboard-sidebar">
            <Clock />
            <HRMessageBoard
              messages={messages}
              onMessageRead={loadData}
              onTaskMessageClick={setHighlightTaskId}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {showTaskModal && (
        <CreateTaskModal
          employees={employees}
          onClose={() => setShowTaskModal(false)}
          onSuccess={() => {
            setShowTaskModal(false);
            loadData();
          }}
        />
      )}

      {selectedEmployee && (
        <EmployeeStatsModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}
