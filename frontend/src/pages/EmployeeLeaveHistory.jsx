import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  X,
  Filter,
  Search
} from 'lucide-react';
import { getMyLeaveHistory, cancelLeaveRequest } from '../services/api';
import '../styles/ba-dashboard.css';
import '../styles/ba-modal.css';

export default function EmployeeLeaveHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    year: new Date().getFullYear(),
    leaveType: '',
    searchText: ''
  });

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, filters]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await getMyLeaveHistory();
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to load history:', error);
      setMessage({ type: 'error', text: 'Failed to load leave history' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(r => r.final_status === filters.status);
    }

    // Filter by year
    if (filters.year) {
      filtered = filtered.filter(r => 
        new Date(r.start_date).getFullYear() === parseInt(filters.year)
      );
    }

    // Filter by leave type
    if (filters.leaveType) {
      filtered = filtered.filter(r => r.leave_type_code === filters.leaveType);
    }

    // Search text
    if (filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(r =>
        r.leave_type_name.toLowerCase().includes(searchLower) ||
        r.reason.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleCancelRequest = async () => {
    if (!cancelReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a cancellation reason' });
      return;
    }

    try {
      setSubmitting(true);
      await cancelLeaveRequest(selectedRequest.id, {
        cancellation_reason: cancelReason.trim()
      });
      setMessage({ type: 'success', text: 'Leave request cancelled successfully' });
      setShowCancelModal(false);
      setSelectedRequest(null);
      setCancelReason('');
      loadHistory();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to cancel:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to cancel request' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'warning', icon: Clock, text: 'Pending' },
      approved: { class: 'success', icon: CheckCircle, text: 'Approved' },
      rejected: { class: 'error', icon: XCircle, text: 'Rejected' },
      cancelled: { class: 'info', icon: AlertCircle, text: 'Cancelled' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`ba-stat-badge ${badge.class}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    );
  };

  const getUniqueLeaveTypes = () => {
    const types = requests.map(r => ({ code: r.leave_type_code, name: r.leave_type_name }));
    return Array.from(new Set(types.map(t => t.code)))
      .map(code => types.find(t => t.code === code));
  };

  const getYears = () => {
    const years = requests.map(r => new Date(r.start_date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading History...</p>
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
              onClick={() => navigate('/employee/leave')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="ba-dashboard-title">Leave History</h1>
              <p className="ba-dashboard-subtitle">
                View all your past leave requests
              </p>
            </div>
          </div>
          <div className="ba-stat-badge info" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
            {filteredRequests.length} Request{filteredRequests.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`ba-alert ba-alert-${message.type === 'success' ? 'warning' : 'error'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Filters */}
        <div className="ba-card" style={{ marginBottom: '1.5rem' }}>
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter className="w-5 h-5" />
              Filters
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setFilters({ status: '', year: new Date().getFullYear(), leaveType: '', searchText: '' })}
            >
              Clear All
            </button>
          </div>
          <div className="ba-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {/* Status Filter */}
              <div className="ba-form-group" style={{ marginBottom: 0 }}>
                <label className="ba-form-label">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="ba-form-input"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Year Filter */}
              <div className="ba-form-group" style={{ marginBottom: 0 }}>
                <label className="ba-form-label">Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="ba-form-input"
                >
                  <option value="">All Years</option>
                  {getYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Leave Type Filter */}
              <div className="ba-form-group" style={{ marginBottom: 0 }}>
                <label className="ba-form-label">Leave Type</label>
                <select
                  value={filters.leaveType}
                  onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
                  className="ba-form-input"
                >
                  <option value="">All Types</option>
                  {getUniqueLeaveTypes().map(type => (
                    <option key={type.code} value={type.code}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="ba-form-group" style={{ marginBottom: 0 }}>
                <label className="ba-form-label">Search</label>
                <div style={{ position: 'relative' }}>
                  <Search className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                  <input
                    type="text"
                    value={filters.searchText}
                    onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                    className="ba-form-input"
                    placeholder="Search..."
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="ba-card">
          <div className="ba-card-body">
            {filteredRequests.length === 0 ? (
              <div className="ba-empty-state">
                <Calendar className="ba-empty-icon" />
                <p>No leave requests found</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {requests.length === 0 ? "You haven't applied for any leaves yet" : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      padding: '1.5rem',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,248,248,0.9))',
                      border: `2px solid ${request.leave_type_color}40`,
                      borderRadius: '12px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: request.leave_type_color,
                          boxShadow: `0 0 0 3px ${request.leave_type_color}30`
                        }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                          {request.leave_type_name}
                        </h3>
                      </div>
                      {getStatusBadge(request.final_status)}
                    </div>

                    {/* Details Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      borderRadius: '8px',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Duration
                        </p>
                        <p style={{ fontWeight: '700', fontSize: '1.1rem', margin: 0 }}>
                          {request.total_days} {request.total_days === 1 ? 'Day' : 'Days'}
                          {request.is_half_day && <span style={{ fontSize: '0.875rem', color: '#6b7280' }}> (Half)</span>}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Date Range
                        </p>
                        <p style={{ fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>
                          {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Requested On
                        </p>
                        <p style={{ fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>
                          {new Date(request.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Reason Preview */}
                    <div style={{
                      padding: '1rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '8px',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <FileText className="w-4 h-4" style={{ color: '#3b82f6', flexShrink: 0 }} />
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Reason
                        </p>
                      </div>
                      <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: '1.6' }}>
                        {request.reason.length > 100 ? `${request.reason.substring(0, 100)}...` : request.reason}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailsModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      {request.final_status === 'pending' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowCancelModal(true);
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedRequest && (
          <div className="ba-modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="ba-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
              <div className="ba-modal-header">
                <div className="ba-modal-header-content">
                  <Eye className="w-6 h-6" />
                  <h2 className="ba-modal-title">Leave Request Details</h2>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="ba-modal-close-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="ba-modal-body">
                {/* Status */}
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  {getStatusBadge(selectedRequest.final_status)}
                </div>

                {/* Basic Info */}
                <div style={{
                  padding: '1.25rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: selectedRequest.leave_type_color
                    }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                      {selectedRequest.leave_type_name}
                    </h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Duration</p>
                      <p style={{ fontWeight: '700', margin: 0 }}>
                        {selectedRequest.total_days} {selectedRequest.total_days === 1 ? 'Day' : 'Days'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Date Range</p>
                      <p style={{ fontWeight: '600', margin: 0 }}>
                        {new Date(selectedRequest.start_date).toLocaleDateString()} - {new Date(selectedRequest.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Requested On</p>
                      <p style={{ fontWeight: '600', margin: 0 }}>
                        {new Date(selectedRequest.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedRequest.is_half_day && (
                      <div>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Half Day Period</p>
                        <p style={{ fontWeight: '600', margin: 0 }}>
                          {selectedRequest.half_day_period === 'first_half' ? 'First Half' : 'Second Half'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText className="w-5 h-5" style={{ color: '#3b82f6' }} />
                    Reason
                  </h4>
                  <p style={{
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    margin: 0,
                    lineHeight: '1.6'
                  }}>
                    {selectedRequest.reason}
                  </p>
                </div>

                {/* Approval Chain */}
                {selectedRequest.approval_chain && selectedRequest.approval_chain.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                      Approval Chain
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedRequest.approval_chain.map((approver, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '1rem',
                            backgroundColor: '#f9fafb',
                            border: `2px solid ${
                              approver.status === 'approved' ? '#10b981' :
                              approver.status === 'rejected' ? '#ef4444' :
                              '#f59e0b'
                            }30`,
                            borderRadius: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <p style={{ fontWeight: '700', margin: 0, textTransform: 'capitalize' }}>
                              {approver.role.replace('_', ' ')}
                            </p>
                            {approver.status === 'pending' && <Clock className="w-5 h-5" style={{ color: '#f59e0b' }} />}
                            {approver.status === 'approved' && <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />}
                            {approver.status === 'rejected' && <XCircle className="w-5 h-5" style={{ color: '#ef4444' }} />}
                          </div>
                          {approver.approved_at && (
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                              {approver.status === 'approved' ? 'Approved' : 'Rejected'} on: {new Date(approver.approved_at).toLocaleDateString()}
                            </p>
                          )}
                          {approver.notes && (
                            <p style={{ fontSize: '0.875rem', margin: 0, fontStyle: 'italic' }}>
                              "{approver.notes}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Override Info */}
                {selectedRequest.admin_override && (
                  <div className="ba-alert ba-alert-warning" style={{ marginTop: '1rem' }}>
                    <AlertCircle className="w-5 h-5" />
                    <div>
                      <strong>Admin Override</strong>
                      {selectedRequest.override_reason && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>Reason: {selectedRequest.override_reason}</p>}
                    </div>
                  </div>
                )}

                {/* Cancellation Info */}
                {selectedRequest.final_status === 'cancelled' && selectedRequest.cancellation_reason && (
                  <div className="ba-alert ba-alert-info" style={{ marginTop: '1rem' }}>
                    <AlertCircle className="w-5 h-5" />
                    <div>
                      <strong>Cancelled</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>Reason: {selectedRequest.cancellation_reason}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="ba-modal-footer">
                <button onClick={() => setShowDetailsModal(false)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && selectedRequest && (
          <div className="ba-modal-overlay" onClick={() => setShowCancelModal(false)}>
            <div className="ba-modal-container ba-modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="ba-modal-header ba-modal-header-danger">
                <div className="ba-modal-header-content">
                  <XCircle className="w-6 h-6" />
                  <h2 className="ba-modal-title">Cancel Leave Request</h2>
                </div>
                <button onClick={() => setShowCancelModal(false)} className="ba-modal-close-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="ba-modal-body">
                <p className="ba-delete-message">
                  Are you sure you want to cancel this leave request?
                </p>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Leave Type:</strong> {selectedRequest.leave_type_name}</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Duration:</strong> {selectedRequest.total_days} days</p>
                  <p style={{ margin: '0' }}><strong>Dates:</strong> {new Date(selectedRequest.start_date).toLocaleDateString()} - {new Date(selectedRequest.end_date).toLocaleDateString()}</p>
                </div>
                <div className="ba-form-group">
                  <label className="ba-form-label">
                    Cancellation Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="ba-form-textarea"
                    rows="3"
                    placeholder="Please provide a reason for cancellation..."
                    required
                  />
                </div>
                <div className="ba-alert ba-alert-warning">
                  <AlertCircle className="w-5 h-5" />
                  <span>Your leave balance will be restored once cancelled.</span>
                </div>
              </div>
              <div className="ba-modal-footer">
                <button onClick={() => setShowCancelModal(false)} className="btn btn-secondary" disabled={submitting}>
                  Close
                </button>
                <button onClick={handleCancelRequest} className="btn btn-danger" disabled={submitting || !cancelReason.trim()}>
                  {submitting ? (
                    <>
                      <div className="spinner spinner-sm"></div>
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Cancel Request</span>
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