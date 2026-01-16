import { useState, useEffect } from "react";
import { X, AlertCircle, Calendar, Plus, Upload } from "lucide-react";
import axios from "axios";
import "../../styles/ba-modal.css";

export default function ApplyLeaveModal({
  onClose,
  onSuccess,
  userRole = "employee",
}) {

  console.log("🔍 ApplyLeaveModal - userRole:", userRole);
  // ← Add userRole prop
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [formData, setFormData] = useState({
    leave_type_code: "",
    start_date: "",
    end_date: "",
    is_half_day: false,
    half_day_period: "first_half",
    reason: "",
    attachment_url: null,
  });

  // ✅ Determine API base path based on role
  const getApiBasePath = () => {
    if (userRole === "team_lead") {
      return "/team-lead/leave";
    } else if (userRole === "business_analyst") {
      return "/ba/leave";
    }
    return "/employee/leave";
  };

  useEffect(() => {
    loadLeaveTypes();
    loadBalances();
  }, []);

  const loadLeaveTypes = async () => {
    try {
      const token = localStorage.getItem("token");
      const basePath = getApiBasePath();

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}${basePath}/available-leave-types`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaveTypes(response.data.leave_types || []);
    } catch (error) {
      console.error("Failed to load leave types:", error);
      setError("Failed to load leave types. Please try again.");
    }
  };

  const loadBalances = async () => {
    try {
      const token = localStorage.getItem("token");
      const currentYear = new Date().getFullYear();
      const basePath = getApiBasePath();

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}${basePath}/balance?year=${currentYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBalances(response.data.balances || []);
    } catch (error) {
      console.error("Failed to load balances:", error);
    }
  };

  const getAvailableBalance = () => {
    if (!formData.leave_type_code) return null;
    const balance = balances.find(
      (b) => b.leave_type_code === formData.leave_type_code
    );
    return balance;
  };

  const getLeaveTypeColor = () => {
    const type = leaveTypes.find((t) => t.code === formData.leave_type_code);
    return type?.color || "#3b82f6";
  };

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    if (formData.is_half_day) return 0.5;

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (
      !formData.leave_type_code ||
      !formData.start_date ||
      !formData.end_date ||
      !formData.reason.trim()
    ) {
      setError("Please fill all required fields");
      return;
    }

    if (formData.reason.length < 10) {
      setError("Reason must be at least 10 characters");
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setError("End date must be after or equal to start date");
      return;
    }

    // Check balance (except for unpaid leave)
    const balance = getAvailableBalance();
    const requestedDays = calculateDays();
    if (
      formData.leave_type_code !== "UNPAID" &&
      balance &&
      requestedDays > balance.available
    ) {
      setError(
        `Insufficient balance. Available: ${balance.available} days, Requested: ${requestedDays} days`
      );
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const basePath = getApiBasePath();

      // ✅ Use role-based endpoint
      const endpoint =
        userRole === "team_lead"
          ? `${import.meta.env.VITE_API_URL}${basePath}/my-leave/apply`
          : userRole === "business_analyst"
            ? `${import.meta.env.VITE_API_URL}${basePath}/requests`
            : `${import.meta.env.VITE_API_URL}${basePath}/apply`;

      await axios.post(endpoint, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onSuccess();
    } catch (error) {
      console.error("Failed to apply:", error);
      setError(
        error.response?.data?.detail || "Failed to submit leave request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const balance = getAvailableBalance();
  const requestedDays = calculateDays();
  const leaveColor = getLeaveTypeColor();
  const selectedType = leaveTypes.find(
    (t) => t.code === formData.leave_type_code
  );

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div
        className="ba-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px" }}
      >
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Plus className="w-6 h-6" />
            <h2 className="ba-modal-title">Apply for Leave</h2>
          </div>
          <button onClick={onClose} className="ba-modal-close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ba-modal-body">
            {error && (
              <div className="ba-alert ba-alert-error">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <div className="ba-form-group">
              <label className="ba-form-label">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.leave_type_code}
                onChange={(e) =>
                  setFormData({ ...formData, leave_type_code: e.target.value })
                }
                className="ba-form-input"
                required
              >
                <option value="">-- Select Leave Type --</option>
                {leaveTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.name} ({type.available_balance} days available)
                  </option>
                ))}
              </select>
            </div>

            {balance && (
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: `${leaveColor}15`,
                  border: `2px solid ${leaveColor}40`,
                  borderRadius: "8px",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      Available Balance
                    </p>
                    <p
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: "700",
                        margin: 0,
                        color: leaveColor,
                      }}
                    >
                      {balance.available} days
                    </p>
                  </div>
                  {requestedDays > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "#6b7280",
                          margin: "0 0 0.25rem 0",
                        }}
                      >
                        Requesting
                      </p>
                      <p
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "700",
                          margin: 0,
                        }}
                      >
                        {requestedDays} {requestedDays === 1 ? "day" : "days"}
                      </p>
                    </div>
                  )}
                </div>
                {balance.used > 0 && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.875rem",
                      }}
                    >
                      <span style={{ color: "#6b7280" }}>
                        Allocated: {balance.allocated} days
                      </span>
                      <span style={{ color: "#6b7280" }}>
                        Used: {balance.used} days
                      </span>
                      <span style={{ color: "#6b7280" }}>
                        Pending: {balance.pending} days
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="ba-form-group">
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.is_half_day}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_half_day: e.target.checked,
                      end_date: e.target.checked
                        ? formData.start_date
                        : formData.end_date,
                    })
                  }
                  style={{ width: "18px", height: "18px" }}
                  disabled={!selectedType?.allow_half_day}
                />
                <span style={{ fontSize: "0.95rem", fontWeight: "500" }}>
                  Half Day Leave{" "}
                  {!selectedType?.allow_half_day &&
                    "(Not available for this leave type)"}
                </span>
              </label>
            </div>

            {formData.is_half_day && (
              <div className="ba-form-group">
                <label className="ba-form-label">Half Day Period</label>
                <select
                  value={formData.half_day_period}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      half_day_period: e.target.value,
                    })
                  }
                  className="ba-form-input"
                >
                  <option value="first_half">First Half (Morning)</option>
                  <option value="second_half">Second Half (Afternoon)</option>
                </select>
              </div>
            )}

            <div className="ba-form-grid">
              <div className="ba-form-group">
                <label className="ba-form-label">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      start_date: e.target.value,
                      end_date: formData.is_half_day
                        ? e.target.value
                        : formData.end_date,
                    })
                  }
                  className="ba-form-input"
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="ba-form-group">
                <label className="ba-form-label">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  className="ba-form-input"
                  min={
                    formData.start_date ||
                    new Date().toISOString().split("T")[0]
                  }
                  disabled={formData.is_half_day}
                  required
                />
              </div>
            </div>

            <div className="ba-form-group">
              <label className="ba-form-label">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                className="ba-form-textarea"
                rows="4"
                placeholder="Please provide a detailed reason for your leave request (minimum 10 characters)..."
                minLength={10}
                maxLength={500}
                required
              />
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                {formData.reason.length}/500 characters
              </div>
            </div>

            {selectedType?.requires_document && (
              <div className="ba-form-group">
                <label className="ba-form-label">
                  Supporting Document{" "}
                  {selectedType.requires_document && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <div
                  style={{
                    border: "2px dashed #d1d5db",
                    borderRadius: "8px",
                    padding: "1.5rem",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  <Upload
                    className="w-8 h-8"
                    style={{ margin: "0 auto 0.5rem", color: "#9ca3af" }}
                  />
                  <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    Document required for this leave type
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                      marginTop: "0.25rem",
                    }}
                  >
                    (File upload feature - To be implemented)
                  </p>
                </div>
              </div>
            )}

            {formData.leave_type_code !== "UNPAID" &&
              balance &&
              requestedDays > balance.available && (
                <div className="ba-alert ba-alert-error">
                  <AlertCircle className="w-5 h-5" />
                  <span>
                    Insufficient balance! You have {balance.available} days
                    available but requesting {requestedDays} days.
                  </span>
                </div>
              )}
          </div>

          <div className="ba-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                submitting ||
                (formData.leave_type_code !== "UNPAID" &&
                  balance &&
                  requestedDays > balance.available)
              }
            >
              {submitting ? (
                <>
                  <div className="spinner spinner-sm"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
