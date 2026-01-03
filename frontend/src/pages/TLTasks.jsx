import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import {
  ListTodo,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  X,
} from "lucide-react";
import {
  getTLTasks,
  createTLTask,
  getTLTeamMembers,
  getTLActiveProjects,
} from "../services/api";

export default function TLTasks() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, pending, in_progress, completed
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    project_id: "",
    due_date: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, membersRes, projectsRes] = await Promise.all([
        getTLTasks(),
        getTLTeamMembers(),
        getTLActiveProjects(),
      ]);
      setTasks(tasksRes.data || []);
      setEmployees(membersRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      await createTLTask(formData);
      setShowCreateModal(false);
      setFormData({
        title: "",
        description: "",
        assigned_to: "",
        project_id: "",
        due_date: "",
      });
      loadData();
    } catch (error) {
      console.error("Failed to create task:", error);
      alert(error.response?.data?.detail || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.employee_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || task.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5" />;
      case "in_progress":
        return <Clock className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "info";
      default:
        return "warning";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Tasks...</p>
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
            <h1 className="ba-dashboard-title">Task Management</h1>
            <p className="ba-dashboard-subtitle">Assign and track team tasks</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Assign Task</span>
          </button>
        </div>

        {/* Stats */}
        <div className="ba-stats-grid">
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Tasks</p>
                <p className="ba-stat-value">{stats.total}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <ListTodo className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Pending</p>
                <p className="ba-stat-value">{stats.pending}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
                <AlertCircle className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">In Progress</p>
                <p className="ba-stat-value">{stats.in_progress}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Completed</p>
                <p className="ba-stat-value">{stats.completed}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div style={{ display: "flex", gap: "1rem", flex: 1 }}>
              {/* Search */}
              <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                <Search
                  className="w-5 h-5"
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem 0.5rem 2.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              {/* Filter Buttons */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className={`btn ${filterStatus === "all" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFilterStatus("all")}
                >
                  All ({stats.total})
                </button>
                <button
                  className={`btn ${filterStatus === "pending" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFilterStatus("pending")}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  className={`btn ${filterStatus === "in_progress" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFilterStatus("in_progress")}
                >
                  In Progress ({stats.in_progress})
                </button>
                <button
                  className={`btn ${filterStatus === "completed" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFilterStatus("completed")}
                >
                  Completed ({stats.completed})
                </button>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="ba-card-body">
            {filteredTasks.length === 0 ? (
              <div className="ba-empty-state">
                <ListTodo className="ba-empty-icon" />
                <p>No tasks found</p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: "1.5rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      backgroundColor: "#fff",
                      transition: "box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.boxShadow =
                        "0 4px 6px -1px rgba(0,0,0,0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.boxShadow = "none")
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
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
                              color:
                                getStatusColor(task.status) === "success"
                                  ? "#10b981"
                                  : getStatusColor(task.status) === "info"
                                    ? "#3b82f6"
                                    : "#f59e0b",
                            }}
                          >
                            {getStatusIcon(task.status)}
                          </div>
                          <h3
                            style={{
                              fontSize: "1.125rem",
                              fontWeight: "600",
                              color: "#111827",
                            }}
                          >
                            {task.title}
                          </h3>
                        </div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            marginBottom: "1rem",
                          }}
                        >
                          {task.description}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "1.5rem",
                            fontSize: "0.875rem",
                            color: "#6b7280",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <User className="w-4 h-4" />
                            {task.employee_name}
                          </span>
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <Calendar className="w-4 h-4" />
                            Created:{" "}
                            {new Date(task.created_at).toLocaleDateString()}
                          </span>
                          {task.due_date && (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <Clock className="w-4 h-4" />
                              Due:{" "}
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`ba-stat-badge ${getStatusColor(task.status)}`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              padding: "2rem",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>
                Assign New Task
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ padding: "0.25rem", color: "#6b7280" }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {/* Title */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    placeholder="Enter task title"
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                    placeholder="Enter task description"
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* Assign To */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Assign To *
                  </label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) =>
                      setFormData({ ...formData, assigned_to: e.target.value })
                    }
                    required
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="">Select Employee</option>
                    {employees
                      .filter((emp) => emp.role === "employee")
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} ({emp.email})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Project Selection */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Project (Optional)
                  </label>
                  <select
                    value={formData.project_id}
                    onChange={(e) =>
                      setFormData({ ...formData, project_id: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="">No Project (Standalone Task)</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.project_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
