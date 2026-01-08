import { useState, useEffect } from "react";
import { X, Loader, Send, User, ListTodo, AlertCircle } from "lucide-react";
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
      setError("");
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load team data. Please try again.");
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

    if (!formData.employee_id || !formData.message.trim()) {
      setError("Please select a team member and enter a message");
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
      onSuccess?.();
      onClose();
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
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Send className="w-5 h-5" />
            <h2 className="ba-modal-title">Send Message to Team Member</h2>
          </div>
          <button onClick={onClose} className="ba-modal-close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="ba-modal-body">
          {error && (
            <div className="ba-alert ba-alert-error">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {loadingData ? (
            <div className="ba-modal-loading">
              <Loader className="w-8 h-8 animate-spin" style={{ color: 'rgba(11, 11, 13, 0.6)' }} />
              <p>Loading team members...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="send-team-message-form">
              {/* Select Team Member */}
              <div className="ba-form-group">
                <label className="ba-form-label">
                  To Team Member <span className="text-red-500">*</span>
                </label>
                <select
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  className="ba-form-input"
                  required
                >
                  <option value="">-- Select a team member --</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name} ({member.email})
                      {member.team_name && ` - ${member.team_name}`}
                    </option>
                  ))}
                </select>
                {teamMembers.length === 0 && !loadingData && (
                  <small className="ba-form-hint" style={{ color: '#f59e0b' }}>
                    No team members found in your team
                  </small>
                )}
              </div>

              {/* Select Task */}
              <div className="ba-form-group">
                <label className="ba-form-label">
                  Related Task (Optional)
                </label>
                <select
                  name="task_id"
                  value={formData.task_id}
                  onChange={handleChange}
                  disabled={!formData.employee_id}
                  className="ba-form-input"
                >
                  <option value="">-- No specific task --</option>
                  {employeeTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} ({task.status})
                    </option>
                  ))}
                </select>
                {!formData.employee_id && (
                  <small className="ba-form-hint">
                    Select a team member first to see their tasks
                  </small>
                )}
                {formData.employee_id && employeeTasks.length === 0 && (
                  <small className="ba-form-hint">
                    No tasks assigned to this team member
                  </small>
                )}
              </div>

              {/* Message */}
              <div className="ba-form-group">
                <label className="ba-form-label">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Type your message here..."
                  rows="8"
                  className="ba-form-textarea"
                  required
                />
                {formData.task_id && (
                  <small className="ba-form-hint">
                    This message will be linked to the selected task
                  </small>
                )}
                {!formData.task_id && (
                  <small className="ba-form-hint">
                    The team member will receive this message in their dashboard
                  </small>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
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
            form="send-team-message-form"
            disabled={loading || loadingData || teamMembers.length === 0}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}