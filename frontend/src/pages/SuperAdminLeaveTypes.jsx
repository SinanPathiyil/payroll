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
  FileText,
  X
} from 'lucide-react';
import axios from 'axios';
import '../styles/ba-dashboard.css';
import '../styles/ba-modal.css';

export default function SuperAdminLeaveTypes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const loadLeaveTypes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/super-admin/leave/types?include_inactive=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaveTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load leave types:', error);
      setMessage({ type: 'error', text: 'Failed to load leave types' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/super-admin/leave/types/${selectedType.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Leave type deleted successfully' });
      setShowDeleteModal(false);
      setSelectedType(null);
      loadLeaveTypes();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to delete:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to delete leave type' });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Leave Types...</p>
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
              <h1 className="ba-dashboard-title">Leave Types</h1>
              <p className="ba-dashboard-subtitle">
                Manage all leave types available in the system
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Add Leave Type</span>
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`ba-alert ba-alert-${message.type === 'success' ? 'warning' : 'error'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Leave Types Grid */}
        <div className="ba-card">
          <div className="ba-card-body">
            {leaveTypes.length === 0 ? (
              <div className="ba-empty-state">
                <FileText className="ba-empty-icon" />
                <p>No leave types configured yet</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                  style={{ marginTop: '1rem' }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Leave Type</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {leaveTypes.map((type) => (
                  <div
                    key={type.id}
                    style={{
                      padding: '1.5rem',
                      background: `linear-gradient(135deg, ${type.color}10, ${type.color}20)`,
                      border: `2px solid ${type.color}40`,
                      borderRadius: '12px',
                      position: 'relative',
                      opacity: type.is_active ? 1 : 0.6
                    }}
                  >
                    {/* Status Badge */}
                    {!type.is_active && (
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        Inactive
                      </div>
                    )}

                    {/* Color Indicator */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: type.color,
                        border: '2px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }} />
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        margin: 0,
                        flex: 1
                      }}>
                        {type.name}
                      </h3>
                    </div>

                    {/* Code */}
                    <div style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.75rem'
                    }}>
                      {type.code}
                    </div>

                    {/* Description */}
                    {type.description && (
                      <p style={{
                        fontSize: '0.9rem',
                        color: '#6b7280',
                        margin: '0.75rem 0',
                        lineHeight: '1.5'
                      }}>
                        {type.description}
                      </p>
                    )}

                    {/* Features */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      margin: '1rem 0'
                    }}>
                      {type.allow_half_day && (
                        <span className="ba-stat-badge info">Half Day</span>
                      )}
                      {type.requires_documentation && (
                        <span className="ba-stat-badge warning">Doc Required</span>
                      )}
                      {type.allow_carry_forward && (
                        <span className="ba-stat-badge success">Carry Forward</span>
                      )}
                      {type.max_days_per_request && (
                        <span className="ba-stat-badge secondary">Max: {type.max_days_per_request} days</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(0,0,0,0.1)'
                    }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => {
                          setSelectedType(type);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setSelectedType(type);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateLeaveTypeModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadLeaveTypes();
              setMessage({ type: 'success', text: 'Leave type created successfully' });
              setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && selectedType && (
          <EditLeaveTypeModal
            leaveType={selectedType}
            onClose={() => {
              setShowEditModal(false);
              setSelectedType(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedType(null);
              loadLeaveTypes();
              setMessage({ type: 'success', text: 'Leave type updated successfully' });
              setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedType && (
          <div className="ba-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="ba-modal-container ba-modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="ba-modal-header ba-modal-header-danger">
                <div className="ba-modal-header-content">
                  <AlertCircle className="w-6 h-6" />
                  <h2 className="ba-modal-title">Delete Leave Type</h2>
                </div>
                <button onClick={() => setShowDeleteModal(false)} className="ba-modal-close-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="ba-modal-body">
                <p className="ba-delete-message">
                  Are you sure you want to delete <strong>{selectedType.name}</strong>?
                </p>
                <div className="ba-alert ba-alert-warning">
                  <AlertCircle className="w-5 h-5" />
                  <span>This will deactivate the leave type. It cannot be deleted if active policies exist.</span>
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

// Create Leave Type Modal Component
function CreateLeaveTypeModal({ onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#3b82f6',
    requires_documentation: false,
    max_days_per_request: '',
    allow_half_day: true,
    allow_carry_forward: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.code) {
      setError('Name and code are required');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        max_days_per_request: formData.max_days_per_request ? parseInt(formData.max_days_per_request) : null
      };
      await axios.post(
        `${import.meta.env.VITE_API_URL}/super-admin/leave/types`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (error) {
      console.error('Failed to create:', error);
      setError(error.response?.data?.detail || 'Failed to create leave type');
    } finally {
      setSubmitting(false);
    }
  };

  const predefinedColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Plus className="w-6 h-6" />
            <h2 className="ba-modal-title">Create Leave Type</h2>
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
                  Leave Type Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="ba-form-input"
                  placeholder="e.g., Sick Leave"
                  required
                />
              </div>

              <div className="ba-form-group">
                <label className="ba-form-label">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="ba-form-input"
                  placeholder="e.g., SICK"
                  style={{ textTransform: 'uppercase' }}
                  required
                />
              </div>
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="ba-form-textarea"
                rows="3"
                placeholder="Brief description of this leave type..."
              />
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: color,
                      border: formData.color === color ? '3px solid #000' : '2px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">Max Days Per Request (Optional)</label>
              <input
                type="number"
                value={formData.max_days_per_request}
                onChange={(e) => setFormData({ ...formData, max_days_per_request: e.target.value })}
                className="ba-form-input"
                placeholder="Leave empty for no limit"
                min="1"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.allow_half_day}
                  onChange={(e) => setFormData({ ...formData, allow_half_day: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Allow Half-Day Leave</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.allow_carry_forward}
                  onChange={(e) => setFormData({ ...formData, allow_carry_forward: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Allow Carry Forward</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.requires_documentation}
                  onChange={(e) => setFormData({ ...formData, requires_documentation: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Requires Documentation</span>
              </label>
            </div>
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
                  <span>Create Leave Type</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Leave Type Modal Component
function EditLeaveTypeModal({ leaveType, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: leaveType.name,
    description: leaveType.description || '',
    color: leaveType.color,
    requires_documentation: leaveType.requires_documentation,
    max_days_per_request: leaveType.max_days_per_request || '',
    allow_half_day: leaveType.allow_half_day,
    allow_carry_forward: leaveType.allow_carry_forward,
    is_active: leaveType.is_active
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        max_days_per_request: formData.max_days_per_request ? parseInt(formData.max_days_per_request) : null
      };
      await axios.put(
        `${import.meta.env.VITE_API_URL}/super-admin/leave/types/${leaveType.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (error) {
      console.error('Failed to update:', error);
      setError(error.response?.data?.detail || 'Failed to update leave type');
    } finally {
      setSubmitting(false);
    }
  };

  const predefinedColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Edit className="w-6 h-6" />
            <h2 className="ba-modal-title">Edit Leave Type</h2>
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
              <label className="ba-form-label">
                Leave Type Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="ba-form-input"
                required
              />
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">Code</label>
              <input
                type="text"
                value={leaveType.code}
                className="ba-form-input"
                disabled
                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
              />
              <p className="ba-form-hint">Code cannot be changed after creation</p>
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="ba-form-textarea"
                rows="3"
              />
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: color,
                      border: formData.color === color ? '3px solid #000' : '2px solid #e5e7eb',
                      cursor: 'pointer'
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">Max Days Per Request (Optional)</label>
              <input
                type="number"
                value={formData.max_days_per_request}
                onChange={(e) => setFormData({ ...formData, max_days_per_request: e.target.value })}
                className="ba-form-input"
                placeholder="Leave empty for no limit"
                min="1"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Active</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.allow_half_day}
                  onChange={(e) => setFormData({ ...formData, allow_half_day: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Allow Half-Day Leave</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.allow_carry_forward}
                  onChange={(e) => setFormData({ ...formData, allow_carry_forward: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Allow Carry Forward</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.requires_documentation}
                  onChange={(e) => setFormData({ ...formData, requires_documentation: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Requires Documentation</span>
              </label>
            </div>
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
                  <span>Update Leave Type</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}