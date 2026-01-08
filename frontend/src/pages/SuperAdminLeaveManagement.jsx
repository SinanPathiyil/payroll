import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import {
  Settings,
  Calendar,
  Shield,
  Users,
  FileText,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import axios from 'axios';
import '../styles/ba-dashboard.css';

export default function SuperAdminLeaveManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeaveTypes: 0,
    totalPolicies: 0,
    totalHolidays: 0,
    systemEnabled: true
  });
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [typesRes, policiesRes, holidaysRes, settingsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/super-admin/leave/types`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/super-admin/leave/policies`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/super-admin/leave/holidays`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/super-admin/leave/settings`, { headers })
      ]);

      setLeaveTypes(typesRes.data || []);
      setStats({
        totalLeaveTypes: typesRes.data?.length || 0,
        totalPolicies: policiesRes.data?.length || 0,
        totalHolidays: holidaysRes.data?.length || 0,
        systemEnabled: settingsRes.data?.enable_leave_system || false
      });
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
          <p className="layout-loading-text">Loading Leave Management...</p>
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
            <h1 className="ba-dashboard-title">Leave Management System</h1>
            <p className="ba-dashboard-subtitle">
              Configure and manage the entire leave system
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className={`btn ${stats.systemEnabled ? 'btn-success' : 'btn-danger'}`}
              onClick={() => navigate('/super-admin/leave/settings')}
            >
              <Settings className="w-4 h-4" />
              <span>{stats.systemEnabled ? 'System Active' : 'System Disabled'}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="ba-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Leave Types</p>
                <p className="ba-stat-value">{stats.totalLeaveTypes}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <FileText className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Active Policies</p>
                <p className="ba-stat-value">{stats.totalPolicies}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <Shield className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Holidays</p>
                <p className="ba-stat-value">{stats.totalHolidays}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">System Status</p>
                <p className="ba-stat-value" style={{ fontSize: '1.5rem' }}>
                  {stats.systemEnabled ? 'Active' : 'Disabled'}
                </p>
              </div>
              <div className={`ba-stat-icon ${stats.systemEnabled ? 'ba-stat-icon-green' : 'ba-stat-icon-red'}`}>
                {stats.systemEnabled ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
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
                onClick={() => navigate('/super-admin/leave/settings')}
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
                <Settings className="w-8 h-8 mb-3" style={{ color: '#3b82f6' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>System Settings</h4>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                  Configure workflow, policies, and features
                </p>
              </button>

              <button
                className="ba-quick-action-card"
                onClick={() => navigate('/super-admin/leave/types')}
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
                <FileText className="w-8 h-8 mb-3" style={{ color: '#10b981' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Leave Types</h4>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                  Manage leave types and their settings
                </p>
              </button>

              <button
                className="ba-quick-action-card"
                onClick={() => navigate('/super-admin/leave/policies')}
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
                <Shield className="w-8 h-8 mb-3" style={{ color: '#a855f7' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Leave Policies</h4>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                  Set allocation rules and quotas
                </p>
              </button>

              <button
                className="ba-quick-action-card"
                onClick={() => navigate('/super-admin/leave/holidays')}
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
                <Calendar className="w-8 h-8 mb-3" style={{ color: '#f59e0b' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Holidays</h4>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                  Manage public holidays calendar
                </p>
              </button>

              <button
                className="ba-quick-action-card"
                onClick={() => navigate('/super-admin/leave/analytics')}
                style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(239, 68, 68, 0.1))',
                  border: '2px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <TrendingUp className="w-8 h-8 mb-3" style={{ color: '#ef4444' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Analytics</h4>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                  View leave reports and insights
                </p>
              </button>

              <button
                className="ba-quick-action-card"
                onClick={() => navigate('/super-admin/leave/allocate')}
                style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.05), rgba(20, 184, 166, 0.1))',
                  border: '2px solid rgba(20, 184, 166, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Users className="w-8 h-8 mb-3" style={{ color: '#14b8a6' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Allocate Leaves</h4>
                <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                  Bulk allocate leaves to employees
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Active Leave Types */}
        <div className="ba-card">
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Active Leave Types</h3>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/super-admin/leave/types')}
            >
              <Plus className="w-4 h-4" />
              <span>Add Leave Type</span>
            </button>
          </div>
          <div className="ba-card-body">
            {leaveTypes.length === 0 ? (
              <div className="ba-empty-state">
                <FileText className="ba-empty-icon" />
                <p>No leave types configured yet</p>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/super-admin/leave/types')}
                  style={{ marginTop: '1rem' }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Leave Type</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {leaveTypes.slice(0, 6).map((type) => (
                  <div
                    key={type.id}
                    style={{
                      padding: '1.25rem',
                      background: `linear-gradient(135deg, ${type.color}15, ${type.color}25)`,
                      border: `2px solid ${type.color}40`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    onClick={() => navigate(`/super-admin/leave/types/${type.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>{type.name}</h4>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: type.color
                        }}
                      />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.5rem 0' }}>
                      {type.description || 'No description'}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                      {type.allow_half_day && (
                        <span className="ba-stat-badge info" style={{ fontSize: '0.75rem' }}>Half Day</span>
                      )}
                      {type.requires_documentation && (
                        <span className="ba-stat-badge warning" style={{ fontSize: '0.75rem' }}>Doc Required</span>
                      )}
                      {type.allow_carry_forward && (
                        <span className="ba-stat-badge success" style={{ fontSize: '0.75rem' }}>Carry Forward</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}