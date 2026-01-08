import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  X,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';
import '../styles/ba-dashboard.css';
import '../styles/ba-modal.css';

export default function HRCompanyCalendar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [leavesOnSelectedDate, setLeavesOnSelectedDate] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Filters
  const [filters, setFilters] = useState({
    leaveType: ''
  });

  useEffect(() => {
    loadCalendarData();
  }, [currentMonth, currentYear]);

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/hr/leave/company-calendar`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { month: currentMonth, year: currentYear }
        }
      );
      setLeaves(response.data.leaves || []);
    } catch (error) {
      console.error('Failed to load calendar:', error);
      setMessage({ type: 'error', text: 'Failed to load calendar data' });
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/employee/leave/types`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaveTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load leave types:', error);
    }
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const previousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getLeavesForDate = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    let filtered = leaves.filter(leave => {
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);
      const checkDate = new Date(dateStr);
      return checkDate >= startDate && checkDate <= endDate;
    });

    // Apply leave type filter
    if (filters.leaveType) {
      filtered = filtered.filter(l => {
        const leaveType = leaveTypes.find(t => t.name === l.leave_type);
        return leaveType && leaveType.code === filters.leaveType;
      });
    }

    return filtered;
  };

  const handleDateClick = (day) => {
    const leavesOnDay = getLeavesForDate(day);
    if (leavesOnDay.length > 0) {
      setSelectedDate(day);
      setLeavesOnSelectedDate(leavesOnDay);
      setShowDetailsModal(true);
    }
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth === today.getMonth() + 1 && 
           currentYear === today.getFullYear();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="calendar-day calendar-day-empty" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const leavesOnDay = getLeavesForDate(day);
      const hasLeaves = leavesOnDay.length > 0;

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday(day) ? 'calendar-day-today' : ''} ${hasLeaves ? 'calendar-day-has-leaves' : ''}`}
          onClick={() => handleDateClick(day)}
          style={{ cursor: hasLeaves ? 'pointer' : 'default' }}
        >
          <div className="calendar-day-number">{day}</div>
          {hasLeaves && (
            <div className="calendar-day-leaves">
              {leavesOnDay.slice(0, 3).map((leave, index) => (
                <div
                  key={index}
                  className="calendar-leave-indicator"
                  style={{ backgroundColor: leave.color }}
                  title={`${leave.user_name} - ${leave.leave_type}`}
                >
                  <span className="calendar-leave-name">{leave.user_name}</span>
                </div>
              ))}
              {leavesOnDay.length > 3 && (
                <div className="calendar-leave-more">
                  +{leavesOnDay.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const getUniqueLeaveTypes = () => {
    const types = leaves.map(l => l.leave_type);
    return Array.from(new Set(types));
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

  return (
    <Layout>
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/hr/leave')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="ba-dashboard-title">Company Calendar</h1>
              <p className="ba-dashboard-subtitle">
                View company-wide leave schedule
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`ba-alert ba-alert-${message.type === 'success' ? 'warning' : 'error'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Filters & Legend */}
        <div className="ba-card" style={{ marginBottom: '1.5rem' }}>
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter className="w-5 h-5" />
              Filters & Legend
            </h3>
          </div>
          <div className="ba-card-body">
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Filter */}
              <div className="ba-form-group" style={{ marginBottom: 0, maxWidth: '300px' }}>
                <label className="ba-form-label">Filter by Leave Type</label>
                <select
                  value={filters.leaveType}
                  onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
                  className="ba-form-input"
                >
                  <option value="">All Leave Types</option>
                  {leaveTypes.map(type => (
                    <option key={type.code} value={type.code}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Legend */}
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#6b7280' }}>
                  Leave Types:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  {leaveTypes.map(type => (
                    <div key={type.code} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        backgroundColor: type.color,
                        border: '1px solid rgba(0,0,0,0.1)'
                      }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{type.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={previousMonth}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, minWidth: '200px', textAlign: 'center' }}>
                {getMonthName(currentMonth)} {currentYear}
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={nextMonth}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setCurrentMonth(new Date().getMonth() + 1);
                setCurrentYear(new Date().getFullYear());
              }}
            >
              <Calendar className="w-4 h-4" />
              <span>Today</span>
            </button>
          </div>
          <div className="ba-card-body" style={{ padding: 0 }}>
            <div className="calendar-container">
              {/* Week days header */}
              <div className="calendar-header">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="calendar-weekday">{day}</div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="calendar-grid">
                {renderCalendar()}
              </div>
            </div>
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && (
          <div className="ba-modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="ba-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className="ba-modal-header">
                <div className="ba-modal-header-content">
                  <Users className="w-6 h-6" />
                  <h2 className="ba-modal-title">
                    Leaves on {getMonthName(currentMonth)} {selectedDate}, {currentYear}
                  </h2>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="ba-modal-close-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="ba-modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {leavesOnSelectedDate.map((leave, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1.25rem',
                        background: `linear-gradient(135deg, ${leave.color}10, ${leave.color}20)`,
                        border: `2px solid ${leave.color}`,
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: leave.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '1.25rem'
                        }}>
                          {leave.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>
                            {leave.user_name}
                          </h4>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                            {leave.user_email}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Leave Type
                          </p>
                          <p style={{ fontWeight: '600', margin: 0 }}>{leave.leave_type}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Duration
                          </p>
                          <p style={{ fontWeight: '600', margin: 0 }}>
                            {leave.total_days} {leave.total_days === 1 ? 'Day' : 'Days'}
                          </p>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Period
                          </p>
                          <p style={{ fontWeight: '600', margin: 0 }}>
                            {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ba-modal-footer">
                <button onClick={() => setShowDetailsModal(false)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .calendar-container {
          padding: 1.5rem;
        }

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 8px;
        }

        .calendar-weekday {
          text-align: center;
          font-weight: 700;
          font-size: 0.875rem;
          color: #6b7280;
          padding: 0.75rem 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .calendar-day {
          min-height: 100px;
          padding: 0.5rem;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .calendar-day-empty {
          background: #f9fafb;
        }

        .calendar-day-today {
          border: 2px solid #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }

        .calendar-day-has-leaves:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border-color: #3b82f6;
        }

        .calendar-day-number {
          font-weight: 700;
          font-size: 0.875rem;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .calendar-day-leaves {
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
        }

        .calendar-leave-indicator {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .calendar-leave-name {
          font-size: 0.75rem;
        }

        .calendar-leave-more {
          padding: 4px 8px;
          background: #e5e7eb;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          color: #6b7280;
          text-align: center;
        }

        @media (max-width: 768px) {
          .calendar-day {
            min-height: 80px;
          }
          
          .calendar-weekday {
            font-size: 0.75rem;
          }
          
          .calendar-leave-indicator {
            font-size: 0.65rem;
            padding: 2px 4px;
          }
        }
      `}</style>
    </Layout>
  );
}