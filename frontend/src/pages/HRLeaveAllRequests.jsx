import { useState, useEffect } from 'react';
import { Calendar, Filter, Download } from 'lucide-react';
import Layout from '../components/common/Layout';
import axios from 'axios';

export default function HRAllLeaveRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    loadAllRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, statusFilter, leaveTypeFilter]);

  const loadAllRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/hr/leave/requests`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const data = response.data.requests || [];
      setRequests(data);
      
      const types = [...new Set(data.map(r => r.leave_type_name))];
      setLeaveTypes(types);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    if (leaveTypeFilter !== 'all') {
      filtered = filtered.filter(req => req.leave_type_name === leaveTypeFilter);
    }
    
    setFilteredRequests(filtered);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', text: '#92400e' },
      approved: { bg: '#d1fae5', text: '#065f46' },
      rejected: { bg: '#fee2e2', text: '#991b1b' },
      cancelled: { bg: '#f3f4f6', text: '#4b5563' }
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{
        display: 'inline-block',
        padding: '0.375rem 0.75rem',
        backgroundColor: s.bg,
        color: s.text,
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
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

  const exportToCSV = () => {
    const csvContent = [
      ['Request Number', 'Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Applied On'].join(','),
      ...filteredRequests.map(req => [
        req.request_number,
        req.user_name,
        req.leave_type_name,
        req.start_date,
        req.end_date,
        req.total_days,
        req.status,
        new Date(req.requested_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading All Requests...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ba-dashboard">
        <div className="ba-dashboard-header">
          <div>
            <h1 className="ba-dashboard-title">All Leave Requests</h1>
            <p className="ba-dashboard-subtitle">
              Complete history of all leave requests
            </p>
          </div>
          <button className="btn btn-secondary" onClick={exportToCSV}>
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="ba-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total</p>
                <p className="ba-stat-value">{requests.length}</p>
              </div>
            </div>
          </div>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Pending</p>
                <p className="ba-stat-value">{requests.filter(r => r.status === 'pending').length}</p>
              </div>
            </div>
          </div>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Approved</p>
                <p className="ba-stat-value">{requests.filter(r => r.status === 'approved').length}</p>
              </div>
            </div>
          </div>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Rejected</p>
                <p className="ba-stat-value">{requests.filter(r => r.status === 'rejected').length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </div>
          </div>
          <div className="ba-card-body">
            <div className="ba-form-grid">
              <div className="ba-form-group">
                <label className="ba-form-label">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="ba-form-input"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="ba-form-group">
                <label className="ba-form-label">Leave Type</label>
                <select
                  value={leaveTypeFilter}
                  onChange={(e) => setLeaveTypeFilter(e.target.value)}
                  className="ba-form-input"
                >
                  <option value="all">All Types</option>
                  {leaveTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Calendar className="w-5 h-5" />
              <span>Requests ({filteredRequests.length})</span>
            </div>
          </div>
          <div className="ba-card-body">
            {filteredRequests.length === 0 ? (
              <div className="ba-empty-state">
                <Calendar className="ba-empty-icon" />
                <p>No requests found</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <tr>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Request #</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Employee</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Leave Type</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Dates</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600' }}>Days</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request, index) => (
                      <tr
                        key={request.id}
                        style={{
                          borderBottom: index < filteredRequests.length - 1 ? '1px solid #e5e7eb' : 'none',
                          backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
                        }}
                      >
                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {request.request_number}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div>
                            <div style={{ fontWeight: '500' }}>{request.user_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{request.user_email}</div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: request.leave_type_color
                              }}
                            />
                            <span>{request.leave_type_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                          <div>{formatDate(request.start_date)}</div>
                          <div style={{ color: '#6b7280' }}>to {formatDate(request.end_date)}</div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>
                          {request.total_days}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {getStatusBadge(request.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}