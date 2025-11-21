import { useState } from 'react';
import { X, Loader, ListTodo, Calendar } from 'lucide-react';
import { createTask } from '../../services/api';

export default function CreateTaskModal({ employees, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.description || !formData.assigned_to) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        assigned_to: formData.assigned_to,
        due_date: formData.due_date || null
      };

      await createTask(taskData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-md">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <ListTodo className="modal-header-icon" />
            <h2 className="modal-title">Assign New Task</h2>
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

          <div className="modal-form-stack">
            {/* Task Title */}
            <div className="modal-input-group">
              <label className="modal-label">
                Task Title <span className="modal-required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter task title"
                className="modal-input"
                required
              />
            </div>

            {/* Task Description */}
            <div className="modal-input-group">
              <label className="modal-label">
                Description <span className="modal-required">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter task description"
                rows="4"
                className="modal-textarea"
                required
              />
            </div>

            {/* Assign To Employee */}
            <div className="modal-input-group">
              <label className="modal-label">
                Assign To <span className="modal-required">*</span>
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className="modal-select"
                required
              >
                <option value="">Select an employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} - {employee.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="modal-input-group">
              <label className="modal-label">
                <Calendar className="w-4 h-4" />
                Due Date (Optional)
              </label>
              <input
                type="datetime-local"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="modal-input"
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
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <ListTodo className="w-4 h-4" />
                  Assign Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}