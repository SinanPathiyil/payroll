import { useState, useEffect } from "react";
import { X, Upload, FileText, Share2, Download, Trash2 } from "lucide-react";
import { 
  getProjectRequirements, 
  uploadRequirementDocument,
  shareRequirementWithTL 
} from "../../services/api";
import "../../styles/ba-modal.css";

export default function RequirementsModal({ isOpen, onClose, onSuccess, project }) {
  const [loading, setLoading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [version, setVersion] = useState("v1.0");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && project) {
      loadRequirements();
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const loadRequirements = async () => {
    try {
      setLoadingDocs(true);
      const response = await getProjectRequirements(project.id);
      console.log("📄 Requirements loaded:", response.data);
      setRequirements(response.data);
      setLoadingDocs(false);
    } catch (error) {
      console.error("Failed to load requirements:", error);
      setLoadingDocs(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    if (!version.trim()) {
      setError("Please enter a version");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('version', version);
      if (notes) {
        formData.append('notes', notes);
      }

      console.log("📤 Uploading requirement document...");

      await uploadRequirementDocument(project.id, version, selectedFile, notes);

      console.log("✅ Document uploaded successfully");

      // Reset form
      setSelectedFile(null);
      setVersion("v1.0");
      setNotes("");
      document.getElementById('file-input').value = null;

      // Reload requirements
      await loadRequirements();
      onSuccess();
    } catch (error) {
      console.error("❌ Failed to upload document:", error);
      setError(
        error.response?.data?.detail ||
        "Failed to upload document. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleShare = async (docId) => {
    try {
      setLoading(true);
      console.log("📤 Sharing document with Team Lead...");
      
      await shareRequirementWithTL(project.id, docId);
      
      console.log("✅ Document shared successfully");
      
      await loadRequirements();
      onSuccess();
    } catch (error) {
      console.error("❌ Failed to share document:", error);
      setError(
        error.response?.data?.detail ||
        "Failed to share document. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div
        className="ba-modal-container ba-modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <FileText className="w-6 h-6" />
            <h2 className="ba-modal-title">Requirement Documents</h2>
          </div>
          <button className="ba-modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="ba-modal-body">
          {/* Error Message */}
          {error && (
            <div className="ba-alert ba-alert-error">{error}</div>
          )}

          {/* Upload Section */}
          <div className="ba-form-section">
            <h3 className="ba-form-section-title">Upload New Document</h3>

            <div className="ba-upload-section">
              <div className="ba-form-grid">
                <div className="ba-form-group">
                  <label className="ba-form-label">Document Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="ba-form-input"
                    placeholder="e.g., v1.0, v1.1"
                  />
                </div>

                <div className="ba-form-group">
                  <label className="ba-form-label">Select File</label>
                  <input
                    id="file-input"
                    type="file"
                    onChange={handleFileSelect}
                    className="ba-form-input"
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  {selectedFile && (
                    <span className="ba-form-hint">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </span>
                  )}
                </div>

                <div className="ba-form-group ba-form-group-full">
                  <label className="ba-form-label">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="ba-form-textarea"
                    rows="2"
                    placeholder="Add any notes about this document..."
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
              >
                {uploading ? (
                  <>
                    <div className="spinner spinner-sm"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Document</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Documents List */}
          <div className="ba-form-section">
            <h3 className="ba-form-section-title">Uploaded Documents</h3>

            {loadingDocs ? (
              <div className="ba-modal-loading">
                <div className="spinner spinner-md"></div>
                <p>Loading documents...</p>
              </div>
            ) : requirements.length === 0 ? (
              <div className="ba-empty-state">
                <FileText className="ba-empty-icon" style={{ width: '48px', height: '48px' }} />
                <p className="ba-empty-text">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="ba-requirements-list">
                {requirements.map((doc) => (
                  <div key={doc.doc_id} className="ba-requirement-item">
                    <div className="ba-requirement-icon">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="ba-requirement-info">
                      <div className="ba-requirement-header">
                        <h4 className="ba-requirement-name">{doc.filename}</h4>
                        <div className="ba-requirement-badges">
                          {doc.is_latest && (
                            <span className="ba-badge ba-badge-primary">Latest</span>
                          )}
                          {doc.shared_with_team_lead && (
                            <span className="ba-badge ba-badge-success">Shared</span>
                          )}
                          {doc.team_lead_approved && (
                            <span className="ba-badge ba-badge-success">Approved</span>
                          )}
                        </div>
                      </div>
                      <div className="ba-requirement-meta">
                        <span>Version {doc.version}</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>Uploaded {formatDate(doc.uploaded_at)}</span>
                      </div>
                      {doc.approval_notes && (
                        <p className="ba-requirement-notes">
                          Notes: {doc.approval_notes}
                        </p>
                      )}
                    </div>
                    <div className="ba-requirement-actions">
                      {!doc.shared_with_team_lead && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleShare(doc.doc_id)}
                          disabled={loading}
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share with TL</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="ba-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}