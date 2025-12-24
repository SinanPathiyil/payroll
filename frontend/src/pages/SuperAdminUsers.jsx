import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import axios from 'axios';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Key,
  Shield,
  UserCog,
  Briefcase,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import '../styles/super-admin-users.css';

export default function SuperAdminUsers() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/super-admin/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter) {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== '') {
      filtered = filtered.filter(u => u.is_active === (statusFilter === 'true'));
    }

    setFilteredUsers(filtered);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin': return <Shield className="w-4 h-4" />;
      case 'hr': return <UserCog className="w-4 h-4" />;
      case 'team_lead': return <Briefcase className="w-4 h-4" />;
      case 'employee': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      super_admin: 'Super Admin',
      hr: 'HR Manager',
      team_lead: 'Team Lead',
      employee: 'Employee',
      business_analyst: 'Business Analyst'
    };
    return labels[role] || role;
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'super_admin': return 'sau-badge-purple';
      case 'hr': return 'sau-badge-blue';
      case 'team_lead': return 'sau-badge-indigo';
      case 'employee': return 'sau-badge-gray';
      default: return 'sau-badge-gray';
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
    setActiveDropdown(null);
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
    setActiveDropdown(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="sau-loading">
          <div className="sau-loading-spinner"></div>
          <p>Loading Users...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="sau-container">
        {/* Header */}
        <div className="sau-header">
          <div>
            <h1 className="sau-title">User Management</h1>
            <p className="sau-subtitle">
              Manage all system users and permissions
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="sau-stats">
          <div className="sau-stat-item">
            <div className="sau-stat-label">Total Users</div>
            <div className="sau-stat-value">{users.length}</div>
          </div>
          <div className="sau-stat-item">
            <div className="sau-stat-label">Active</div>
            <div className="sau-stat-value sau-stat-success">
              {users.filter(u => u.is_active).length}
            </div>
          </div>
          <div className="sau-stat-item">
            <div className="sau-stat-label">Inactive</div>
            <div className="sau-stat-value sau-stat-danger">
              {users.filter(u => !u.is_active).length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="sau-filters">
          <div className="sau-search">
            <Search className="sau-search-icon" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sau-search-input"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="sau-filter-select"
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="hr">HR Manager</option>
            <option value="team_lead">Team Lead</option>
            <option value="employee">Employee</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sau-filter-select"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="sau-card">
          <div className="sau-table-wrapper">
            <table className="sau-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="sau-empty">
                      <Users className="sau-empty-icon" />
                      <p>No users found</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="sau-user-cell">
                          <div className="sau-user-avatar">
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="sau-user-name">{u.full_name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`sau-badge ${getRoleBadgeClass(u.role)}`}>
                          {getRoleIcon(u.role)}
                          <span>{getRoleLabel(u.role)}</span>
                        </span>
                      </td>
                      <td>
                        <span className={`sau-status ${u.is_active ? 'sau-status-active' : 'sau-status-inactive'}`}>
                          {u.is_active ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              <span>Inactive</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className="sau-email">{u.email}</span>
                      </td>
                      <td>
                        <div className="sau-actions">
                          <button
                            className="sau-action-btn"
                            onClick={() => handleEdit(u)}
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="sau-action-btn"
                            onClick={() => handleResetPassword(u)}
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            className="sau-action-btn sau-action-danger"
                            onClick={() => handleDelete(u)}
                            title="Delete User"
                            disabled={u.id === user.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals will be added in next step */}
      </div>
    </Layout>
  );
}