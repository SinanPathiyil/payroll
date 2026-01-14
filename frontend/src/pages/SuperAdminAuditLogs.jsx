import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import axios from 'axios';
import {
  Activity,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Key,
  UserPlus,
  UserX,
  Edit,
  Trash2
} from 'lucide-react';
import '../styles/super-admin-audit.css';

export default function SuperAdminAuditLogs() {
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    fetchLogs();
  }, [limit, actionFilter]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('limit', limit);
      if (actionFilter) params.append('action_type', actionFilter);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/super-admin/audit-logs?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Handle both { logs: [...] } and [...] response formats
      setLogs(response.data.logs || response.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setLogs([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    // Safety check: ensure logs is an array
    if (!Array.isArray(logs)) {
      setFilteredLogs([]);
      return;
    }
    
    if (!searchTerm) {
      setFilteredLogs(logs);
    } else {
      const filtered = logs.filter(log =>
        log.performer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.target_user_name && log.target_user_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredLogs(filtered);
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'hr_account_created':
      case 'super_admin_created':
        return <UserPlus className="w-4 h-4" />;
      case 'user_updated':
        return <Edit className="w-4 h-4" />;
      case 'user_deleted':
        return <Trash2 className="w-4 h-4" />;
      case 'password_reset':
        return <Key className="w-4 h-4" />;
      case 'role_change_approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'override_request_rejected':
        return <XCircle className="w-4 h-4" />;
      case 'login':
        return <User className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionBadgeClass = (actionType) => {
    if (actionType.includes('created') || actionType.includes('approved')) {
      return 'saal-badge-success';
    }
    if (actionType.includes('deleted') || actionType.includes('rejected')) {
      return 'saal-badge-danger';
    }
    if (actionType.includes('updated') || actionType.includes('reset')) {
      return 'saal-badge-warning';
    }
    return 'saal-badge-info';
  };

  const formatActionType = (actionType) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const actionTypes = [
    'hr_account_created',
    'super_admin_created',
    'user_updated',
    'user_deleted',
    'password_reset',
    'role_change_approved',
    'override_request_rejected',
    'login'
  ];

  if (loading) {
    return (
      <Layout>
        <div className="saal-loading">
          <div className="saal-loading-spinner"></div>
          <p>Loading Audit Logs...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="saal-container">
        {/* Header */}
        <div className="saal-header">
          <div>
            <h1 className="saal-title">Audit Logs</h1>
            <p className="saal-subtitle">
              Track all system activities and user actions
            </p>
          </div>
          <div className="saal-header-info">
            <Activity className="w-5 h-5" />
            <span>{logs.length} Recent Activities</span>
          </div>
        </div>

        {/* Filters */}
        <div className="saal-filters">
          <div className="saal-search">
            <Search className="saal-search-icon" />
            <input
              type="text"
              placeholder="Search by user or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="saal-search-input"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="saal-filter-select"
          >
            <option value="">All Actions</option>
            {actionTypes.map(type => (
              <option key={type} value={type}>
                {formatActionType(type)}
              </option>
            ))}
          </select>

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="saal-filter-select"
          >
            <option value="50">Last 50</option>
            <option value="100">Last 100</option>
            <option value="200">Last 200</option>
            <option value="500">Last 500</option>
          </select>
        </div>

        {/* Logs Timeline */}
        <div className="saal-timeline">
          {filteredLogs.length === 0 ? (
            <div className="saal-empty">
              <FileText className="saal-empty-icon" />
              <p>No audit logs found</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="saal-log-item">
                <div className="saal-log-indicator">
                  <div className={`saal-log-icon ${getActionBadgeClass(log.action_type)}`}>
                    {getActionIcon(log.action_type)}
                  </div>
                  <div className="saal-log-line"></div>
                </div>

                <div className="saal-log-card">
                  <div className="saal-log-header">
                    <div className="saal-log-meta">
                      <span className={`saal-badge ${getActionBadgeClass(log.action_type)}`}>
                        {getActionIcon(log.action_type)}
                        <span>{formatActionType(log.action_type)}</span>
                      </span>
                      <div className="saal-log-time">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="saal-log-body">
                    <div className="saal-log-user">
                      <User className="w-4 h-4" />
                      <span className="saal-log-performer">
                        <strong>{log.performer_name}</strong>
                        <span className="saal-log-role">({log.user_role})</span>
                      </span>
                    </div>

                    {log.target_user_name && (
                      <div className="saal-log-target">
                        <span className="saal-log-arrow">→</span>
                        <span>Target: <strong>{log.target_user_name}</strong></span>
                      </div>
                    )}

                    {Object.keys(log.details).length > 0 && (
                      <div className="saal-log-details">
                        <FileText className="w-4 h-4" />
                        <div className="saal-log-details-content">
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key} className="saal-log-detail-item">
                              <span className="saal-log-detail-key">{key}:</span>
                              <span className="saal-log-detail-value">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {log.ip_address && (
                      <div className="saal-log-ip">
                        <Shield className="w-4 h-4" />
                        <span>IP: {log.ip_address}</span>
                      </div>
                    )}
                  </div>

                  <div className="saal-log-footer">
                    <span className="saal-log-timestamp">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}