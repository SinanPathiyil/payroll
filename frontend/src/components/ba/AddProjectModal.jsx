import { useState, useEffect } from "react";
import { X, Plus, Trash2, Briefcase, Target, AlertCircle } from "lucide-react";
import { createBAProject, getClients, getTeamLeads } from "../../services/api";
import "../../styles/ba-modal.css";

export default function AddProjectModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [clients, setClients] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [formData, setFormData] = useState({
    project_name: "",
    description: "",
    client_id: "",
    assigned_to_team_lead: "",
    estimated_budget: "",
    total_contract_value: "",
    priority: "medium",
    start_date: "",
    due_date: "",
    milestones: [
      {
        name: "Milestone 1",
        percentage: "",
        amount: "",
      },
    ],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);

      // Fetch clients
      const clientsRes = await getClients();
      const activeClients = clientsRes.data.filter(
        (c) => c.status === "active"
      );
      setClients(activeClients);

      // Fetch team leads
      const teamLeadsRes = await getTeamLeads();
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

  const handleMilestoneChange = (index, field, value) => {
    setFormData((prev) => {
      const newMilestones = [...prev.milestones];
      newMilestones[index] = { ...newMilestones[index], [field]: value };
      return { ...prev, milestones: newMilestones };
    });
  };

  const addMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          name: `Milestone ${prev.milestones.length + 1}`,
          percentage: "",
          amount: "",
        },
      ],
    }));
  };

  const removeMilestone = (index) => {
    if (formData.milestones.length > 1) {
      setFormData((prev) => ({
        ...prev,
        milestones: prev.milestones.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateTotalPercentage = () => {
    return formData.milestones.reduce((sum, m) => {
      const percentage = parseFloat(m.percentage) || 0;
      return sum + percentage;
    }, 0);
  };

  const calculateTotalAmount = () => {
    return formData.milestones.reduce((sum, m) => {
      const amount = parseFloat(m.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.project_name.trim()) {
      newErrors.project_name = "Project name is required";
    }

    if (!formData.client_id) {
      newErrors.client_id = "Please select a client";
    }

    if (!formData.assigned_to_team_lead) {
      newErrors.assigned_to_team_lead = "Please select a team lead";
    }

    if (
      !formData.estimated_budget ||
      parseFloat(formData.estimated_budget) <= 0
    ) {
      newErrors.estimated_budget = "Valid budget is required";
    }

    if (
      !formData.total_contract_value ||
      parseFloat(formData.total_contract_value) <= 0
    ) {
      newErrors.total_contract_value = "Valid contract value is required";
    }

    // Validate milestones
    const validMilestones = formData.milestones.filter(
      (m) => m.name && m.percentage && m.amount
    );

    if (validMilestones.length === 0) {
      newErrors.milestones = "At least one complete milestone is required";
    }

    // Validate milestone percentages sum to 100
    const totalPercentage = calculateTotalPercentage();
    if (Math.abs(totalPercentage - 100) > 0.01) {
      newErrors.milestones_percentage = `Milestone percentages must sum to 100%. Current total: ${totalPercentage.toFixed(2)}%`;
    }

    // Validate milestone amounts sum to contract value
    const totalAmount = calculateTotalAmount();
    const contractValue = parseFloat(formData.total_contract_value) || 0;
    if (Math.abs(totalAmount - contractValue) > 0.01) {
      newErrors.milestones_amount = `Milestone amounts must sum to contract value. Expected: $${contractValue.toFixed(2)}, Got: $${totalAmount.toFixed(2)}`;
    }

    // Validate dates
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

      const validMilestones = formData.milestones.filter(
        (m) => m.name.trim() && m.percentage && m.amount
      );

      const projectData = {
        project_name: formData.project_name.trim(),
        description: formData.description.trim() || null,
        client_id: formData.client_id,
        assigned_to_team_lead: formData.assigned_to_team_lead,
        estimated_budget: parseFloat(formData.estimated_budget),
        total_contract_value: parseFloat(formData.total_contract_value),
        priority: formData.priority,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
        milestones: validMilestones.map((m) => ({
          name: m.name.trim(),
          percentage: parseFloat(m.percentage),
          amount: parseFloat(m.amount),
        })),
      };

      console.log("📤 Creating project:", projectData);

      await createBAProject(projectData);

      console.log("✅ Project created successfully");

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("❌ Failed to create project:", error);
      console.error("❌ Error response:", error.response?.data);
      setErrors({
        submit:
          error.response?.data?.detail ||
          "Failed to create project. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      project_name: "",
      description: "",
      client_id: "",
      assigned_to_team_lead: "",
      estimated_budget: "",
      total_contract_value: "",
      priority: "medium",
      start_date: "",
      due_date: "",
      milestones: [
        {
          name: "Milestone 1",
          percentage: "",
          amount: "",
        },
      ],
    });
    setErrors({});
    onClose();
  };

  const totalPercentage = calculateTotalPercentage();
  const totalAmount = calculateTotalAmount();
  const contractValue = parseFloat(formData.total_contract_value) || 0;

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
            <h2 className="ba-modal-title">Create New Project</h2>
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
                      <span className="ba-form-error">
                        {errors.project_name}
                      </span>
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
                      Client <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="client_id"
                      value={formData.client_id}
                      onChange={handleChange}
                      className={`ba-form-input ${errors.client_id ? "error" : ""}`}
                    >
                      <option value="">Select Client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.company_name}
                        </option>
                      ))}
                    </select>
                    {errors.client_id && (
                      <span className="ba-form-error">{errors.client_id}</span>
                    )}
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
                      <span className="ba-form-error">
                        {errors.assigned_to_team_lead}
                      </span>
                    )}
                    {teamLeads.length === 0 && (
                      <span className="ba-form-hint">
                        No team leads available. Please create team leads first.
                      </span>
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
                </div>
              </div>

              {/* Budget & Timeline */}
              <div className="ba-form-section">
                <h3 className="ba-form-section-title">Budget & Timeline</h3>

                <div className="ba-form-grid">
                  <div className="ba-form-group">
                    <label className="ba-form-label">
                      Estimated Budget <span className="text-red-500">*</span>
                    </label>
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
                      <span className="ba-form-error">
                        {errors.estimated_budget}
                      </span>
                    )}
                  </div>

                  <div className="ba-form-group">
                    <label className="ba-form-label">
                      Total Contract Value{" "}
                      <span className="text-red-500">*</span>
                    </label>
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
                      <span className="ba-form-error">
                        {errors.total_contract_value}
                      </span>
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

              {/* Milestones */}
              <div className="ba-form-section">
                <div className="ba-form-section-header">
                  <h3 className="ba-form-section-title">
                    Project Milestones <span className="text-red-500">*</span>
                  </h3>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={addMilestone}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Milestone</span>
                  </button>
                </div>

                {/* Validation Alerts */}
                {errors.milestones && (
                  <div className="ba-alert ba-alert-warning">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.milestones}</span>
                  </div>
                )}

                {errors.milestones_percentage && (
                  <div className="ba-alert ba-alert-error">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.milestones_percentage}</span>
                  </div>
                )}

                {errors.milestones_amount && (
                  <div className="ba-alert ba-alert-error">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.milestones_amount}</span>
                  </div>
                )}

                {/* Milestone Summary */}
                <div className="ba-milestone-summary">
                  <div className="ba-milestone-summary-item">
                    <span className="ba-milestone-summary-label">
                      Total Percentage:
                    </span>
                    <span
                      className={`ba-milestone-summary-value ${Math.abs(totalPercentage - 100) < 0.01 ? "success" : "error"}`}
                    >
                      {totalPercentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="ba-milestone-summary-item">
                    <span className="ba-milestone-summary-label">
                      Total Amount:
                    </span>
                    <span
                      className={`ba-milestone-summary-value ${Math.abs(totalAmount - contractValue) < 0.01 ? "success" : "error"}`}
                    >
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                  {contractValue > 0 && (
                    <div className="ba-milestone-summary-item">
                      <span className="ba-milestone-summary-label">
                        Contract Value:
                      </span>
                      <span className="ba-milestone-summary-value">
                        ${contractValue.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Milestone List */}
                {formData.milestones.map((milestone, index) => (
                  <div key={`milestone-${index}`} className="ba-milestone-item">
                    <div className="ba-milestone-item-header">
                      <div className="ba-milestone-item-title">
                        <Target className="w-4 h-4" />
                        <span>Milestone {index + 1}</span>
                      </div>
                      {formData.milestones.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeMilestone(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="ba-form-grid ba-form-grid-3">
                      <div className="ba-form-group">
                        <label className="ba-form-label">Milestone Name</label>
                        <input
                          type="text"
                          value={milestone.name}
                          onChange={(e) =>
                            handleMilestoneChange(index, "name", e.target.value)
                          }
                          className="ba-form-input"
                          placeholder="e.g., Design Phase"
                        />
                      </div>

                      <div className="ba-form-group">
                        <label className="ba-form-label">Percentage (%)</label>
                        <input
                          type="number"
                          value={milestone.percentage}
                          onChange={(e) =>
                            handleMilestoneChange(
                              index,
                              "percentage",
                              e.target.value
                            )
                          }
                          className="ba-form-input"
                          placeholder="0"
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </div>

                      <div className="ba-form-group">
                        <label className="ba-form-label">Amount ($)</label>
                        <input
                          type="number"
                          value={milestone.amount}
                          onChange={(e) =>
                            handleMilestoneChange(
                              index,
                              "amount",
                              e.target.value
                            )
                          }
                          className="ba-form-input"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
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
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Create Project</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
