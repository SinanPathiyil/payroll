import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  Target,
  Activity,
} from "lucide-react";

import {
  getBAProjects,
  getBAProject,
  createBAProject,
  updateBAProject,
  getProjectMilestones,
} from "../services/api";

export default function BAProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);

      // Real API call
      const response = await getBAProjects();
      setProjects(response.data);

      setLoading(false);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || project.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || project.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      in_progress: "info",
      completed: "success",
      pending_approval: "warning",
      on_hold: "inactive",
    };
    return colors[status] || "inactive";
  };

  const getStatusLabel = (status) => {
    const labels = {
      in_progress: "In Progress",
      completed: "Completed",
      pending_approval: "Pending Approval",
      on_hold: "On Hold",
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: "danger",
      medium: "warning",
      low: "info",
    };
    return colors[priority] || "info";
  };

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "in_progress").length,
    completed: projects.filter((p) => p.status === "completed").length,
    pending_approval: projects.filter((p) => p.status === "pending_approval")
      .length,
    total_value: projects.reduce((sum, p) => sum + p.total_contract_value, 0),
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Projects...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ba-projects">
        {/* Header */}
        <div className="ba-page-header">
          <div>
            <h1 className="ba-page-title">Project Management</h1>
            <p className="ba-page-subtitle">
              Manage projects, milestones, and deliverables
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>

        {/* Stats Summary */}
        <div className="ba-projects-stats">
          <div className="ba-projects-stat-item">
            <Briefcase className="w-5 h-5" />
            <div>
              <p className="ba-projects-stat-value">{stats.total}</p>
              <p className="ba-projects-stat-label">Total Projects</p>
            </div>
          </div>
          <div className="ba-projects-stat-item">
            <Activity className="w-5 h-5" />
            <div>
              <p className="ba-projects-stat-value">{stats.active}</p>
              <p className="ba-projects-stat-label">Active Projects</p>
            </div>
          </div>
          <div className="ba-projects-stat-item">
            <CheckCircle className="w-5 h-5" />
            <div>
              <p className="ba-projects-stat-value">{stats.completed}</p>
              <p className="ba-projects-stat-label">Completed</p>
            </div>
          </div>
          <div className="ba-projects-stat-item">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="ba-projects-stat-value">{stats.pending_approval}</p>
              <p className="ba-projects-stat-label">Pending Approval</p>
            </div>
          </div>
          <div className="ba-projects-stat-item">
            <DollarSign className="w-5 h-5" />
            <div>
              <p className="ba-projects-stat-value">
                {formatCurrency(stats.total_value)}
              </p>
              <p className="ba-projects-stat-label">Total Value</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ba-projects-filters">
          <div className="ba-search-box">
            <Search className="ba-search-icon" />
            <input
              type="text"
              placeholder="Search projects by name or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ba-search-input"
            />
          </div>
          <div className="ba-filter-group">
            <Filter className="w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="ba-filter-select"
            >
              <option value="all">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
          <div className="ba-filter-group">
            <Target className="w-4 h-4" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="ba-filter-select"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <div className="ba-empty-state">
            <Briefcase className="ba-empty-icon" />
            <p className="ba-empty-text">No projects found</p>
            <p className="ba-empty-hint">
              {searchTerm || filterStatus !== "all" || filterPriority !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first project to get started"}
            </p>
            {!searchTerm &&
              filterStatus === "all" &&
              filterPriority === "all" && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Project</span>
                </button>
              )}
          </div>
        ) : (
          <div className="ba-projects-list">
            {filteredProjects.map((project) => (
              <div key={project.id} className="ba-project-card">
                {/* Card Header */}
                <div className="ba-project-card-header">
                  <div className="ba-project-header-left">
                    <div className="ba-project-icon">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="ba-project-name">
                        {project.project_name}
                      </h3>
                      <p className="ba-project-client">{project.client_name}</p>
                    </div>
                  </div>
                  <div className="ba-project-header-right">
                    <span
                      className={`status-chip ${getStatusColor(project.status)}`}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                    <span
                      className={`ba-project-priority priority-${project.priority}`}
                    >
                      {project.priority}
                    </span>
                    <div className="ba-project-actions">
                      <button
                        className="ba-project-action-btn"
                        onClick={() =>
                          setShowActionMenu(
                            showActionMenu === project.id ? null : project.id
                          )
                        }
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {showActionMenu === project.id && (
                        <div className="ba-project-action-menu">
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowActionMenu(null);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => {
                              // Edit logic
                              setShowActionMenu(null);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              // Requirements logic
                              setShowActionMenu(null);
                            }}
                          >
                            <FileText className="w-4 h-4" />
                            <span>View Requirements</span>
                          </button>
                          <button
                            className="danger"
                            onClick={() => {
                              // Delete logic
                              setShowActionMenu(null);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="ba-project-card-body">
                  <p className="ba-project-description">
                    {project.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="ba-project-progress">
                    <div className="ba-project-progress-header">
                      <span className="ba-project-progress-label">
                        Overall Progress
                      </span>
                      <span className="ba-project-progress-value">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="ba-project-progress-bar">
                      <div
                        className="ba-project-progress-fill"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="ba-project-milestones">
                    <div className="ba-project-milestones-header">
                      <Target className="w-4 h-4" />
                      <span>Milestones ({project.milestones.length})</span>
                    </div>
                    <div className="ba-project-milestones-list">
                      {project.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="ba-project-milestone"
                        >
                          <div className="ba-project-milestone-info">
                            <span className="ba-project-milestone-name">
                              {milestone.name}
                            </span>
                            <span className="ba-project-milestone-amount">
                              {formatCurrency(milestone.amount)}
                            </span>
                          </div>
                          <span
                            className={`status-chip ${getStatusColor(milestone.status)}`}
                          >
                            {getStatusLabel(milestone.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Project Info Grid */}
                  <div className="ba-project-info-grid">
                    <div className="ba-project-info-item">
                      <Users className="w-4 h-4" />
                      <div>
                        <p className="ba-project-info-label">Team Lead</p>
                        <p className="ba-project-info-value">
                          {project.assigned_to_team_lead}
                        </p>
                      </div>
                    </div>
                    <div className="ba-project-info-item">
                      <Users className="w-4 h-4" />
                      <div>
                        <p className="ba-project-info-label">Team Size</p>
                        <p className="ba-project-info-value">
                          {project.team_size} members
                        </p>
                      </div>
                    </div>
                    <div className="ba-project-info-item">
                      <DollarSign className="w-4 h-4" />
                      <div>
                        <p className="ba-project-info-label">Budget</p>
                        <p className="ba-project-info-value">
                          {formatCurrency(project.estimated_budget)}
                        </p>
                      </div>
                    </div>
                    <div className="ba-project-info-item">
                      <TrendingUp className="w-4 h-4" />
                      <div>
                        <p className="ba-project-info-label">Contract Value</p>
                        <p className="ba-project-info-value">
                          {formatCurrency(project.total_contract_value)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="ba-project-card-footer">
                  <div className="ba-project-footer-dates">
                    <div className="ba-project-footer-date">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Started: {formatDate(project.start_date)}</span>
                    </div>
                    <div className="ba-project-footer-date">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Due: {formatDate(project.due_date)}</span>
                    </div>
                  </div>
                  <button
                    className="ba-project-view-btn"
                    onClick={() => setSelectedProject(project)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
