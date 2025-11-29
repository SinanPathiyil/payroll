import { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  Clock,
  CheckCircle,
  Monitor,
  DollarSign,
  TrendingDown,
  Brain,
} from "lucide-react";
import { getEmployeeStats } from "../../services/api";
import AttendanceTable from "./AttendanceTable";
import { formatHours } from "../../utils/helpers";
import EmployeeActivityBreakdown from "./EmployeeActivityBreakdown";
import AIProductivityScore from "./AIProductivityScore";

export default function EmployeeStatsModal({ employee, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActivityBreakdown, setShowActivityBreakdown] = useState(false);
  const [aiProductivityScore, setAiProductivityScore] = useState(null);
  const [salaryMode, setSalaryMode] = useState("avg");

  useEffect(() => {
    loadStats();
  }, [employee.id]);

  const loadStats = async () => {
    try {
      const response = await getEmployeeStats(employee.id);
      setStats(response.data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-backdrop">
        <div className="modal-loading">
          <div className="spinner spinner-lg"></div>
          <p className="modal-loading-text">Loading employee stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-xl">
        {/* Sticky Header */}
        <div className="employee-stats-header">
          <div>
            <h2 className="employee-stats-name">{employee.full_name}</h2>
            <p className="employee-stats-email">{employee.email}</p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="employee-stats-body">
          {/* Summary Stats */}
          <div className="employee-stats-grid">
            <div className="employee-stat-card">
              <div className="employee-stat-icon">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <p className="employee-stat-label">Total Hours (7 days)</p>
                <p className="employee-stat-value">
                  {formatHours(stats?.attendance?.total_hours)} hrs
                </p>
              </div>
            </div>

            <div className="employee-stat-card">
              <div className="employee-stat-icon">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <p className="employee-stat-label">Task Completion</p>
                <p className="employee-stat-value">
                  {stats?.tasks_summary?.completed || 0}/
                  {stats?.tasks_summary?.total || 0}
                </p>
              </div>
            </div>

            <div className="employee-stat-card">
              <div className="employee-stat-icon">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <p className="employee-stat-label">Avg Productivity</p>
                <p className="employee-stat-value">
                  {stats?.activity_summary?.avg_productivity_score?.toFixed(
                    0
                  ) || 0}
                  %
                </p>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="employee-activity-card">
            <div className="employee-activity-header">
              <h3 className="employee-activity-title">
                Activity Summary (Last 7 Days)
              </h3>
              <button
                onClick={() => setShowActivityBreakdown(true)}
                className="btn btn-primary btn-sm"
              >
                <Monitor className="w-4 h-4" />
                View Per-App Breakdown
              </button>
            </div>
            <div className="employee-activity-grid">
              <div className="employee-activity-item">
                <p className="employee-activity-label">Active Time</p>
                <p className="employee-activity-value employee-activity-value-success">
                  {formatHours(stats?.activity_summary?.total_active_time)} hrs
                </p>
              </div>
              <div className="employee-activity-item">
                <p className="employee-activity-label">Idle Time</p>
                <p className="employee-activity-value employee-activity-value-warning">
                  {formatHours(stats?.activity_summary?.total_idle_time)} hrs
                </p>
              </div>
              <div className="employee-activity-item">
                <p className="employee-activity-label">Mouse Events</p>
                <p className="employee-activity-value">
                  {stats?.activity_summary?.total_mouse_events?.toLocaleString() ||
                    0}
                </p>
              </div>
              <div className="employee-activity-item">
                <p className="employee-activity-label">Keyboard Events</p>
                <p className="employee-activity-value">
                  {stats?.activity_summary?.total_keyboard_events?.toLocaleString() ||
                    0}
                </p>
              </div>
            </div>
          </div>

          {/* AI Productivity Analysis */}
          <AIProductivityScore
            employeeId={employee.id}
            onScoreUpdate={setAiProductivityScore}
          />

          {/* Salary Information */}
          {stats?.salary_info && (
            <div className="employee-salary-card">
              <div className="employee-salary-header">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  <h3 className="employee-salary-title">Salary Calculation</h3>
                </div>

                {/* Toggle Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Based on:</span>
                  <select
                    value={salaryMode}
                    onChange={(e) => {
                      if (e.target.value === "ai" && !aiProductivityScore) {
                        alert("Please analyze productivity with AI first");
                        return;
                      }
                      setSalaryMode(e.target.value);
                    }}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="avg">Average Productivity (7 days)</option>
                    <option value="ai" disabled={!aiProductivityScore}>
                      AI Productivity{" "}
                      {!aiProductivityScore
                        ? "(Not analyzed)"
                        : "(Current month)"}
                    </option>
                  </select>
                </div>
              </div>

              {(() => {
                // Calculate which productivity score to use
                const avgProductivity =
                  stats.activity_summary?.avg_productivity_score || 0;
                const selectedProductivity =
                  salaryMode === "ai" && aiProductivityScore
                    ? aiProductivityScore
                    : avgProductivity;

                // Calculate salary based on selected productivity
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

                const baseSalary = stats.salary_info.base_salary;
                const displaySalary = calculateSalary(
                  baseSalary,
                  selectedProductivity
                );

                return (
                  <>
                    <div className="employee-salary-grid">
                      <div className="employee-salary-section">
                        <div className="employee-salary-row">
                          <span className="employee-salary-label">
                            Base Salary:
                          </span>
                          <span className="employee-salary-value">
                            ${displaySalary.base_salary.toLocaleString()}
                          </span>
                        </div>

                        <div className="employee-salary-row">
                          <span className="employee-salary-label">
                            {salaryMode === "ai" ? "🤖 AI" : "📊 Avg"}{" "}
                            Productivity:
                          </span>
                          <span className="employee-salary-value employee-salary-highlight">
                            {selectedProductivity.toFixed(0)}%
                          </span>
                        </div>

                        <div className="employee-salary-row">
                          <span className="employee-salary-label">
                            Productivity Tier:
                          </span>
                          <span
                            className={`status-chip ${
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

                      <div className="employee-salary-section">
                        <div className="employee-salary-row">
                          <span className="employee-salary-label">
                            Multiplier:
                          </span>
                          <span className="employee-salary-value">
                            {(displaySalary.multiplier * 100).toFixed(0)}%
                          </span>
                        </div>

                        {displaySalary.deduction > 0 && (
                          <div className="employee-salary-row">
                            <span className="employee-salary-label">
                              <TrendingDown className="w-4 h-4" />
                              Deduction:
                            </span>
                            <span className="employee-salary-value employee-salary-deduction">
                              -${displaySalary.deduction.toLocaleString()}
                            </span>
                          </div>
                        )}

                        <div className="employee-salary-total">
                          <span className="employee-salary-total-label">
                            Actual Salary:
                          </span>
                          <span className="employee-salary-total-value">
                            ${displaySalary.actual_salary.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Info Banner */}
                    {salaryMode === "ai" && aiProductivityScore && (
                      <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <p className="text-xs text-purple-700">
                          <span className="font-semibold">
                            Using AI-analyzed productivity score
                          </span>{" "}
                          from current month data
                        </p>
                      </div>
                    )}

                    <div className="employee-salary-legend">
                      <p className="employee-salary-legend-title">
                        Productivity Tiers:
                      </p>
                      <div className="employee-salary-legend-items">
                        <span className="status-chip success">
                          90-100% = 100%
                        </span>
                        <span className="status-chip info">80-89% = 95%</span>
                        <span className="status-chip warning">
                          70-79% = 90%
                        </span>
                        <span className="status-chip danger">60-69% = 85%</span>
                        <span className="status-chip danger">
                          &lt;60% = 80%
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Attendance Records Section */}
          <div className="employee-attendance-section">
            <div className="employee-attendance-divider">
              <span className="employee-attendance-divider-text">
                Attendance Records (Last 7 Days)
              </span>
            </div>
            <AttendanceTable records={stats?.attendance?.records || []} />
          </div>
        </div>
      </div>

      {showActivityBreakdown && (
        <EmployeeActivityBreakdown
          employeeId={employee.id || employee._id}
          employeeName={employee.full_name}
          onClose={() => setShowActivityBreakdown(false)}
        />
      )}
    </div>
  );
}
