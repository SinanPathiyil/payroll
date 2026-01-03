import { useState, useEffect } from "react";
import { X, Loader, Send, User, ListTodo } from "lucide-react";
import { getTLTeamMembers, getTLTasks, sendMessage } from "../../services/api";

export default function SendMessageModal({ onClose, onSuccess }) {
  const [teamMembers, setTeamMembers] = useState([]);
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
      const [membersRes, tasksRes] = await Promise.all([
        getTLTeamMembers(),
        getTLTasks(),
      ]);
      setTeamMembers(membersRes.data || []);
      setAllTasks(tasksRes.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
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

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-md">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <Send className="modal-header-icon" />
            <h2 className="modal-title">Send Message to Team Member</h2>
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
              <p className="mt-2 text-gray-600">Loading team members...</p>
            </div>
          ) : (
            <div className="modal-form-stack">
              {/* Select Team Member */}
              <div className="modal-input-group">
                <label className="modal-label">
                  <User className="w-4 h-4" />
                  To Team Member <span className="modal-required">*</span>
                </label>
                <select
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  className="modal-select"
                  required
                >
                  <option value="">Select a team member</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name} - {member.email}
                      {member.team_name && ` (${member.team_name})`}
                    </option>
                  ))}
                </select>
                {teamMembers.length === 0 && (
                  <p className="modal-hint text-orange-600">No team members found</p>
                )}
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
                  <p className="modal-hint">Select a team member first</p>
                )}
                {formData.employee_id && employeeTasks.length === 0 && (
                  <p className="modal-hint">No tasks assigned to this member</p>
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
              disabled={loading || loadingData || teamMembers.length === 0}
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