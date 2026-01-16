import { useState, useEffect } from "react";
import { X, UserPlus, Users, Mail, Briefcase } from "lucide-react";
import axios from "axios";
import "../../styles/ba-modal.css";

export default function AddTeamMemberModal({
  isOpen,
  onClose,
  onSuccess,
  selectedTeam,
}) {
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadAvailableEmployees();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const loadAvailableEmployees = async () => {
    try {
      setLoadingEmployees(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/team-lead/team/available-employees`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("📋 Available employees:", response.data);
      setAvailableEmployees(response.data || []);
    } catch (error) {
      console.error("Failed to load employees:", error);
      setError(
        error.response?.data?.detail || "Failed to load available employees"
      );
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEmployee) {
      setError("Please select an employee");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!selectedTeam) {
        setError("No team selected. Please select a team first.");
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/team-lead/team/add-member`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            employee_id: selectedEmployee,
            team_id: selectedTeam.id, // ← SEND SELECTED TEAM ID
          },
        }
      );

      console.log("✅ Team member added successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("❌ Failed to add team member:", error);
      setError(
        error.response?.data?.detail ||
          "Failed to add team member. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployee("");
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
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <UserPlus className="w-6 h-6" />
            <h2 className="ba-modal-title">Add Team Member</h2>
          </div>
          <button className="ba-modal-close-btn" onClick={handleClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="ba-modal-body">
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && <div className="ba-alert ba-alert-error">{error}</div>}

            {/* Loading Employees */}
            {loadingEmployees ? (
              <div className="ba-modal-loading">
                <div className="spinner spinner-md"></div>
                <p>Loading available employees...</p>
              </div>
            ) : availableEmployees.length === 0 ? (
              <div className="ba-empty-state">
                <Users
                  className="ba-empty-icon"
                  style={{ width: "64px", height: "64px" }}
                />
                <p className="ba-empty-text">No available employees</p>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "rgba(11, 11, 13, 0.6)",
                    marginTop: "8px",
                  }}
                >
                  All employees are already assigned to teams
                </p>
              </div>
            ) : (
              <>
                {/* Select Employee */}
                <div className="ba-form-group">
                  <label className="ba-form-label">
                    Select Employee <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => {
                      setSelectedEmployee(e.target.value);
                      setError(null);
                    }}
                    className="ba-form-input"
                    required
                  >
                    <option value="">-- Select an employee --</option>
                    {availableEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.email}) - {emp.designation}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Employee Preview */}
                {selectedEmployee && (
                  <div
                    className="ba-contact-item"
                    style={{ marginTop: "20px" }}
                  >
                    <div className="ba-contact-item-header">
                      <div className="ba-contact-item-title">
                        <Users className="w-5 h-5" />
                        Selected Employee
                      </div>
                    </div>
                    <div className="ba-form-grid">
                      {(() => {
                        const emp = availableEmployees.find(
                          (e) => e.id === selectedEmployee
                        );
                        return emp ? (
                          <>
                            <div className="ba-form-group">
                              <label className="ba-form-label">Name</label>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "10px 14px",
                                  background: "rgba(11, 11, 13, 0.03)",
                                  borderRadius: "8px",
                                }}
                              >
                                <Users
                                  className="w-4 h-4"
                                  style={{ color: "rgba(11, 11, 13, 0.6)" }}
                                />
                                <span style={{ fontWeight: "600" }}>
                                  {emp.full_name}
                                </span>
                              </div>
                            </div>
                            <div className="ba-form-group">
                              <label className="ba-form-label">Email</label>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "10px 14px",
                                  background: "rgba(11, 11, 13, 0.03)",
                                  borderRadius: "8px",
                                }}
                              >
                                <Mail
                                  className="w-4 h-4"
                                  style={{ color: "rgba(11, 11, 13, 0.6)" }}
                                />
                                <span style={{ fontWeight: "600" }}>
                                  {emp.email}
                                </span>
                              </div>
                            </div>
                            <div className="ba-form-group ba-form-group-full">
                              <label className="ba-form-label">
                                Designation
                              </label>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "10px 14px",
                                  background: "rgba(11, 11, 13, 0.03)",
                                  borderRadius: "8px",
                                }}
                              >
                                <Briefcase
                                  className="w-4 h-4"
                                  style={{ color: "rgba(11, 11, 13, 0.6)" }}
                                />
                                <span style={{ fontWeight: "600" }}>
                                  {emp.designation}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}
              </>
            )}
          </form>
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
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={
              loading ||
              !selectedEmployee ||
              loadingEmployees ||
              availableEmployees.length === 0
            }
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm"></div>
                <span>Adding...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Add to Team</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
