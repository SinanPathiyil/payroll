import { useState, useEffect } from "react";
import Layout from "../components/common/Layout";
import TaskList from "../components/employee/TaskList";
import { getMyTasks } from "../services/api";
import { CheckSquare, ListTodo, CheckCircle, Clock } from "lucide-react";

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, completed

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await getMyTasks();
      setTasks(response.data || []);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "pending") return task.status === "pending" || task.status === "in_progress";
    if (filter === "completed") return task.status === "completed";
    return true;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
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
            <h1 className="ba-dashboard-title">My Tasks</h1>
            <p className="ba-dashboard-subtitle">Manage your assigned tasks</p>
          </div>
        </div>

        {/* Stats */}
        <div className="ba-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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
                <p className="ba-stat-label">In Progress</p>
                <p className="ba-stat-value">{stats.pending}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
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

        {/* Filter Tabs */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter('all')}
              >
                All Tasks ({stats.total})
              </button>
              <button
                className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter('pending')}
              >
                In Progress ({stats.pending})
              </button>
              <button
                className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter('completed')}
              >
                Completed ({stats.completed})
              </button>
            </div>
          </div>
          <div className="ba-card-body" style={{ padding: 0 }}>
            <TaskList tasks={filteredTasks} onTaskUpdate={loadTasks} />
          </div>
        </div>
      </div>
    </Layout>
  );
}