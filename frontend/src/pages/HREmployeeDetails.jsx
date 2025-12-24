import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import AttendanceTable from "../components/hr/AttendanceTable";
import AIProductivityScore from "../components/hr/AIProductivityScore";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  TrendingUp,
  Monitor,
  DollarSign,
  TrendingDown,
  Brain,
  BarChart3,
  Mouse,
  Keyboard,
  Timer,
  Coffee,
} from "lucide-react";
import { getEmployeeStats } from "../services/api";
import { formatHours } from "../utils/helpers";

export default function HREmployeeDetails() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [aiProductivityScore, setAiProductivityScore] = useState(null);
  const [salaryMode, setSalaryMode] = useState("avg");

  useEffect(() => {
    loadEmployeeData();
  }, [employeeId]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEmployeeStats(employeeId);
      
      if (!response.data) {
        setError("No employee data received from server");
      } else {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to load employee data:", error);
      setError(error.response?.data?.detail || error.message || "Failed to load employee data");
    } finally {
      setLoading(false);
    }
  };

  const calculateSalary = (baseAmount, productivity) => {
    let multiplier = 1.0;
    let tier = "Excellent (90-100%)";

    if (productivity >= 90) {
      multiplier = 1.0;
      tier = "Excellent (90-100%)";
    } else if (productivity >= 80) {
      multiplier = 0.95;
      tier = "Good (80-89%)";
    } else if (productivity >= 70) {
      multiplier = 0.9;
      tier = "Average (70-79%)";
    } else if (productivity >= 60) {
      multiplier = 0.85;
      tier = "Below Average (60-69%)";
    } else {
      multiplier = 0.8;
      tier = "Needs Improvement (<60%)";
    }

    return {
      base_salary: baseAmount,
      avg_productivity: productivity,
      tier,
      multiplier,
      actual_salary: baseAmount * multiplier,
      deduction: baseAmount - baseAmount * multiplier,
    };
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Employee Details...</p>
        </div>
      </Layout>
    );
  }

  if (error || !stats) {
    return (
      <Layout>
        <div className="ba-dashboard">
          <div className="ba-card">
            <div className="ba-card-body">
              <div className="ba-empty-state">
                <Clock className="ba-empty-icon" style={{ color: '#ef4444' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginTop: '1rem' }}>
                  {error || "Employee data not found"}
                </h2>
                <button className="btn btn-primary" onClick={() => navigate("/hr/employees")} style={{ marginTop: '1rem' }}>
                  Back to Employees
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const avgProductivity = stats.activity_summary?.avg_productivity_score || stats.activity_summary?.monthly_avg_productivity || 0;
  const selectedProductivity = salaryMode === "ai" && aiProductivityScore ? aiProductivityScore : avgProductivity;
  const baseSalary = stats.salary_info?.base_salary || 0;
  const displaySalary = calculateSalary(baseSalary, selectedProductivity);
  const employeeName = stats.employee_name || stats.employee?.full_name || "Employee";
  const employeeEmail = stats.employee_email || stats.employee?.email || "";

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
              <h1 className="ba-dashboard-title">{employeeName}</h1>
              <p className="ba-dashboard-subtitle">{employeeEmail}</p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/hr/employees/${employeeId}/activity-breakdown`)}
          >
            <Monitor className="w-4 h-4" />
            <span>View App Breakdown</span>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="ba-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Hours (7 days)</p>
                <p className="ba-stat-value">{formatHours(stats?.attendance?.total_hours)} hrs</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Task Completion</p>
                <p className="ba-stat-value">
                  {stats?.tasks_summary?.completed || 0}/{stats?.tasks_summary?.total || 0}
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">
                  Avg Productivity {stats?.activity_summary?.monthly_period && `(${stats.activity_summary.monthly_period})`}
                </p>
                <p className="ba-stat-value">{avgProductivity.toFixed(0)}%</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-purple">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Cards Container with proper spacing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Activity Summary Card */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Monitor className="w-5 h-5" />
                <span>Activity Summary (Last 7 Days)</span>
              </div>
            </div>
            <div className="ba-card-body">
              <div className="ba-performance-grid">
                <div className="ba-performance-item">
                  <div className="ba-performance-label">
                    <Timer className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Active Time
                  </div>
                  <div className="ba-performance-value" style={{ color: "#10b981" }}>
                    {formatTime(stats?.activity_summary?.total_active_time || 0)}
                  </div>
                </div>
                <div className="ba-performance-item">
                  <div className="ba-performance-label">
                    <Coffee className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Idle Time
                  </div>
                  <div className="ba-performance-value" style={{ color: "#f59e0b" }}>
                    {formatTime(stats?.activity_summary?.total_idle_time || 0)}
                  </div>
                </div>
                <div className="ba-performance-item">
                  <div className="ba-performance-label">
                    <Mouse className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Mouse Events
                  </div>
                  <div className="ba-performance-value">
                    {stats?.activity_summary?.total_mouse_events?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="ba-performance-item">
                  <div className="ba-performance-label">
                    <Keyboard className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Keyboard Events
                  </div>
                  <div className="ba-performance-value">
                    {stats?.activity_summary?.total_keyboard_events?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Productivity Analysis */}
          <AIProductivityScore employeeId={employeeId} onScoreUpdate={setAiProductivityScore} />

          {/* Salary Information Card */}
          {stats?.salary_info && (
            <div className="ba-card">
              <div className="ba-card-header">
                <div className="ba-card-title">
                  <DollarSign className="w-5 h-5" />
                  <span>Salary Calculation</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Based on:</span>
                  <select
                    value={salaryMode}
                    onChange={(e) => {
                      if (e.target.value === "ai" && !aiProductivityScore) {
                        alert("Please analyze productivity with AI first");
                        return;
                      }
                      setSalaryMode(e.target.value);
                    }}
                    style={{
                      padding: "0.25rem 0.75rem",
                      fontSize: "0.875rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.375rem",
                      backgroundColor: "white",
                    }}
                  >
                    <option value="avg">
                      Average Productivity{" "}
                      {stats?.activity_summary?.monthly_period && `(${stats.activity_summary.monthly_period})`}
                    </option>
                    <option value="ai" disabled={!aiProductivityScore}>
                      AI Productivity {!aiProductivityScore ? "(Not analyzed)" : "(Current month)"}
                    </option>
                  </select>
                </div>
              </div>
              <div className="ba-card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                  {/* Left Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #e5e7eb" }}>
                      <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Base Salary:</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                        ${displaySalary.base_salary.toLocaleString()}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #e5e7eb" }}>
                      <span style={{ fontSize: "0.875rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {salaryMode === "ai" ? (
                          <>
                            <Brain className="w-4 h-4" /> AI
                          </>
                        ) : (
                          <>
                            <BarChart3 className="w-4 h-4" /> Avg
                          </>
                        )}{" "}
                        Productivity:
                      </span>
                      <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#3b82f6" }}>
                        {selectedProductivity.toFixed(0)}%
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0" }}>
                      <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Productivity Tier:</span>
                      <span
                        className={`ba-stat-badge ${
                          displaySalary.multiplier === 1.0
                            ? "success"
                            : displaySalary.multiplier >= 0.95
                              ? "info"
                              : displaySalary.multiplier >= 0.9
                                ? "warning"
                                : "danger"
                        }`}
                      >
                        {displaySalary.tier}
                      </span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #e5e7eb" }}>
                      <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Multiplier:</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                        {(displaySalary.multiplier * 100).toFixed(0)}%
                      </span>
                    </div>

                    {displaySalary.deduction > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: "0.875rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <TrendingDown className="w-4 h-4" />
                          Deduction:
                        </span>
                        <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#ef4444" }}>
                          -${displaySalary.deduction.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "1rem",
                        backgroundColor: "#f0fdf4",
                        borderRadius: "0.5rem",
                        border: "1px solid #86efac",
                      }}
                    >
                      <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#166534" }}>Actual Salary:</span>
                      <span style={{ fontSize: "1.125rem", fontWeight: "700", color: "#15803d" }}>
                        ${displaySalary.actual_salary.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Mode Banner */}
                {salaryMode === "ai" && aiProductivityScore && (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "0.75rem",
                      backgroundColor: "#faf5ff",
                      borderRadius: "0.5rem",
                      border: "1px solid #e9d5ff",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Brain className="w-4 h-4" style={{ color: "#9333ea" }} />
                    <p style={{ fontSize: "0.75rem", color: "#6b21a8" }}>
                      <span style={{ fontWeight: "600" }}>Using AI-analyzed productivity score</span> from current month data
                    </p>
                  </div>
                )}

                {/* Productivity Tiers Legend */}
                <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "0.5rem" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                    Productivity Tiers:
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span className="ba-stat-badge success">90-100% = 100%</span>
                    <span className="ba-stat-badge info">80-89% = 95%</span>
                    <span className="ba-stat-badge warning">70-79% = 90%</span>
                    <span className="ba-stat-badge warning">60-69% = 85%</span>
                    <span className="ba-stat-badge danger">&lt;60% = 80%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Records Card */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Clock className="w-5 h-5" />
                <span>Attendance Records (Last 7 Days)</span>
              </div>
            </div>
            <div className="ba-card-body" style={{ padding: 0 }}>
              <AttendanceTable records={stats?.attendance?.records || []} />
            </div>
          </div>

        </div>
        {/* End Cards Container */}

      </div>
    </Layout>
  );
}