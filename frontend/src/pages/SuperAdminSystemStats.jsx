import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import axios from 'axios';
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Clock,
  Calendar,
  Shield,
  UserCog,
  Briefcase,
  User,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import '../styles/super-admin-stats.css';

export default function SuperAdminSystemStats() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch system stats
      const statsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/super-admin/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(statsResponse.data);

      // Fetch recent audit logs for activity analysis
      const logsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/super-admin/audit-logs?limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLogs(logsResponse.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityBreakdown = () => {
    const breakdown = {};
    logs.forEach(log => {
      breakdown[log.action_type] = (breakdown[log.action_type] || 0) + 1;
    });
    return Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const getUserActivityBreakdown = () => {
    const breakdown = {};
    logs.forEach(log => {
      breakdown[log.performer_name] = (breakdown[log.performer_name] || 0) + 1;
    });
    return Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const getTodayActivity = () => {
    const today = new Date().toDateString();
    return logs.filter(log => new Date(log.timestamp).toDateString() === today).length;
  };

  const getWeekActivity = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logs.filter(log => new Date(log.timestamp) > weekAgo).length;
  };

  if (loading) {
    return (
      <Layout>
        <div className="sass-loading">
          <div className="sass-loading-spinner"></div>
          <p>Loading System Statistics...</p>
        </div>
      </Layout>
    );
  }

  const activityBreakdown = getActivityBreakdown();
  const userActivityBreakdown = getUserActivityBreakdown();
  const todayActivity = getTodayActivity();
  const weekActivity = getWeekActivity();

  return (
    <Layout>
      <div className="sass-container">
        {/* Header */}
        <div className="sass-header">
          <div>
            <h1 className="sass-title">System Statistics</h1>
            <p className="sass-subtitle">
              Comprehensive system analytics and insights
            </p>
          </div>
          <div className="sass-header-badge">
            <BarChart3 className="w-5 h-5" />
            <span>Analytics Dashboard</span>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="sass-stats-grid">
          <div className="sass-stat-card sass-stat-primary">
            <div className="sass-stat-icon">
              <Users className="w-8 h-8" />
            </div>
            <div className="sass-stat-content">
              <div className="sass-stat-label">Total Users</div>
              <div className="sass-stat-value">{stats?.total_users || 0}</div>
              <div className="sass-stat-trend">
                <TrendingUp className="w-4 h-4" />
                <span>All system users</span>
              </div>
            </div>
          </div>

          <div className="sass-stat-card sass-stat-success">
            <div className="sass-stat-icon">
              <Activity className="w-8 h-8" />
            </div>
            <div className="sass-stat-content">
              <div className="sass-stat-label">Active Users</div>
              <div className="sass-stat-value">{stats?.active_users || 0}</div>
              <div className="sass-stat-trend">
                <ArrowUp className="w-4 h-4" />
                <span>{((stats?.active_users / stats?.total_users) * 100).toFixed(1)}% of total</span>
              </div>
            </div>
          </div>

          <div className="sass-stat-card sass-stat-warning">
            <div className="sass-stat-icon">
              <Clock className="w-8 h-8" />
            </div>
            <div className="sass-stat-content">
              <div className="sass-stat-label">Today's Activity</div>
              <div className="sass-stat-value">{todayActivity}</div>
              <div className="sass-stat-trend">
                <Activity className="w-4 h-4" />
                <span>Actions performed</span>
              </div>
            </div>
          </div>

          <div className="sass-stat-card sass-stat-info">
            <div className="sass-stat-icon">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="sass-stat-content">
              <div className="sass-stat-label">Weekly Activity</div>
              <div className="sass-stat-value">{weekActivity}</div>
              <div className="sass-stat-trend">
                <TrendingUp className="w-4 h-4" />
                <span>Last 7 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Role Distribution Chart */}
        <div className="sass-card">
          <div className="sass-card-header">
            <h2 className="sass-card-title">
              <Users className="w-5 h-5" />
              Role Distribution
            </h2>
          </div>
          <div className="sass-card-body">
            <div className="sass-role-chart">
              {[
                { role: 'super_admin', label: 'Super Admin', icon: Shield, color: 'purple' },
                { role: 'hr', label: 'HR Manager', icon: UserCog, color: 'blue' },
                { role: 'team_lead', label: 'Team Lead', icon: Briefcase, color: 'indigo' },
                { role: 'employee', label: 'Employee', icon: User, color: 'teal' }
              ].map(({ role, label, icon: Icon, color }) => {
                const count = stats?.role_distribution?.[role] || 0;
                const percentage = stats?.total_users > 0 
                  ? ((count / stats.total_users) * 100).toFixed(1) 
                  : 0;
                
                return (
                  <div key={role} className="sass-role-item">
                    <div className="sass-role-info">
                      <Icon className={`sass-role-icon sass-role-icon-${color}`} />
                      <div className="sass-role-details">
                        <div className="sass-role-label">{label}</div>
                        <div className="sass-role-count">{count} users</div>
                      </div>
                    </div>
                    <div className="sass-role-bar-container">
                      <div 
                        className={`sass-role-bar sass-role-bar-${color}`}
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="sass-role-percentage">{percentage}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity Breakdown */}
        <div className="sass-content-grid">
          {/* Top Actions */}
          <div className="sass-card">
            <div className="sass-card-header">
              <h2 className="sass-card-title">
                <Activity className="w-5 h-5" />
                Top Actions (Last 50)
              </h2>
            </div>
            <div className="sass-card-body">
              {activityBreakdown.length === 0 ? (
                <div className="sass-empty-state">
                  <p>No activity recorded</p>
                </div>
              ) : (
                <div className="sass-activity-list">
                  {activityBreakdown.map(([action, count], index) => (
                    <div key={action} className="sass-activity-item">
                      <div className="sass-activity-rank">#{index + 1}</div>
                      <div className="sass-activity-name">
                        {action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </div>
                      <div className="sass-activity-count">{count}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Most Active Users */}
          <div className="sass-card">
            <div className="sass-card-header">
              <h2 className="sass-card-title">
                <TrendingUp className="w-5 h-5" />
                Most Active Users
              </h2>
            </div>
            <div className="sass-card-body">
              {userActivityBreakdown.length === 0 ? (
                <div className="sass-empty-state">
                  <p>No user activity</p>
                </div>
              ) : (
                <div className="sass-activity-list">
                  {userActivityBreakdown.map(([userName, count], index) => (
                    <div key={userName} className="sass-activity-item">
                      <div className="sass-activity-rank">#{index + 1}</div>
                      <div className="sass-activity-name">{userName}</div>
                      <div className="sass-activity-count">{count} actions</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="sass-card">
          <div className="sass-card-header">
            <h2 className="sass-card-title">
              <Shield className="w-5 h-5" />
              System Health
            </h2>
          </div>
          <div className="sass-card-body">
            <div className="sass-health-grid">
              <div className="sass-health-item sass-health-success">
                <div className="sass-health-icon">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="sass-health-info">
                  <div className="sass-health-label">Active Rate</div>
                  <div className="sass-health-value">
                    {((stats?.active_users / stats?.total_users) * 100).toFixed(1)}%
                  </div>
                  <div className="sass-health-status">Healthy</div>
                </div>
              </div>

              <div className="sass-health-item sass-health-info">
                <div className="sass-health-icon">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="sass-health-info">
                  <div className="sass-health-label">Today's Logins</div>
                  <div className="sass-health-value">{stats?.todays_logins || 0}</div>
                  <div className="sass-health-status">Active</div>
                </div>
              </div>

              <div className="sass-health-item sass-health-warning">
                <div className="sass-health-icon">
                  <Users className="w-6 h-6" />
                </div>
                <div className="sass-health-info">
                  <div className="sass-health-label">Pending Requests</div>
                  <div className="sass-health-value">{stats?.pending_override_requests || 0}</div>
                  <div className="sass-health-status">
                    {stats?.pending_override_requests > 0 ? 'Requires Action' : 'Clear'}
                  </div>
                </div>
              </div>

              <div className="sass-health-item sass-health-primary">
                <div className="sass-health-icon">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div className="sass-health-info">
                  <div className="sass-health-label">Total Activity</div>
                  <div className="sass-health-value">{logs.length}</div>
                  <div className="sass-health-status">Last 50 Actions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}