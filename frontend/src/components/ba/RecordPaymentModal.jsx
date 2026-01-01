import { useState, useEffect } from "react";
import { Plus, CheckCircle, X } from "lucide-react";
import { recordPayment, getBAProjectDetails } from "../../services/api";

export default function RecordPaymentModal({
  isOpen,
  onClose,
  projects,
  onSuccess,
}) {
  const [selectedProject, setSelectedProject] = useState("");
  const [availableMilestones, setAvailableMilestones] = useState([]);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_method: "Bank Transfer",
    transaction_id: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedProject("");
    setSelectedMilestone(null);
    setAvailableMilestones([]);
    setPaymentForm({
      payment_method: "Bank Transfer",
      transaction_id: "",
      payment_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const handleProjectSelect = async (projectId) => {
    setSelectedProject(projectId);
    setSelectedMilestone(null);
    setAvailableMilestones([]);

    if (!projectId) {
      return;
    }

    try {
      // Fetch full project details with milestones
      console.log("🔍 Fetching project details for:", projectId);
      const response = await getBAProjectDetails(projectId);
      const projectDetails = response.data;

      console.log("📋 Project Details:", projectDetails);
      console.log("📋 Milestones:", projectDetails.milestones);

      if (projectDetails && projectDetails.milestones) {
        const reachedMilestones = projectDetails.milestones.filter((m) => {
          console.log(
            `Milestone: ${m.name}, Status: ${m.status}, Payment Received: ${m.payment_received_at}`
          );
          return m.status === "reached" && !m.payment_received_at;
        });

        console.log("✅ Available Milestones for payment:", reachedMilestones);
        setAvailableMilestones(reachedMilestones);
      } else {
        console.log("❌ No milestones found in project");
      }
    } catch (error) {
      console.error("❌ Failed to fetch project details:", error);
      alert("Failed to load project details. Please try again.");
    }
  };

  const handleMilestoneSelect = (milestoneId) => {
    const milestone = availableMilestones.find(
      (m) => m.milestone_id === milestoneId
    );
    setSelectedMilestone(milestone);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProject || !selectedMilestone) {
      alert("Please select a project and milestone");
      return;
    }

    try {
      setSubmitting(true);

      const paymentData = {
        project_id: selectedProject,
        milestone_id: selectedMilestone.milestone_id,
        amount: selectedMilestone.amount,
        payment_method: paymentForm.payment_method,
        transaction_id: paymentForm.transaction_id || undefined,
        payment_date: new Date(paymentForm.payment_date).toISOString(),
        notes: paymentForm.notes || undefined,
      };

      await recordPayment(paymentData);

      alert("Payment recorded successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to record payment:", error);
      alert(error.response?.data?.detail || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div
        className="ba-modal-container ba-modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        {/* FIXED HEADER */}
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Plus className="w-5 h-5" />
            <h2 className="ba-modal-title">Record Payment</h2>
          </div>
          <button className="ba-modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM WITH SCROLLABLE BODY AND FIXED FOOTER */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* SCROLLABLE BODY */}
          <div className="ba-modal-body">
            <div className="ba-form-grid">
              {/* Project Selection */}
              <div className="ba-form-group">
                <label className="ba-form-label">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  className="ba-form-input"
                  value={selectedProject}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Milestone Selection */}
              <div className="ba-form-group">
                <label className="ba-form-label">
                  Milestone <span className="text-red-500">*</span>
                </label>
                <select
                  className="ba-form-input"
                  value={selectedMilestone?.milestone_id || ""}
                  onChange={(e) => handleMilestoneSelect(e.target.value)}
                  disabled={
                    !selectedProject || availableMilestones.length === 0
                  }
                  required
                >
                  <option value="">
                    {!selectedProject
                      ? "Select project first"
                      : availableMilestones.length === 0
                        ? "No reached milestones available"
                        : "Select Milestone"}
                  </option>
                  {availableMilestones.map((milestone) => (
                    <option
                      key={milestone.milestone_id}
                      value={milestone.milestone_id}
                    >
                      {milestone.name} ({milestone.percentage}%) -{" "}
                      {formatCurrency(milestone.amount)}
                    </option>
                  ))}
                </select>

                {/* Info message when no milestones */}
                {selectedProject && availableMilestones.length === 0 && (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#f59e0b",
                      marginTop: "8px",
                      fontStyle: "italic",
                    }}
                  >
                    ℹ️ Only milestones marked as "reached" by the Team Lead can
                    receive payment. Please contact the Team Lead to update
                    milestone status.
                  </p>
                )}
              </div>

              {/* Amount (read-only) */}
              <div className="ba-form-group">
                <label className="ba-form-label">Amount</label>
                <input
                  type="text"
                  className="ba-form-input"
                  value={
                    selectedMilestone
                      ? formatCurrency(selectedMilestone.amount)
                      : ""
                  }
                  placeholder="Select milestone to see amount"
                  disabled
                  readOnly
                  style={{ cursor: "not-allowed" }}
                />
              </div>

              {/* Payment Method */}
              <div className="ba-form-group">
                <label className="ba-form-label">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  className="ba-form-input"
                  value={paymentForm.payment_method}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_method: e.target.value,
                    })
                  }
                  required
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                  <option value="Online Payment">Online Payment</option>
                  <option value="Wire Transfer">Wire Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Transaction ID */}
              <div className="ba-form-group">
                <label className="ba-form-label">Transaction ID</label>
                <input
                  type="text"
                  className="ba-form-input"
                  placeholder="Enter transaction/reference ID"
                  value={paymentForm.transaction_id}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      transaction_id: e.target.value,
                    })
                  }
                />
              </div>

              {/* Payment Date */}
              <div className="ba-form-group">
                <label className="ba-form-label">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="ba-form-input"
                  value={paymentForm.payment_date}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_date: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {/* Notes - Full Width */}
              <div className="ba-form-group ba-form-group-full">
                <label className="ba-form-label">Notes</label>
                <textarea
                  className="ba-form-textarea"
                  rows="3"
                  placeholder="Add any additional notes about this payment..."
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      notes: e.target.value,
                    })
                  }
                ></textarea>
              </div>
            </div>
          </div>

          {/* FIXED FOOTER */}
          <div className="ba-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !selectedMilestone}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Record Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
