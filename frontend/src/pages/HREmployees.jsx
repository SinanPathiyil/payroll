import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Clock,
  Activity,
  TrendingUp,
  Eye,
} from "lucide-react";
import { getEmployees } from "../services/api";

export default function HREmployees() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await getEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error("Failed to load employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && employee.today_status === "active") ||
      (filterStatus === "inactive" && employee.today_status !== "active");

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.today_status === "active").length,
    inactive: employees.filter((e) => e.today_status !== "active").length,
    avgHours:
      employees.length > 0
        ? (
            employees.reduce((sum, e) => sum + (e.today_hours || 0), 0) /
            employees.length
          ).toFixed(2)
        : 0,
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Employees...</p>
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
            <h1 className="ba-dashboard-title">Employee Management</h1>
            <p className="ba-dashboard-subtitle">
              Manage and monitor all employees
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/hr/employees/create")}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>

        {/* Stats */}
        <div className="ba-stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Employees</p>
                <p className="ba-stat-value">{stats.total}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Users className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Active Today</p>
                <p className="ba-stat-value">{stats.active}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <Activity className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Offline</p>
                <p className="ba-stat-value">{stats.inactive}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Avg Hours Today</p>
                <p className="ba-stat-value">{stats.avgHours}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-purple">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div style={{ display: "flex", gap: "1rem", flex: 1 }}>
              {/* Search */}
              <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                <Search
                  className="w-5 h-5"
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem 0.5rem 2.5rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              {/* Filter Buttons */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className={`btn ${filterStatus === "all" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFilterStatus("all")}
                >
                  All ({stats.total})
                </button>
                <button
                  className={`btn ${filterStatus === "active" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFilterStatus("active")}
                >
                  Active ({stats.active})
                </button>
                <button
                  className={`btn ${filterStatus === "inactive" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFilterStatus("inactive")}
                >
                  Offline ({stats.inactive})
                </button>
              </div>
            </div>
          </div>

          {/* Employee Table */}
          <div className="ba-card-body" style={{ padding: 0 }}>
            {filteredEmployees.length === 0 ? (
              <div className="ba-empty-state">
                <Users className="ba-empty-icon" />
                <p>No employees found</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      <th
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "left",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          color: "#6b7280",
                          textTransform: "uppercase",
                        }}
                      >
                        Employee
                      </th>
                      <th
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "left",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          color: "#6b7280",
                          textTransform: "uppercase",
                        }}
                      >
                        Email
                      </th>
                      <th
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "center",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          color: "#6b7280",
                          textTransform: "uppercase",
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "center",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          color: "#6b7280",
                          textTransform: "uppercase",
                        }}
                      >
                        Hours Today
                      </th>
                      <th
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "center",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          color: "#6b7280",
                          textTransform: "uppercase",
                        }}
                      >
                        Week Hours
                      </th>
                      <th
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "center",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          color: "#6b7280",
                          textTransform: "uppercase",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => (
                      <tr
                        key={employee.id}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#f9fafb")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "transparent")
                        }
                      >
                        <td style={{ padding: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "#3b82f6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontWeight: "600",
                              }}
                            >
                              {employee.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight: "500", fontSize: "0.875rem" }}>
                                {employee.full_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
                          {employee.email}
                        </td>
                        <td style={{ padding: "1rem", textAlign: "center" }}>
                          <span
                            className={`ba-stat-badge ${
                              employee.today_status === "active" ? "success" : "secondary"
                            }`}
                          >
                            {employee.today_status === "active" ? "Active" : "Offline"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                          }}
                        >
                          {employee.today_hours?.toFixed(2) || "0.00"} hrs
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                          }}
                        >
                          {employee.week_hours?.toFixed(2) || "0.00"} hrs
                        </td>
                        <td style={{ padding: "1rem", textAlign: "center" }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/hr/employees/${employee.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}