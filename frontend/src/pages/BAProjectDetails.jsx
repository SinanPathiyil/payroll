import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/common/Layout";
import EditProjectModal from "../components/ba/EditProjectModal";
import RequirementsModal from "../components/ba/RequirementsModal";
import DeleteProjectModal from "../components/ba/DeleteProjectModal";
import {
  ArrowLeft,
  Briefcase,
  Edit,
  Trash2,
  FileText,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Activity,
  CheckCircle,
  Upload,
  Eye,
} from "lucide-react";
import { getBAProject } from "../services/api";
import "../styles/ba-project-details.css";

export default function BAProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadProjectDetails();
  }, [id]);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await getBAProject(id);
      console.log("📊 Project Details:", response.data);
      setProject(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load project details:", error);
      setLoading(false);
    }
  };

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
      pending_tl_approval: "warning",
      requirement_gathering: "info",
      requirement_uploaded: "info",
      on_hold: "inactive",
    };
    return colors[status] || "inactive";
  };

  const getStatusLabel = (status) => {
    const labels = {
      in_progress: "In Progress",
      completed: "Completed",
      pending_tl_approval: "Pending TL Approval",
      requirement_gathering: "Requirement Gathering",
      requirement_uploaded: "Requirement Uploaded",
      on_hold: "On Hold",
    };
    return labels[status] || status.replace(/_/g, " ").toUpperCase();
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Project Details...</p>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="layout-loading">
          <p className="layout-loading-text">Project not found</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/ba/projects")}
          >
            Back to Projects
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ba-project-details">
        {/* Header */}
        <div className="ba-project-details-header">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/ba/projects")}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </button>
          <div className="ba-project-details-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowRequirementsModal(true)}
            >
              <Upload className="w-4 h-4" />
              <span>Requirements</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="w-4 h-4" />
              <span>Edit Project</span>
            </button>
            <button
              className="btn btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Project Header Card */}
        <div className="ba-project-header-card">
          <div className="ba-project-header-left">
            <div className="ba-project-logo-large">
              <Briefcase className="w-12 h-12" />
            </div>
            <div className="ba-project-header-info">
              <h1 className="ba-project-details-title">
                {project.project_name}
              </h1>
              <div className="ba-project-header-meta">
                <span
                  className={`status-chip ${getStatusColor(project.status)}`}
                >
                  {getStatusLabel(project.status)}
                </span>
                <span className="ba-project-priority-tag priority-{project.priority}">
                  {project.priority?.toUpperCase() || "MEDIUM"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="ba-project-stats-grid">
          <div className="ba-project-stat-box">
            <div className="ba-project-stat-icon ba-stat-icon-blue">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="ba-project-stat-label">Progress</p>
              <p className="ba-project-stat-value">
                {project.progress_percentage}%
              </p>
              <p className="ba-project-stat-sub">
                {project.completed_tasks}/{project.total_tasks} tasks
              </p>
            </div>
          </div>

          <div className="ba-project-stat-box">
            <div className="ba-project-stat-icon ba-stat-icon-green">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="ba-project-stat-label">Contract Value</p>
              <p className="ba-project-stat-value">
                {formatCurrency(project.total_contract_value)}
              </p>
              <p className="ba-project-stat-sub">
                Budget: {formatCurrency(project.estimated_budget)}
              </p>
            </div>
          </div>

          <div className="ba-project-stat-box">
            <div className="ba-project-stat-icon ba-stat-icon-purple">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="ba-project-stat-label">Milestones</p>
              <p className="ba-project-stat-value">
                {project.milestones?.length || 0}
              </p>
              <p className="ba-project-stat-sub">Payment stages</p>
            </div>
          </div>

          <div className="ba-project-stat-box">
            <div className="ba-project-stat-icon ba-stat-icon-orange">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="ba-project-stat-label">Documents</p>
              <p className="ba-project-stat-value">
                {project.document_count || 0}
              </p>
              <p className="ba-project-stat-sub">
                {project.requirement_documents?.length || 0} requirements
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="ba-project-content-grid">
          {/* Left Column */}
          <div className="ba-project-content-left">
            {/* Project Information */}
            <div className="ba-details-card">
              <div className="ba-details-card-header">
                <Briefcase className="w-5 h-5" />
                <h3>Project Information</h3>
              </div>
              <div className="ba-details-card-body">
                {project.description && (
                  <div className="ba-detail-row">
                    <span className="ba-detail-label">Description:</span>
                    <span className="ba-detail-value">
                      {project.description}
                    </span>
                  </div>
                )}
                <div className="ba-detail-row">
                  <span className="ba-detail-label">Status:</span>
                  <span
                    className={`status-chip ${getStatusColor(project.status)}`}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                <div className="ba-detail-row">
                  <span className="ba-detail-label">Priority:</span>
                  <span className="ba-detail-value">
                    {project.priority?.toUpperCase() || "MEDIUM"}
                  </span>
                </div>
                {project.team_lead_details && (
                  <div className="ba-detail-row">
                    <span className="ba-detail-label">Team Lead:</span>
                    <span className="ba-detail-value">
                      {project.team_lead_details.full_name}
                    </span>
                  </div>
                )}
                {project.client_details && (
                  <div className="ba-detail-row">
                    <span className="ba-detail-label">Client:</span>
                    <span className="ba-detail-value">
                      {project.client_details.company_name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="ba-details-card">
              <div className="ba-details-card-header">
                <Calendar className="w-5 h-5" />
                <h3>Timeline</h3>
              </div>
              <div className="ba-details-card-body">
                <div className="ba-detail-row">
                  <span className="ba-detail-label">Start Date:</span>
                  <span className="ba-detail-value">
                    {formatDate(project.start_date)}
                  </span>
                </div>
                <div className="ba-detail-row">
                  <span className="ba-detail-label">Due Date:</span>
                  <span className="ba-detail-value">
                    {formatDate(project.due_date)}
                  </span>
                </div>
                <div className="ba-detail-row">
                  <span className="ba-detail-label">Created:</span>
                  <span className="ba-detail-value">
                    {formatDate(project.created_at)}
                  </span>
                </div>
                {project.completion_date && (
                  <div className="ba-detail-row">
                    <span className="ba-detail-label">Completed:</span>
                    <span className="ba-detail-value">
                      {formatDate(project.completion_date)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Budget */}
            <div className="ba-details-card">
              <div className="ba-details-card-header">
                <DollarSign className="w-5 h-5" />
                <h3>Budget & Financials</h3>
              </div>
              <div className="ba-details-card-body">
                <div className="ba-detail-row">
                  <span className="ba-detail-label">Estimated Budget:</span>
                  <span className="ba-detail-value">
                    {formatCurrency(project.estimated_budget)}
                  </span>
                </div>
                <div className="ba-detail-row">
                  <span className="ba-detail-label">Contract Value:</span>
                  <span className="ba-detail-value">
                    {formatCurrency(project.total_contract_value)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="ba-project-content-right">
            {/* Milestones */}
            <div className="ba-details-card">
              <div className="ba-details-card-header">
                <Target className="w-5 h-5" />
                <h3>Project Milestones</h3>
              </div>
              <div className="ba-details-card-body">
                {project.milestones && project.milestones.length > 0 ? (
                  <div className="ba-milestones-list">
                    {project.milestones.map((milestone, index) => (
                      <div
                        key={milestone.milestone_id}
                        className="ba-milestone-box"
                      >
                        <div className="ba-milestone-box-header">
                          <h4 className="ba-milestone-box-name">
                            {milestone.name}
                          </h4>
                          <span
                            className={`status-chip ${getStatusColor(milestone.status)}`}
                          >
                            {milestone.status}
                          </span>
                        </div>
                        <div className="ba-milestone-box-details">
                          <div className="ba-milestone-box-item">
                            <span className="ba-milestone-box-label">
                              Percentage:
                            </span>
                            <span className="ba-milestone-box-value">
                              {milestone.percentage}%
                            </span>
                          </div>
                          <div className="ba-milestone-box-item">
                            <span className="ba-milestone-box-label">
                              Amount:
                            </span>
                            <span className="ba-milestone-box-value">
                              {formatCurrency(milestone.amount)}
                            </span>
                          </div>
                        </div>
                        {milestone.reached_at && (
                          <div className="ba-milestone-box-date">
                            Reached: {formatDate(milestone.reached_at)}
                          </div>
                        )}
                        {milestone.payment_received_at && (
                          <div className="ba-milestone-box-date">
                            Payment Received:{" "}
                            {formatDate(milestone.payment_received_at)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ba-empty-state-small">
                    <Target className="ba-empty-icon-small" />
                    <p>No milestones defined</p>
                  </div>
                )}
              </div>
            </div>

            {/* Requirements */}
            <div className="ba-details-card">
              <div className="ba-details-card-header">
                <FileText className="w-5 h-5" />
                <h3>Requirement Documents</h3>
              </div>
              <div className="ba-details-card-body">
                {project.requirement_documents &&
                project.requirement_documents.length > 0 ? (
                  <div className="ba-documents-list">
                    {project.requirement_documents.map((doc) => {
                      console.log("📄 Document Data:", doc);
                      return (
                        <div key={doc.doc_id} className="ba-document-item">
                          <FileText className="w-4 h-4" />
                          <div className="ba-document-info">
                            <p className="ba-document-name">{doc.filename}</p>
                            <p className="ba-document-meta">
                              Version {doc.version} •{" "}
                              {formatDate(doc.uploaded_at)}
                            </p>
                            {doc.shared_with_team_lead && (
                              <div className="ba-document-badges">
                                <span className="ba-badge ba-badge-success">
                                  Shared with TL
                                </span>
                                {doc.team_lead_approved ? (
                                  <span className="ba-badge ba-badge-success">
                                    Approved
                                  </span>
                                ) : doc.rejected_at ? (
                                  <span className="ba-badge ba-badge-danger">
                                    Rejected
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </div>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              if (
                                doc.file_path &&
                                doc.file_path.startsWith("data:")
                              ) {
                                try {
                                  // Convert base64 to blob
                                  const base64Data =
                                    doc.file_path.split(",")[1];
                                  const binaryString = window.atob(base64Data);
                                  const bytes = new Uint8Array(
                                    binaryString.length
                                  );
                                  for (
                                    let i = 0;
                                    i < binaryString.length;
                                    i++
                                  ) {
                                    bytes[i] = binaryString.charCodeAt(i);
                                  }
                                  const blob = new Blob([bytes], {
                                    type: "application/pdf",
                                  });
                                  const blobUrl = URL.createObjectURL(blob);

                                  // Open in new window
                                  window.open(blobUrl, "_blank");

                                  // Clean up after 1 minute
                                  setTimeout(
                                    () => URL.revokeObjectURL(blobUrl),
                                    60000
                                  );
                                } catch (error) {
                                  console.error("Error opening PDF:", error);
                                  alert(
                                    "Failed to open PDF. Please try again."
                                  );
                                }
                              } else {
                                alert("PDF data not available");
                              }
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ba-empty-state-small">
                    <FileText className="ba-empty-icon-small" />
                    <p>No requirement documents uploaded yet</p>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowRequirementsModal(true)}
                      style={{ marginTop: "12px" }}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Requirements</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Project Modal */}
        <EditProjectModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            loadProjectDetails();
          }}
          project={project}
        />

        {/* Requirements Modal */}
        <RequirementsModal
          isOpen={showRequirementsModal}
          onClose={() => setShowRequirementsModal(false)}
          onSuccess={() => {
            loadProjectDetails();
          }}
          project={project}
        />

        {/* Delete Project Modal */}
        <DeleteProjectModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => {
            navigate("/ba/projects");
          }}
          project={project}
        />
      </div>
    </Layout>
  );
}
