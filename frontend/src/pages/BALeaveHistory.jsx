import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
} from "lucide-react";
import Layout from "../components/common/Layout";
import ApplyLeaveModal from "../components/employee/ApplyLeaveModal";
import axios from "axios";

export default function BALeaveHistory() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    loadLeaveHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, statusFilter, searchTerm]);

  const loadLeaveHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ba/leave/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error("Failed to load leave history:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.leave_type_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          req.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.request_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const handleCancelRequest = async (requestId) => {
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation");
      return;
    }

    try {
      setCancellingId(requestId);
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/ba/leave/requests/${requestId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { cancelled_reason: cancelReason },
        }
      );
      setSelectedRequest(null);
      setCancelReason("");
      loadLeaveHistory();
    } catch (error) {
      console.error("Failed to cancel request:", error);
      alert(error.response?.data?.detail || "Failed to cancel request");
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: "#fef3c7", text: "#92400e", icon: Clock },
      approved: { bg: "#d1fae5", text: "#065f46", icon: CheckCircle },
      rejected: { bg: "#fee2e2", text: "#991b1b", icon: XCircle },
      cancelled: { bg: "#f3f4f6", text: "#4b5563", icon: AlertCircle },
    };

    const config = styles[status] || styles.pending;
    const Icon = config.icon;

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.375rem 0.75rem",
          backgroundColor: config.bg,
          color: config.text,
          borderRadius: "9999px",
          fontSize: "0.875rem",
          fontWeight: "500",
        }}
      >
        <Icon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: "2rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: "700",
                margin: "0 0 0.5rem 0",
              }}
            >
              My Leave History
            </h1>
            <p style={{ color: "#6b7280", margin: 0 }}>
              Total Requests: {requests.length}
            </p>
          </div>
          <button
            onClick={() => setShowApplyModal(true)}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>

        {/* Filters */}
        <div
          style={{
            backgroundColor: "white",
            padding: "1.5rem",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                }}
              >
                <Filter className="w-4 h-4" />
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ba-form-input"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                }}
              >
                <Search className="w-4 h-4" />
                Search
              </label>
              <input
                type="text"
                placeholder="Search by leave type, reason, or request number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ba-form-input"
              />
            </div>
          </div>
        </div>

        {/* Leave Requests List */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          {filteredRequests.length === 0 ? (
            <div
              style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}
            >
              <Calendar
                className="w-16 h-16"
                style={{ margin: "0 auto 1rem", opacity: 0.5 }}
              />
              <p style={{ fontSize: "1.125rem", margin: 0 }}>
                {requests.length === 0
                  ? "No leave requests found"
                  : "No requests match your filters"}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead
                  style={{
                    backgroundColor: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <tr>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Request #
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Leave Type
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Dates
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Days
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Applied On
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request, index) => (
                    <tr
                      key={request.id}
                      style={{
                        borderBottom:
                          index < filteredRequests.length - 1
                            ? "1px solid #e5e7eb"
                            : "none",
                        backgroundColor: index % 2 === 0 ? "white" : "#fafafa",
                      }}
                    >
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                          }}
                        >
                          {request.request_number}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              backgroundColor: request.leave_type_color,
                            }}
                          />
                          <span style={{ fontWeight: "500" }}>
                            {request.leave_type_name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem" }}>
                        <div>
                          <div>{formatDate(request.start_date)}</div>
                          <div style={{ color: "#6b7280" }}>
                            to {formatDate(request.end_date)}
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          fontWeight: "600",
                        }}
                      >
                        {request.total_days}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {getStatusBadge(request.status)}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          fontSize: "0.875rem",
                          color: "#6b7280",
                        }}
                      >
                        {formatDate(request.requested_at)}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="btn btn-secondary"
                            style={{
                              padding: "0.375rem 0.75rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            View
                          </button>
                          {(request.status === "pending" ||
                            request.status === "approved") &&
                            new Date(request.start_date) > new Date() && (
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setCancelReason("");
                                }}
                                className="btn"
                                style={{
                                  padding: "0.375rem 0.75rem",
                                  fontSize: "0.875rem",
                                  backgroundColor: "#fee2e2",
                                  color: "#991b1b",
                                  border: "1px solid #fca5a5",
                                }}
                              >
                                Cancel
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View/Cancel Request Modal */}
      {selectedRequest && (
        <div
          className="ba-modal-overlay"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="ba-modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="ba-modal-header">
              <div className="ba-modal-header-content">
                <Calendar className="w-6 h-6" />
                <h2 className="ba-modal-title">Leave Request Details</h2>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="ba-modal-close-btn"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="ba-modal-body">
              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    Request Number
                  </span>
                  <span style={{ fontFamily: "monospace", fontWeight: "500" }}>
                    {selectedRequest.request_number}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    Status
                  </span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    Leave Type
                  </span>
                  <span style={{ fontWeight: "500" }}>
                    {selectedRequest.leave_type_name}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    Duration
                  </span>
                  <span style={{ fontWeight: "500" }}>
                    {selectedRequest.total_days} days
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    From
                  </span>
                  <span style={{ fontWeight: "500" }}>
                    {formatDate(selectedRequest.start_date)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    To
                  </span>
                  <span style={{ fontWeight: "500" }}>
                    {formatDate(selectedRequest.end_date)}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Reason
                </label>
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "0.875rem",
                  }}
                >
                  {selectedRequest.reason}
                </div>
              </div>

              {selectedRequest.hr_notes && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      fontSize: "0.875rem",
                      color: "#6b7280",
                      marginBottom: "0.5rem",
                      display: "block",
                    }}
                  >
                    HR Notes
                  </label>
                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor:
                        selectedRequest.status === "approved"
                          ? "#d1fae5"
                          : "#fee2e2",
                      borderRadius: "8px",
                      border: `1px solid ${selectedRequest.status === "approved" ? "#10b981" : "#ef4444"}`,
                      fontSize: "0.875rem",
                    }}
                  >
                    {selectedRequest.hr_notes}
                  </div>
                </div>
              )}

              {(selectedRequest.status === "pending" ||
                selectedRequest.status === "approved") &&
                new Date(selectedRequest.start_date) > new Date() && (
                  <div>
                    <label
                      style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        marginBottom: "0.5rem",
                        display: "block",
                      }}
                    >
                      Cancellation Reason{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="ba-form-textarea"
                      rows="3"
                      placeholder="Please provide a reason for cancellation..."
                    />
                  </div>
                )}
            </div>

            <div className="ba-modal-footer">
              <button
                onClick={() => setSelectedRequest(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
              {(selectedRequest.status === "pending" ||
                selectedRequest.status === "approved") &&
                new Date(selectedRequest.start_date) > new Date() && (
                  <button
                    onClick={() => handleCancelRequest(selectedRequest.id)}
                    className="btn"
                    style={{ backgroundColor: "#ef4444", color: "white" }}
                    disabled={
                      cancellingId === selectedRequest.id ||
                      !cancelReason.trim()
                    }
                  >
                    {cancellingId === selectedRequest.id ? (
                      <>
                        <div className="spinner spinner-sm"></div>
                        <span>Cancelling...</span>
                      </>
                    ) : (
                      "Cancel Request"
                    )}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <ApplyLeaveModal
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false);
            loadLeaveHistory();
          }}
          userRole="business_analyst"
        />
      )}
    </Layout>
  );
}
