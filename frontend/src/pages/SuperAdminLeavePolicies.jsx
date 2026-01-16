import { useState, useEffect } from "react";
import { Settings, Save, Plus, Trash2, AlertCircle, Info } from "lucide-react";
import Layout from "../components/common/Layout";
import axios from "axios";

export default function AdminLeavePolicies() {
  const [loading, setLoading] = useState(true);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [policy, setPolicy] = useState({
    year: new Date().getFullYear(),
    probation_enabled: true,
    probation_period_days: 90,
    carry_forward_enabled: true,
    carry_forward_expiry_month: 3,
    carry_forward_expiry_day: 31,
    advance_notice_days: 0,
    max_consecutive_days: 30,
    weekend_days: ["saturday", "sunday"],
    exclude_weekends: true,
    exclude_public_holidays: true,
    role_allocations: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const roles = ["employee", "team_lead", "business_analyst", "hr"];

  useEffect(() => {
    loadLeaveTypes();
    loadPolicy();
  }, [selectedYear]);

  const loadLeaveTypes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/leave/leave-types`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaveTypes(response.data.leave_types || []);
    } catch (error) {
      console.error("Failed to load leave types:", error);
    }
  };

  const loadPolicy = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/leave/policies/${selectedYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        setPolicy(response.data);
      } else {
        // Initialize empty policy for new year
        initializeEmptyPolicy();
      }
    } catch (error) {
      console.error("Failed to load policy:", error);
      // If 404, initialize empty policy
      if (error.response?.status === 404) {
        initializeEmptyPolicy();
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeEmptyPolicy = () => {
    setPolicy({
      year: selectedYear,
      probation_enabled: true,
      probation_period_days: 90,
      carry_forward_enabled: true,
      carry_forward_expiry_month: 3,
      carry_forward_expiry_day: 31,
      advance_notice_days: 0,
      max_consecutive_days: 30,
      weekend_days: ["saturday", "sunday"],
      exclude_weekends: true,
      exclude_public_holidays: true,
      role_allocations: roles.map((role) => ({
        role: role,
        allocations: leaveTypes.map((lt) => ({
          leave_type_code: lt.code,
          days: 0,
        })),
      })),
    });
  };

  const handleWeekendToggle = (day) => {
    const dayLower = day.toLowerCase();
    const newWeekendDays = policy.weekend_days.includes(dayLower)
      ? policy.weekend_days.filter((d) => d !== dayLower)
      : [...policy.weekend_days, dayLower];

    setPolicy({ ...policy, weekend_days: newWeekendDays });
  };

  const updateRoleAllocation = (role, leaveTypeCode, days) => {
    const newRoleAllocations = [...policy.role_allocations];
    const roleIndex = newRoleAllocations.findIndex((r) => r.role === role);

    if (roleIndex === -1) {
      // Add new role
      newRoleAllocations.push({
        role: role,
        allocations: [
          { leave_type_code: leaveTypeCode, days: parseInt(days) || 0 },
        ],
      });
    } else {
      const allocIndex = newRoleAllocations[roleIndex].allocations.findIndex(
        (a) => a.leave_type_code === leaveTypeCode
      );

      if (allocIndex === -1) {
        newRoleAllocations[roleIndex].allocations.push({
          leave_type_code: leaveTypeCode,
          days: parseInt(days) || 0,
        });
      } else {
        newRoleAllocations[roleIndex].allocations[allocIndex].days =
          parseInt(days) || 0;
      }
    }

    setPolicy({ ...policy, role_allocations: newRoleAllocations });
  };

  const getRoleAllocation = (role, leaveTypeCode) => {
    const roleAlloc = policy.role_allocations.find((r) => r.role === role);
    if (!roleAlloc) return 0;

    const leaveAlloc = roleAlloc.allocations.find(
      (a) => a.leave_type_code === leaveTypeCode
    );
    return leaveAlloc ? leaveAlloc.days : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/leave/policies`,
        { ...policy, year: selectedYear },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Leave policy saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to save policy:", error);

      // Handle validation errors (array of error objects)
      if (
        error.response?.data?.detail &&
        Array.isArray(error.response.data.detail)
      ) {
        const errorMessages = error.response.data.detail
          .map((err) => {
            if (typeof err === "object" && err.msg) {
              return `${err.loc ? err.loc.join(" -> ") + ": " : ""}${err.msg}`;
            }
            return String(err);
          })
          .join(", ");
        setError(errorMessages);
      }
      // Handle single error message
      else if (typeof error.response?.data?.detail === "string") {
        setError(error.response.data.detail);
      }
      // Handle error object
      else if (typeof error.response?.data?.detail === "object") {
        setError(JSON.stringify(error.response.data.detail));
      }
      // Fallback
      else {
        setError("Failed to save policy. Please check your inputs.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Policy...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div>
            <h1 className="ba-dashboard-title">Leave Policy Configuration</h1>
            <p className="ba-dashboard-subtitle">
              Configure leave rules and allocations for your organization
            </p>
          </div>
        </div>

        {/* Year Selector */}
        <div className="ba-card">
          <div className="ba-card-body">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                Configure Policy for Year:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="ba-form-input"
                style={{ maxWidth: "200px" }}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - 1 + i
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Alerts */}
          {error && (
            <div className="ba-alert ba-alert-error">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#d1fae5",
                border: "2px solid #6ee7b7",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <Save className="w-5 h-5" style={{ color: "#065f46" }} />
              <span style={{ color: "#065f46", fontWeight: "500" }}>
                {success}
              </span>
            </div>
          )}

          {/* Probation Settings */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Settings className="w-5 h-5" />
                <span>Probation Period Settings</span>
              </div>
            </div>
            <div className="ba-card-body">
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
                    checked={policy.probation_enabled}
                    onChange={(e) =>
                      setPolicy({
                        ...policy,
                        probation_enabled: e.target.checked,
                      })
                    }
                    style={{ width: "18px", height: "18px" }}
                  />
                  <span style={{ fontSize: "0.95rem", fontWeight: "500" }}>
                    Enable Probation Period Restrictions
                  </span>
                </label>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginTop: "0.5rem",
                    marginLeft: "1.625rem",
                  }}
                >
                  Restrict certain leave types during employee probation period
                </p>
              </div>

              {policy.probation_enabled && (
                <div className="ba-form-group">
                  <label className="ba-form-label">
                    Probation Period (Days)
                  </label>
                  <input
                    type="number"
                    value={policy.probation_period_days}
                    onChange={(e) =>
                      setPolicy({
                        ...policy,
                        probation_period_days: parseInt(e.target.value) || 0,
                      })
                    }
                    className="ba-form-input"
                    style={{ maxWidth: "200px" }}
                    min="0"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Carry Forward Settings */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Settings className="w-5 h-5" />
                <span>Carry Forward Settings</span>
              </div>
            </div>
            <div className="ba-card-body">
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
                    checked={policy.carry_forward_enabled}
                    onChange={(e) =>
                      setPolicy({
                        ...policy,
                        carry_forward_enabled: e.target.checked,
                      })
                    }
                    style={{ width: "18px", height: "18px" }}
                  />
                  <span style={{ fontSize: "0.95rem", fontWeight: "500" }}>
                    Allow Unused Leaves to Carry Forward
                  </span>
                </label>
              </div>

              {policy.carry_forward_enabled && (
                <div className="ba-form-grid">
                  <div className="ba-form-group">
                    <label className="ba-form-label">Expiry Month</label>
                    <select
                      value={policy.carry_forward_expiry_month}
                      onChange={(e) =>
                        setPolicy({
                          ...policy,
                          carry_forward_expiry_month: parseInt(e.target.value),
                        })
                      }
                      className="ba-form-input"
                    >
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((month, idx) => (
                        <option key={idx} value={idx + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="ba-form-group">
                    <label className="ba-form-label">Expiry Day</label>
                    <input
                      type="number"
                      value={policy.carry_forward_expiry_day}
                      onChange={(e) =>
                        setPolicy({
                          ...policy,
                          carry_forward_expiry_day:
                            parseInt(e.target.value) || 1,
                        })
                      }
                      className="ba-form-input"
                      min="1"
                      max="31"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Request Rules */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Settings className="w-5 h-5" />
                <span>Leave Request Rules</span>
              </div>
            </div>
            <div className="ba-card-body">
              <div className="ba-form-grid">
                <div className="ba-form-group">
                  <label className="ba-form-label">Advance Notice (Days)</label>
                  <input
                    type="number"
                    value={policy.advance_notice_days}
                    onChange={(e) =>
                      setPolicy({
                        ...policy,
                        advance_notice_days: parseInt(e.target.value) || 0,
                      })
                    }
                    className="ba-form-input"
                    min="0"
                  />
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      marginTop: "0.25rem",
                    }}
                  >
                    Minimum days in advance required to apply (0 = no
                    restriction)
                  </p>
                </div>
                <div className="ba-form-group">
                  <label className="ba-form-label">Max Consecutive Days</label>
                  <input
                    type="number"
                    value={policy.max_consecutive_days}
                    onChange={(e) =>
                      setPolicy({
                        ...policy,
                        max_consecutive_days: parseInt(e.target.value) || 1,
                      })
                    }
                    className="ba-form-input"
                    min="1"
                  />
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      marginTop: "0.25rem",
                    }}
                  >
                    Maximum continuous leave days allowed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekend & Holiday Settings */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Settings className="w-5 h-5" />
                <span>Weekend & Holiday Settings</span>
              </div>
            </div>
            <div className="ba-card-body">
              <div className="ba-form-group">
                <label className="ba-form-label">Weekend Days</label>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <label
                      key={day}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        padding: "0.5rem 1rem",
                        border: "2px solid #e5e7eb",
                        borderRadius: "8px",
                        backgroundColor: policy.weekend_days.includes(
                          day.toLowerCase()
                        )
                          ? "#dbeafe"
                          : "white",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={policy.weekend_days.includes(
                          day.toLowerCase()
                        )}
                        onChange={() => handleWeekendToggle(day)}
                        style={{ width: "16px", height: "16px" }}
                      />
                      <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                        {day}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

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
                    checked={policy.exclude_weekends}
                    onChange={(e) =>
                      setPolicy({
                        ...policy,
                        exclude_weekends: e.target.checked,
                      })
                    }
                    style={{ width: "18px", height: "18px" }}
                  />
                  <span style={{ fontSize: "0.95rem", fontWeight: "500" }}>
                    Exclude Weekends from Leave Count
                  </span>
                </label>
              </div>

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
                    checked={policy.exclude_public_holidays}
                    onChange={(e) =>
                      setPolicy({
                        ...policy,
                        exclude_public_holidays: e.target.checked,
                      })
                    }
                    style={{ width: "18px", height: "18px" }}
                  />
                  <span style={{ fontSize: "0.95rem", fontWeight: "500" }}>
                    Exclude Public Holidays from Leave Count
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Role-Based Allocations */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Settings className="w-5 h-5" />
                <span>Role-Based Leave Allocations</span>
              </div>
            </div>
            <div className="ba-card-body">
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  display: "flex",
                  gap: "0.75rem",
                }}
              >
                <Info
                  className="w-5 h-5"
                  style={{ color: "#1e40af", flexShrink: 0 }}
                />
                <p
                  style={{ fontSize: "0.875rem", color: "#1e40af", margin: 0 }}
                >
                  Configure how many days of each leave type are allocated to
                  different roles annually.
                </p>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#f9fafb",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      <th
                        style={{
                          padding: "1rem",
                          textAlign: "left",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                        }}
                      >
                        Leave Type
                      </th>
                      {roles.map((role) => (
                        <th
                          key={role}
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                          }}
                        >
                          {role.replace("_", " ").toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaveTypes.map((leaveType, idx) => (
                      <tr
                        key={leaveType.id}
                        style={{
                          borderBottom:
                            idx < leaveTypes.length - 1
                              ? "1px solid #e5e7eb"
                              : "none",
                        }}
                      >
                        <td style={{ padding: "1rem" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <div
                              style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                backgroundColor: leaveType.color,
                              }}
                            />
                            <span style={{ fontWeight: "500" }}>
                              {leaveType.name}
                            </span>
                          </div>
                        </td>
                        {roles.map((role) => (
                          <td
                            key={role}
                            style={{ padding: "1rem", textAlign: "center" }}
                          >
                            <input
                              type="number"
                              value={getRoleAllocation(role, leaveType.code)}
                              onChange={(e) =>
                                updateRoleAllocation(
                                  role,
                                  leaveType.code,
                                  e.target.value
                                )
                              }
                              className="ba-form-input"
                              style={{ maxWidth: "100px", textAlign: "center" }}
                              min="0"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}
          >
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ minWidth: "200px" }}
            >
              {submitting ? (
                <>
                  <div className="spinner spinner-sm"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Policy Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
