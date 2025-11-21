import { useState, useEffect } from "react";
import { X, Loader, Send, User, ListTodo } from "lucide-react";
import { getEmployees, getAllTasks, sendMessage } from "../../services/api";

export default function SendMessageModal({ onClose, onSuccess }) {
  const [employees, setEmployees] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: "",
    task_id: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [employeesRes, tasksRes] = await Promise.all([
        getEmployees(),
        getAllTasks(),
      ]);
      setEmployees(employeesRes.data);
      setAllTasks(tasksRes.data);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

  const employeeTasks = formData.employee_id
    ? allTasks.filter((task) => task.assigned_to === formData.employee_id)
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.employee_id || !formData.message) {
      setError("Please select an employee and enter a message");
      return;
    }

    setLoading(true);

    try {
      const selectedTask = formData.task_id
        ? allTasks.find((t) => t.id === formData.task_id)
        : null;

      let messageContent = formData.message;
      if (selectedTask) {
        messageContent = `Regarding Task: "${selectedTask.title}"\n\n${formData.message}`;
      }

      const messageData = {
        to_user: formData.employee_id,
        content: messageContent,
      };

      if (formData.task_id) {
        messageData.task_id = formData.task_id;
      }

      await sendMessage(messageData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "employee_id" ? { task_id: "" } : {}),
    }));
  };

  // 🎯 EXACT SAME STRUCTURE AS CreateTaskModal
  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-md">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <Send className="modal-header-icon" />
            <h2 className="modal-title">Send Message</h2>
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

          {loadingData ? (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 animate-spin mx-auto text-gray-600" />
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : (
            <div className="modal-form-stack">
              {/* Select Employee */}
              <div className="modal-input-group">
                <label className="modal-label">
                  <User className="w-4 h-4" />
                  To Employee <span className="modal-required">*</span>
                </label>
                <select
                  name="employee_id"
                  value={formData.employee_id}
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

              {/* Select Task */}
              <div className="modal-input-group">
                <label className="modal-label">
                  <ListTodo className="w-4 h-4" />
                  Related Task (Optional)
                </label>
                <select
                  name="task_id"
                  value={formData.task_id}
                  onChange={handleChange}
                  disabled={!formData.employee_id}
                  className="modal-select"
                >
                  <option value="">No specific task</option>
                  {employeeTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} ({task.status})
                    </option>
                  ))}
                </select>
                {!formData.employee_id && (
                  <p className="modal-hint">Select an employee first</p>
                )}
                {formData.employee_id && employeeTasks.length === 0 && (
                  <p className="modal-hint">No tasks for this employee</p>
                )}
              </div>

              {/* Message */}
              <div className="modal-input-group">
                <label className="modal-label">
                  Message <span className="modal-required">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Enter your message..."
                  rows="6"
                  className="modal-textarea"
                  required
                />
              </div>
            </div>
          )}

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
              disabled={loading || loadingData}
              className="btn btn-primary"
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
      </div>
    </div>
  );
}