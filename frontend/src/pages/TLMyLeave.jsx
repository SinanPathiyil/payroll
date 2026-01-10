import { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, TrendingUp } from 'lucide-react';
import Layout from '../components/common/Layout';
import ApplyLeaveModal from '../components/employee/ApplyLeaveModal';
import axios from 'axios';

export default function TLMyLeave() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('balance'); // 'balance' or 'history'
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Load balance
      const balanceResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/team-lead/leave/my-leave/balance?year=${currentYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBalances(balanceResponse.data.balances || []);

      // Load history
      const historyResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/team-lead/leave/my-leave/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(historyResponse.data.requests || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
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
      <span style={{ display: 'inline-block', padding: '0.375rem 0.75rem', backgroundColor: s.bg, color: s.text, borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '500' }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading...</p>
        </div>
      </Layout>
    );
  }

  const summary = {
    total_allocated: balances.reduce((sum, b) => sum + b.allocated, 0),
    total_used: balances.reduce((sum, b) => sum + b.used, 0),
    total_available: balances.reduce((sum, b) => sum + b.available, 0)
  };

  return (
    <Layout>
      <div className="ba-dashboard">
        <div className="ba-dashboard-header">
          <div>
            <h1 className="ba-dashboard-title">My Leave Management</h1>
            <p className="ba-dashboard-subtitle">Manage your own leave requests and balance</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowApplyModal(true)}>
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>

        <div className="ba-stats-grid">
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Allocated</p>
                <p className="ba-stat-value">{summary.total_allocated}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Used</p>
                <p className="ba-stat-value">{summary.total_used}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Available</p>
                <p className="ba-stat-value">{summary.total_available}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button className={`btn ${activeTab === 'balance' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('balance')}>
            Leave Balance
          </button>
          <button className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('history')}>
            Leave History
          </button>
        </div>

        {activeTab === 'balance' ? (
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Calendar className="w-5 h-5" />
                <span>Leave Balance by Type ({currentYear})</span>
              </div>
            </div>
            <div className="ba-card-body">
              {balances.length === 0 ? (
                <div className="ba-empty-state">
                  <Calendar className="ba-empty-icon" />
                  <p>No leave balances found</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {balances.map((balance) => (
                    <div key={balance.id} style={{ padding: '1.5rem', border: '2px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#fafafa' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                            {balance.leave_type_name}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                            {balance.leave_type_code}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: '#10b981' }}>
                            {balance.available}
                          </p>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>days available</p>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Allocated</p>
                          <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>{balance.allocated}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Used</p>
                          <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>{balance.used}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Pending</p>
                          <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>{balance.pending}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Carried Forward</p>
                          <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>{balance.carried_forward}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Clock className="w-5 h-5" />
                <span>Leave History ({requests.length})</span>
              </div>
            </div>
            <div className="ba-card-body">
              {requests.length === 0 ? (
                <div className="ba-empty-state">
                  <Calendar className="ba-empty-icon" />
                  <p>No leave requests found</p>
                </div>
              ) : (
                <div className="ba-activity-list">
                  {requests.map((request) => (
                    <div key={request.id} className="ba-activity-item">
                      <div className="ba-activity-indicator" style={{ backgroundColor: request.leave_type_color }} />
                      <div className="ba-activity-content">
                        <p className="ba-activity-message">
                          <strong>{request.leave_type_name}</strong> - {request.request_number}
                        </p>
                        <p className="ba-activity-time">
                          {formatDate(request.start_date)} → {formatDate(request.end_date)} ({request.total_days} days)
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showApplyModal && (
        <ApplyLeaveModal
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false);
            loadData();
          }}
        />
      )}
    </Layout>
  );
}