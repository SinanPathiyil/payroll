import { useState, useEffect } from 'react';
import { createOverrideRequest, getEmployees } from '../../services/api';
import { X, AlertCircle, Shield } from 'lucide-react';
import '../../styles/ba-modal.css';

export default function CreateOverrideRequestModal({ isOpen, onClose, onSuccess }) {
  const [requestType, setRequestType] = useState('role_change');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');

  // Role Change Fields
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [requestedRole, setRequestedRole] = useState('');

  // Project Extension Fields
  const [projectId, setProjectId] = useState('');
  const [currentDueDate, setCurrentDueDate] = useState('');
  const [requestedDueDate, setRequestedDueDate] = useState('');

  // Employee Exception Fields
  const [exceptionType, setExceptionType] = useState('');
  const [durationDays, setDurationDays] = useState('');

  // Policy Override Fields
  const [policyName, setPolicyName] = useState('');
  const [overrideDetails, setOverrideDetails] = useState('');
  const [affectedUsers, setAffectedUsers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      resetForm();
    }
  }, [isOpen]);

  const loadEmployees = async () => {
    try {
      const response = await getEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const resetForm = () => {
    setRequestType('role_change');
    setReason('');
    setSelectedEmployee('');
    setRequestedRole('');
    setProjectId('');
    setCurrentDueDate('');
    setRequestedDueDate('');
    setExceptionType('');
    setDurationDays('');
    setPolicyName('');
    setOverrideDetails('');
    setAffectedUsers([]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    let details = {};

    // Build details based on request type
    switch (requestType) {
      case 'role_change':
        if (!selectedEmployee || !requestedRole) {
          setError('Please fill all required fields');
          return;
        }
        const employee = employees.find(e => e.id === selectedEmployee);
        details = {
          user_id: selectedEmployee,
          current_role: employee?.role || 'employee',
          requested_role: requestedRole,
          justification: reason
        };
        break;

      case 'project_extension':
        if (!projectId || !currentDueDate || !requestedDueDate) {
          setError('Please fill all required fields');
          return;
        }
        details = {
          project_id: projectId,
          current_due_date: currentDueDate,
          requested_due_date: requestedDueDate,
          justification: reason
        };
        break;

      case 'employee_exception':
        if (!selectedEmployee || !exceptionType || !durationDays) {
          setError('Please fill all required fields');
          return;
        }
        details = {
          employee_id: selectedEmployee,
          exception_type: exceptionType,
          duration_days: parseInt(durationDays),
          justification: reason
        };
        break;

      case 'policy_override':
        if (!policyName || !overrideDetails) {
          setError('Please fill all required fields');
          return;
        }
        details = {
          policy_name: policyName,
          override_details: overrideDetails,
          affected_users: affectedUsers,
          justification: reason
        };
        break;

      default:
        setError('Invalid request type');
        return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for this request');
      return;
    }

    try {
      setLoading(true);
      await createOverrideRequest({
        request_type: requestType,
        reason: reason.trim(),
        details
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create request:', error);
      setError(error.response?.data?.detail || 'Failed to create override request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal-container ba-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Shield className="w-6 h-6" />
            <h2 className="ba-modal-title">Create Override Request</h2>
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

            {/* Request Type Selection */}
            <div className="ba-form-section">
              <h3 className="ba-form-section-title">Request Type</h3>
              <div className="ba-form-group">
                <label className="ba-form-label">
                  Select Request Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={requestType}
                  onChange={(e) => {
                    setRequestType(e.target.value);
                    setError('');
                  }}
                  className="ba-form-input"
                  required
                >
                  <option value="role_change">Role Change</option>
                  <option value="project_extension">Project Extension</option>
                  <option value="employee_exception">Employee Exception</option>
                  <option value="policy_override">Policy Override</option>
                </select>
              </div>
            </div>

            {/* Request Details */}
            <div className="ba-form-section">
              <h3 className="ba-form-section-title">Request Details</h3>

              {/* Role Change Fields */}
              {requestType === 'role_change' && (
                <div className="ba-form-grid">
                  <div className="ba-form-group">
                    <label className="ba-form-label">
                      Select Employee <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="ba-form-input"
                      required
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} ({emp.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">
                      Requested Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value)}
                      className="ba-form-input"
                      required
                    >
                      <option value="">-- Select Role --</option>
                      <option value="team_lead">Team Lead</option>
                      <option value="hr">HR</option>
                      <option value="business_analyst">Business Analyst</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Project Extension Fields */}
              {requestType === 'project_extension' && (
                <div className="ba-form-grid">
                  <div className="ba-form-group ba-form-group-full">
                    <label className="ba-form-label">
                      Project ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="ba-form-input"
                      placeholder="Enter project ID"
                      required
                    />
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">
                      Current Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={currentDueDate}
                      onChange={(e) => setCurrentDueDate(e.target.value)}
                      className="ba-form-input"
                      required
                    />
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">
                      Requested Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={requestedDueDate}
                      onChange={(e) => setRequestedDueDate(e.target.value)}
                      className="ba-form-input"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Employee Exception Fields */}
              {requestType === 'employee_exception' && (
                <div className="ba-form-grid">
                  <div className="ba-form-group">
                    <label className="ba-form-label">
                      Select Employee <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="ba-form-input"
                      required
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} ({emp.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">
                      Exception Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={exceptionType}
                      onChange={(e) => setExceptionType(e.target.value)}
                      className="ba-form-input"
                      required
                    >
                      <option value="">-- Select Type --</option>
                      <option value="attendance_waiver">Attendance Waiver</option>
                      <option value="hour_reduction">Hour Reduction</option>
                      <option value="schedule_adjustment">Schedule Adjustment</option>
                      <option value="productivity_exception">Productivity Exception</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="ba-form-group ba-form-group-full">
                    <label className="ba-form-label">
                      Duration (Days) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      className="ba-form-input"
                      placeholder="Number of days"
                      min="1"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Policy Override Fields */}
              {requestType === 'policy_override' && (
                <>
                  <div className="ba-form-group">
                    <label className="ba-form-label">
                      Policy Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={policyName}
                      onChange={(e) => setPolicyName(e.target.value)}
                      className="ba-form-input"
                      placeholder="e.g., Remote Work Policy"
                      required
                    />
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">
                      Override Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={overrideDetails}
                      onChange={(e) => setOverrideDetails(e.target.value)}
                      className="ba-form-textarea"
                      rows="3"
                      placeholder="Describe what policy rules need to be overridden..."
                      required
                    />
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">Affected Employees (Optional)</label>
                    <select
                      multiple
                      value={affectedUsers}
                      onChange={(e) => setAffectedUsers(Array.from(e.target.selectedOptions, option => option.value))}
                      className="ba-form-input"
                      style={{ height: '120px' }}
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </option>
                      ))}
                    </select>
                    <p className="ba-form-hint">
                      Hold Ctrl/Cmd to select multiple employees
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Common Reason Field */}
            <div className="ba-form-section">
              <h3 className="ba-form-section-title">Justification</h3>
              <div className="ba-form-group">
                <label className="ba-form-label">
                  Reason / Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="ba-form-textarea"
                  rows="4"
                  placeholder="Provide detailed justification for this override request..."
                  required
                />
              </div>

              <div className="ba-alert ba-alert-warning">
                <AlertCircle className="w-5 h-5" />
                <span>
                  This request will be sent to Super Admin for review and approval.
                </span>
              </div>
            </div>
          </div>

          <div className="ba-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner spinner-sm"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
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