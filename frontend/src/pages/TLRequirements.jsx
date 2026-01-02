import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/common/Layout";
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  Calendar,
  User,
  Building,
  Briefcase,
  MessageSquare,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

import {
  getTLPendingApprovalProjects,
  getTLActiveProjects,
  getTLRequirements,
  approveRequirement,
  rejectRequirement,
} from "../services/api";

export default function TLRequirements() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightDocId = searchParams.get("doc");

  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null); // 'approve' or 'reject'
  const [approvalNotes, setApprovalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequirements();
  }, []);

  useEffect(() => {
    if (highlightDocId && requirements.length > 0) {
      const doc = requirements.find((r) => r.id === parseInt(highlightDocId));
      if (doc) {
        setSelectedDoc(doc);
      }
    }
  }, [highlightDocId, requirements]);

  const loadRequirements = async () => {
    try {
      setLoading(true);

      // Get all active projects
      const projectsResponse = await getTLActiveProjects();
      const projects = projectsResponse.data;

      // Get requirements for all projects
      const allRequirements = [];

      for (const project of projects) {
        try {
          const requirementsResponse = await getTLRequirements(project.id);
          const projectRequirements = requirementsResponse.data || [];

          // Add project context to each requirement
          projectRequirements.forEach((req) => {
            allRequirements.push({
              id: req.doc_id,
              doc_id: req.doc_id,
              document_name: req.filename,
              project_id: project.id,
              project_name: project.project_name,
              client_name:
                project.project_name_display?.split("(")[1]?.replace(")", "") ||
                "Unknown Client",
              uploaded_by: req.uploaded_by,
              uploaded_by_role: "Business Analyst",
              uploaded_at: req.uploaded_at,
              shared_at: req.shared_at,
              approval_deadline: req.shared_at, // Use shared_at as placeholder
              file_size: req.file_size
                ? `${(req.file_size / 1024 / 1024).toFixed(2)} MB`
                : "Unknown",
              document_url: req.file_path || "#",
              version: req.version,
              is_latest: req.is_latest,

              // Determine status
              status: req.team_lead_approved
                ? "approved"
                : req.team_lead_approved === false
                  ? "rejected"
                  : "pending",

              // Approval/rejection info
              approved_by: req.team_lead_approved ? "You" : null,
              approved_at: req.approved_at,
              approval_notes: req.approval_notes,
              rejected_by: req.team_lead_approved === false ? "You" : null,
              rejected_at: req.approved_at,
              rejection_notes: req.approval_notes,

              // Additional fields
              description: `Requirement document v${req.version} for ${project.project_name}`,
              sections: [], // Can be populated if backend provides it
            });
          });
        } catch (error) {
          console.error(
            `Failed to load requirements for project ${project.id}:`,
            error
          );
          // Continue with other projects even if one fails
        }
      }

      setRequirements(allRequirements);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load requirements:", error);
      setLoading(false);
    }
  };

  const filteredRequirements = requirements.filter((req) => {
    const matchesSearch =
      req.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.doc_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requirements.length,
    pending: requirements.filter((r) => r.status === "pending").length,
    approved: requirements.filter((r) => r.status === "approved").length,
    rejected: requirements.filter((r) => r.status === "rejected").length,
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5" />;
      case "rejected":
        return <XCircle className="w-5 h-5" />;
      case "pending":
        return <Clock className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const isDeadlineNear = (deadline) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const hoursLeft = (deadlineDate - now) / (1000 * 60 * 60);
    return hoursLeft <= 24 && hoursLeft > 0;
  };

  const isOverdue = (deadline, status) => {
    if (status !== "pending") return false;
    return new Date(deadline) < new Date();
  };

  const handleApprovalAction = (action) => {
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const submitApproval = async () => {
    setSubmitting(true);
    try {
      // Real API call
      if (approvalAction === "approve") {
        await approveRequirement(selectedDoc.project_id, selectedDoc.doc_id, {
          notes: approvalNotes,
        });
      } else {
        await rejectRequirement(selectedDoc.project_id, selectedDoc.doc_id, {
          notes: approvalNotes,
        });
      }

      // Success - reload data
      setShowApprovalModal(false);
      setSelectedDoc(null);
      setApprovalNotes("");
      loadRequirements();
      setSubmitting(false);
    } catch (error) {
      console.error("Failed to submit approval:", error);
      alert("Failed to submit approval. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Requirements...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="tl-requirements">
        {/* Header */}
        <div className="ba-page-header">
          <div>
            <h1 className="ba-page-title">Requirement Approval</h1>
            <p className="ba-page-subtitle">
              Review and approve requirement documents from Business Analysts
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="tl-req-stats">
          <div className="tl-req-stat-card">
            <FileText className="tl-req-stat-icon" />
            <div>
              <p className="tl-req-stat-value">{stats.total}</p>
              <p className="tl-req-stat-label">Total Documents</p>
            </div>
          </div>
          <div className="tl-req-stat-card stat-warning">
            <Clock className="tl-req-stat-icon" />
            <div>
              <p className="tl-req-stat-value">{stats.pending}</p>
              <p className="tl-req-stat-label">Pending Review</p>
            </div>
          </div>
          <div className="tl-req-stat-card stat-success">
            <CheckCircle className="tl-req-stat-icon" />
            <div>
              <p className="tl-req-stat-value">{stats.approved}</p>
              <p className="tl-req-stat-label">Approved</p>
            </div>
          </div>
          <div className="tl-req-stat-card stat-danger">
            <XCircle className="tl-req-stat-icon" />
            <div>
              <p className="tl-req-stat-value">{stats.rejected}</p>
              <p className="tl-req-stat-label">Rejected</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ba-projects-filters">
          <div className="ba-search-box">
            <Search className="ba-search-icon" />
            <input
              type="text"
              placeholder="Search by document name, project, or client..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Requirements List */}
        {filteredRequirements.length === 0 ? (
          <div className="ba-empty-state">
            <FileText className="ba-empty-icon" />
            <p className="ba-empty-text">No requirements found</p>
            <p className="ba-empty-hint">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "No requirement documents to review at the moment"}
            </p>
          </div>
        ) : (
          <div className="tl-req-list">
            {filteredRequirements.map((req) => (
              <div
                key={req.id}
                className={`tl-req-card ${req.status === "pending" ? "pending" : ""} ${isOverdue(req.approval_deadline, req.status) ? "overdue" : ""}`}
              >
                {/* Card Header */}
                <div className="tl-req-card-header">
                  <div className="tl-req-header-left">
                    <div className="tl-req-icon">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="tl-req-header-info">
                      <div className="tl-req-doc-id">{req.doc_id}</div>
                      <h3 className="tl-req-title">{req.document_name}</h3>
                      <div className="tl-req-meta">
                        <span className="tl-req-project">
                          <Briefcase className="w-3.5 h-3.5" />
                          {req.project_name}
                        </span>
                        <span className="tl-req-separator">•</span>
                        <span className="tl-req-client">
                          <Building className="w-3.5 h-3.5" />
                          {req.client_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="tl-req-header-right">
                    <span
                      className={`status-chip ${req.status === "approved" ? "success" : req.status === "rejected" ? "danger" : "warning"}`}
                    >
                      {getStatusIcon(req.status)}
                      <span>{req.status}</span>
                    </span>
                    {isOverdue(req.approval_deadline, req.status) && (
                      <span className="tl-req-overdue-badge">OVERDUE</span>
                    )}
                    {isDeadlineNear(req.approval_deadline) &&
                      req.status === "pending" && (
                        <span className="tl-req-urgent-badge">URGENT</span>
                      )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="tl-req-card-body">
                  <p className="tl-req-description">{req.description}</p>

                  {/* Document Info */}
                  <div className="tl-req-info-grid">
                    <div className="tl-req-info-item">
                      <User className="w-4 h-4" />
                      <div>
                        <p className="tl-req-info-label">Uploaded By</p>
                        <p className="tl-req-info-value">{req.uploaded_by}</p>
                        <p className="tl-req-info-hint">
                          {req.uploaded_by_role}
                        </p>
                      </div>
                    </div>
                    <div className="tl-req-info-item">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <p className="tl-req-info-label">Uploaded On</p>
                        <p className="tl-req-info-value">
                          {formatDateTime(req.uploaded_at)}
                        </p>
                      </div>
                    </div>
                    <div className="tl-req-info-item">
                      <Clock className="w-4 h-4" />
                      <div>
                        <p className="tl-req-info-label">Deadline</p>
                        <p
                          className={`tl-req-info-value ${isOverdue(req.approval_deadline, req.status) ? "text-danger" : isDeadlineNear(req.approval_deadline) && req.status === "pending" ? "text-warning" : ""}`}
                        >
                          {formatDateTime(req.approval_deadline)}
                        </p>
                      </div>
                    </div>
                    <div className="tl-req-info-item">
                      <FileText className="w-4 h-4" />
                      <div>
                        <p className="tl-req-info-label">File Size</p>
                        <p className="tl-req-info-value">{req.file_size}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sections */}
                  {req.sections && req.sections.length > 0 && (
                    <div className="tl-req-sections">
                      <p className="tl-req-sections-label">
                        Document Sections:
                      </p>
                      <div className="tl-req-sections-list">
                        {req.sections.map((section, index) => (
                          <span key={index} className="tl-req-section-badge">
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approval/Rejection Info */}
                  {req.status === "approved" && (
                    <div className="tl-req-decision approved">
                      <div className="tl-req-decision-header">
                        <CheckCircle className="w-5 h-5" />
                        <span>
                          Approved by {req.approved_by} on{" "}
                          {formatDateTime(req.approved_at)}
                        </span>
                      </div>
                      {req.approval_notes && (
                        <p className="tl-req-decision-notes">
                          {req.approval_notes}
                        </p>
                      )}
                    </div>
                  )}

                  {req.status === "rejected" && (
                    <div className="tl-req-decision rejected">
                      <div className="tl-req-decision-header">
                        <XCircle className="w-5 h-5" />
                        <span>
                          Rejected by {req.rejected_by} on{" "}
                          {formatDateTime(req.rejected_at)}
                        </span>
                      </div>
                      {req.rejection_notes && (
                        <p className="tl-req-decision-notes">
                          {req.rejection_notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="tl-req-card-footer">
                  <a
                    href={req.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedDoc(req)}
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                  {req.status === "pending" && (
                    <>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => {
                          setSelectedDoc(req);
                          handleApprovalAction("approve");
                        }}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setSelectedDoc(req);
                          handleApprovalAction("reject");
                        }}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Document Details Modal */}
        {selectedDoc && !showApprovalModal && (
          <div className="modal-backdrop" onClick={() => setSelectedDoc(null)}>
            <div
              className="modal-container modal-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-header-content">
                  <FileText className="modal-header-icon" />
                  <h2 className="modal-title">Requirement Details</h2>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setSelectedDoc(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="tl-req-details">
                  {/* Status Banner */}
                  <div
                    className={`tl-req-details-banner banner-${selectedDoc.status}`}
                  >
                    {getStatusIcon(selectedDoc.status)}
                    <span>STATUS: {selectedDoc.status.toUpperCase()}</span>
                  </div>

                  {/* Document Header */}
                  <div className="tl-req-details-header">
                    <div>
                      <p className="tl-req-details-doc-id">
                        {selectedDoc.doc_id}
                      </p>
                      <h3 className="tl-req-details-title">
                        {selectedDoc.document_name}
                      </h3>
                    </div>
                    <a
                      href={selectedDoc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Document</span>
                    </a>
                  </div>

                  {/* Description */}
                  <div className="tl-req-details-section">
                    <h4 className="tl-req-details-section-title">
                      Description
                    </h4>
                    <p className="tl-req-details-description">
                      {selectedDoc.description}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="tl-req-details-grid">
                    <div className="tl-req-detail-item">
                      <p className="tl-req-detail-label">Project</p>
                      <p className="tl-req-detail-value">
                        {selectedDoc.project_name}
                      </p>
                    </div>
                    <div className="tl-req-detail-item">
                      <p className="tl-req-detail-label">Client</p>
                      <p className="tl-req-detail-value">
                        {selectedDoc.client_name}
                      </p>
                    </div>
                    <div className="tl-req-detail-item">
                      <p className="tl-req-detail-label">Uploaded By</p>
                      <p className="tl-req-detail-value">
                        {selectedDoc.uploaded_by}
                      </p>
                      <p className="tl-req-detail-hint">
                        {selectedDoc.uploaded_by_role}
                      </p>
                    </div>
                    <div className="tl-req-detail-item">
                      <p className="tl-req-detail-label">Upload Date</p>
                      <p className="tl-req-detail-value">
                        {formatDateTime(selectedDoc.uploaded_at)}
                      </p>
                    </div>
                    <div className="tl-req-detail-item">
                      <p className="tl-req-detail-label">Approval Deadline</p>
                      <p className="tl-req-detail-value">
                        {formatDateTime(selectedDoc.approval_deadline)}
                      </p>
                    </div>
                    <div className="tl-req-detail-item">
                      <p className="tl-req-detail-label">File Size</p>
                      <p className="tl-req-detail-value">
                        {selectedDoc.file_size}
                      </p>
                    </div>
                  </div>

                  {/* Document Sections */}
                  {selectedDoc.sections && selectedDoc.sections.length > 0 && (
                    <div className="tl-req-details-section">
                      <h4 className="tl-req-details-section-title">
                        Document Sections
                      </h4>
                      <div className="tl-req-details-sections">
                        {selectedDoc.sections.map((section, index) => (
                          <div
                            key={index}
                            className="tl-req-details-section-item"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>{section}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Decision Info */}
                  {selectedDoc.status === "approved" && (
                    <div className="tl-req-details-decision approved">
                      <h4 className="tl-req-details-decision-title">
                        <CheckCircle className="w-5 h-5" />
                        Approval Information
                      </h4>
                      <p className="tl-req-details-decision-info">
                        Approved by <strong>{selectedDoc.approved_by}</strong>{" "}
                        on {formatDateTime(selectedDoc.approved_at)}
                      </p>
                      {selectedDoc.approval_notes && (
                        <div className="tl-req-details-decision-notes">
                          <p className="tl-req-details-notes-label">
                            Approval Notes:
                          </p>
                          <p className="tl-req-details-notes-text">
                            {selectedDoc.approval_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedDoc.status === "rejected" && (
                    <div className="tl-req-details-decision rejected">
                      <h4 className="tl-req-details-decision-title">
                        <XCircle className="w-5 h-5" />
                        Rejection Information
                      </h4>
                      <p className="tl-req-details-decision-info">
                        Rejected by <strong>{selectedDoc.rejected_by}</strong>{" "}
                        on {formatDateTime(selectedDoc.rejected_at)}
                      </p>
                      {selectedDoc.rejection_notes && (
                        <div className="tl-req-details-decision-notes">
                          <p className="tl-req-details-notes-label">
                            Rejection Reason:
                          </p>
                          <p className="tl-req-details-notes-text">
                            {selectedDoc.rejection_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedDoc.status === "pending" && (
                    <div className="tl-req-details-actions">
                      <button
                        className="btn btn-success"
                        onClick={() => handleApprovalAction("approve")}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Approve Requirements</span>
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleApprovalAction("reject")}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>Reject Requirements</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approval/Rejection Modal */}
        {showApprovalModal && selectedDoc && (
          <div
            className="modal-backdrop"
            onClick={() => setShowApprovalModal(false)}
          >
            <div
              className="modal-container modal-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-header-content">
                  {approvalAction === "approve" ? (
                    <ThumbsUp className="modal-header-icon" />
                  ) : (
                    <ThumbsDown className="modal-header-icon" />
                  )}
                  <h2 className="modal-title">
                    {approvalAction === "approve" ? "Approve" : "Reject"}{" "}
                    Requirements
                  </h2>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowApprovalModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="tl-approval-form">
                  <div className="tl-approval-doc-info">
                    <p className="tl-approval-doc-name">
                      {selectedDoc.document_name}
                    </p>
                    <p className="tl-approval-doc-meta">
                      {selectedDoc.project_name} • {selectedDoc.client_name}
                    </p>
                  </div>

                  <div className="modal-input-group">
                    <label className="modal-label">
                      {approvalAction === "approve"
                        ? "Approval Notes"
                        : "Rejection Reason"}{" "}
                      <span className="modal-required">*</span>
                    </label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="modal-textarea"
                      rows="6"
                      placeholder={
                        approvalAction === "approve"
                          ? "Add any notes or comments about the approval..."
                          : "Please provide a detailed reason for rejection..."
                      }
                      required
                    />
                    <p className="modal-hint">
                      {approvalAction === "approve"
                        ? "This will notify the Business Analyst that requirements are approved for development."
                        : "The Business Analyst will be notified and can revise the document based on your feedback."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowApprovalModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className={`btn ${approvalAction === "approve" ? "btn-success" : "btn-danger"}`}
                  onClick={submitApproval}
                  disabled={!approvalNotes.trim() || submitting}
                >
                  {submitting ? (
                    <>
                      <div className="spinner spinner-sm"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      {approvalAction === "approve" ? (
                        <ThumbsUp className="w-4 h-4" />
                      ) : (
                        <ThumbsDown className="w-4 h-4" />
                      )}
                      <span>
                        Confirm{" "}
                        {approvalAction === "approve"
                          ? "Approval"
                          : "Rejection"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
