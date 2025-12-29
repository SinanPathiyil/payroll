import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/common/Layout";
import {
  Briefcase,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Target,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  Download,
  Send,
  CheckSquare,
  X,
  Check,
  Loader,
  Plus,
  Minus
} from "lucide-react";

import {
  getTLPendingApprovalProjects,
  getTLActiveProjects,
  getTLRequirements,
  approveRequirement,
  rejectRequirement,
  getTLMilestones,
  notifyMilestoneCompletion,
  completeProject
} from "../services/api";

export default function TLProjects() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingProjects, setPendingProjects] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  
  // Modals
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showMilestoneNotifyModal, setShowMilestoneNotifyModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  // Selected data
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [selectedMilestones, setSelectedMilestones] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  
  // Forms
  const [approvalNotes, setApprovalNotes] = useState("");
  const [milestoneNotes, setMilestoneNotes] = useState("");
  const [demoLink, setDemoLink] = useState("");
  const [completedFeatures, setCompletedFeatures] = useState([""]);
  const [completionNotes, setCompletionNotes] = useState("");
  
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      
      const pendingRes = await getTLPendingApprovalProjects();
      setPendingProjects(pendingRes.data || []);
      
      const activeRes = await getTLActiveProjects();
      const active = activeRes.data || [];
      
      setActiveProjects(active.filter(p => p.status !== "completed"));
      setCompletedProjects(active.filter(p => p.status === "completed"));
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setLoading(false);
    }
  };

  const handleViewRequirements = async (project) => {
    try {
      setActionLoading(true);
      setSelectedProject(project);
      
      const res = await getTLRequirements(project.id);
      setSelectedRequirements(res.data || []);
      setShowRequirementsModal(true);
      setActionLoading(false);
    } catch (error) {
      console.error("Failed to load requirements:", error);
      alert("Failed to load requirements");
      setActionLoading(false);
    }
  };

  const handleApproveClick = (doc) => {
    setSelectedDocument(doc);
    setApprovalNotes("");
    setShowApprovalModal(true);
  };

  const handleApproveRequirement = async (approved) => {
    try {
      setActionLoading(true);
      
      if (approved) {
        await approveRequirement(selectedProject.id, selectedDocument.doc_id, {
          approval_notes: approvalNotes
        });
        alert("Requirements approved successfully! Project is ready to start.");
      } else {
        await rejectRequirement(selectedProject.id, selectedDocument.doc_id, {
          rejection_notes: approvalNotes
        });
        alert("Requirements sent back for revision.");
      }
      
      setShowApprovalModal(false);
      setShowRequirementsModal(false);
      setApprovalNotes("");
      loadProjects();
      setActionLoading(false);
    } catch (error) {
      console.error("Failed to process requirement:", error);
      alert(error.response?.data?.detail || "Failed to process requirement");
      setActionLoading(false);
    }
  };

  const handleViewMilestones = async (project) => {
    try {
      setActionLoading(true);
      setSelectedProject(project);
      
      const res = await getTLMilestones(project.id);
      setSelectedMilestones(res.data || []);
      setShowMilestonesModal(true);
      setActionLoading(false);
    } catch (error) {
      console.error("Failed to load milestones:", error);
      alert("Failed to load milestones");
      setActionLoading(false);
    }
  };

  const handleNotifyMilestone = (milestone) => {
    setSelectedMilestone(milestone);
    setMilestoneNotes("");
    setDemoLink("");
    setCompletedFeatures([""]);
    setShowMilestoneNotifyModal(true);
  };

  const handleSubmitMilestoneNotification = async () => {
    try {
      setActionLoading(true);
      
      const features = completedFeatures.filter(f => f.trim() !== "");
      
      await notifyMilestoneCompletion(selectedProject.id, {
        milestone_id: selectedMilestone.milestone_id,
        completion_notes: milestoneNotes,
        demo_link: demoLink,
        completed_features: features
      });
      
      alert("BA notified of milestone completion!");
      setShowMilestoneNotifyModal(false);
      setShowMilestonesModal(false);
      loadProjects();
      setActionLoading(false);
    } catch (error) {
      console.error("Failed to notify milestone:", error);
      alert(error.response?.data?.detail || "Failed to notify milestone");
      setActionLoading(false);
    }
  };

  const handleCompleteProject = (project) => {
    setSelectedProject(project);
    setCompletionNotes("");
    setShowCompleteModal(true);
  };

  const handleSubmitCompletion = async () => {
    try {
      setActionLoading(true);
      
      await completeProject(selectedProject.id, {
        completion_notes: completionNotes
      });
      
      alert("Project marked as completed! BA has been notified.");
      setShowCompleteModal(false);
      loadProjects();
      setActionLoading(false);
    } catch (error) {
      console.error("Failed to complete project:", error);
      alert(error.response?.data?.detail || "Failed to complete project");
      setActionLoading(false);
    }
  };

  const addFeatureField = () => {
    setCompletedFeatures([...completedFeatures, ""]);
  };

  const removeFeatureField = (index) => {
    const updated = completedFeatures.filter((_, i) => i !== index);
    setCompletedFeatures(updated);
  };

  const updateFeature = (index, value) => {
    const updated = [...completedFeatures];
    updated[index] = value;
    setCompletedFeatures(updated);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusColor = (status) => {
    const statusMap = {
      pending_tl_approval: "warning",
      approved_ready_to_start: "success",
      in_development: "info",
      milestone_reached: "success",
      completed: "success"
    };
    return statusMap[status] || "info";
  };

  const stats = {
    pending: pendingProjects.length,
    active: activeProjects.length,
    completed: completedProjects.length,
    total: pendingProjects.length + activeProjects.length + completedProjects.length
  };

  const renderProjectCard = (project) => (
    <div
      key={project.id}
      style={{
        padding: "1.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        backgroundColor: "#fff",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#111827", marginBottom: "0.5rem" }}>
            {project.project_name}
          </h3>
          {project.description && (
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.75rem" }}>
              {project.description}
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users className="w-4 h-4" />
              By: {project.created_by_name}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar className="w-4 h-4" />
              {formatDate(project.created_at)}
            </span>
            {project.due_date && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock className="w-4 h-4" />
                Due: {formatDate(project.due_date)}
              </span>
            )}
          </div>
        </div>
        <span className={`ba-stat-badge ${getStatusColor(project.status)}`}>
          {project.status.replace(/_/g, " ").toUpperCase()}
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#6b7280" }}>Progress</span>
          <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>
            {project.progress_percentage}%
          </span>
        </div>
        <div style={{ width: "100%", height: "8px", backgroundColor: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
          <div
            style={{
              width: `${project.progress_percentage}%`,
              height: "100%",
              backgroundColor: "#3b82f6",
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckSquare className="w-4 h-4" />
          {project.completed_tasks}/{project.total_tasks} Tasks
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FileText className="w-4 h-4" />
          {project.document_count} Docs
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {activeTab === "pending" && (
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => handleViewRequirements(project)}
            disabled={actionLoading}
          >
            <Eye className="w-4 h-4" />
            <span>Review Requirements</span>
          </button>
        )}
        
        {activeTab === "active" && (
          <>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => handleViewMilestones(project)}
              disabled={actionLoading}
            >
              <Target className="w-4 h-4" />
              <span>Milestones</span>
            </button>
            {project.progress_percentage === 100 && (
              <button 
                className="btn btn-success btn-sm"
                onClick={() => handleCompleteProject(project)}
                disabled={actionLoading}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Complete</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

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
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div>
            <h1 className="ba-dashboard-title">Projects</h1>
            <p className="ba-dashboard-subtitle">
              Manage project requirements, milestones, and completion
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="ba-stats-grid">
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Projects</p>
                <p className="ba-stat-value">{stats.total}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Briefcase className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Pending Approval</p>
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
                <p className="ba-stat-label">Active</p>
                <p className="ba-stat-value">{stats.active}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <TrendingUp className="w-8 h-8" />
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

        {/* Tabs & Content */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                className={`btn ${activeTab === "pending" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setActiveTab("pending")}
              >
                <AlertCircle className="w-4 h-4" />
                <span>Pending Approval ({stats.pending})</span>
              </button>
              <button
                className={`btn ${activeTab === "active" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setActiveTab("active")}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Active ({stats.active})</span>
              </button>
              <button
                className={`btn ${activeTab === "completed" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setActiveTab("completed")}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Completed ({stats.completed})</span>
              </button>
            </div>
          </div>

          <div className="ba-card-body">
            {activeTab === "pending" && (
              <>
                {pendingProjects.length === 0 ? (
                  <div className="ba-empty-state">
                    <CheckCircle className="ba-empty-icon" />
                    <p>No projects pending approval</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {pendingProjects.map(project => renderProjectCard(project))}
                  </div>
                )}
              </>
            )}

            {activeTab === "active" && (
              <>
                {activeProjects.length === 0 ? (
                  <div className="ba-empty-state">
                    <Briefcase className="ba-empty-icon" />
                    <p>No active projects</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {activeProjects.map(project => renderProjectCard(project))}
                  </div>
                )}
              </>
            )}

            {activeTab === "completed" && (
              <>
                {completedProjects.length === 0 ? (
                  <div className="ba-empty-state">
                    <CheckCircle className="ba-empty-icon" />
                    <p>No completed projects</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {completedProjects.map(project => renderProjectCard(project))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Requirements Modal */}
      {showRequirementsModal && (
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
          onClick={() => setShowRequirementsModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              maxWidth: "800px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem", borderBottom: "1px solid #e5e7eb" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText className="w-5 h-5" />
                <span>Requirements - {selectedProject?.project_name}</span>
              </h2>
              <button
                onClick={() => setShowRequirementsModal(false)}
                style={{ padding: "0.25rem", color: "#6b7280" }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
              {selectedRequirements.length === 0 ? (
                <div className="ba-empty-state">
                  <FileText className="ba-empty-icon" />
                  <p>No requirements shared with you yet</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {selectedRequirements.map((doc) => (
                    <div
                      key={doc.doc_id}
                      style={{
                        padding: "1.25rem",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.5rem",
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                        <div style={{
                          width: "48px",
                          height: "48px",
                          backgroundColor: "#dbeafe",
                          borderRadius: "0.5rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <FileText className="w-6 h-6" style={{ color: "#3b82f6" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                            <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "#111827" }}>
                              {doc.filename}
                            </h4>
                            {doc.is_latest && (
                              <span className="ba-stat-badge success">Latest</span>
                            )}
                          </div>
                          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                            Version {doc.version} • Uploaded by {doc.uploaded_by}
                          </p>
                          <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                            {formatDateTime(doc.uploaded_at)}
                          </p>
                        </div>
                      </div>

                      {doc.team_lead_approved ? (
                        <div style={{
                          padding: "1rem",
                          backgroundColor: "#d1fae5",
                          border: "1px solid #6ee7b7",
                          borderRadius: "0.5rem",
                          display: "flex",
                          alignItems: "start",
                          gap: "0.75rem"
                        }}>
                          <CheckCircle className="w-5 h-5" style={{ color: "#059669", flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "#065f46" }}>
                              Approved on {formatDateTime(doc.approved_at)}
                            </p>
                            {doc.approval_notes && (
                              <p style={{ fontSize: "0.875rem", color: "#047857", marginTop: "0.25rem" }}>
                                {doc.approval_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                          <a 
                            href={doc.file_path} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </a>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApproveClick(doc)}
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve / Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
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
          onClick={() => setShowApprovalModal(false)}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle className="w-5 h-5" />
                <span>Approve or Reject</span>
              </h2>
              <button
                onClick={() => setShowApprovalModal(false)}
                style={{ padding: "0.25rem", color: "#6b7280" }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Document
              </label>
              <p style={{ fontSize: "1rem", fontWeight: "600", color: "#111827" }}>
                {selectedDocument?.filename}
              </p>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Notes (Optional)
              </label>
              <textarea
                rows="4"
                placeholder="Add any notes or feedback..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowApprovalModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleApproveRequirement(false)}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader className="spinner" /> : <XCircle className="w-4 h-4" />}
                <span>Reject</span>
              </button>
              <button 
                className="btn btn-success"
                onClick={() => handleApproveRequirement(true)}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader className="spinner" /> : <Check className="w-4 h-4" />}
                <span>Approve</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestones Modal */}
      {showMilestonesModal && (
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
          onClick={() => setShowMilestonesModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              maxWidth: "700px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem", borderBottom: "1px solid #e5e7eb" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Target className="w-5 h-5" />
                <span>Milestones - {selectedProject?.project_name}</span>
              </h2>
              <button
                onClick={() => setShowMilestonesModal(false)}
                style={{ padding: "0.25rem", color: "#6b7280" }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
              {selectedMilestones.length === 0 ? (
                <div className="ba-empty-state">
                  <Target className="ba-empty-icon" />
                  <p>No milestones defined</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {selectedMilestones.map((milestone, index) => (
                    <div
                      key={milestone.milestone_id}
                      style={{
                        padding: "1.25rem",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.5rem",
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                        <div style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: "#e0e7ff",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                          fontWeight: "700",
                          color: "#4f46e5",
                          flexShrink: 0
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                            <h4 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#111827" }}>
                              {milestone.name}
                            </h4>
                            <span className={`ba-stat-badge ${
                              milestone.status === "pending" ? "warning" :
                              milestone.status === "reached" ? "info" :
                              milestone.status === "payment_received" ? "success" : "info"
                            }`}>
                              {milestone.status.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.75rem" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <TrendingUp className="w-4 h-4" />
                              {milestone.percentage}%
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <DollarSign className="w-4 h-4" />
                              ${milestone.amount.toLocaleString()}
                            </span>
                          </div>

                          {milestone.reached_at && (
                            <div style={{
                              padding: "0.75rem",
                              backgroundColor: "#fef3c7",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                              marginTop: "0.75rem"
                            }}>
                              <p><strong>Reached:</strong> {formatDateTime(milestone.reached_at)}</p>
                              {milestone.notes && <p style={{ marginTop: "0.25rem" }}><strong>Notes:</strong> {milestone.notes}</p>}
                            </div>
                          )}
                        </div>
                      </div>

                      {milestone.can_notify && (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleNotifyMilestone(milestone)}
                          style={{ width: "100%" }}
                        >
                          <Send className="w-4 h-4" />
                          <span>Notify BA of Completion</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Milestone Notification Modal */}
      {showMilestoneNotifyModal && (
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
          onClick={() => setShowMilestoneNotifyModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              padding: "2rem",
              maxWidth: "550px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Send className="w-5 h-5" />
                <span>Notify Milestone Completion</span>
              </h2>
              <button
                onClick={() => setShowMilestoneNotifyModal(false)}
                style={{ padding: "0.25rem", color: "#6b7280" }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Milestone
              </label>
              <p style={{ fontSize: "1rem", fontWeight: "600", color: "#111827" }}>
                {selectedMilestone?.name} ({selectedMilestone?.percentage}%)
              </p>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Completion Notes (Optional)
              </label>
              <textarea
                rows="3"
                placeholder="Describe what was completed..."
                value={milestoneNotes}
                onChange={(e) => setMilestoneNotes(e.target.value)}
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

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Demo Link (Optional)
              </label>
              <input
                type="url"
                placeholder="https://demo-link.com"
                value={demoLink}
                onChange={(e) => setDemoLink(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.625rem 0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Completed Features (Optional)
              </label>
              {completedFeatures.map((feature, index) => (
                <div key={index} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Feature description..."
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    style={{
                      flex: 1,
                      padding: "0.625rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  />
                  {completedFeatures.length > 1 && (
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => removeFeatureField(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button 
                className="btn btn-secondary btn-sm"
                onClick={addFeatureField}
                style={{ marginTop: "0.5rem" }}
              >
                <Plus className="w-4 h-4" />
                <span>Add Feature</span>
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowMilestoneNotifyModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitMilestoneNotification}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader className="spinner" /> : <Send className="w-4 h-4" />}
                <span>Send Notification</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Project Modal */}
      {showCompleteModal && (
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
          onClick={() => setShowCompleteModal(false)}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle className="w-5 h-5" />
                <span>Complete Project</span>
              </h2>
              <button
                onClick={() => setShowCompleteModal(false)}
                style={{ padding: "0.25rem", color: "#6b7280" }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div style={{
              padding: "1rem",
              backgroundColor: "#fef3c7",
              border: "1px solid #fbbf24",
              borderRadius: "0.5rem",
              marginBottom: "1.5rem",
              display: "flex",
              gap: "0.75rem"
            }}>
              <AlertCircle className="w-5 h-5" style={{ color: "#f59e0b", flexShrink: 0, marginTop: "0.125rem" }} />
              <p style={{ fontSize: "0.875rem", color: "#78350f" }}>
                This will mark the project as <strong>100% completed</strong> and notify the BA.
                Make sure all tasks are finished and the project is ready for final client review.
              </p>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Project
              </label>
              <p style={{ fontSize: "1rem", fontWeight: "600", color: "#111827" }}>
                {selectedProject?.project_name}
              </p>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                Completion Notes (Optional)
              </label>
              <textarea
                rows="4"
                placeholder="Add any final notes or handover information..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCompleteModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-success"
                onClick={handleSubmitCompletion}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader className="spinner" /> : <CheckCircle className="w-4 h-4" />}
                <span>Mark as Complete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}