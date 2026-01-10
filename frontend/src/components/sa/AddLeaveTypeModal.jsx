import { useState, useEffect } from 'react';
import { Plus, Edit, X, AlertCircle, Save } from 'lucide-react';
import axios from 'axios';
import '../../styles/ba-modal.css';

export default function AddLeaveTypeModal({ editingType, onClose, onSuccess }) {
  const [predefinedTypes, setPredefinedTypes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    max_days_per_year: 10,
    requires_document: false,
    can_carry_forward: false,
    carry_forward_limit: 0,
    allow_half_day: true,
    color: '#3b82f6',
    is_paid: true,
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editingType) {
      loadPredefinedTypes();
    } else {
      setFormData({
        name: editingType.name,
        code: editingType.code,
        description: editingType.description || '',
        max_days_per_year: editingType.max_days_per_year,
        requires_document: editingType.requires_document,
        can_carry_forward: editingType.can_carry_forward,
        carry_forward_limit: editingType.carry_forward_limit,
        allow_half_day: editingType.allow_half_day,
        color: editingType.color,
        is_paid: editingType.is_paid,
        is_active: editingType.is_active
      });
    }
  }, [editingType]);

  const loadPredefinedTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/leave/leave-types/predefined`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPredefinedTypes(response.data.leave_types || []);
    } catch (error) {
      console.error('Failed to load predefined types:', error);
    }
  };

  const handlePredefinedSelect = (type) => {
    setFormData({
      ...formData,
      name: type.name,
      code: type.code,
      color: type.color
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      if (editingType) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/admin/leave/leave-types/${editingType.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/admin/leave/leave-types`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save leave type:', error);
      setError(error.response?.data?.detail || 'Failed to save leave type');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            {editingType ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            <h2 className="ba-modal-title">
              {editingType ? 'Edit Leave Type' : 'Add New Leave Type'}
            </h2>
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

            {!editingType && predefinedTypes.length > 0 && (
              <div className="ba-form-group">
                <label className="ba-form-label">Select Predefined Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {predefinedTypes.map(type => (
                    <button
                      key={type.code}
                      type="button"
                      onClick={() => handlePredefinedSelect(type)}
                      style={{
                        padding: '0.75rem',
                        border: formData.code === type.code ? `2px solid ${type.color}` : '2px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: formData.code === type.code ? `${type.color}10` : 'white',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        textAlign: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
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
                  required
                  disabled={!!editingType}
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
                  required
                  disabled={!!editingType}
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
              />
            </div>

            <div className="ba-form-grid">
              <div className="ba-form-group">
                <label className="ba-form-label">Max Days Per Year</label>
                <input
                  type="number"
                  value={formData.max_days_per_year}
                  onChange={(e) => setFormData({ ...formData, max_days_per_year: parseInt(e.target.value) })}
                  className="ba-form-input"
                  min="0"
                />
              </div>

              <div className="ba-form-group">
                <label className="ba-form-label">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="ba-form-input"
                  style={{ height: '45px' }}
                />
              </div>
            </div>

            <div className="ba-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_paid}
                  onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Paid Leave</span>
              </label>
            </div>

            <div className="ba-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.allow_half_day}
                  onChange={(e) => setFormData({ ...formData, allow_half_day: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Allow Half Day</span>
              </label>
            </div>

            <div className="ba-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.requires_document}
                  onChange={(e) => setFormData({ ...formData, requires_document: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Requires Supporting Document</span>
              </label>
            </div>

            <div className="ba-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.can_carry_forward}
                  onChange={(e) => setFormData({ ...formData, can_carry_forward: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Can Carry Forward to Next Year</span>
              </label>
            </div>

            {formData.can_carry_forward && (
              <div className="ba-form-group">
                <label className="ba-form-label">Carry Forward Limit (Days)</label>
                <input
                  type="number"
                  value={formData.carry_forward_limit}
                  onChange={(e) => setFormData({ ...formData, carry_forward_limit: parseInt(e.target.value) })}
                  className="ba-form-input"
                  min="0"
                />
              </div>
            )}
          </div>

          <div className="ba-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner spinner-sm"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{editingType ? 'Update' : 'Create'} Leave Type</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}