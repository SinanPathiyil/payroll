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
  Calendar,
  X,
  Download
} from 'lucide-react';
import axios from 'axios';
import '../styles/ba-dashboard.css';
import '../styles/ba-modal.css';

export default function SuperAdminLeaveHolidays() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadHolidays();
  }, [selectedYear]);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/super-admin/leave/holidays?year=${selectedYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHolidays(response.data || []);
    } catch (error) {
      console.error('Failed to load holidays:', error);
      setMessage({ type: 'error', text: 'Failed to load holidays' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/super-admin/leave/holidays/${selectedHoliday.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Holiday deleted successfully' });
      setShowDeleteModal(false);
      setSelectedHoliday(null);
      loadHolidays();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to delete:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to delete holiday' });
    }
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  };

  const groupHolidaysByMonth = () => {
    const grouped = {};
    holidays.forEach(holiday => {
      const date = new Date(holiday.date);
      const month = date.toLocaleString('default', { month: 'long' });
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(holiday);
    });
    return grouped;
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Holidays...</p>
        </div>
      </Layout>
    );
  }

  const groupedHolidays = groupHolidaysByMonth();

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
              <h1 className="ba-dashboard-title">Holiday Calendar</h1>
              <p className="ba-dashboard-subtitle">
                Manage public holidays for leave calculations
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="ba-form-input"
              style={{ width: '120px' }}
            >
              {getYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Add Holiday</span>
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`ba-alert ba-alert-${message.type === 'success' ? 'warning' : 'error'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Summary Card */}
        <div className="ba-card">
          <div className="ba-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Holidays</p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#3b82f6' }}>{holidays.length}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Mandatory</p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#10b981' }}>
                  {holidays.filter(h => !h.is_optional).length}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Optional</p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#f59e0b' }}>
                  {holidays.filter(h => h.is_optional).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Holidays by Month */}
        {holidays.length === 0 ? (
          <div className="ba-card">
            <div className="ba-card-body">
              <div className="ba-empty-state">
                <Calendar className="ba-empty-icon" />
                <p>No holidays configured for {selectedYear}</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                  style={{ marginTop: '1rem' }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Holiday</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {Object.keys(groupedHolidays).sort((a, b) => {
              const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              return months.indexOf(a) - months.indexOf(b);
            }).map(month => (
              <div key={month} className="ba-card">
                <div className="ba-card-header">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>{month}</h3>
                  <span className="ba-stat-badge secondary">
                    {groupedHolidays[month].length} {groupedHolidays[month].length === 1 ? 'holiday' : 'holidays'}
                  </span>
                </div>
                <div className="ba-card-body" style={{ padding: 0 }}>
                  <div style={{ display: 'grid', gap: '0' }}>
                    {groupedHolidays[month].map((holiday, index) => (
                      <div
                        key={holiday.id}
                        style={{
                          padding: '1.25rem 1.5rem',
                          borderBottom: index < groupedHolidays[month].length - 1 ? '1px solid #e5e7eb' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '12px',
                            border: '2px solid #e5e7eb'
                          }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                              {new Date(holiday.date).getDate()}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>
                              {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>
                              {holiday.name}
                            </h4>
                            {holiday.description && (
                              <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
                                {holiday.description}
                              </p>
                            )}
                          </div>
                          <div>
                            {holiday.is_optional ? (
                              <span className="ba-stat-badge warning">Optional</span>
                            ) : (
                              <span className="ba-stat-badge success">Mandatory</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedHoliday(holiday);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setSelectedHoliday(holiday);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <CreateHolidayModal
            selectedYear={selectedYear}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadHolidays();
              setMessage({ type: 'success', text: 'Holiday added successfully' });
              setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && selectedHoliday && (
          <EditHolidayModal
            holiday={selectedHoliday}
            onClose={() => {
              setShowEditModal(false);
              setSelectedHoliday(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedHoliday(null);
              loadHolidays();
              setMessage({ type: 'success', text: 'Holiday updated successfully' });
              setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }}
          />
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedHoliday && (
          <div className="ba-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="ba-modal-container ba-modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="ba-modal-header ba-modal-header-danger">
                <div className="ba-modal-header-content">
                  <AlertCircle className="w-6 h-6" />
                  <h2 className="ba-modal-title">Delete Holiday</h2>
                </div>
                <button onClick={() => setShowDeleteModal(false)} className="ba-modal-close-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="ba-modal-body">
                <p className="ba-delete-message">
                  Are you sure you want to delete <strong>{selectedHoliday.name}</strong>?
                </p>
                <div className="ba-alert ba-alert-warning">
                  <AlertCircle className="w-5 h-5" />
                  <span>This may affect leave calculations for this date.</span>
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

// Create Holiday Modal
function CreateHolidayModal({ selectedYear, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    description: '',
    is_optional: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.date || !formData.name) {
      setError('Date and name are required');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/super-admin/leave/holidays`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (error) {
      console.error('Failed to create:', error);
      setError(error.response?.data?.detail || 'Failed to add holiday');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal-container ba-modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Plus className="w-6 h-6" />
            <h2 className="ba-modal-title">Add Holiday</h2>
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
              <label className="ba-form-label">
                Holiday Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="ba-form-input"
                placeholder="e.g., Independence Day"
                required
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
              <p className="ba-form-hint">Employees can choose to work on this day</p>
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
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Holiday</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Holiday Modal
function EditHolidayModal({ holiday, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: holiday.name,
    description: holiday.description || '',
    is_optional: holiday.is_optional
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/super-admin/leave/holidays/${holiday.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (error) {
      console.error('Failed to update:', error);
      setError(error.response?.data?.detail || 'Failed to update holiday');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal-container ba-modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Edit className="w-6 h-6" />
            <h2 className="ba-modal-title">Edit Holiday</h2>
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
              <label className="ba-form-label">Date</label>
              <input
                type="text"
                value={new Date(holiday.date).toLocaleDateString()}
                className="ba-form-input"
                disabled
                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
              />
              <p className="ba-form-hint">Date cannot be changed after creation</p>
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">
                Holiday Name <span className="text-red-500">*</span>
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
              <label className="ba-form-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="ba-form-textarea"
                rows="3"
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
                  <span>Update Holiday</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}