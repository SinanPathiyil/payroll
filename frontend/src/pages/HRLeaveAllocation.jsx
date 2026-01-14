import { useState, useEffect } from "react";
import { Users, Plus, Search, X, Save, Eye, Calendar } from "lucide-react";
import Layout from "../components/common/Layout";
import axios from "axios";

export default function HRLeaveAllocation() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [employeeBalances, setEmployeeBalances] = useState([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    year: new Date().getFullYear(),
    leave_type_code: "",
    days: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Load employees
      const empResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/hr/employees`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmployees(empResponse.data || []);

      // Load leave types
      const leaveTypesRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/hr/leave/leave-types`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaveTypes(leaveTypesRes.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeBalance = async (employee) => {
    try {
      setLoadingBalances(true);
      setSelectedEmployee(employee);
      setShowBalanceModal(true);
      
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/hr/leave/balances/${employee.id}?year=${new Date().getFullYear()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmployeeBalances(response.data.balances || []);
    } catch (error) {
      console.error("Failed to load balance:", error);
      setEmployeeBalances([]);
    } finally {
      setLoadingBalances(false);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/hr/leave/allocate-leaves`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowModal(false);
      setSelectedEmployee(null);
      alert("Leave allocated successfully!");
      loadData(); // Refresh data
    } catch (error) {
      console.error("Failed to allocate:", error);
      const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           "Failed to allocate leaves";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ba-dashboard">
        <div className="ba-dashboard-header" style={{ marginBottom: "2rem" }}>
          <div>
            <h1 className="ba-dashboard-title">Leave Allocation</h1>
            <p className="ba-dashboard-subtitle">
              Allocate additional leaves to employees
            </p>
          </div>
        </div>

        <div className="ba-card" style={{ marginBottom: "1.5rem" }}>
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Search className="w-5 h-5" />
              <span>Search Employees</span>
            </div>
          </div>
          <div className="ba-card-body">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ba-form-input"
            />
          </div>
        </div>

        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Users className="w-5 h-5" />
              <span>Employees ({filteredEmployees.length})</span>
            </div>
          </div>
          <div className="ba-card-body">
            {filteredEmployees.length === 0 ? (
              <div className="ba-empty-state">
                <Users className="ba-empty-icon" />
                <p>No employees found</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1.25rem",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "1rem",
                            fontWeight: "600",
                            margin: 0,
                          }}
                        >
                          {employee.full_name}
                        </h3>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.5rem",
                            backgroundColor:
                              employee.role === "team_lead"
                                ? "#dbeafe"
                                : employee.role === "business_analyst"
                                  ? "#fef3c7"
                                  : "#f3f4f6",
                            color:
                              employee.role === "team_lead"
                                ? "#1e40af"
                                : employee.role === "business_analyst"
                                  ? "#92400e"
                                  : "#4b5563",
                            borderRadius: "9999px",
                            fontWeight: "500",
                          }}
                        >
                          {employee.role === "team_lead"
                            ? "Team Lead"
                            : employee.role === "business_analyst"
                              ? "BA"
                              : "Employee"}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "#6b7280",
                          margin: 0,
                        }}
                      >
                        {employee.email}
                      </p>
                    </div>
                    
                    {/* Button Group */}
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button
                        onClick={() => loadEmployeeBalance(employee)}
                        className="btn btn-secondary"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Balance</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setFormData({ ...formData, user_id: employee.id });
                          setShowModal(true);
                          setError("");
                        }}
                        className="btn btn-primary"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Allocate Leave</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Allocate Leave Modal */}
      {showModal && selectedEmployee && (
        <div className="ba-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="ba-modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <div className="ba-modal-header">
              <div className="ba-modal-header-content">
                <Plus className="w-6 h-6" />
                <h2 className="ba-modal-title">Allocate Leave</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="ba-modal-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllocate}>
              <div className="ba-modal-body">
                {error && (
                  <div 
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "1rem",
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      marginBottom: "1.5rem"
                    }}
                  >
                    <X 
                      className="w-5 h-5" 
                      style={{ 
                        flexShrink: 0, 
                        marginTop: "0.125rem",
                        color: "#dc2626" 
                      }} 
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        fontWeight: "600", 
                        marginBottom: "0.25rem",
                        color: "#991b1b",
                        fontSize: "0.875rem",
                        margin: "0 0 0.25rem 0"
                      }}>
                        Allocation Failed
                      </p>
                      <p style={{ 
                        fontSize: "0.875rem", 
                        margin: 0,
                        color: "#7f1d1d",
                        lineHeight: "1.5"
                      }}>
                        {error}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "0.25rem",
                        color: "#dc2626"
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#eff6ff",
                    borderRadius: "8px",
                    marginBottom: "1.5rem",
                  }}
                >
                  <p style={{ fontSize: "0.875rem", margin: 0 }}>
                    <strong>Employee:</strong> {selectedEmployee.full_name}
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#6b7280",
                      margin: "0.25rem 0 0 0",
                    }}
                  >
                    {selectedEmployee.email}
                  </p>
                </div>

                <div className="ba-form-group">
                  <label className="ba-form-label">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: parseInt(e.target.value),
                      })
                    }
                    className="ba-form-input"
                    required
                  >
                    {Array.from(
                      { length: 3 },
                      (_, i) => new Date().getFullYear() + i
                    ).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ba-form-group">
                  <label className="ba-form-label">
                    Leave Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.leave_type_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        leave_type_code: e.target.value,
                      })
                    }
                    className="ba-form-input"
                    required
                  >
                    <option value="">-- Select Leave Type --</option>
                    {leaveTypes.map((type) => (
                      <option key={type.code} value={type.code}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ba-form-group">
                  <label className="ba-form-label">
                    Days to Allocate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        days: parseFloat(e.target.value),
                      })
                    }
                    className="ba-form-input"
                    min="0"
                    step="0.5"
                    required
                  />
                </div>
              </div>

              <div className="ba-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="spinner spinner-sm"></div>
                      <span>Allocating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Allocate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

     {/* View Balance Modal */}
      {showBalanceModal && selectedEmployee && (
        <div className="ba-modal-overlay" onClick={() => setShowBalanceModal(false)}>
          <div
            className="ba-modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "700px" }}
          >
            <div className="ba-modal-header">
              <div className="ba-modal-header-content">
                <Calendar className="w-6 h-6" />
                <h2 className="ba-modal-title">Leave Balance - {selectedEmployee.full_name}</h2>
              </div>
              <button
                onClick={() => setShowBalanceModal(false)}
                className="ba-modal-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="ba-modal-body" style={{ padding: "1.5rem" }}>
              {loadingBalances ? (
                <div style={{ textAlign: "center", padding: "3rem 0" }}>
                  <div className="spinner spinner-lg" style={{ margin: "0 auto 1rem" }}></div>
                  <p style={{ color: "#6b7280" }}>Loading balances...</p>
                </div>
              ) : employeeBalances.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 0" }}>
                  <Calendar className="w-12 h-12" style={{ margin: "0 auto 1rem", color: "#9ca3af" }} />
                  <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                    No leave balances found for {new Date().getFullYear()}
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
                    <div style={{
                      padding: "1rem",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb"
                    }}>
                      <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: "0 0 0.5rem 0", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Allocated</p>
                      <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827", margin: 0 }}>
                        {employeeBalances.reduce((sum, b) => sum + b.allocated, 0)}
                      </p>
                    </div>
                    <div style={{
                      padding: "1rem",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb"
                    }}>
                      <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: "0 0 0.5rem 0", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Available</p>
                      <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827", margin: 0 }}>
                        {employeeBalances.reduce((sum, b) => sum + b.available, 0)}
                      </p>
                    </div>
                    <div style={{
                      padding: "1rem",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb"
                    }}>
                      <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: "0 0 0.5rem 0", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Used</p>
                      <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827", margin: 0 }}>
                        {employeeBalances.reduce((sum, b) => sum + b.used, 0)}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Balance Table */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                          <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Leave Type</th>
                          <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Allocated</th>
                          <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Used</th>
                          <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pending</th>
                          <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.75rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Available</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeBalances.map((balance, index) => (
                          <tr 
                            key={balance.id} 
                            style={{ 
                              borderBottom: "1px solid #f3f4f6",
                              backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb"
                            }}
                          >
                            <td style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: "500", color: "#111827" }}>
                              {balance.leave_type_name}
                            </td>
                            <td style={{ padding: "1rem", textAlign: "center", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>
                              {balance.allocated}
                            </td>
                            <td style={{ padding: "1rem", textAlign: "center", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>
                              {balance.used}
                            </td>
                            <td style={{ padding: "1rem", textAlign: "center", fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>
                              {balance.pending}
                            </td>
                            <td style={{ padding: "1rem", textAlign: "center", fontSize: "0.875rem", fontWeight: "700", color: "#111827" }}>
                              {balance.available}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ 
                    marginTop: "1.5rem", 
                    padding: "1rem", 
                    backgroundColor: "#f9fafb", 
                    borderRadius: "8px",
                    borderLeft: "3px solid #6b7280",
                    fontSize: "0.8125rem",
                    color: "#4b5563"
                  }}>
                    <strong>Note:</strong> Balance shown for year {new Date().getFullYear()}. Carried forward leaves expire as per policy.
                  </div>
                </>
              )}
            </div>

            <div className="ba-modal-footer">
              <button
                onClick={() => setShowBalanceModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}