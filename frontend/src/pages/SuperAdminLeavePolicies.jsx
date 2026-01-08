import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Shield,
  X
} from 'lucide-react';
import axios from 'axios';
import '../styles/ba-dashboard.css';
import '../styles/ba-modal.css';

export default function SuperAdminLeavePolicies() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [policiesRes, typesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/super-admin/leave/policies`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/super-admin/leave/types`, { headers })
      ]);

      setPolicies(policiesRes.data || []);
      setLeaveTypes(typesRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage({ type: 'error', text: 'Failed to load policies' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/super-admin/leave/policies/${selectedPolicy.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Policy deleted successfully' });
      setShowDeleteModal(false);
      setSelectedPolicy(null);
      loadData();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to delete:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to delete policy' });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Policies...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/super-admin/leave')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="ba-dashboard-title">Leave Policies</h1>
              <p className="ba-dashboard-subtitle">
                Define leave allocation rules for different roles
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Add Policy</span>
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`ba-alert ba-alert-${message.type === 'success' ? 'warning' : 'error'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Policies Table */}
        <div className="ba-card">
          <div className="ba-card-body" style={{ padding: 0 }}>
            {policies.length === 0 ? (
              <div className="ba-empty-state">
                <Shield className="ba-empty-icon" />
                <p>No leave policies configured yet</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                  style={{ marginTop: '1rem' }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Policy</span>
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700' }}>Leave Type</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700' }}>Role</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>Allocated Days</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>Carry Forward</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>Pro-rated</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>Accrual</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map((policy) => (
                      <tr
                        key={policy.id}
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: leaveTypes.find(t => t.code === policy.leave_type_code)?.color || '#3b82f6'
                              }}
                            />
                            <span style={{ fontWeight: '600' }}>{policy.leave_type_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className="ba-stat-badge secondary">
                            {policy.role || 'All Roles'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '700', fontSize: '1.1rem' }}>
                          {policy.allocated_days}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {policy.can_carry_forward ? (
                            <span className="ba-stat-badge success">
                              Yes {policy.max_carry_forward ? `(${policy.max_carry_forward})` : ''}
                            </span>
                          ) : (
                            <span className="ba-stat-badge secondary">No</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {policy.pro_rated ? (
                            <CheckCircle className="w-5 h-5" style={{ color: '#10b981', margin: '0 auto' }} />
                          ) : (
                            <X className="w-5 h-5" style={{ color: '#6b7280', margin: '0 auto' }} />
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span className="ba-stat-badge info">
                            {policy.accrual_basis === 'monthly' ? 'Monthly' : 'Yearly'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setSelectedPolicy(policy);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                setSelectedPolicy(policy);
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <CreatePolicyModal
            leaveTypes={leaveTypes}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadData();
              setMessage({ type: 'success', text: 'Policy created successfully' });
              setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && selectedPolicy && (
          <EditPolicyModal
            policy={selectedPolicy}
            leaveTypes={leaveTypes}
            onClose={() => {
              setShowEditModal(false);
              setSelectedPolicy(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedPolicy(null);
              loadData();
              setMessage({ type: 'success', text: 'Policy updated successfully' });
              setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }}
          />
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedPolicy && (
          <div className="ba-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="ba-modal-container ba-modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="ba-modal-header ba-modal-header-danger">
                <div className="ba-modal-header-content">
                  <AlertCircle className="w-6 h-6" />
                  <h2 className="ba-modal-title">Delete Policy</h2>
                </div>
                <button onClick={() => setShowDeleteModal(false)} className="ba-modal-close-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="ba-modal-body">
                <p className="ba-delete-message">
                  Are you sure you want to delete the policy for <strong>{selectedPolicy.leave_type_name}</strong>?
                </p>
                <div className="ba-alert ba-alert-warning">
                  <AlertCircle className="w-5 h-5" />
                  <span>This will affect leave allocations for employees.</span>
                </div>
              </div>
              <div className="ba-modal-footer">
                <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleDelete} className="btn btn-danger">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Create Policy Modal
function CreatePolicyModal({ leaveTypes, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    leave_type_code: '',
    role: '',
    allocated_days: '',
    can_carry_forward: false,
    max_carry_forward: '',
    pro_rated: true,
    applies_to_all: true,
    min_service_months: 0,
    accrual_basis: 'yearly'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.leave_type_code || !formData.allocated_days) {
      setError('Leave type and allocated days are required');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        allocated_days: parseFloat(formData.allocated_days),
        max_carry_forward: formData.max_carry_forward ? parseFloat(formData.max_carry_forward) : null,
        role: formData.applies_to_all ? null : formData.role || null
      };
      await axios.post(
        `${import.meta.env.VITE_API_URL}/super-admin/leave/policies`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (error) {
      console.error('Failed to create:', error);
      setError(error.response?.data?.detail || 'Failed to create policy');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Plus className="w-6 h-6" />
            <h2 className="ba-modal-title">Create Leave Policy</h2>
          </div>
          <button onClick={onClose} className="ba-modal-close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ba-modal-body">
            {error && (
              <div className="ba-alert ba-alert-error">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <div className="ba-form-grid">
              <div className="ba-form-group">
                <label className="ba-form-label">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.leave_type_code}
                  onChange={(e) => setFormData({ ...formData, leave_type_code: e.target.value })}
                  className="ba-form-input"
                  required
                >
                  <option value="">-- Select Leave Type --</option>
                  {leaveTypes.map(type => (
                    <option key={type.code} value={type.code}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div className="ba-form-group">
                <label className="ba-form-label">
                  Allocated Days <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.allocated_days}
                  onChange={(e) => setFormData({ ...formData, allocated_days: e.target.value })}
                  className="ba-form-input"
                  placeholder="e.g., 10"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="ba-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.applies_to_all}
                  onChange={(e) => setFormData({ ...formData, applies_to_all: e.target.checked, role: '' })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Apply to All Roles</span>
              </label>
            </div>

            {!formData.applies_to_all && (
              <div className="ba-form-group">
                <label className="ba-form-label">Specific Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="ba-form-input"
                >
                  <option value="">-- Select Role --</option>
                  <option value="employee">Employee</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="hr">HR</option>
                  <option value="business_analyst">Business Analyst</option>
                </select>
              </div>
            )}

            <div className="ba-form-grid">
              <div className="ba-form-group">
                <label className="ba-form-label">Accrual Basis</label>
                <select
                  value={formData.accrual_basis}
                  onChange={(e) => setFormData({ ...formData, accrual_basis: e.target.value })}
                  className="ba-form-input"
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="ba-form-group">
                <label className="ba-form-label">Min Service (Months)</label>
                <input
                  type="number"
                  value={formData.min_service_months}
                  onChange={(e) => setFormData({ ...formData, min_service_months: parseInt(e.target.value) || 0 })}
                  className="ba-form-input"
                  min="0"
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.pro_rated}
                  onChange={(e) => setFormData({ ...formData, pro_rated: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Pro-rate based on joining date</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.can_carry_forward}
                  onChange={(e) => setFormData({ ...formData, can_carry_forward: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Allow Carry Forward</span>
              </label>
            </div>

            {formData.can_carry_forward && (
              <div className="ba-form-group" style={{ marginTop: '1rem' }}>
                <label className="ba-form-label">Max Carry Forward Days (Optional)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.max_carry_forward}
                  onChange={(e) => setFormData({ ...formData, max_carry_forward: e.target.value })}
                  className="ba-form-input"
                  placeholder="Leave empty for no limit"
                  min="0"
                />
              </div>
            )}
          </div>

          <div className="ba-modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="spinner spinner-sm"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Policy</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Policy Modal
function EditPolicyModal({ policy, leaveTypes, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    allocated_days: policy.allocated_days,
    can_carry_forward: policy.can_carry_forward,
    max_carry_forward: policy.max_carry_forward || '',
    pro_rated: policy.pro_rated,
    min_service_months: policy.min_service_months || 0,
    accrual_basis: policy.accrual_basis || 'yearly'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        allocated_days: parseFloat(formData.allocated_days),
        max_carry_forward: formData.max_carry_forward ? parseFloat(formData.max_carry_forward) : null
      };
      await axios.put(
        `${import.meta.env.VITE_API_URL}/super-admin/leave/policies/${policy.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (error) {
      console.error('Failed to update:', error);
      setError(error.response?.data?.detail || 'Failed to update policy');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Edit className="w-6 h-6" />
            <h2 className="ba-modal-title">Edit Leave Policy</h2>
          </div>
          <button onClick={onClose} className="ba-modal-close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ba-modal-body">
            {error && (
              <div className="ba-alert ba-alert-error">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <div className="ba-form-group">
              <label className="ba-form-label">Leave Type</label>
              <input
                type="text"
                value={policy.leave_type_name}
                className="ba-form-input"
                disabled
                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
              />
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">Role</label>
              <input
                type="text"
                value={policy.role || 'All Roles'}
                className="ba-form-input"
                disabled
                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
              />
            </div>

            <div className="ba-form-grid">
              <div className="ba-form-group">
                <label className="ba-form-label">
                  Allocated Days <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.allocated_days}
                  onChange={(e) => setFormData({ ...formData, allocated_days: e.target.value })}
                  className="ba-form-input"
                  min="0"
                  required
                />
              </div>

              <div className="ba-form-group">
                <label className="ba-form-label">Accrual Basis</label>
                <select
                  value={formData.accrual_basis}
                  onChange={(e) => setFormData({ ...formData, accrual_basis: e.target.value })}
                  className="ba-form-input"
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">Min Service (Months)</label>
              <input
                type="number"
                value={formData.min_service_months}
                onChange={(e) => setFormData({ ...formData, min_service_months: parseInt(e.target.value) || 0 })}
                className="ba-form-input"
                min="0"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.pro_rated}
                  onChange={(e) => setFormData({ ...formData, pro_rated: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Pro-rate based on joining date</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.can_carry_forward}
                  onChange={(e) => setFormData({ ...formData, can_carry_forward: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Allow Carry Forward</span>
              </label>
            </div>

            {formData.can_carry_forward && (
              <div className="ba-form-group" style={{ marginTop: '1rem' }}>
                <label className="ba-form-label">Max Carry Forward Days (Optional)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.max_carry_forward}
                  onChange={(e) => setFormData({ ...formData, max_carry_forward: e.target.value })}
                  className="ba-form-input"
                  placeholder="Leave empty for no limit"
                  min="0"
                />
              </div>
            )}
          </div>

          <div className="ba-modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="spinner spinner-sm"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  <span>Update Policy</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}