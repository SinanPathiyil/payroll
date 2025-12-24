import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Search,
  Eye,
} from "lucide-react";
import { getEmployees } from "../services/api";

export default function HRAttendance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error("Failed to load attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: employees.length,
    present: employees.filter((e) => e.today_status === "active").length,
    absent: employees.filter((e) => e.today_status !== "active").length,
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
          <p className="layout-loading-text">Loading Attendance...</p>
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
            <h1 className="ba-dashboard-title">Attendance Management</h1>
            <p className="ba-dashboard-subtitle">
              Track employee attendance and working hours
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="ba-stats-grid">
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
                <p className="ba-stat-label">Present Today</p>
                <p className="ba-stat-value">{stats.present}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Absent Today</p>
                <p className="ba-stat-value">{stats.absent}</p>
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

        {/* Filters & Search */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div style={{ display: "flex", gap: "1rem", flex: 1, alignItems: "center" }}>
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
                  placeholder="Search employees..."
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

              {/* Date Filter */}
              <div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="ba-card-body" style={{ padding: 0 }}>
            {filteredEmployees.length === 0 ? (
              <div className="ba-empty-state">
                <Users className="ba-empty-icon" />
                <p>No attendance records found</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                        Login Time
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
                        Productivity
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
                        style={{ borderBottom: "1px solid #e5e7eb" }}
                      >
                        <td style={{ padding: "1rem" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                            }}
                          >
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
                              <p
                                style={{
                                  fontWeight: "500",
                                  fontSize: "0.875rem",
                                }}
                              >
                                {employee.full_name}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#6b7280",
                                }}
                              >
                                {employee.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "1rem", textAlign: "center" }}>
                          <span
                            className={`ba-stat-badge ${
                              employee.today_status === "active"
                                ? "success"
                                : "secondary"
                            }`}
                          >
                            {employee.today_status === "active"
                              ? "Present"
                              : "Absent"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                            fontSize: "0.875rem",
                            color: "#6b7280",
                          }}
                        >
                          {employee.login_time
                            ? new Date(employee.login_time).toLocaleTimeString()
                            : "—"}
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
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor:
                                  employee.productivity_score >= 80
                                    ? "#d1fae5"
                                    : employee.productivity_score >= 60
                                      ? "#fef3c7"
                                      : "#fee2e2",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color:
                                  employee.productivity_score >= 80
                                    ? "#065f46"
                                    : employee.productivity_score >= 60
                                      ? "#92400e"
                                      : "#991b1b",
                              }}
                            >
                              {employee.productivity_score || 0}%
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "1rem", textAlign: "center" }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() =>
                              navigate(`/hr/employees/${employee.id}`)
                            }
                          >
                            <Eye className="w-4 h-4" />
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