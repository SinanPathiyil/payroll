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
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  X,
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequirements();
  }, []);

  useEffect(() => {
    if (highlightDocId && requirements.length > 0) {
      const doc = requirements.find((r) => r.id === highlightDocId);
      if (doc) {
        setSelectedDoc(doc);
        setShowDetailsModal(true);
      }
    }
  }, [highlightDocId, requirements]);

  const loadRequirements = async () => {
    try {
      setLoading(true);

      const projectsResponse = await getTLActiveProjects();
      const projects = projectsResponse.data;

      const allRequirements = [];

      for (const project of projects) {
        try {
          const requirementsResponse = await getTLRequirements(project.id);
          const projectRequirements = requirementsResponse.data || [];

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
              file_size: req.file_size
                ? `${(req.file_size / 1024 / 1024).toFixed(2)} MB`
                : "Unknown",
              document_url: req.file_path || "#",
              version: req.version,
              is_latest: req.is_latest,

              // Determine status - FIXED
              status:
                req.team_lead_approved === true
                  ? "approved"
                  : req.shared_with_team_lead === false
                    ? "not_shared"
                    : req.rejected_at
                      ? "rejected"
                      : "pending",

              // Approval/rejection info
              approved_by: req.team_lead_approved ? "You" : null,
              approved_at: req.approved_at,
              approval_notes: req.approval_notes,
              rejected_by: req.rejected_at ? "You" : null,
              rejected_at: req.rejected_at,
              rejection_notes: req.approval_notes,

              description: `Requirement document v${req.version} for ${project.project_name}`,
            });
          });
        } catch (error) {
          console.error(
            `Failed to load requirements for project ${project.id}:`,
            error
          );
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
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleViewDetails = (doc) => {
    setSelectedDoc(doc);
    setShowDetailsModal(true);
  };

  const handleApprovalAction = (action) => {
    setApprovalAction(action);
    setShowDetailsModal(false);
    setShowApprovalModal(true);
  };

  const submitApproval = async () => {
    setSubmitting(true);
    try {
      if (approvalAction === "approve") {
        await approveRequirement(selectedDoc.project_id, selectedDoc.doc_id, {
          notes: approvalNotes || "", // Send empty string if no notes
        });
      } else {
        await rejectRequirement(selectedDoc.project_id, selectedDoc.doc_id, {
          notes: approvalNotes || "", // Send empty string if no notes
        });
      }

      setShowApprovalModal(false);
      setSelectedDoc(null);
      setApprovalNotes("");
      loadRequirements();
      setSubmitting(false);
    } catch (error) {
      console.error("Failed to submit approval:", error);
      alert(
        error.response?.data?.detail || "Failed to submit. Please try again."
      );
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

        {/* Requirements List - COMPACT CARDS */}
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
                className={`tl-req-card-compact ${req.status === "pending" ? "pending" : ""}`}
              >
                <div className="tl-req-card-compact-content">
                  {/* Icon */}
                  <div className="tl-req-compact-icon">
                    <FileText className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <div className="tl-req-compact-info">
                    <div className="tl-req-compact-header">
                      <h3 className="tl-req-compact-title">
                        {req.document_name}
                      </h3>
                    </div>
                    <div className="tl-req-compact-meta">
                      <span>
                        <Briefcase className="w-3.5 h-3.5" />
                        {req.project_name}
                      </span>
                      <span className="tl-req-separator">•</span>
                      <span>
                        <Building className="w-3.5 h-3.5" />
                        {req.client_name}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <span
                    className={`status-chip ${
                      req.status === "approved"
                        ? "success"
                        : req.status === "rejected"
                          ? "danger"
                          : "warning"
                    }`}
                  >
                    {getStatusIcon(req.status)}
                    <span>{req.status}</span>
                  </span>

                  {/* Actions */}
                  <div className="tl-req-compact-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleViewDetails(req)}
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
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
              </div>
            ))}
          </div>
        )}

        {/* View Details Modal */}
        {showDetailsModal && selectedDoc && (
          <div
            className="ba-modal-overlay"
            onClick={() => setShowDetailsModal(false)}
          >
            <div
              className="ba-modal-container ba-modal-large"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ba-modal-header">
                <div className="ba-modal-header-content">
                  <FileText className="w-5 h-5" />
                  <h2 className="ba-modal-title">Requirement Details</h2>
                </div>
                <button
                  className="ba-modal-close-btn"
                  onClick={() => setShowDetailsModal(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="ba-modal-body">
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
                      <span>Download</span>
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
                      <p className="tl-req-detail-label">Version</p>
                      <p className="tl-req-detail-value">
                        {selectedDoc.version}
                      </p>
                    </div>
                    <div className="tl-req-detail-item">
                      <p className="tl-req-detail-label">File Size</p>
                      <p className="tl-req-detail-value">
                        {selectedDoc.file_size}
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
                      <p className="tl-req-detail-label">Shared On</p>
                      <p className="tl-req-detail-value">
                        {formatDateTime(selectedDoc.shared_at)}
                      </p>
                    </div>
                    <div className="tl-req-detail-item">
                      <p className="tl-req-detail-label">Latest Version</p>
                      <p className="tl-req-detail-value">
                        {selectedDoc.is_latest ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

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
            className="ba-modal-overlay"
            onClick={() => setShowApprovalModal(false)}
          >
            <div
              className="ba-modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ba-modal-header">
                <div className="ba-modal-header-content">
                  {approvalAction === "approve" ? (
                    <ThumbsUp className="w-5 h-5" />
                  ) : (
                    <ThumbsDown className="w-5 h-5" />
                  )}
                  <h2 className="ba-modal-title">
                    {approvalAction === "approve" ? "Approve" : "Reject"}{" "}
                    Requirements
                  </h2>
                </div>
                <button
                  className="ba-modal-close-btn"
                  onClick={() => setShowApprovalModal(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="ba-modal-body">
                <div className="tl-approval-form">
                  <div className="tl-approval-doc-info">
                    <p className="tl-approval-doc-name">
                      {selectedDoc.document_name}
                    </p>
                    <p className="tl-approval-doc-meta">
                      {selectedDoc.project_name} • {selectedDoc.client_name}
                    </p>
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">
                      {approvalAction === "approve"
                        ? "Approval Notes"
                        : "Rejection Reason"}{" "}
                      <span
                        style={{
                          color: "rgba(11, 11, 13, 0.5)",
                          fontStyle: "italic",
                        }}
                      >
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="ba-form-textarea"
                      rows="6"
                      placeholder={
                        approvalAction === "approve"
                          ? "Add any notes or comments about the approval..."
                          : "Please provide a reason for rejection..."
                      }
                    />
                    <p className="ba-form-hint">
                      {approvalAction === "approve"
                        ? "This will notify the Business Analyst that requirements are approved for development."
                        : "The Business Analyst will be notified and can revise the document based on your feedback."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="ba-modal-footer">
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
                  disabled={submitting}
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
