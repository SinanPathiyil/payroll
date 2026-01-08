import { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar, Plus } from 'lucide-react';
import axios from 'axios';
import '../../styles/ba-modal.css';

export default function ApplyLeaveModal({ balances, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [formData, setFormData] = useState({
    leave_type_code: '',
    start_date: '',
    end_date: '',
    is_half_day: false,
    half_day_period: 'first_half',
    reason: '',
    attachments: []
  });

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const loadLeaveTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/employee/leave/types`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaveTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load leave types:', error);
    }
  };

  const getAvailableBalance = () => {
    if (!formData.leave_type_code) return null;
    const balance = balances.find(b => b.leave_type_code === formData.leave_type_code);
    return balance;
  };

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    if (formData.is_half_day) return 0.5;
    
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.leave_type_code || !formData.start_date || !formData.end_date || !formData.reason.trim()) {
      setError('Please fill all required fields');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setError('End date must be after or equal to start date');
      return;
    }

    // Check balance
    const balance = getAvailableBalance();
    const requestedDays = calculateDays();
    if (balance && requestedDays > balance.available) {
      setError(`Insufficient balance. Available: ${balance.available} days, Requested: ${requestedDays} days`);
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/employee/leave/apply`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (error) {
      console.error('Failed to apply:', error);
      setError(error.response?.data?.detail || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const balance = getAvailableBalance();
  const requestedDays = calculateDays();

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Plus className="w-6 h-6" />
            <h2 className="ba-modal-title">Apply for Leave</h2>
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

            {balance && (
              <div style={{
                padding: '1rem',
                backgroundColor: `${balance.color}15`,
                border: `2px solid ${balance.color}40`,
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Available Balance</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0, color: balance.color }}>
                      {balance.available} days
                    </p>
                  </div>
                  {requestedDays > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Requesting</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                        {requestedDays} {requestedDays === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="ba-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_half_day}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    is_half_day: e.target.checked,
                    end_date: e.target.checked ? formData.start_date : formData.end_date
                  })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Half Day Leave</span>
              </label>
            </div>

            {formData.is_half_day && (
              <div className="ba-form-group">
                <label className="ba-form-label">Half Day Period</label>
                <select
                  value={formData.half_day_period}
                  onChange={(e) => setFormData({ ...formData, half_day_period: e.target.value })}
                  className="ba-form-input"
                >
                  <option value="first_half">First Half</option>
                  <option value="second_half">Second Half</option>
                </select>
              </div>
            )}

            <div className="ba-form-grid">
              <div className="ba-form-group">
                <label className="ba-form-label">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    start_date: e.target.value,
                    end_date: formData.is_half_day ? e.target.value : formData.end_date
                  })}
                  className="ba-form-input"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="ba-form-group">
                <label className="ba-form-label">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="ba-form-input"
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                  disabled={formData.is_half_day}
                  required
                />
              </div>
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="ba-form-textarea"
                rows="4"
                placeholder="Please provide a reason for your leave request..."
                required
              />
            </div>

            {balance && requestedDays > balance.available && (
              <div className="ba-alert ba-alert-error">
                <AlertCircle className="w-5 h-5" />
                <span>
                  Insufficient balance! You have {balance.available} days available but requesting {requestedDays} days.
                </span>
              </div>
            )}
          </div>

          <div className="ba-modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || (balance && requestedDays > balance.available)}>
              {submitting ? (
                <>
                  <div className="spinner spinner-sm"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}