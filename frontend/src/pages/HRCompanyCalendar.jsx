import { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  AlertCircle,
} from "lucide-react";
import Layout from "../components/common/Layout";
import axios from "axios";

export default function HRCompanyCalendar() {
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    loadCompanyCalendar();
  }, [currentDate]);

  const loadCompanyCalendar = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const firstDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const lastDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/hr/leave/company-calendar`,
        {
          params: {
            start_date: firstDay.toISOString().split("T")[0],
            end_date: lastDay.toISOString().split("T")[0],
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const events = response.data.events || [];
      setLeaves(events);

      const leaveEvents = events.filter((e) => e.type === "leave");
      const types = [...new Set(leaveEvents.map((l) => l.leave_type))];
      setDepartments(types);
    } catch (error) {
      console.error("Failed to load calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getLeavesForDay = (day) => {
    // Create date string for comparison (YYYY-MM-DD format)
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const checkDateStr = `${year}-${month}-${dayStr}`;

    let dayEvents = leaves.filter((event) => {
      if (event.type === "holiday") {
        const holidayDateStr = event.date.split("T")[0];
        return holidayDateStr === checkDateStr;
      } else {
        const startDateStr = event.start_date.split("T")[0];
        const endDateStr = event.end_date.split("T")[0];
        return checkDateStr >= startDateStr && checkDateStr <= endDateStr;
      }
    });

    if (filterDepartment !== "all") {
      dayEvents = dayEvents.filter(
        (e) => e.type === "holiday" || e.leave_type === filterDepartment
      );
    }

    return dayEvents;
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const exportCalendar = () => {
    alert("Export functionality - To be implemented");
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Company Calendar...</p>
        </div>
      </Layout>
    );
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const filteredLeaves =
    filterDepartment === "all"
      ? leaves
      : leaves.filter((l) => l.type === "holiday" || l.leave_type === filterDepartment);

  return (
    <Layout>
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div>
            <h1 className="ba-dashboard-title">Company Leave Calendar</h1>
            <p className="ba-dashboard-subtitle">
              View all employees' approved leave schedules
            </p>
          </div>
          <div className="ba-dashboard-actions">
            <button className="btn btn-secondary" onClick={exportCalendar}>
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() =>
                setViewMode(viewMode === "month" ? "list" : "month")
              }
            >
              {viewMode === "month" ? "List View" : "Calendar View"}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div
          className="ba-stats-grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            marginBottom: "1.5rem",
          }}
        >
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Leaves This Month</p>
                <p className="ba-stat-value">
                  {leaves.filter((e) => e.type === "leave").length}
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Public Holidays</p>
                <p className="ba-stat-value">
                  {leaves.filter((e) => e.type === "holiday").length}
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Viewing</p>
                <p className="ba-stat-value" style={{ fontSize: "1.25rem" }}>
                  {monthName}
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ba-card" style={{ marginBottom: "1.5rem" }}>
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </div>
          </div>
          <div className="ba-card-body">
            <div style={{ maxWidth: "400px" }}>
              <label
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                  display: "block",
                }}
              >
                Filter by Leave Type
              </label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="ba-form-input"
              >
                <option value="all">All Leave Types</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {viewMode === "month" ? (
          /* Calendar View */
          <div className="ba-card" style={{ marginBottom: "1.5rem" }}>
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Calendar className="w-5 h-5" />
                <span>{monthName}</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-secondary" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="btn btn-secondary" onClick={goToToday}>
                  Today
                </button>
                <button className="btn btn-secondary" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="ba-card-body" style={{ padding: 0 }}>
              {/* Weekday Headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  backgroundColor: "#f9fafb",
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                {[
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ].map((day) => (
                  <div
                    key={day}
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "1px",
                  backgroundColor: "#e5e7eb",
                }}
              >
                {/* Empty cells before month starts */}
                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    style={{
                      backgroundColor: "#f9fafb",
                      minHeight: "120px",
                      padding: "0.5rem",
                    }}
                  />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const dayLeaves = getLeavesForDay(day);
                  const isToday =
                    day === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear();

                  return (
                    <div
                      key={day}
                      style={{
                        backgroundColor: "white",
                        minHeight: "120px",
                        padding: "0.5rem",
                        position: "relative",
                        border: isToday ? "2px solid #3b82f6" : "none",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: isToday ? "700" : "500",
                          color: isToday ? "#3b82f6" : "#374151",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {day}
                      </div>

                      {dayLeaves.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                          }}
                        >
                          {dayLeaves.slice(0, 3).map((event, idx) => {
                            if (event.type === "holiday") {
                              return (
                                <div
                                  key={`${event.id}-${idx}`}
                                  style={{
                                    fontSize: "0.7rem",
                                    padding: "0.25rem 0.375rem",
                                    backgroundColor: `${event.color}20`,
                                    borderLeft: `3px solid ${event.color}`,
                                    borderRadius: "3px",
                                    fontWeight: "600",
                                  }}
                                  title={event.description || event.name}
                                >
                                  🎉 {event.name}
                                </div>
                              );
                            }

                            return (
                              <div
                                key={`${event.id}-${idx}`}
                                style={{
                                  fontSize: "0.7rem",
                                  padding: "0.25rem 0.375rem",
                                  backgroundColor: `${event.color}20`,
                                  borderLeft: `3px solid ${event.color}`,
                                  borderRadius: "3px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={`${event.user_name} - ${event.leave_type}`}
                              >
                                {event.user_name}
                              </div>
                            );
                          })}
                          {dayLeaves.length > 3 && (
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: "#6b7280",
                                padding: "0.25rem 0.375rem",
                                fontWeight: "500",
                              }}
                            >
                              +{dayLeaves.length - 3} more
                            </div>
                          )}
                        </div>
                      )}

                      {dayLeaves.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "0.5rem",
                            right: "0.5rem",
                            backgroundColor: "#3b82f6",
                            color: "white",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.7rem",
                            fontWeight: "600",
                          }}
                        >
                          {dayLeaves.length}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="ba-card" style={{ marginBottom: "1.5rem" }}>
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Users className="w-5 h-5" />
                <span>All Employees on Leave - {monthName}</span>
              </div>
            </div>
            <div className="ba-card-body">
              {filteredLeaves.length === 0 ? (
                <div className="ba-empty-state">
                  <Calendar className="ba-empty-icon" />
                  <p>No employees on leave this month</p>
                </div>
              ) : (
                <div className="ba-activity-list">
                  {filteredLeaves.map((leave) => (
                    <div key={leave.id} className="ba-activity-item">
                      <div
                        className="ba-activity-indicator"
                        style={{ backgroundColor: leave.color }}
                      />
                      <div className="ba-activity-content">
                        <p className="ba-activity-message">
                          <strong>
                            {leave.type === "holiday" ? `🎉 ${leave.name}` : leave.user_name}
                          </strong>
                          {leave.user_email && (
                            <span
                              style={{
                                color: "#6b7280",
                                fontSize: "0.875rem",
                                marginLeft: "0.5rem",
                              }}
                            >
                              ({leave.user_email})
                            </span>
                          )}
                        </p>
                        <p className="ba-activity-time">
                          {leave.type === "holiday"
                            ? formatDate(leave.date)
                            : `${formatDate(leave.start_date)} → ${formatDate(leave.end_date)} (${leave.total_days} ${leave.total_days === 1 ? "day" : "days"})`}
                        </p>
                      </div>
                      <span
                        className="ba-stat-badge"
                        style={{
                          backgroundColor: `${leave.color}20`,
                          color: leave.color,
                          border: `1px solid ${leave.color}40`,
                        }}
                      >
                        {leave.type === "holiday" ? "Holiday" : leave.leave_type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <AlertCircle className="w-5 h-5" />
              <span>Event Legend</span>
            </div>
          </div>
          <div className="ba-card-body">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "1rem",
              }}
            >
              {/* Leave Types */}
              {Array.from(
                new Set(
                  leaves
                    .filter((l) => l.type === "leave")
                    .map((l) => l.leave_type)
                )
              ).map((type) => {
                const leave = leaves.find(
                  (l) => l.type === "leave" && l.leave_type === type
                );
                return (
                  <div
                    key={`leave-${type}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "4px",
                        backgroundColor: leave.color,
                      }}
                    />
                    <span style={{ fontSize: "0.875rem" }}>{type}</span>
                  </div>
                );
              })}

              {/* Holiday Types */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    backgroundColor: "#10b981",
                  }}
                />
                <span style={{ fontSize: "0.875rem" }}>Public Holiday</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    backgroundColor: "#f59e0b",
                  }}
                />
                <span style={{ fontSize: "0.875rem" }}>Optional Holiday</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}