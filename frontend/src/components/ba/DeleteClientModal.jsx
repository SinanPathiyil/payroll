import { useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { deleteClient } from "../../services/api";
import "../../styles/ba-modal.css";

export default function DeleteClientModal({ isOpen, onClose, onSuccess, client }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !client) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🗑️ Deleting client:", client.id);

      await deleteClient(client.id);

      console.log("✅ Client deleted successfully");

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("❌ Failed to delete client:", error);
      setError(
        error.response?.data?.detail ||
        "Failed to delete client. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

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
            <h2 className="ba-modal-title">Delete Client</h2>
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
              Are you sure you want to delete <strong>{client.company_name}</strong>?
            </p>
            <p className="ba-delete-warning">
              This action will deactivate the client. The client will be set to inactive status.
            </p>
            {client.active_projects > 0 && (
              <div className="ba-alert ba-alert-warning">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  This client has <strong>{client.active_projects} active project(s)</strong>. 
                  You cannot delete a client with active projects.
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
            disabled={loading || client.active_projects > 0}
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Client</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}