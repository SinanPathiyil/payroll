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
  X
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
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [createForm, setCreateForm] = useState({
    role: 'hr',
    email: '',
    full_name: '',
    password: '',
    required_hours: 8.0,
    base_salary: 0
  });

  const [editForm, setEditForm] = useState({
    full_name: '',
    role: '',
    is_active: true,
    required_hours: 8.0,
    base_salary: 0
  });

  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: '',
    reason: ''
  });

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

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    if (statusFilter !== '') {
      filtered = filtered.filter(u => u.is_active === (statusFilter === 'true'));
    }

    setFilteredUsers(filtered);
  };

  // CREATE USER
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const endpoint = createForm.role === 'super_admin' 
        ? '/super-admin/users/super-admin'
        : '/super-admin/users/hr';

      await axios.post(
        `${import.meta.env.VITE_API_URL}${endpoint}`,
        createForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowCreateModal(false);
      setCreateForm({
        role: 'hr',
        email: '',
        full_name: '',
        password: '',
        required_hours: 8.0,
        base_salary: 0
      });
      fetchUsers();
      alert('User created successfully!');
    } catch (err) {
      console.error('Error creating user:', err);
      alert(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  // EDIT USER
  const handleEdit = (selectedUser) => {
    setSelectedUser(selectedUser);
    setEditForm({
      full_name: selectedUser.full_name,
      role: selectedUser.role,
      is_active: selectedUser.is_active,
      required_hours: selectedUser.required_hours || 8.0,
      base_salary: selectedUser.base_salary || 0
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/super-admin/users/${selectedUser.id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowEditModal(false);
      fetchUsers();
      alert('User updated successfully!');
    } catch (err) {
      console.error('Error updating user:', err);
      alert(err.response?.data?.detail || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  // RESET PASSWORD
  const handleResetPassword = (selectedUser) => {
    setSelectedUser(selectedUser);
    setPasswordForm({ new_password: '', confirm_password: '', reason: '' });
    setShowPasswordModal(true);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('Passwords do not match!');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/super-admin/users/${selectedUser.id}/reset-password`,
        {
          user_id: selectedUser.id,
          new_password: passwordForm.new_password,
          reason: passwordForm.reason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowPasswordModal(false);
      setPasswordForm({ new_password: '', confirm_password: '', reason: '' });
      alert('Password reset successfully!');
    } catch (err) {
      console.error('Error resetting password:', err);
      alert(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE USER
  const handleDelete = (selectedUser) => {
    setSelectedUser(selectedUser);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/super-admin/users/${selectedUser.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowDeleteModal(false);
      fetchUsers();
      alert('User deleted successfully!');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.detail || 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
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

        {/* CREATE USER MODAL */}
        {showCreateModal && (
          <div className="sau-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="sau-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sau-modal-header">
                <h2>Create New User</h2>
                <button onClick={() => setShowCreateModal(false)} className="sau-modal-close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="sau-modal-body">
                  <div className="sau-form-group">
                    <label>User Type *</label>
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                      className="sau-input"
                      required
                    >
                      <option value="hr">HR Manager</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  <div className="sau-form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={createForm.full_name}
                      onChange={(e) => setCreateForm({...createForm, full_name: e.target.value})}
                      className="sau-input"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="sau-form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                      className="sau-input"
                      placeholder="john@company.com"
                      required
                    />
                  </div>

                  <div className="sau-form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                      className="sau-input"
                      placeholder="Minimum 8 characters"
                      required
                      minLength="8"
                    />
                  </div>

                  {createForm.role === 'hr' && (
                    <>
                      <div className="sau-form-group">
                        <label>Required Hours</label>
                        <input
                          type="number"
                          step="0.5"
                          value={createForm.required_hours}
                          onChange={(e) => setCreateForm({...createForm, required_hours: parseFloat(e.target.value)})}
                          className="sau-input"
                        />
                      </div>

                      <div className="sau-form-group">
                        <label>Base Salary</label>
                        <input
                          type="number"
                          step="0.01"
                          value={createForm.base_salary}
                          onChange={(e) => setCreateForm({...createForm, base_salary: parseFloat(e.target.value)})}
                          className="sau-input"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="sau-modal-footer">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="sau-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="sau-btn-primary">
                    {submitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT USER MODAL */}
        {showEditModal && (
          <div className="sau-modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="sau-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sau-modal-header">
                <h2>Edit User</h2>
                <button onClick={() => setShowEditModal(false)} className="sau-modal-close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateUser}>
                <div className="sau-modal-body">
                  <div className="sau-form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      className="sau-input"
                      required
                    />
                  </div>

                  <div className="sau-form-group">
                    <label>Role *</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                      className="sau-input"
                      required
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="hr">HR Manager</option>
                      <option value="team_lead">Team Lead</option>
                      <option value="employee">Employee</option>
                    </select>
                  </div>

                  <div className="sau-form-group">
                    <label>Status *</label>
                    <select
                      value={editForm.is_active}
                      onChange={(e) => setEditForm({...editForm, is_active: e.target.value === 'true'})}
                      className="sau-input"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>

                  <div className="sau-form-group">
                    <label>Required Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editForm.required_hours}
                      onChange={(e) => setEditForm({...editForm, required_hours: parseFloat(e.target.value)})}
                      className="sau-input"
                    />
                  </div>

                  <div className="sau-form-group">
                    <label>Base Salary</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.base_salary}
                      onChange={(e) => setEditForm({...editForm, base_salary: parseFloat(e.target.value)})}
                      className="sau-input"
                    />
                  </div>
                </div>

                <div className="sau-modal-footer">
                  <button type="button" onClick={() => setShowEditModal(false)} className="sau-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="sau-btn-primary">
                    {submitting ? 'Updating...' : 'Update User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RESET PASSWORD MODAL */}
        {showPasswordModal && (
          <div className="sau-modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="sau-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sau-modal-header">
                <h2>Reset Password</h2>
                <button onClick={() => setShowPasswordModal(false)} className="sau-modal-close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handlePasswordReset}>
                <div className="sau-modal-body">
                  <div className="sau-modal-info">
                    <strong>User:</strong> {selectedUser?.full_name} ({selectedUser?.email})
                  </div>

                  <div className="sau-form-group">
                    <label>New Password *</label>
                    <input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                      className="sau-input"
                      placeholder="Minimum 8 characters"
                      required
                      minLength="8"
                    />
                  </div>

                  <div className="sau-form-group">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                      className="sau-input"
                      placeholder="Re-enter password"
                      required
                      minLength="8"
                    />
                  </div>

                  <div className="sau-form-group">
                    <label>Reason *</label>
                    <textarea
                      value={passwordForm.reason}
                      onChange={(e) => setPasswordForm({...passwordForm, reason: e.target.value})}
                      className="sau-textarea"
                      placeholder="Reason for password reset..."
                      rows="3"
                      required
                    />
                  </div>
                </div>

                <div className="sau-modal-footer">
                  <button type="button" onClick={() => setShowPasswordModal(false)} className="sau-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="sau-btn-primary">
                    {submitting ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE USER MODAL */}
        {showDeleteModal && (
          <div className="sau-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="sau-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sau-modal-header">
                <h2>Delete User</h2>
                <button onClick={() => setShowDeleteModal(false)} className="sau-modal-close">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="sau-modal-body">
                <div className="sau-modal-warning">
                  <AlertCircle className="w-6 h-6" />
                  <p>This action cannot be undone!</p>
                </div>
                <div className="sau-modal-info">
                  <div><strong>User:</strong> {selectedUser?.full_name}</div>
                  <div><strong>Email:</strong> {selectedUser?.email}</div>
                  <div><strong>Role:</strong> {getRoleLabel(selectedUser?.role)}</div>
                </div>
                <p className="sau-modal-text">
                  Are you sure you want to permanently delete this user?
                </p>
              </div>
              <div className="sau-modal-footer">
                <button onClick={() => setShowDeleteModal(false)} className="sau-btn-secondary">
                  Cancel
                </button>
                <button onClick={handleDeleteUser} disabled={submitting} className="sau-btn-danger">
                  {submitting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}