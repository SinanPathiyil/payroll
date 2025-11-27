import { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  Clock,
  CheckCircle,
  Monitor,
  DollarSign,
  TrendingDown,
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
          <AIProductivityScore employeeId={employee.id} />
          
          {/* Salary Information */}
          {stats?.salary_info && (
            <div className="employee-salary-card">
              <div className="employee-salary-header">
                <DollarSign className="w-6 h-6" />
                <h3 className="employee-salary-title">Salary Calculation</h3>
              </div>

              <div className="employee-salary-grid">
                <div className="employee-salary-section">
                  <div className="employee-salary-row">
                    <span className="employee-salary-label">Base Salary:</span>
                    <span className="employee-salary-value">
                      ${stats.salary_info.base_salary.toLocaleString()}
                    </span>
                  </div>

                  <div className="employee-salary-row">
                    <span className="employee-salary-label">
                      Avg Productivity:
                    </span>
                    <span className="employee-salary-value employee-salary-highlight">
                      {stats.salary_info.avg_productivity}%
                    </span>
                  </div>

                  <div className="employee-salary-row">
                    <span className="employee-salary-label">
                      Productivity Tier:
                    </span>
                    <span
                      className={`status-chip ${
                        stats.salary_info.multiplier === 1.0
                          ? "success"
                          : stats.salary_info.multiplier >= 0.95
                            ? "info"
                            : stats.salary_info.multiplier >= 0.9
                              ? "warning"
                              : "danger"
                      }`}
                    >
                      {stats.salary_info.tier}
                    </span>
                  </div>
                </div>

                <div className="employee-salary-section">
                  <div className="employee-salary-row">
                    <span className="employee-salary-label">Multiplier:</span>
                    <span className="employee-salary-value">
                      {(stats.salary_info.multiplier * 100).toFixed(0)}%
                    </span>
                  </div>

                  {stats.salary_info.deduction > 0 && (
                    <div className="employee-salary-row">
                      <span className="employee-salary-label">
                        <TrendingDown className="w-4 h-4" />
                        Deduction:
                      </span>
                      <span className="employee-salary-value employee-salary-deduction">
                        -${stats.salary_info.deduction.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="employee-salary-total">
                    <span className="employee-salary-total-label">
                      Actual Salary:
                    </span>
                    <span className="employee-salary-total-value">
                      ${stats.salary_info.actual_salary.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="employee-salary-legend">
                <p className="employee-salary-legend-title">
                  Productivity Tiers:
                </p>
                <div className="employee-salary-legend-items">
                  <span className="status-chip success">90-100% = 100%</span>
                  <span className="status-chip info">80-89% = 95%</span>
                  <span className="status-chip warning">70-79% = 90%</span>
                  <span className="status-chip danger">60-69% = 85%</span>
                  <span className="status-chip danger">&lt;60% = 80%</span>
                </div>
              </div>
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
