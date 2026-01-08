import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import { ArrowLeft, UserPlus, Mail, User, Lock, DollarSign, Eye, EyeOff } from "lucide-react";
import { createUser } from "../services/api";

export default function HRCreateEmployee() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "employee",
    required_hours: 8.0,
    base_salary: 50000,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "required_hours" || name === "base_salary" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createUser(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate("/hr/employees");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button className="btn btn-secondary" onClick={() => navigate("/hr/employees")}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="ba-dashboard-title">Create New Employee</h1>
              <p className="ba-dashboard-subtitle">Add a new employee to the system</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#d1fae5",
              border: "1px solid #6ee7b7",
              borderRadius: "0.5rem",
              color: "#065f46",
              marginBottom: "1.5rem",
            }}
          >
            ✅ Employee created successfully! Redirecting...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "0.5rem",
              color: "#991b1b",
              marginBottom: "1.5rem",
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* Form Card */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <UserPlus className="w-5 h-5" />
              <span>Employee Information</span>
            </div>
          </div>
          <div className="ba-card-body">
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {/* Full Name */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <User className="w-4 h-4" style={{ display: "inline", marginRight: "0.5rem" }} />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    autoComplete="off"
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <Mail className="w-4 h-4" style={{ display: "inline", marginRight: "0.5rem" }} />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john.doe@company.com"
                    autoComplete="new-email"
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <Lock className="w-4 h-4" style={{ display: "inline", marginRight: "0.5rem" }} />
                    Password *
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength="8"
                      placeholder="Enter secure password (min 8 characters)"
                      autoComplete="new-password"
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.75rem",
                        paddingRight: "2.5rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#6b7280",
                        padding: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR Manager</option>
                    <option value="team_lead">Team Lead</option>
                    <option value="business_analyst">Business Analyst</option>
                  </select>
                </div>

                {/* Required Hours */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Required Hours/Day *
                  </label>
                  <input
                    type="number"
                    name="required_hours"
                    value={formData.required_hours}
                    onChange={handleChange}
                    step="0.5"
                    min="0"
                    max="24"
                    required
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                {/* Base Salary */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <DollarSign className="w-4 h-4" style={{ display: "inline", marginRight: "0.5rem" }} />
                    Base Salary *
                  </label>
                  <input
                    type="number"
                    name="base_salary"
                    value={formData.base_salary}
                    onChange={handleChange}
                    step="1000"
                    min="0"
                    required
                    placeholder="50000"
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1rem",
                  marginTop: "2rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate("/hr/employees")}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: "16px", height: "16px" }}></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Employee</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Information Card */}
        <div className="ba-card" style={{ backgroundColor: "#eff6ff" }}>
          <div className="ba-card-body">
            <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1e40af", marginBottom: "0.5rem" }}>
              ℹ️ Important Information
            </h3>
            <ul style={{ fontSize: "0.875rem", color: "#1e3a8a", paddingLeft: "1.25rem" }}>
              <li>The employee will receive login credentials via email</li>
              <li>Base salary is used for performance-based salary calculations</li>
              <li>Required hours determine daily work expectations</li>
              <li>Employees can change their password after first login</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}