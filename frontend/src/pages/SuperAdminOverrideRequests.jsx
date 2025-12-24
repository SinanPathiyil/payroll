import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import axios from 'axios';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Calendar,
  Shield,
  UserCog
} from 'lucide-react';
import '../styles/super-admin-override.css';

export default function SuperAdminOverrideRequests() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/super-admin/override-requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(response.data);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    if (statusFilter === '') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(r => r.status === statusFilter));
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/super-admin/override-requests/${selectedRequest.id}/approve`,
        { review_notes: reviewNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowApproveModal(false);
      setReviewNotes('');
      fetchRequests();
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/super-admin/override-requests/${selectedRequest.id}/reject`,
        { review_notes: reviewNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowRejectModal(false);
      setReviewNotes('');
      fetchRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Failed to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="saor-status saor-status-pending"><Clock className="w-4 h-4" />Pending</span>;
      case 'approved':
        return <span className="saor-status saor-status-approved"><CheckCircle className="w-4 h-4" />Approved</span>;
      case 'rejected':
        return <span className="saor-status saor-status-rejected"><XCircle className="w-4 h-4" />Rejected</span>;
      default:
        return status;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  if (loading) {
    return (
      <Layout>
        <div className="saor-loading">
          <div className="saor-loading-spinner"></div>
          <p>Loading Requests...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="saor-container">
        {/* Header */}
        <div className="saor-header">
          <div>
            <h1 className="saor-title">Override Requests</h1>
            <p className="saor-subtitle">
              Review and manage role change and permission override requests
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="saor-stats">
          <div className="saor-stat-item">
            <div className="saor-stat-label">Pending</div>
            <div className="saor-stat-value saor-stat-warning">{pendingCount}</div>
          </div>
          <div className="saor-stat-item">
            <div className="saor-stat-label">Approved</div>
            <div className="saor-stat-value saor-stat-success">{approvedCount}</div>
          </div>
          <div className="saor-stat-item">
            <div className="saor-stat-label">Rejected</div>
            <div className="saor-stat-value saor-stat-danger">{rejectedCount}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="saor-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="saor-filter-select"
          >
            <option value="">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Requests List */}
        <div className="saor-list">
          {filteredRequests.length === 0 ? (
            <div className="saor-empty">
              <AlertCircle className="saor-empty-icon" />
              <p>No requests found</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="saor-card">
                <div className="saor-card-header">
                  <div className="saor-card-meta">
                    <div className="saor-user-info">
                      <User className="w-5 h-5" />
                      <span className="saor-user-name">{request.requested_by_name}</span>
                    </div>
                    <div className="saor-request-date">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="saor-card-body">
                  <div className="saor-request-type">
                    <Shield className="w-5 h-5" />
                    <span>Role Change Request</span>
                  </div>

                  <div className="saor-details">
                    <div className="saor-detail-item">
                      <span className="saor-detail-label">Current Role:</span>
                      <span className="saor-detail-value">{request.details.current_role}</span>
                    </div>
                    <div className="saor-detail-item">
                      <span className="saor-detail-label">Requested Role:</span>
                      <span className="saor-detail-value saor-highlight">{request.details.requested_role}</span>
                    </div>
                  </div>

                  <div className="saor-reason">
                    <FileText className="w-4 h-4" />
                    <div>
                      <div className="saor-reason-label">Reason:</div>
                      <div className="saor-reason-text">{request.reason}</div>
                    </div>
                  </div>

                  {request.review_notes && (
                    <div className="saor-review-notes">
                      <UserCog className="w-4 h-4" />
                      <div>
                        <div className="saor-reason-label">Review Notes:</div>
                        <div className="saor-reason-text">{request.review_notes}</div>
                        <div className="saor-reviewer">
                          Reviewed by {request.reviewer_name} on {new Date(request.reviewed_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div className="saor-card-footer">
                    <button
                      className="saor-btn saor-btn-reject"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRejectModal(true);
                      }}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      className="saor-btn saor-btn-approve"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowApproveModal(true);
                      }}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Approve Modal */}
        {showApproveModal && (
          <div className="saor-modal-overlay" onClick={() => setShowApproveModal(false)}>
            <div className="saor-modal" onClick={(e) => e.stopPropagation()}>
              <div className="saor-modal-header">
                <h2>Approve Request</h2>
                <button onClick={() => setShowApproveModal(false)} className="saor-modal-close">×</button>
              </div>
              <div className="saor-modal-body">
                <p className="saor-modal-text">
                  Are you sure you want to approve this role change request?
                </p>
                <div className="saor-modal-info">
                  <div><strong>User:</strong> {selectedRequest?.requested_by_name}</div>
                  <div><strong>Change:</strong> {selectedRequest?.details.current_role} → {selectedRequest?.details.requested_role}</div>
                </div>
                <div className="saor-form-group">
                  <label>Review Notes (Optional)</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about this approval..."
                    rows="3"
                    className="saor-textarea"
                  />
                </div>
              </div>
              <div className="saor-modal-footer">
                <button onClick={() => setShowApproveModal(false)} className="saor-btn saor-btn-secondary">
                  Cancel
                </button>
                <button onClick={handleApprove} disabled={submitting} className="saor-btn saor-btn-approve">
                  {submitting ? 'Approving...' : 'Approve Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="saor-modal-overlay" onClick={() => setShowRejectModal(false)}>
            <div className="saor-modal" onClick={(e) => e.stopPropagation()}>
              <div className="saor-modal-header">
                <h2>Reject Request</h2>
                <button onClick={() => setShowRejectModal(false)} className="saor-modal-close">×</button>
              </div>
              <div className="saor-modal-body">
                <p className="saor-modal-text">
                  Are you sure you want to reject this role change request?
                </p>
                <div className="saor-modal-info">
                  <div><strong>User:</strong> {selectedRequest?.requested_by_name}</div>
                  <div><strong>Requested:</strong> {selectedRequest?.details.requested_role}</div>
                </div>
                <div className="saor-form-group">
                  <label>Rejection Reason <span className="saor-required">*</span></label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    rows="3"
                    className="saor-textarea"
                    required
                  />
                </div>
              </div>
              <div className="saor-modal-footer">
                <button onClick={() => setShowRejectModal(false)} className="saor-btn saor-btn-secondary">
                  Cancel
                </button>
                <button 
                  onClick={handleReject} 
                  disabled={submitting || !reviewNotes.trim()} 
                  className="saor-btn saor-btn-reject"
                >
                  {submitting ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}