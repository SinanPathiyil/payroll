import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import axios from 'axios';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Briefcase,
  UserCog,
  AlertCircle,
  Activity,
  TrendingUp,
  Clock
} from 'lucide-react';
import '../styles/super-admin-dashboard.css';

export default function SuperAdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/super-admin/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="sa-loading">
          <div className="sa-loading-spinner"></div>
          <p>Loading Dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="sa-dashboard">
          <div className="sa-card" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#991b1b' }}>
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      iconClass: 'sa-stat-icon-blue'
    },
    {
      title: 'Active Users',
      value: stats?.active_users || 0,
      icon: UserCheck,
      iconClass: 'sa-stat-icon-green'
    },
    {
      title: 'Inactive Users',
      value: stats?.inactive_users || 0,
      icon: UserX,
      iconClass: 'sa-stat-icon-orange'
    },
    {
      title: 'Pending Requests',
      value: stats?.pending_override_requests || 0,
      icon: AlertCircle,
      iconClass: 'sa-stat-icon-red'
    }
  ];

  const roleCards = [
    {
      title: 'Super Admins',
      value: stats?.role_distribution?.super_admin || 0,
      icon: Shield,
      colorClass: 'purple',
      cardClass: 'sa-role-card-purple'
    },
    {
      title: 'HR Managers',
      value: stats?.role_distribution?.hr || 0,
      icon: UserCog,
      colorClass: 'indigo',
      cardClass: 'sa-role-card-indigo'
    },
    {
      title: 'Team Leads',
      value: stats?.role_distribution?.team_lead || 0,
      icon: Briefcase,
      colorClass: 'blue',
      cardClass: 'sa-role-card-blue'
    },
    {
      title: 'Employees',
      value: stats?.role_distribution?.employee || 0,
      icon: Users,
      colorClass: 'teal',
      cardClass: 'sa-role-card-teal'
    }
  ];

  return (
    <Layout>
      <div className="sa-dashboard">
        {/* Header */}
        <div className="sa-dashboard-header">
          <div>
            <h1 className="sa-dashboard-title">Super Admin Dashboard</h1>
            <p className="sa-dashboard-subtitle">
              Welcome back, <strong>{user?.full_name}</strong>
            </p>
          </div>
          <div className="sa-role-badge">
            <Shield className="w-5 h-5" />
            <span>Super Admin</span>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="sa-stats-grid">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="sa-stat-card">
                <div className="sa-stat-content">
                  <div className="sa-stat-info">
                    <p className="sa-stat-label">{stat.title}</p>
                    <p className="sa-stat-value">{stat.value}</p>
                  </div>
                  <div className={`sa-stat-icon ${stat.iconClass}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Role Distribution */}
        <div className="sa-card">
          <div className="sa-card-header">
            <h2 className="sa-card-title">
              <TrendingUp className="w-5 h-5" />
              Role Distribution
            </h2>
          </div>
          <div className="sa-role-grid">
            {roleCards.map((role, index) => {
              const Icon = role.icon;
              return (
                <div key={index} className={`sa-role-card ${role.cardClass}`}>
                  <Icon className={`sa-role-icon sa-role-icon-${role.colorClass}`} />
                  <div className="sa-role-info">
                    <p className="sa-role-label">{role.title}</p>
                    <p className={`sa-role-value sa-role-value-${role.colorClass}`}>
                      {role.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="sa-content-grid">
          {/* Today's Activity */}
          <div className="sa-card">
            <div className="sa-card-header">
              <h2 className="sa-card-title">
                <Activity className="w-5 h-5" />
                Today's Activity
              </h2>
            </div>
            <div className="sa-activity-item">
              <div className="sa-activity-icon">
                <Clock className="w-5 h-5" />
              </div>
              <div className="sa-activity-content">
                <p className="sa-activity-label">Total Logins</p>
                <p className="sa-activity-value">{stats?.todays_logins || 0}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="sa-card">
            <div className="sa-card-header">
              <h2 className="sa-card-title">Quick Actions</h2>
            </div>
            <div className="sa-quick-actions">
              <button 
                className="sa-quick-action-btn sa-quick-action-blue"
                onClick={() => navigate('/super-admin/users')}
              >
                <Users className="w-5 h-5" />
                <span>Manage Users</span>
              </button>
              <button 
                className="sa-quick-action-btn sa-quick-action-purple"
                onClick={() => navigate('/super-admin/override-requests')}
              >
                <AlertCircle className="w-5 h-5" />
                <span>Override Requests</span>
              </button>
              <button 
                className="sa-quick-action-btn sa-quick-action-gray"
                onClick={() => navigate('/super-admin/audit-logs')}
              >
                <Activity className="w-5 h-5" />
                <span>Audit Logs</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}