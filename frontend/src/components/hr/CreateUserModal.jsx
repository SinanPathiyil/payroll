import { useState } from 'react';
import { createUser } from '../../services/api';
import { X, UserPlus, Mail, Lock, Clock, DollarSign } from 'lucide-react';

export default function CreateUserModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'employee',
    required_hours: 8.0,
    base_salary: 0.0
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createUser(formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-md">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <UserPlus className="modal-header-icon" />
            <h2 className="modal-title">Create New Employee</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="modal-error">
              {error}
            </div>
          )}

          <div className="modal-form-grid">
            {/* Full Name */}
            <div className="modal-input-group">
              <label className="modal-label">Full Name</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="modal-input"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div className="modal-input-group">
              <label className="modal-label">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="modal-input"
                placeholder="john.doe@company.com"
              />
            </div>

            {/* Password */}
            <div className="modal-input-group">
              <label className="modal-label">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="modal-input"
                placeholder="••••••••"
              />
            </div>

            {/* Required Hours */}
            <div className="modal-input-group">
              <label className="modal-label">
                <Clock className="w-4 h-4" />
                Required Hours/Day
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.required_hours}
                onChange={(e) => setFormData({ ...formData, required_hours: parseFloat(e.target.value) })}
                className="modal-input"
                placeholder="8.0"
              />
            </div>

            {/* Base Salary */}
            <div className="modal-input-group modal-input-full">
              <label className="modal-label">
                <DollarSign className="w-4 h-4" />
                Base Salary ($)
              </label>
              <input
                type="number"
                step="100"
                min="0"
                required
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) })}
                className="modal-input"
                placeholder="5000"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}