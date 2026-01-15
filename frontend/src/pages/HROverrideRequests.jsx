import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  X,
  Clock,
  FileText,
  Calendar,
  Shield,
  UserCog,
  Plus,
  Trash2
} from 'lucide-react';
import { getMyOverrideRequests, cancelOverrideRequest } from '../services/api';
import CreateOverrideRequestModal from '../components/hr/CreateOverrideRequestModal';
import '../styles/hr-override-requests.css';

export default function HROverrideRequests() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
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
      const response = await getMyOverrideRequests();
      setRequests(response.data || []);
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

  const handleCancelRequest = async () => {
    try {
      setSubmitting(true);
      await cancelOverrideRequest(selectedRequest.id);
      setShowCancelModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      console.error('Error cancelling request:', err);
      alert('Failed to cancel request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-badge pending"><Clock className="w-4 h-4" />Pending</span>;
      case 'approved':
        return <span className="status-badge approved"><CheckCircle className="w-4 h-4" />Approved</span>;
      case 'rejected':
        return <span className="status-badge rejected"><XCircle className="w-4 h-4" />Rejected</span>;
      default:
        return status;
    }
  };

  const getRequestTypeLabel = (type) => {
    const labels = {
      'role_change': 'Role Change',
      'project_extension': 'Project Extension',
      'employee_exception': 'Employee Exception',
      'policy_override': 'Policy Override'
    };
    return labels[type] || type;
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Requests...</p>
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
            <h1 className="ba-dashboard-title">Override Requests</h1>
            <p className="ba-dashboard-subtitle">
              Submit and manage override requests to Super Admin
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>New Request</span>
          </button>
        </div>

        {/* Stats */}
        <div className="hr-override-stats">
          <div className="hr-override-stat-card">
            <div className="hr-override-stat-label">Pending</div>
            <p className="hr-override-stat-value warning">{pendingCount}</p>
          </div>
          <div className="hr-override-stat-card">
            <div className="hr-override-stat-label">Approved</div>
            <p className="hr-override-stat-value success">{approvedCount}</p>
          </div>
          <div className="hr-override-stat-card">
            <div className="hr-override-stat-label">Rejected</div>
            <p className="hr-override-stat-value danger">{rejectedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div className="hr-override-filters">
              <button
                className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('')}
              >
                All ({requests.length})
              </button>
              <button
                className={`btn ${statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('pending')}
              >
                Pending ({pendingCount})
              </button>
              <button
                className={`btn ${statusFilter === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('approved')}
              >
                Approved ({approvedCount})
              </button>
              <button
                className={`btn ${statusFilter === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected ({rejectedCount})
              </button>
            </div>
          </div>

          {/* Requests List */}
          <div className="ba-card-body">
            {filteredRequests.length === 0 ? (
              <div className="hr-override-empty">
                <AlertCircle className="hr-override-empty-icon" />
                <p>No requests found</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Request</span>
                </button>
              </div>
            ) : (
              <div className="hr-override-list">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="hr-override-card">
                    <div className="hr-override-card-header">
                      <div className="hr-override-card-meta">
                        <div className="hr-override-type">
                          <Shield className="w-5 h-5" />
                          <span>{getRequestTypeLabel(request.request_type)}</span>
                        </div>
                        <div className="hr-override-date">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="hr-override-card-body">
                      <div className="hr-override-reason">
                        <FileText className="w-5 h-5" style={{ color: '#6b7280', flexShrink: 0 }} />
                        <div className="hr-override-reason-content">
                          <div className="hr-override-reason-label">Reason</div>
                          <div className="hr-override-reason-text">{request.reason}</div>
                        </div>
                      </div>

                      {/* Request Type Specific Details */}
                      {request.request_type === 'role_change' && request.details && (
                        <div className="hr-override-details">
                          <div className="hr-override-detail-item">
                            <span className="hr-override-detail-label">Current Role:</span>
                            <span className="hr-override-detail-value">{request.details.current_role}</span>
                          </div>
                          <div className="hr-override-detail-item">
                            <span className="hr-override-detail-label">Requested Role:</span>
                            <span className="hr-override-detail-value highlight">{request.details.requested_role}</span>
                          </div>
                        </div>
                      )}

                      {request.review_notes && (
                        <div className="hr-override-review-notes">
                          <UserCog className="w-5 h-5" style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div className="hr-override-reason-label">Review Notes</div>
                            <div className="hr-override-reason-text">{request.review_notes}</div>
                            {request.reviewer_name && (
                              <div className="hr-override-reviewer">
                                Reviewed by {request.reviewer_name} on {new Date(request.reviewed_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {request.status === 'pending' && (
                      <div className="hr-override-card-footer">
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowCancelModal(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Cancel Request</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        <CreateOverrideRequestModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchRequests}
        />

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="ba-modal-overlay" onClick={() => setShowCancelModal(false)}>
            <div className="ba-modal-container ba-modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="ba-modal-header ba-modal-header-danger">
                <div className="ba-modal-header-content">
                  <AlertCircle className="w-6 h-6" />
                  <h2 className="ba-modal-title">Cancel Request</h2>
                </div>
                <button onClick={() => setShowCancelModal(false)} className="ba-modal-close-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="ba-modal-body">
                <p className="ba-delete-message">
                  Are you sure you want to cancel this override request?
                </p>
                <div className="ba-alert ba-alert-warning">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <div><strong>Type:</strong> {getRequestTypeLabel(selectedRequest?.request_type)}</div>
                    <div><strong>Created:</strong> {new Date(selectedRequest?.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
              <div className="ba-modal-footer">
                <button onClick={() => setShowCancelModal(false)} className="btn btn-secondary">
                  Keep Request
                </button>
                <button onClick={handleCancelRequest} disabled={submitting} className="btn btn-danger">
                  {submitting ? 'Cancelling...' : 'Cancel Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}