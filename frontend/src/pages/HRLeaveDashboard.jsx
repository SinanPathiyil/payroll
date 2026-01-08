import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';
import '../styles/ba-dashboard.css';

export default function HRLeaveDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    approvedToday: 0,
    onLeaveToday: 0,
    totalRequests: 0
  });
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [pendingRes, allRequestsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/hr/leave/pending-approvals`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/hr/leave/all-requests`, { headers })
      ]);

      const pending = pendingRes.data || [];
      const allRequests = allRequestsRes.data || [];

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const approvedToday = allRequests.filter(r => 
        r.final_status === 'approved' && 
        r.requested_at && 
        r.requested_at.startsWith(today)
      ).length;

      const onLeaveToday = allRequests.filter(r => 
        r.final_status === 'approved' && 
        new Date(r.start_date) <= new Date() && 
        new Date(r.end_date) >= new Date()
      ).length;

      setStats({
        pendingApprovals: pending.length,
        approvedToday,
        onLeaveToday,
        totalRequests: allRequests.length
      });

      setPendingRequests(pending.slice(0, 5)); // Show only 5 recent
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <Layout>
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div>
            <h1 className="ba-dashboard-title">Leave Management</h1>
            <p className="ba-dashboard-subtitle">
              Manage employee leave requests and approvals
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="ba-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div 
            className="ba-stat-card" 
            onClick={() => navigate('/hr/leave/pending-approvals')}
            style={{ cursor: 'pointer' }}
          >
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Pending Approvals</p>
                <p className="ba-stat-value">{stats.pendingApprovals}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Approved Today</p>
                <p className="ba-stat-value">{stats.approvedToday}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div 
            className="ba-stat-card"
            onClick={() => navigate('/hr/leave/calendar')}
            style={{ cursor: 'pointer' }}
          >
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">On Leave Today</p>
                <p className="ba-stat-value">{stats.onLeaveToday}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Users className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div 
            className="ba-stat-card"
            onClick={() => navigate('/hr/leave/all-requests')}
            style={{ cursor: 'pointer' }}
          >
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Requests</p>
                <p className="ba-stat-value">{stats.totalRequests}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-purple">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="ba-card">
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Quick Actions</h3>
          </div>
          <div className="ba-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <button
                className="ba-quick-action-card"
                onClick={() => navigate('/hr/leave/pending-approvals')}
                style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.1))',
                  border: '2px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Clock className="w-8 h-8 mb-3" style={{ color: '#f59e0b' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Pending Approvals
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                  Review and approve leave requests
                </p>
              </button>

              <button
                className="ba-quick-action-card"
                onClick={() => navigate('/hr/leave/all-requests')}
                style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.1))',
                  border: '2px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Eye className="w-8 h-8 mb-3" style={{ color: '#3b82f6' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  All Requests
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                  View all leave requests
                </p>
              </button>

              <button
                className="ba-quick-action-card"
                onClick={() => navigate('/hr/leave/calendar')}
                style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.1))',
                  border: '2px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Calendar className="w-8 h-8 mb-3" style={{ color: '#10b981' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Company Calendar
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                  View company-wide leave calendar
                </p>
              </button>

              <button
                className="ba-quick-action-card"
                onClick={() => navigate('/hr/leave/allocate')}
                style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(168, 85, 247, 0.1))',
                  border: '2px solid rgba(168, 85, 247, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <TrendingUp className="w-8 h-8 mb-3" style={{ color: '#a855f7' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  Allocate Leaves
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                  Bulk allocate leaves to employees
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Pending Requests */}
        <div className="ba-card">
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
              Recent Pending Requests
            </h3>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/hr/leave/pending-approvals')}
            >
              View All
            </button>
          </div>
          <div className="ba-card-body" style={{ padding: 0 }}>
            {pendingRequests.length === 0 ? (
              <div className="ba-empty-state">
                <CheckCircle className="ba-empty-icon" style={{ color: '#10b981' }} />
                <p>No pending approvals</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700' }}>Employee</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700' }}>Leave Type</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>Duration</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>From - To</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((request) => (
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
                          {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate(`/hr/leave/pending-approvals`)}
                          >
                            Review
                          </button>
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