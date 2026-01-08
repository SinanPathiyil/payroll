import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  User,
  X
} from 'lucide-react';
import { getHRLeavePendingApprovals, hrApproveRejectLeave } from '../services/api';
import '../styles/ba-dashboard.css';
import '../styles/ba-modal.css';

export default function HRLeavePendingApprovals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await getHRLeavePendingApprovals();
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
      setMessage({ type: 'error', text: 'Failed to load pending approvals' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await hrApproveRejectLeave(selectedRequest.id, {
        action: 'approve',
        notes: notes.trim() || null
      });
      setMessage({ type: 'success', text: 'Leave request approved successfully' });
      setShowApproveModal(false);
      setSelectedRequest(null);
      setNotes('');
      loadRequests();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to approve:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to approve request' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason for rejection' });
      return;
    }

    try {
      setSubmitting(true);
      await hrApproveRejectLeave(selectedRequest.id, {
        action: 'reject',
        notes: notes.trim()
      });
      setMessage({ type: 'success', text: 'Leave request rejected successfully' });
      setShowRejectModal(false);
      setSelectedRequest(null);
      setNotes('');
      loadRequests();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to reject:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to reject request' });
    } finally {
      setSubmitting(false);
    }
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/hr/leave')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="ba-dashboard-title">Pending Approvals</h1>
              <p className="ba-dashboard-subtitle">
                Review and approve leave requests
              </p>
            </div>
          </div>
          <div className="ba-stat-badge warning" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
            {requests.length} Pending
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`ba-alert ba-alert-${message.type === 'success' ? 'warning' : 'error'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Requests List */}
        <div className="ba-card">
          <div className="ba-card-body">
            {requests.length === 0 ? (
              <div className="ba-empty-state">
                <CheckCircle className="ba-empty-icon" style={{ color: '#10b981' }} />
                <p>No pending approvals</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  All leave requests have been processed
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {requests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      padding: '1.5rem',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,248,248,0.9))',
                      border: '2px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '1.25rem'
                        }}>
                          {request.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                            {request.user_name}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                            {request.user_email}
                          </p>
                        </div>
                      </div>
                      <span className="ba-stat-badge warning">
                        <Clock className="w-4 h-4" />
                        Pending
                      </span>
                    </div>

                    {/* Leave Details */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      borderRadius: '8px',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Leave Type
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: request.leave_type_color
                          }} />
                          <span style={{ fontWeight: '600' }}>{request.leave_type_name}</span>
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Duration
                        </p>
                        <p style={{ fontWeight: '700', fontSize: '1.1rem', margin: 0 }}>
                          {request.total_days} {request.total_days === 1 ? 'Day' : 'Days'}
                          {request.is_half_day && <span style={{ fontSize: '0.875rem', color: '#6b7280' }}> (Half Day)</span>}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Date Range
                        </p>
                        <p style={{ fontWeight: '600', margin: 0 }}>
                          {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Requested On
                        </p>
                        <p style={{ fontWeight: '600', margin: 0 }}>
                          {new Date(request.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Reason */}
                    <div style={{
                      padding: '1rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '8px',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <FileText className="w-5 h-5" style={{ color: '#3b82f6', flexShrink: 0 }} />
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Reason
                        </p>
                      </div>
                      <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.6' }}>
                        {request.reason}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowApproveModal(true);
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

        {/* Approve Modal */}
        {showApproveModal && selectedRequest && (
          <div className="ba-modal-overlay" onClick={() => setShowApproveModal(false)}>
            <div className="ba-modal-container ba-modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="ba-modal-header">
                <div className="ba-modal-header-content">
                  <CheckCircle className="w-6 h-6" style={{ color: '#10b981' }} />
                  <h2 className="ba-modal-title">Approve Leave Request</h2>
                </div>
                <button onClick={() => setShowApproveModal(false)} className="ba-modal-close-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="ba-modal-body">
                <p className="ba-delete-message">
                  Are you sure you want to approve this leave request?
                </p>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Employee:</strong> {selectedRequest.user_name}</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Leave Type:</strong> {selectedRequest.leave_type_name}</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Duration:</strong> {selectedRequest.total_days} days</p>
                  <p style={{ margin: '0' }}><strong>Dates:</strong> {new Date(selectedRequest.start_date).toLocaleDateString()} - {new Date(selectedRequest.end_date).toLocaleDateString()}</p>
                </div>
                <div className="ba-form-group">
                  <label className="ba-form-label">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="ba-form-textarea"
                    rows="3"
                    placeholder="Add any notes for this approval..."
                  />
                </div>
              </div>
              <div className="ba-modal-footer">
                <button onClick={() => setShowApproveModal(false)} className="btn btn-secondary" disabled={submitting}>
                  Cancel
                </button>
                <button onClick={handleApprove} className="btn btn-success" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="spinner spinner-sm"></div>
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedRequest && (
          <div className="ba-modal-overlay" onClick={() => setShowRejectModal(false)}>
            <div className="ba-modal-container ba-modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="ba-modal-header ba-modal-header-danger">
                <div className="ba-modal-header-content">
                  <XCircle className="w-6 h-6" />
                  <h2 className="ba-modal-title">Reject Leave Request</h2>
                </div>
                <button onClick={() => setShowRejectModal(false)} className="ba-modal-close-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="ba-modal-body">
                <p className="ba-delete-message">
                  Are you sure you want to reject this leave request?
                </p>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Employee:</strong> {selectedRequest.user_name}</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Leave Type:</strong> {selectedRequest.leave_type_name}</p>
                  <p style={{ margin: '0' }}><strong>Duration:</strong> {selectedRequest.total_days} days</p>
                </div>
                <div className="ba-form-group">
                  <label className="ba-form-label">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="ba-form-textarea"
                    rows="3"
                    placeholder="Provide a reason for rejection..."
                    required
                  />
                </div>
                <div className="ba-alert ba-alert-warning">
                  <AlertCircle className="w-5 h-5" />
                  <span>The employee will be notified about the rejection.</span>
                </div>
              </div>
              <div className="ba-modal-footer">
                <button onClick={() => setShowRejectModal(false)} className="btn btn-secondary" disabled={submitting}>
                  Cancel
                </button>
                <button onClick={handleReject} className="btn btn-danger" disabled={submitting || !notes.trim()}>
                  {submitting ? (
                    <>
                      <div className="spinner spinner-sm"></div>
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
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