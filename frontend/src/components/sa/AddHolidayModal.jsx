import { useState, useEffect } from 'react';
import { Plus, Edit, X, AlertCircle, Save } from 'lucide-react';
import axios from 'axios';
import '../../styles/ba-modal.css';

export default function AddHolidayModal({ editingHoliday, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    country: '',
    is_optional: false,
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingHoliday) {
      setFormData({
        name: editingHoliday.name,
        date: editingHoliday.date,
        country: editingHoliday.country || '',
        is_optional: editingHoliday.is_optional,
        description: editingHoliday.description || ''
      });
    }
  }, [editingHoliday]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      if (editingHoliday) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/admin/leave/holidays/${editingHoliday.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/admin/leave/holidays`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save holiday:', error);
      setError(error.response?.data?.detail || 'Failed to save holiday');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            {editingHoliday ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            <h2 className="ba-modal-title">
              {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
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

            <div className="ba-form-group">
              <label className="ba-form-label">
                Holiday Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="ba-form-input"
                placeholder="e.g., New Year's Day"
                required
              />
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="ba-form-input"
                required
              />
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">Country Code (Optional)</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                className="ba-form-input"
                placeholder="e.g., US, UK, IN"
                maxLength={2}
              />
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="ba-form-textarea"
                rows="3"
                placeholder="Optional description..."
              />
            </div>

            <div className="ba-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_optional}
                  onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Optional Holiday</span>
              </label>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', marginLeft: '1.625rem' }}>
                Employees can choose whether to take this holiday
              </p>
            </div>
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
                  <span>{editingHoliday ? 'Update' : 'Add'} Holiday</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}