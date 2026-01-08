import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Calendar,
  Eye
} from 'lucide-react';
import { getHRAllLeaveRequests } from '../services/api';
import '../styles/ba-dashboard.css';

export default function HRLeaveAllRequests() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, searchTerm, statusFilter, leaveTypeFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await getHRAllLeaveRequests();
      const allRequests = response.data || [];
      setRequests(allRequests);

      // Extract unique leave types
      const types = [...new Set(allRequests.map(r => r.leave_type_name))];
      setLeaveTypes(types);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.user_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(r => r.final_status === statusFilter);
    }

    // Leave type filter
    if (leaveTypeFilter) {
      filtered = filtered.filter(r => r.leave_type_name === leaveTypeFilter);
    }

    setFilteredRequests(filtered);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="ba-stat-badge warning"><Clock className="w-4 h-4" />Pending</span>;
      case 'approved':
        return <span className="ba-stat-badge success"><CheckCircle className="w-4 h-4" />Approved</span>;
      case 'rejected':
        return <span className="ba-stat-badge danger"><XCircle className="w-4 h-4" />Rejected</span>;
      case 'cancelled':
        return <span className="ba-stat-badge secondary">Cancelled</span>;
      default:
        return status;
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.final_status === 'pending').length,
    approved: requests.filter(r => r.final_status === 'approved').length,
    rejected: requests.filter(r => r.final_status === 'rejected').length
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
              <h1 className="ba-dashboard-title">All Leave Requests</h1>
              <p className="ba-dashboard-subtitle">
                View and filter all leave requests
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="ba-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Requests</p>
                <p className="ba-stat-value">{stats.total}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
          </div>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Pending</p>
                <p className="ba-stat-value">{stats.pending}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </div>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Approved</p>
                <p className="ba-stat-value">{stats.approved}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
          </div>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Rejected</p>
                <p className="ba-stat-value">{stats.rejected}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-red">
                <XCircle className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div style={{ display: 'flex', gap: '1rem', flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1', minWidth: '250px', maxWidth: '400px' }}>
                <Search
                  className="w-5 h-5"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af'
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by employee name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ba-form-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ba-form-input"
                style={{ width: '150px' }}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Leave Type Filter */}
              <select
                value={leaveTypeFilter}
                onChange={(e) => setLeaveTypeFilter(e.target.value)}
                className="ba-form-input"
                style={{ width: '180px' }}
              >
                <option value="">All Leave Types</option>
                {leaveTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ba-card-body" style={{ padding: 0 }}>
            {filteredRequests.length === 0 ? (
              <div className="ba-empty-state">
                <Calendar className="ba-empty-icon" />
                <p>No leave requests found</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700' }}>Employee</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700' }}>Leave Type</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>Duration</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>Start Date</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>End Date</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        style={{ borderBottom: '1px solid #e5e7eb' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '1rem' }}>
                          <div>
                            <p style={{ fontWeight: '600', margin: 0 }}>{request.user_name}</p>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                              {request.user_email}
                            </p>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: request.leave_type_color
                              }}
                            />
                            <span>{request.leave_type_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>
                          {request.total_days} {request.total_days === 1 ? 'day' : 'days'}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                          {new Date(request.start_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                          {new Date(request.end_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {getStatusBadge(request.final_status)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                          {new Date(request.requested_at).toLocaleDateString()}
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