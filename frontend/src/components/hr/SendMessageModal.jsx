import { useState, useEffect } from "react";
import { X, Loader, Send, User, AlertCircle } from "lucide-react";
import { getEmployees, sendMessage } from "../../services/api";

export default function SendMessageModal({ onClose, onSuccess }) {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: "",
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
      const employeesRes = await getEmployees();
      setEmployees(employeesRes.data || []);
      setError("");
    } catch (err) {
      console.error("Failed to load employees:", err);
      setError("Failed to load employees. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.employee_id || !formData.message.trim()) {
      setError("Please select an employee and enter a message");
      return;
    }

    setLoading(true);

    try {
      const messageData = {
        to_user: formData.employee_id,
        content: formData.message,
      };

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
    }));
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Send className="w-5 h-5" />
            <h2 className="ba-modal-title">Send Message</h2>
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
              <Loader
                className="w-8 h-8 animate-spin"
                style={{ color: "rgba(11, 11, 13, 0.6)" }}
              />
              <p>Loading employees...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="send-message-form">
              {/* Select Employee */}
              <div className="ba-form-group">
                <label className="ba-form-label">
                  To Employee <span className="text-red-500">*</span>
                </label>
                <select
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  className="ba-form-input"
                  required
                >
                  <option value="">-- Select an employee --</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name} ({employee.email})
                    </option>
                  ))}
                </select>
                {employees.length === 0 && !loadingData && (
                  <small className="ba-form-hint">No employees available</small>
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
                <small className="ba-form-hint">
                  The employee will receive this message in their dashboard
                </small>
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
            form="send-message-form"
            disabled={loading || loadingData || employees.length === 0}
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
