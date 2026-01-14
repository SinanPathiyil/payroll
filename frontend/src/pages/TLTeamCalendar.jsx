import { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Palmtree,
} from "lucide-react";
import Layout from "../components/common/Layout";
import ApplyLeaveModal from "../components/employee/ApplyLeaveModal";
import axios from "axios";

export default function TLTeamCalendar() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // 'month' or 'list'

  useEffect(() => {
    loadLeaveCalendar();
  }, [currentDate]);

  const loadLeaveCalendar = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Get first and last day of current month
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
        `${import.meta.env.VITE_API_URL}/team-lead/leave/team-calendar`,
        {
          params: {
            start_date: firstDay.toISOString().split("T")[0],
            end_date: lastDay.toISOString().split("T")[0],
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEvents(response.data.events || []);
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

  const getEventsForDay = (day) => {
    // Create date string for the day we're checking (YYYY-MM-DD format)
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const checkDateStr = `${year}-${month}-${dayStr}`;

    return events.filter((event) => {
      if (event.type === "holiday") {
        // For holidays, compare just the date part
        const holidayDateStr = event.date.split("T")[0];
        return holidayDateStr === checkDateStr;
      } else {
        // For leaves, check if date is within range
        const startDateStr = event.start_date.split("T")[0];
        const endDateStr = event.end_date.split("T")[0];
        return checkDateStr >= startDateStr && checkDateStr <= endDateStr;
      }
    });
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filter events by type
  const leaves = events.filter((e) => e.type === "leave");
  const holidays = events.filter((e) => e.type === "holiday");

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="spinner spinner-lg"></div>
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading Calendar...</p>
        </div>
      </Layout>
    );
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Layout>
      <div style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
              Team Leave Calendar
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              View your team's approved leave schedules and public holidays
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() =>
                setViewMode(viewMode === "month" ? "list" : "month")
              }
            >
              {viewMode === "month" ? "List View" : "Calendar View"}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowApplyModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}
        >
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users className="w-6 h-6" style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Team Members on Leave</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: '#3b82f6' }}>
                  {leaves.length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#d1fae5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Palmtree className="w-6 h-6" style={{ color: '#10b981' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Public Holidays</p>
                <p style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: '#10b981' }}>
                  {holidays.length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#e9d5ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar className="w-6 h-6" style={{ color: '#9333ea' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Viewing</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#9333ea' }}>
                  {monthName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {viewMode === "month" ? (
          /* Calendar View */
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar className="w-5 h-5" style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>{monthName}</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-secondary" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentDate(new Date())}
                  style={{ minWidth: "80px" }}
                >
                  Today
                </button>
                <button className="btn btn-secondary" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div style={{ padding: 0 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  backgroundColor: "#f9fafb",
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
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
                  )
                )}
              </div>

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
                      minHeight: "100px",
                      padding: "0.5rem",
                    }}
                  />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const dayEvents = getEventsForDay(day);
                  const isToday =
                    day === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear();

                  return (
                    <div
                      key={day}
                      style={{
                        backgroundColor: "white",
                        minHeight: "100px",
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
                          marginBottom: "0.25rem",
                        }}
                      >
                        {day}
                      </div>

                      {dayEvents.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                          }}
                        >
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.25rem",
                                backgroundColor: `${event.color}20`,
                                borderLeft: `3px solid ${event.color}`,
                                borderRadius: "3px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontWeight:
                                  event.type === "leave" && event.is_own
                                    ? "600"
                                    : "400",
                              }}
                              title={
                                event.type === "holiday"
                                  ? `${event.name}${event.is_optional ? " (Optional)" : ""}`
                                  : `${event.user_name} - ${event.leave_type}${event.is_own ? " (You)" : ""}`
                              }
                            >
                              {event.type === "holiday" ? (
                                <span>🎉 {event.name}</span>
                              ) : (
                                <span>
                                  {event.is_own ? "👤 " : ""}
                                  {event.user_name}
                                </span>
                              )}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "#6b7280",
                                padding: "0.25rem",
                              }}
                            >
                              +{dayEvents.length - 3} more
                            </div>
                          )}
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
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar className="w-5 h-5" style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>Calendar Events - {monthName}</span>
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {events.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                  <Calendar className="w-16 h-16" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '1.125rem', margin: 0 }}>No events this month</p>
                </div>
              ) : (
                <>
                  {/* Public Holidays Section */}
                  {holidays.length > 0 && (
                    <>
                      <h3
                        style={{
                          fontSize: "1rem",
                          fontWeight: "600",
                          marginBottom: "1rem",
                          color: "#374151",
                        }}
                      >
                        🎉 Public Holidays
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: "2rem" }}>
                        {holidays.map((holiday) => (
                          <div
                            key={holiday.id}
                            style={{
                              padding: '1rem',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem'
                            }}
                          >
                            <div
                              style={{
                                width: '4px',
                                height: '60px',
                                backgroundColor: holiday.color,
                                borderRadius: '2px'
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                                {holiday.name}
                                {holiday.is_optional && (
                                  <span
                                    style={{
                                      color: "#f59e0b",
                                      marginLeft: "0.5rem",
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    (Optional)
                                  </span>
                                )}
                              </p>
                              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                                {formatDate(holiday.date)}
                                {holiday.description &&
                                  ` - ${holiday.description}`}
                              </p>
                            </div>
                            <span
                              style={{
                                padding: '0.375rem 0.75rem',
                                backgroundColor: holiday.is_optional ? '#fef3c7' : '#d1fae5',
                                color: holiday.is_optional ? '#92400e' : '#065f46',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                              }}
                            >
                              {holiday.is_optional ? "Optional" : "Holiday"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Team Leaves Section */}
                  {leaves.length > 0 && (
                    <>
                      <h3
                        style={{
                          fontSize: "1rem",
                          fontWeight: "600",
                          marginBottom: "1rem",
                          color: "#374151",
                        }}
                      >
                        👥 Team Members on Leave
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {leaves.map((leave) => (
                          <div
                            key={leave.id}
                            style={{
                              padding: '1rem',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem'
                            }}
                          >
                            <div
                              style={{
                                width: '4px',
                                height: '60px',
                                backgroundColor: leave.color,
                                borderRadius: '2px'
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                                {leave.is_own ? '👤 ' : ''}{leave.user_name} - {leave.leave_type}
                              </p>
                              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                                {formatDate(leave.start_date)} →{" "}
                                {formatDate(leave.end_date)} ({leave.total_days}{" "}
                                {leave.total_days === 1 ? "day" : "days"})
                              </p>
                            </div>
                            <span
                              style={{
                                padding: '0.375rem 0.75rem',
                                backgroundColor: '#dbeafe',
                                color: '#1e40af',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                              }}
                            >
                              {leave.leave_type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {leaves.length === 0 && holidays.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                      <Calendar className="w-16 h-16" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                      <p style={{ fontSize: '1.125rem', margin: 0 }}>No events this month</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          marginTop: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle className="w-5 h-5" style={{ color: '#6b7280' }} />
              <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>Event Legend</span>
            </div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "1rem",
              }}
            >
              {/* Leave Types */}
              {Array.from(new Set(leaves.map((l) => l.leave_type))).map(
                (type) => {
                  const leave = leaves.find((l) => l.leave_type === type);
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
                }
              )}

              {/* Holiday Types */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
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
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
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

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <ApplyLeaveModal
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false);
            loadLeaveCalendar();
          }}
        />
      )}
    </Layout>
  );
}