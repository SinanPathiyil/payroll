import { useState, useEffect } from "react";
import { X, Save, Briefcase, AlertCircle } from "lucide-react";
import { updateBAProject, getClients, getTeamLeads } from "../../services/api";
import "../../styles/ba-modal.css";

export default function EditProjectModal({ isOpen, onClose, onSuccess, project }) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [clients, setClients] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [formData, setFormData] = useState({
    project_name: "",
    description: "",
    assigned_to_team_lead: "",
    estimated_budget: "",
    total_contract_value: "",
    priority: "medium",
    start_date: "",
    due_date: "",
    status: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        project_name: project.project_name || "",
        description: project.description || "",
        assigned_to_team_lead: project.assigned_to_team_lead || "",
        estimated_budget: project.estimated_budget || "",
        total_contract_value: project.total_contract_value || "",
        priority: project.priority || "medium",
        start_date: project.start_date 
          ? new Date(project.start_date).toISOString().split('T')[0] 
          : "",
        due_date: project.due_date 
          ? new Date(project.due_date).toISOString().split('T')[0] 
          : "",
        status: project.status || "",
      });
      loadInitialData();
    }
  }, [project, isOpen]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      const [clientsRes, teamLeadsRes] = await Promise.all([
        getClients(),
        getTeamLeads()
      ]);
      
      setClients(clientsRes.data.filter(c => c.status === "active"));
      setTeamLeads(teamLeadsRes.data);
      setLoadingData(false);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      setLoadingData(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.project_name.trim()) {
      newErrors.project_name = "Project name is required";
    }

    if (!formData.assigned_to_team_lead) {
      newErrors.assigned_to_team_lead = "Please select a team lead";
    }

    if (formData.estimated_budget && parseFloat(formData.estimated_budget) <= 0) {
      newErrors.estimated_budget = "Valid budget is required";
    }

    if (formData.total_contract_value && parseFloat(formData.total_contract_value) <= 0) {
      newErrors.total_contract_value = "Valid contract value is required";
    }

    if (
      formData.start_date &&
      formData.due_date &&
      new Date(formData.start_date) > new Date(formData.due_date)
    ) {
      newErrors.due_date = "Due date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        project_name: formData.project_name.trim(),
        description: formData.description.trim() || null,
        assigned_to_team_lead: formData.assigned_to_team_lead,
        estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
        total_contract_value: formData.total_contract_value ? parseFloat(formData.total_contract_value) : null,
        priority: formData.priority,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
        status: formData.status || null,
      };

      console.log("📤 Updating project:", updateData);

      await updateBAProject(project.id, updateData);

      console.log("✅ Project updated successfully");

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("❌ Failed to update project:", error);
      console.error("❌ Error response:", error.response?.data);
      setErrors({
        submit:
          error.response?.data?.detail ||
          "Failed to update project. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <div className="ba-modal-overlay" onClick={handleClose}>
      <div
        className="ba-modal-container ba-modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Briefcase className="w-6 h-6" />
            <h2 className="ba-modal-title">Edit Project</h2>
          </div>
          <button className="ba-modal-close-btn" onClick={handleClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="ba-modal-body">
          {loadingData ? (
            <div className="ba-modal-loading">
              <div className="spinner spinner-md"></div>
              <p>Loading data...</p>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {errors.submit && (
                <div className="ba-alert ba-alert-error">{errors.submit}</div>
              )}

              {/* Project Information */}
              <div className="ba-form-section">
                <h3 className="ba-form-section-title">Project Information</h3>

                <div className="ba-form-grid">
                  <div className="ba-form-group ba-form-group-full">
                    <label className="ba-form-label">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="project_name"
                      value={formData.project_name}
                      onChange={handleChange}
                      className={`ba-form-input ${errors.project_name ? "error" : ""}`}
                      placeholder="Enter project name"
                    />
                    {errors.project_name && (
                      <span className="ba-form-error">{errors.project_name}</span>
                    )}
                  </div>

                  <div className="ba-form-group ba-form-group-full">
                    <label className="ba-form-label">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="ba-form-textarea"
                      rows="3"
                      placeholder="Project description..."
                    />
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">
                      Team Lead <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="assigned_to_team_lead"
                      value={formData.assigned_to_team_lead}
                      onChange={handleChange}
                      className={`ba-form-input ${errors.assigned_to_team_lead ? "error" : ""}`}
                    >
                      <option value="">Select Team Lead</option>
                      {teamLeads.map((tl) => (
                        <option key={tl.id} value={tl.id}>
                          {tl.full_name}
                        </option>
                      ))}
                    </select>
                    {errors.assigned_to_team_lead && (
                      <span className="ba-form-error">{errors.assigned_to_team_lead}</span>
                    )}
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">Priority</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="ba-form-input"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="ba-form-input"
                    >
                      <option value="requirement_gathering">Requirement Gathering</option>
                      <option value="requirement_uploaded">Requirement Uploaded</option>
                      <option value="on_hold">On Hold</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Budget & Timeline */}
              <div className="ba-form-section">
                <h3 className="ba-form-section-title">Budget & Timeline</h3>

                <div className="ba-form-grid">
                  <div className="ba-form-group">
                    <label className="ba-form-label">Estimated Budget</label>
                    <input
                      type="number"
                      name="estimated_budget"
                      value={formData.estimated_budget}
                      onChange={handleChange}
                      className={`ba-form-input ${errors.estimated_budget ? "error" : ""}`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                    {errors.estimated_budget && (
                      <span className="ba-form-error">{errors.estimated_budget}</span>
                    )}
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">Total Contract Value</label>
                    <input
                      type="number"
                      name="total_contract_value"
                      value={formData.total_contract_value}
                      onChange={handleChange}
                      className={`ba-form-input ${errors.total_contract_value ? "error" : ""}`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                    {errors.total_contract_value && (
                      <span className="ba-form-error">{errors.total_contract_value}</span>
                    )}
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">Start Date</label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      className="ba-form-input"
                    />
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">Due Date</label>
                    <input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleChange}
                      className={`ba-form-input ${errors.due_date ? "error" : ""}`}
                    />
                    {errors.due_date && (
                      <span className="ba-form-error">{errors.due_date}</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </form>

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
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || loadingData}
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}