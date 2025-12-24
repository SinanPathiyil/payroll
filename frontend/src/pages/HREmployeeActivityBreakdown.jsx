import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import {
  ArrowLeft,
  Monitor,
  Clock,
  Calendar,
  TrendingDown,
} from "lucide-react";
import { getEmployeeAppBreakdown, getEmployees } from "../services/api";

export default function HREmployeeActivityBreakdown() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeName, setEmployeeName] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    loadEmployeeName();
  }, [employeeId]);

  useEffect(() => {
    if (employeeName) {
      fetchBreakdown();
    }
  }, [employeeId, startDate, endDate, employeeName]);

  const loadEmployeeName = async () => {
    try {
      const response = await getEmployees();
      const employee = response.data.find((emp) => emp.id === employeeId);
      setEmployeeName(employee?.full_name || "Employee");
    } catch (err) {
      console.error("Failed to load employee name:", err);
      setEmployeeName("Employee");
    }
  };

  const fetchBreakdown = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEmployeeAppBreakdown(employeeId, startDate, endDate);
      setData(response.data);
    } catch (err) {
      console.error("Error fetching app breakdown:", err);
      setError("Failed to load activity breakdown. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const setDateRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading activity data...</p>
        </div>
      </Layout>
    );
  }

  const breakdown = data?.breakdown || [];
  const totalDurationMinutes = breakdown.reduce(
    (sum, item) => sum + item.total_duration_minutes,
    0
  );

  return (
    <Layout>
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/hr/employees/${employeeId}`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="ba-dashboard-title">{employeeName}</h1>
              <p className="ba-dashboard-subtitle">Per-Application Activity Breakdown</p>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Calendar className="w-5 h-5" />
              <span>Select Date Range</span>
            </div>
          </div>
          <div className="ba-card-body">
            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
              {/* Quick Select Buttons */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => setDateRange(1)} className="btn btn-secondary">
                  Today
                </button>
                <button onClick={() => setDateRange(7)} className="btn btn-secondary">
                  Last 7 Days
                </button>
                <button onClick={() => setDateRange(30)} className="btn btn-secondary">
                  Last 30 Days
                </button>
              </div>

              {/* Date Inputs */}
              <div style={{ display: "flex", gap: "1rem", flex: 1 }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      color: "#6b7280",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      color: "#6b7280",
                      marginBottom: "0.25rem",
                    }}
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={today}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="ba-stats-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Activity Time</p>
                <p className="ba-stat-value">
                  {Math.floor(totalDurationMinutes / 60)}h{" "}
                  {Math.round(totalDurationMinutes % 60)}m
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Applications</p>
                <p className="ba-stat-value">{data?.total_apps || 0}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-purple">
                <Monitor className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "0.5rem",
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}

        {/* Applications Breakdown */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <TrendingDown className="w-5 h-5" />
              <span>Activity Breakdown</span>
            </div>
          </div>
          <div className="ba-card-body">
            {breakdown.length === 0 ? (
              <div className="ba-empty-state">
                <Monitor className="ba-empty-icon" />
                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginTop: "1rem" }}>
                  No activity recorded
                </h3>
                <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
                  Try selecting a different date range
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {breakdown.map((app, index) => {
                  const hours = Math.floor(app.total_duration_minutes / 60);
                  const minutes = Math.round(app.total_duration_minutes % 60);

                  return (
                    <div
                      key={index}
                      style={{
                        padding: "1.5rem",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.5rem",
                        backgroundColor: "#fff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "0.5rem",
                              backgroundColor: "#eff6ff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Monitor className="w-5 h-5" style={{ color: "#3b82f6" }} />
                          </div>
                          <p style={{ fontSize: "1rem", fontWeight: "600", color: "#111827" }}>
                            {app.app_name}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "1.125rem", fontWeight: "600", color: "#111827" }}>
                            {hours > 0 ? `${hours}h ` : ""}
                            {minutes}m
                          </p>
                          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                            {app.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          backgroundColor: "#e5e7eb",
                          borderRadius: "9999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${app.percentage}%`,
                            height: "100%",
                            backgroundColor: "#3b82f6",
                            borderRadius: "9999px",
                            transition: "width 0.3s ease",
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}