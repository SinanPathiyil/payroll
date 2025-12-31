import { useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { deleteBAProject } from "../../services/api";
import "../../styles/ba-modal.css";

export default function DeleteProjectModal({ isOpen, onClose, onSuccess, project }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !project) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🗑️ Deleting project:", project.id);

      await deleteBAProject(project.id);

      console.log("✅ Project deleted successfully");

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("❌ Failed to delete project:", error);
      setError(
        error.response?.data?.detail ||
        "Failed to delete project. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const hasActiveWork = project.status === "in_progress" || project.total_tasks > 0;

  return (
    <div className="ba-modal-overlay" onClick={handleClose}>
      <div
        className="ba-modal-container ba-modal-small"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ba-modal-header ba-modal-header-danger">
          <div className="ba-modal-header-content">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="ba-modal-title">Delete Project</h2>
          </div>
          <button className="ba-modal-close-btn" onClick={handleClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="ba-modal-body">
          {error && (
            <div className="ba-alert ba-alert-error">{error}</div>
          )}

          <div className="ba-delete-confirmation">
            <div className="ba-delete-icon">
              <Trash2 className="w-12 h-12" />
            </div>
            <p className="ba-delete-message">
              Are you sure you want to delete <strong>{project.project_name}</strong>?
            </p>
            <p className="ba-delete-warning">
              This action will set the project status to cancelled. All project data will be preserved.
            </p>
            {hasActiveWork && (
              <div className="ba-alert ba-alert-warning">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  This project has <strong>active work</strong>. Please ensure all stakeholders are notified before proceeding.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="ba-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
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
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Project</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}