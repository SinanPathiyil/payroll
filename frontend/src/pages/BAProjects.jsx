import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import AddProjectModal from "../components/ba/AddProjectModal";
import EditProjectModal from "../components/ba/EditProjectModal";
import RequirementsModal from "../components/ba/RequirementsModal";
import DeleteProjectModal from "../components/ba/DeleteProjectModal";
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
      console.log("📊 Projects loaded:", response.data);
      setProjects(response.data);

      setLoading(false);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_name_display
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || project.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || project.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatCurrency = (amount) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
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
      pending_tl_approval: "warning",
      requirement_gathering: "info",
      requirement_uploaded: "info",
      on_hold: "inactive",
      cancelled: "inactive",
    };
    return colors[status] || "inactive";
  };

  const getStatusLabel = (status) => {
    const labels = {
      in_progress: "In Progress",
      completed: "Completed",
      pending_approval: "Pending Approval",
      pending_tl_approval: "Pending TL Approval",
      requirement_gathering: "Requirement Gathering",
      requirement_uploaded: "Requirement Uploaded",
      on_hold: "On Hold",
      cancelled: "Cancelled",
    };
    return labels[status] || status.replace(/_/g, " ").toUpperCase();
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: "danger",
      critical: "danger",
      medium: "warning",
      low: "info",
    };
    return colors[priority] || "info";
  };

  const stats = {
    total: projects.length,
    active: projects.filter(
      (p) =>
        p.status === "in_progress" ||
        p.status === "requirement_gathering" ||
        p.status === "requirement_uploaded" ||
        p.status === "pending_tl_approval"
    ).length,
    completed: projects.filter((p) => p.status === "completed").length,
    pending_approval: projects.filter(
      (p) =>
        p.status === "pending_approval" || p.status === "pending_tl_approval"
    ).length,
    total_value: projects.reduce(
      (sum, p) => sum + (p.total_contract_value || 0),
      0
    ),
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
              placeholder="Search projects by name..."
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
              <option value="requirement_gathering">
                Requirement Gathering
              </option>
              <option value="requirement_uploaded">Requirement Uploaded</option>
              <option value="pending_tl_approval">Pending TL Approval</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
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
              <option value="critical">Critical</option>
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
                      <p className="ba-project-client">
                        {project.project_name_display || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="ba-project-header-right">
                    <span
                      className={`status-chip ${getStatusColor(project.status)}`}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                    <span
                      className={`ba-project-priority priority-${project.priority || "medium"}`}
                    >
                      {(project.priority || "medium").toUpperCase()}
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
                              navigate(`/ba/projects/${project.id}`);
                              setShowActionMenu(null);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowEditModal(true);
                              setShowActionMenu(null);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setShowRequirementsModal(true);
                              setShowActionMenu(null);
                            }}
                          >
                            <FileText className="w-4 h-4" />
                            <span>View Requirements</span>
                          </button>
                          <button
                            className="danger"
                            onClick={() => {
                              setSelectedProject(project);
                              setShowDeleteModal(true);
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
                  {project.description && (
                    <p className="ba-project-description">
                      {project.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="ba-project-progress">
                    <div className="ba-project-progress-header">
                      <span className="ba-project-progress-label">
                        Overall Progress
                      </span>
                      <span className="ba-project-progress-value">
                        {project.progress_percentage || 0}%
                      </span>
                    </div>
                    <div className="ba-project-progress-bar">
                      <div
                        className="ba-project-progress-fill"
                        style={{
                          width: `${project.progress_percentage || 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Project Info Grid */}
                  <div className="ba-project-info-grid">
                    <div className="ba-project-info-item">
                      <Users className="w-4 h-4" />
                      <div>
                        <p className="ba-project-info-label">Team Lead</p>
                        <p className="ba-project-info-value">
                          {project.team_lead_name || "Not Assigned"}
                        </p>
                      </div>
                    </div>
                    <div className="ba-project-info-item">
                      <FileText className="w-4 h-4" />
                      <div>
                        <p className="ba-project-info-label">Documents</p>
                        <p className="ba-project-info-value">
                          {project.document_count || 0} files
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
                    {project.start_date && (
                      <div className="ba-project-footer-date">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Started: {formatDate(project.start_date)}</span>
                      </div>
                    )}
                    {project.due_date && (
                      <div className="ba-project-footer-date">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Due: {formatDate(project.due_date)}</span>
                      </div>
                    )}
                  </div>
                  <button
                    className="ba-project-view-btn"
                    onClick={() => navigate(`/ba/projects/${project.id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Project Modal */}
        <AddProjectModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadProjects}
        />

        {/* Edit Project Modal */}
        <EditProjectModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProject(null);
          }}
          onSuccess={() => {
            loadProjects();
            setSelectedProject(null);
          }}
          project={selectedProject}
        />

        {/* Requirements Modal */}
        <RequirementsModal
          isOpen={showRequirementsModal}
          onClose={() => {
            setShowRequirementsModal(false);
            setSelectedProject(null);
          }}
          onSuccess={() => {
            loadProjects();
            setSelectedProject(null);
          }}
          project={selectedProject}
        />

        {/* Delete Project Modal */}
        <DeleteProjectModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedProject(null);
          }}
          onSuccess={() => {
            loadProjects();
            setSelectedProject(null);
          }}
          project={selectedProject}
        />
      </div>
    </Layout>
  );
}
