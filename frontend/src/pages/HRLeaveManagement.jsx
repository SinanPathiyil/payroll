import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import {
  Clock,
  CheckCircle,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Activity,
  BarChart3
} from 'lucide-react';
import axios from 'axios';

export default function HRLeaveManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [onLeaveToday, setOnLeaveToday] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Load stats
      const statsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/hr/leave/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(statsResponse.data);

      // Load employees on leave today
      const onLeaveResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/hr/leave/on-leave-today`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOnLeaveToday(onLeaveResponse.data.employees || []);

      // Load recent requests (pending)
      const requestsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/hr/leave/pending-approvals?limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecentRequests(requestsResponse.data.requests || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="layout-loading">
          <p className="layout-loading-text">No data available</p>
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
            <h1 className="ba-dashboard-title">Leave Management Dashboard</h1>
            <p className="ba-dashboard-subtitle">
              Overview of all leave requests and approvals
            </p>
          </div>
          <div className="ba-dashboard-actions">
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/hr/leave/calendar')}
            >
              <Calendar className="w-4 h-4" />
              <span>Company Calendar</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/hr/leave/approvals')}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Pending Approvals</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="ba-stats-grid">
          {/* Pending Approvals */}
          <div className="ba-stat-card" onClick={() => navigate('/hr/leave/approvals')}>
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Pending Approvals</p>
                <p className="ba-stat-value">{stats.pending_count}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge warning">
                    Requires action
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
                <Clock className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>Review requests</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Approved Today */}
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Approved Today</p>
                <p className="ba-stat-value">{stats.approved_today_count}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge success">
                    Processed
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* On Leave Today */}
          <div className="ba-stat-card" onClick={() => navigate('/hr/leave/calendar')}>
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">On Leave Today</p>
                <p className="ba-stat-value">{stats.on_leave_today_count}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge info">
                    {onLeaveToday.length} employees
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Users className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>View calendar</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Total Requests */}
          <div className="ba-stat-card" onClick={() => navigate('/hr/leave/all-requests')}>
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Requests</p>
                <p className="ba-stat-value">{stats.total_requests}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge info">
                    All time
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-purple">
                <BarChart3 className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>View all</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="ba-content-grid">
          {/* Pending Requests */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Clock className="w-5 h-5" />
                <span>Recent Pending Requests</span>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                onClick={() => navigate('/hr/leave/approvals')}
              >
                View All
              </button>
            </div>
            <div className="ba-card-body">
              {recentRequests.length === 0 ? (
                <div className="ba-empty-state">
                  <CheckCircle className="ba-empty-icon" />
                  <p>No pending requests</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    All caught up! 🎉
                  </p>
                </div>
              ) : (
                <div className="ba-activity-list">
                  {recentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="ba-activity-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/hr/leave/approvals')}
                    >
                      <div
                        className="ba-activity-indicator"
                        style={{ backgroundColor: request.leave_type_color }}
                      />
                      <div className="ba-activity-content">
                        <p className="ba-activity-message">
                          <strong>{request.user_name}</strong> - {request.leave_type_name}
                        </p>
                        <p className="ba-activity-time">
                          {formatDate(request.start_date)} → {formatDate(request.end_date)}
                          {' '}({request.total_days} days)
                        </p>
                      </div>
                      <span className="ba-stat-badge warning">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Employees on Leave Today */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Users className="w-5 h-5" />
                <span>On Leave Today</span>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                onClick={() => navigate('/hr/leave/calendar')}
              >
                View Calendar
              </button>
            </div>
            <div className="ba-card-body">
              {onLeaveToday.length === 0 ? (
                <div className="ba-empty-state">
                  <Calendar className="ba-empty-icon" />
                  <p>No one on leave today</p>
                </div>
              ) : (
                <div className="ba-activity-list">
                  {onLeaveToday.map((employee) => (
                    <div key={employee.request_number} className="ba-activity-item">
                      <div
                        className="ba-activity-indicator"
                        style={{ backgroundColor: '#3b82f6' }}
                      />
                      <div className="ba-activity-content">
                        <p className="ba-activity-message">
                          <strong>{employee.user_name}</strong>
                        </p>
                        <p className="ba-activity-time">
                          {employee.leave_type} • {employee.total_days} {employee.total_days === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                      <span className="ba-stat-badge info">
                        Away
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <TrendingUp className="w-5 h-5" />
              <span>Quick Actions</span>
            </div>
          </div>
          <div className="ba-card-body">
            <div className="ba-quick-actions">
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate('/hr/leave/approvals')}
              >
                <CheckCircle className="w-5 h-5" />
                <span>Review Approvals</span>
              </button>
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate('/hr/leave/all-requests')}
              >
                <Activity className="w-5 h-5" />
                <span>All Requests</span>
              </button>
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate('/hr/leave/calendar')}
              >
                <Calendar className="w-5 h-5" />
                <span>Company Calendar</span>
              </button>
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate('/hr/leave/allocation')}
              >
                <Users className="w-5 h-5" />
                <span>Allocate Leaves</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="ba-card ba-performance-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <BarChart3 className="w-5 h-5" />
              <span>Leave Statistics</span>
            </div>
          </div>
          <div className="ba-card-body">
            <div className="ba-performance-grid">
              <div className="ba-performance-item">
                <div className="ba-performance-label">Approval Rate</div>
                <div className="ba-performance-value">
                  {stats.total_requests > 0
                    ? ((stats.total_requests - stats.pending_count) / stats.total_requests * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="ba-performance-bar">
                  <div
                    className="ba-performance-fill"
                    style={{
                      width: `${stats.total_requests > 0
                        ? ((stats.total_requests - stats.pending_count) / stats.total_requests * 100)
                        : 0}%`,
                      backgroundColor: '#10b981'
                    }}
                  ></div>
                </div>
              </div>
              <div className="ba-performance-item">
                <div className="ba-performance-label">Pending Review</div>
                <div className="ba-performance-value">
                  {stats.pending_count}
                </div>
              </div>
              <div className="ba-performance-item">
                <div className="ba-performance-label">Processed Today</div>
                <div className="ba-performance-value">
                  {stats.approved_today_count}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Box */}
        {stats.pending_count > 0 && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#fef3c7',
            border: '2px solid #fbbf24',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <AlertCircle className="w-6 h-6" style={{ color: '#92400e', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem 0', color: '#92400e' }}>
                Action Required
              </h3>
              <p style={{ fontSize: '0.875rem', margin: 0, color: '#92400e' }}>
                You have {stats.pending_count} leave {stats.pending_count === 1 ? 'request' : 'requests'} pending approval.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/hr/leave/approvals')}
            >
              Review Now
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}