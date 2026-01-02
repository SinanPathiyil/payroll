import { X, AlertTriangle } from "lucide-react";
import { cancelMeeting } from "../../services/api";
import { useState } from "react";
import "../../styles/ba-modal.css";

export default function DeleteMeetingModal({ meeting, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    try {
      setLoading(true);
      await cancelMeeting(meeting.id);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to cancel meeting:", err);
      setError(err.response?.data?.detail || "Failed to cancel meeting");
      setLoading(false);
    }
  };

  if (!meeting) return null;

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div
        className="ba-modal-container ba-modal-small"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ba-modal-header ba-modal-header-danger">
          <div className="ba-modal-header-content">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="ba-modal-title">Cancel Meeting</h2>
          </div>
          <button className="ba-modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="ba-modal-body">
          {error && (
            <div className="ba-alert ba-alert-error">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="ba-delete-confirmation">
            <div className="ba-delete-icon">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <p className="ba-delete-message">
              Are you sure you want to cancel this meeting?
            </p>
            <p className="ba-delete-message">
              <strong>{meeting.project_name}</strong> - {meeting.client_name}
            </p>
            <p className="ba-delete-warning">
              This action will mark the meeting as cancelled. You cannot undo this action.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="ba-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Keep Meeting
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm"></div>
                <span>Cancelling...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Cancel Meeting</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}