import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Eye,
  Filter,
} from "lucide-react";
import Layout from "../components/common/Layout";
import ReviewLeaveModal from "../components/hr/ReviewLeaveModal";
import axios from "axios";

export default function HRLeaveApprovals() {
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [filterLeaveType, setFilterLeaveType] = useState("all");
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [pendingRequests, filterLeaveType]);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/hr/leave/pending-approvals`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const requests = response.data.requests || [];
      setPendingRequests(requests);

      // Extract unique leave types
      const types = [...new Set(requests.map((r) => r.leave_type_name))];
      setLeaveTypes(types);
    } catch (error) {
      console.error("Failed to load pending approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...pendingRequests];

    if (filterLeaveType !== "all") {
      filtered = filtered.filter(
        (req) => req.leave_type_name === filterLeaveType
      );
    }

    setFilteredRequests(filtered);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateDaysAgo = (dateString) => {
    const diffTime = new Date() - new Date(dateString);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Pending Approvals...</p>
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
            <h1 className="ba-dashboard-title">Leave Approvals</h1>
            <p className="ba-dashboard-subtitle">
              Review and process pending leave requests
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div
          className="ba-stats-grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Pending Approvals</p>
                <p className="ba-stat-value">{pendingRequests.length}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge warning">Requires action</span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Filtered Results</p>
                <p className="ba-stat-value">{filteredRequests.length}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Filter className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </div>
          </div>
          <div className="ba-card-body">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "1rem",
                maxWidth: "400px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Filter by Leave Type
                </label>
                <select
                  value={filterLeaveType}
                  onChange={(e) => setFilterLeaveType(e.target.value)}
                  className="ba-form-input"
                >
                  <option value="all">All Leave Types</option>
                  {leaveTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Calendar className="w-5 h-5" />
              <span>Pending Leave Requests ({filteredRequests.length})</span>
            </div>
          </div>
          <div className="ba-card-body">
            {filteredRequests.length === 0 ? (
              <div className="ba-empty-state">
                <CheckCircle className="ba-empty-icon" />
                <p>No pending leave requests</p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginTop: "0.5rem",
                  }}
                >
                  All caught up! 🎉
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "1.5rem",
                      backgroundColor: "#fafafa",
                      transition: "all 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        request.leave_type_color;
                      e.currentTarget.style.backgroundColor = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.backgroundColor = "#fafafa";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "1rem",
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
                          <h3
                            style={{
                              fontSize: "1.125rem",
                              fontWeight: "600",
                              margin: 0,
                            }}
                          >
                            {request.user_name}
                          </h3>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "0.75rem",
                              color: "#6b7280",
                            }}
                          >
                            {request.request_number}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            margin: "0 0 0.5rem 0",
                          }}
                        >
                          {request.user_email} • {request.user_role}
                        </p>
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
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "1.5rem",
                            fontWeight: "700",
                            color: request.leave_type_color,
                          }}
                        >
                          {request.total_days}
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                          {request.total_days === 1 ? "day" : "days"}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "1rem",
                        marginBottom: "1rem",
                        padding: "1rem",
                        backgroundColor: "white",
                        borderRadius: "8px",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            margin: "0 0 0.25rem 0",
                          }}
                        >
                          Start Date
                        </p>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            margin: 0,
                          }}
                        >
                          {formatDate(request.start_date)}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            margin: "0 0 0.25rem 0",
                          }}
                        >
                          End Date
                        </p>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            margin: 0,
                          }}
                        >
                          {formatDate(request.end_date)}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            margin: "0 0 0.25rem 0",
                          }}
                        >
                          Applied
                        </p>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            margin: 0,
                          }}
                        >
                          {calculateDaysAgo(request.requested_at)}
                        </p>
                      </div>
                      {request.team_lead_name && (
                        <div>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              margin: "0 0 0.25rem 0",
                            }}
                          >
                            Team Lead
                          </p>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              margin: 0,
                            }}
                          >
                            {request.team_lead_name}
                          </p>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        padding: "1rem",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          margin: "0 0 0.5rem 0",
                        }}
                      >
                        Reason
                      </p>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          margin: 0,
                          lineHeight: "1.5",
                        }}
                      >
                        {request.reason}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setActionType("view");
                        }}
                        className="btn btn-secondary"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setActionType("reject");
                          setNotes("");
                        }}
                        className="btn"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          backgroundColor: "#fee2e2",
                          color: "#991b1b",
                          border: "1px solid #fca5a5",
                        }}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setActionType("approve");
                          setNotes("");
                        }}
                        className="btn"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          backgroundColor: "#d1fae5",
                          color: "#065f46",
                          border: "1px solid #6ee7b7",
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve/Reject Modal */}
      {selectedRequest && actionType !== "view" && (
        <ReviewLeaveModal
          request={selectedRequest}
          actionType={actionType}
          onClose={() => {
            setSelectedRequest(null);
            setActionType(null);
          }}
          onSuccess={() => {
            setSelectedRequest(null);
            setActionType(null);
            loadPendingApprovals();
          }}
        />
      )}
    </Layout>
  );
}
