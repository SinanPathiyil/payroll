import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, AlertCircle, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Layout from '../components/common/Layout';
import ApplyLeaveModal from '../components/employee/ApplyLeaveModal';
import axios from 'axios';

export default function EmployeeLeaveCalendar() {
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'

  useEffect(() => {
    loadLeaveCalendar();
  }, [currentDate]);

  const loadLeaveCalendar = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get first and last day of current month
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/employee/leave/team-calendar`,
        {
          params: {
            start_date: firstDay.toISOString().split('T')[0],
            end_date: lastDay.toISOString().split('T')[0]
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setLeaves(response.data.leaves || []);
    } catch (error) {
      console.error('Failed to load calendar:', error);
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
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString().split('T')[0];
    
    return leaves.filter(leave => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const current = new Date(dateStr);
      return current >= start && current <= end;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Calendar...</p>
        </div>
      </Layout>
    );
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Layout>
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div>
            <h1 className="ba-dashboard-title">Team Leave Calendar</h1>
            <p className="ba-dashboard-subtitle">
              View your team's approved leave schedules
            </p>
          </div>
          <div className="ba-dashboard-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setViewMode(viewMode === 'month' ? 'list' : 'month')}
            >
              {viewMode === 'month' ? 'List View' : 'Calendar View'}
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowApplyModal(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="ba-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Team Members on Leave</p>
                <p className="ba-stat-value">{leaves.length}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Viewing</p>
                <p className="ba-stat-value" style={{ fontSize: '1.25rem' }}>{monthName}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-purple">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'month' ? (
          /* Calendar View */
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Calendar className="w-5 h-5" />
                <span>{monthName}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="btn btn-secondary" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="ba-card-body" style={{ padding: 0 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                backgroundColor: '#f9fafb',
                borderBottom: '2px solid #e5e7eb'
              }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div
                    key={day}
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151'
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '1px',
                backgroundColor: '#e5e7eb'
              }}>
                {/* Empty cells before month starts */}
                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    style={{
                      backgroundColor: '#f9fafb',
                      minHeight: '100px',
                      padding: '0.5rem'
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
                        backgroundColor: 'white',
                        minHeight: '100px',
                        padding: '0.5rem',
                        position: 'relative',
                        border: isToday ? '2px solid #3b82f6' : 'none'
                      }}
                    >
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: isToday ? '700' : '500',
                        color: isToday ? '#3b82f6' : '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        {day}
                      </div>

                      {dayLeaves.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {dayLeaves.slice(0, 2).map(leave => (
                            <div
                              key={leave.id}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem',
                                backgroundColor: `${leave.color}20`,
                                borderLeft: `3px solid ${leave.color}`,
                                borderRadius: '3px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={`${leave.user_name} - ${leave.leave_type}`}
                            >
                              {leave.user_name}
                            </div>
                          ))}
                          {dayLeaves.length > 2 && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              padding: '0.25rem'
                            }}>
                              +{dayLeaves.length - 2} more
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
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Users className="w-5 h-5" />
                <span>Team Members on Leave - {monthName}</span>
              </div>
            </div>
            <div className="ba-card-body">
              {leaves.length === 0 ? (
                <div className="ba-empty-state">
                  <Calendar className="ba-empty-icon" />
                  <p>No team members on leave this month</p>
                </div>
              ) : (
                <div className="ba-activity-list">
                  {leaves.map((leave) => (
                    <div key={leave.id} className="ba-activity-item">
                      <div 
                        className="ba-activity-indicator"
                        style={{ backgroundColor: leave.color }}
                      />
                      <div className="ba-activity-content">
                        <p className="ba-activity-message">
                          <strong>{leave.user_name}</strong> - {leave.leave_type}
                        </p>
                        <p className="ba-activity-time">
                          {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
                          {' '}({leave.total_days} {leave.total_days === 1 ? 'day' : 'days'})
                        </p>
                      </div>
                      <span className="ba-stat-badge info">
                        {leave.leave_type}
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
              <span>Leave Type Legend</span>
            </div>
          </div>
          <div className="ba-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {Array.from(new Set(leaves.map(l => l.leave_type))).map(type => {
                const leave = leaves.find(l => l.leave_type === type);
                return (
                  <div
                    key={type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        backgroundColor: leave.color
                      }}
                    />
                    <span style={{ fontSize: '0.875rem' }}>{type}</span>
                  </div>
                );
              })}
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