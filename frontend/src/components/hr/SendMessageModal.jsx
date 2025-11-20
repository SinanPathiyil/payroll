import { useState, useEffect } from 'react';
import { X, Loader, Send } from 'lucide-react';
import { getEmployees, getAllTasks, sendMessage } from '../../services/api';

export default function SendMessageModal({ onClose, onSuccess, position = 'left' }) {
  const [employees, setEmployees] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: '',
    task_id: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [employeesRes, tasksRes] = await Promise.all([
        getEmployees(),
        getAllTasks()
      ]);
      setEmployees(employeesRes.data);
      setAllTasks(tasksRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  // Filter tasks by selected employee
  const employeeTasks = formData.employee_id
    ? allTasks.filter(task => task.assigned_to === formData.employee_id)
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.employee_id || !formData.message) {
      setError('Please select an employee and enter a message');
      return;
    }

    setLoading(true);

    try {
      // Get selected task details if task is selected
      const selectedTask = formData.task_id 
        ? allTasks.find(t => t.id === formData.task_id)
        : null;

      // Build message content
      let messageContent = formData.message;
      if (selectedTask) {
        messageContent = `Regarding Task: "${selectedTask.title}"\n\n${formData.message}`;
      }

      await sendMessage({
        to_user: formData.employee_id,
        content: messageContent
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset task when employee changes
      ...(name === 'employee_id' ? { task_id: '' } : {})
    }));
  };

  // Position classes
  const positionClasses = {
    center: 'items-center justify-center',
    left: 'items-center justify-start pl-8',
    right: 'items-center justify-end pr-8'
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex ${positionClasses[position]} z-50`}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Send Message</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        {loadingData ? (
          <div className="p-8 text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                {error}
              </div>
            )}

            {/* Select Employee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Employee <span className="text-red-500">*</span>
              </label>
              <select
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Select Task (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Task (Optional)
              </label>
              <select
                name="task_id"
                value={formData.task_id}
                onChange={handleChange}
                disabled={!formData.employee_id}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">No specific task</option>
                {employeeTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.status})
                  </option>
                ))}
              </select>
              {!formData.employee_id && (
                <p className="text-xs text-gray-500 mt-1">Select an employee first</p>
              )}
              {formData.employee_id && employeeTasks.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No tasks for this employee</p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Enter your message..."
                rows="6"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}