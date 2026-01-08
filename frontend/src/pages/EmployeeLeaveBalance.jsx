import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import {
  Calendar,
  Plus,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  Info
} from 'lucide-react';
import axios from 'axios';
import ApplyLeaveModal from '../components/employee/ApplyLeaveModal';
import '../styles/ba-dashboard.css';

export default function EmployeeLeaveBalance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/employee/leave/balance`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBalances(response.data || []);
    } catch (error) {
      console.error('Failed to load balance:', error);
      setMessage({ type: 'error', text: 'Failed to load leave balance' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Leave Balance...</p>
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
            <h1 className="ba-dashboard-title">My Leave Balance</h1>
            <p className="ba-dashboard-subtitle">
              View your leave balance and apply for leave
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowApplyModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`ba-alert ba-alert-${message.type === 'success' ? 'warning' : 'error'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Quick Stats */}
        <div className="ba-card">
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Quick Actions</h3>
          </div>
          <div className="ba-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <button
                onClick={() => setShowApplyModal(true)}
                style={{
                  padding: '1.25rem',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.1))',
                  border: '2px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Plus className="w-7 h-7 mb-2" style={{ color: '#3b82f6' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem' }}>Apply for Leave</h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Submit a new leave request</p>
              </button>

              <button
                onClick={() => navigate('/employee/leave/history')}
                style={{
                  padding: '1.25rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.1))',
                  border: '2px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Clock className="w-7 h-7 mb-2" style={{ color: '#10b981' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem' }}>Leave History</h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>View past leave requests</p>
              </button>

              <button
                onClick={() => navigate('/employee/leave/calendar')}
                style={{
                  padding: '1.25rem',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(168, 85, 247, 0.1))',
                  border: '2px solid rgba(168, 85, 247, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Calendar className="w-7 h-7 mb-2" style={{ color: '#a855f7' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem' }}>Team Calendar</h4>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>View team leave calendar</p>
              </button>
            </div>
          </div>
        </div>

        {/* Leave Balances */}
        <div className="ba-card">
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Leave Balance</h3>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Current Year: {new Date().getFullYear()}
            </span>
          </div>
          <div className="ba-card-body">
            {balances.length === 0 ? (
              <div className="ba-empty-state">
                <Info className="ba-empty-icon" />
                <p>No leave balance allocated yet</p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Contact HR for leave allocation
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {balances.map((balance) => (
                  <div
                    key={balance.leave_type_code}
                    style={{
                      padding: '1.5rem',
                      background: `linear-gradient(135deg, ${balance.color}10, ${balance.color}20)`,
                      border: `2px solid ${balance.color}40`,
                      borderRadius: '12px'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                        {balance.leave_type_name}
                      </h4>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: balance.color,
                          border: '2px solid white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      />
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{
                        height: '8px',
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${balance.allocated > 0 ? (balance.available / balance.allocated) * 100 : 0}%`,
                            backgroundColor: balance.color,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Available
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: balance.color }}>
                          {balance.available}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Allocated
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                          {balance.allocated}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Used
                        </p>
                        <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                          {balance.used}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Pending
                        </p>
                        <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                          {balance.pending}
                        </p>
                      </div>
                    </div>

                    {/* Carried Forward */}
                    {balance.carried_forward > 0 && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}>
                        <TrendingUp className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem', color: balance.color }} />
                        <strong>{balance.carried_forward}</strong> carried forward
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Apply Leave Modal */}
        {showApplyModal && (
          <ApplyLeaveModal
            balances={balances}
            onClose={() => setShowApplyModal(false)}
            onSuccess={() => {
              setShowApplyModal(false);
              loadBalance();
              setMessage({ type: 'success', text: 'Leave request submitted successfully!' });
              setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }}
          />
        )}
      </div>
    </Layout>
  );
}