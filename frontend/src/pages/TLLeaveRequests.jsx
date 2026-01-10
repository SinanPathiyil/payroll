import { useState, useEffect } from 'react';
import { Eye, Users, Filter, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import Layout from '../components/common/Layout';
import axios from 'axios';

export default function TLLeaveRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadTeamRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, statusFilter]);

  const loadTeamRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/team-lead/leave/team-requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Failed to load team requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    setFilteredRequests(filtered);
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: '#fef3c7', text: '#92400e', icon: Clock },
      approved: { bg: '#d1fae5', text: '#065f46', icon: CheckCircle },
      rejected: { bg: '#fee2e2', text: '#991b1b', icon: XCircle },
      cancelled: { bg: '#f3f4f6', text: '#4b5563', icon: XCircle }
    };
    const s = config[status] || config.pending;
    const Icon = s.icon;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        backgroundColor: s.bg,
        color: s.text,
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        <Icon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Team Requests...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ba-dashboard">
        <div className="ba-dashboard-header">
          <div>
            <h1 className="ba-dashboard-title">Team Leave Requests</h1>
            <p className="ba-dashboard-subtitle">
              View your team members' leave requests (Read-only)
            </p>
          </div>
        </div>

        <div className="ba-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Requests</p>
                <p className="ba-stat-value">{requests.length}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Pending</p>
                <p className="ba-stat-value">
                  {requests.filter(r => r.status === 'pending').length}
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
                <p className="ba-stat-label">Approved</p>
                <p className="ba-stat-value">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Filter className="w-5 h-5" />
              <span>Filter by Status</span>
            </div>
          </div>
          <div className="ba-card-body">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ba-form-input"
              style={{ maxWidth: '300px' }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Calendar className="w-5 h-5" />
              <span>Team Leave Requests ({filteredRequests.length})</span>
            </div>
          </div>
          <div className="ba-card-body">
            {filteredRequests.length === 0 ? (
              <div className="ba-empty-state">
                <Users className="ba-empty-icon" />
                <p>No leave requests found</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                            {request.user_name}
                          </h3>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6b7280' }}>
                            {request.request_number}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: request.leave_type_color
                            }}
                          />
                          <span style={{ fontWeight: '500' }}>{request.leave_type_name}</span>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '1rem',
                          marginBottom: '1rem'
                        }}>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>
                              Start Date
                            </p>
                            <p style={{ fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
                              {formatDate(request.start_date)}
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>
                              End Date
                            </p>
                            <p style={{ fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
                              {formatDate(request.end_date)}
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>
                              Duration
                            </p>
                            <p style={{ fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
                              {request.total_days} days
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>
                              Status
                            </p>
                            {getStatusBadge(request.status)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedRequest && (
        <div className="ba-modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="ba-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="ba-modal-header">
              <div className="ba-modal-header-content">
                <Eye className="w-6 h-6" />
                <h2 className="ba-modal-title">Leave Request Details</h2>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="ba-modal-close-btn">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="ba-modal-body">
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Request Number</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>
                    {selectedRequest.request_number}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Employee</span>
                  <span style={{ fontWeight: '500' }}>{selectedRequest.user_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Email</span>
                  <span>{selectedRequest.user_email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Leave Type</span>
                  <span style={{ fontWeight: '500' }}>{selectedRequest.leave_type_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Duration</span>
                  <span style={{ fontWeight: '500' }}>{selectedRequest.total_days} days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Status</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', display: 'block' }}>
                  Reason
                </label>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  {selectedRequest.reason}
                </div>
              </div>

              {selectedRequest.hr_notes && (
                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', display: 'block' }}>
                    HR Notes
                  </label>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: selectedRequest.status === 'approved' ? '#d1fae5' : '#fee2e2',
                    borderRadius: '8px',
                    border: `1px solid ${selectedRequest.status === 'approved' ? '#10b981' : '#ef4444'}`
                  }}>
                    {selectedRequest.hr_notes}
                  </div>
                </div>
              )}
            </div>

            <div className="ba-modal-footer">
              <button onClick={() => setSelectedRequest(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
