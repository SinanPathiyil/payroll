import { useState, useEffect } from 'react';
import { Monitor, Clock, X, Calendar, TrendingDown } from 'lucide-react';
import { getEmployeeAppBreakdown } from '../../services/api';

export default function EmployeeActivityBreakdown({ employeeId, employeeName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    fetchBreakdown();
  }, [employeeId, startDate, endDate]);

  const fetchBreakdown = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getEmployeeAppBreakdown(employeeId, startDate, endDate);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching app breakdown:', err);
      setError('Failed to load activity breakdown. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setDateRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="modal-backdrop">
        <div className="modal-loading">
          <div className="spinner spinner-lg"></div>
          <p className="modal-loading-text">Loading activity data...</p>
        </div>
      </div>
    );
  }

  const breakdown = data?.breakdown || [];
  const totalDurationMinutes = breakdown.reduce((sum, item) => sum + item.total_duration_minutes, 0);

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-xl">
        {/* Sticky Header */}
        <div className="activity-breakdown-header">
          <div>
            <h2 className="activity-breakdown-title">{employeeName}</h2>
            <p className="activity-breakdown-subtitle">Per-Application Activity Breakdown</p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="activity-breakdown-body">
          {/* Date Range Selector */}
          <div className="activity-breakdown-date-card">
            <label className="activity-breakdown-date-label">
              <Calendar className="w-4 h-4" />
              Select Date Range
            </label>
            
            <div className="activity-breakdown-date-buttons">
              <button
                onClick={() => setDateRange(1)}
                className="btn btn-secondary btn-sm"
              >
                Today
              </button>
              <button
                onClick={() => setDateRange(7)}
                className="btn btn-secondary btn-sm"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateRange(30)}
                className="btn btn-secondary btn-sm"
              >
                Last 30 Days
              </button>
            </div>

            <div className="activity-breakdown-date-inputs">
              <div>
                <label className="activity-breakdown-input-label">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  className="modal-input"
                />
              </div>
              <div>
                <label className="activity-breakdown-input-label">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={today}
                  className="modal-input"
                />
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="activity-breakdown-summary">
            <div className="activity-breakdown-summary-time">
              <div className="activity-breakdown-summary-icon">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <p className="activity-breakdown-summary-label">Total Activity Time</p>
                <p className="activity-breakdown-summary-value">
                  {Math.floor(totalDurationMinutes / 60)}h {Math.round(totalDurationMinutes % 60)}m
                </p>
              </div>
            </div>
            <div className="activity-breakdown-summary-apps">
              <p className="activity-breakdown-summary-label">Total Applications</p>
              <p className="activity-breakdown-summary-value">{data?.total_apps || 0}</p>
            </div>
          </div>

          {error && (
            <div className="modal-error">{error}</div>
          )}

          {/* Applications Breakdown */}
          <div>
            <h3 className="activity-breakdown-list-title">
              <TrendingDown className="w-6 h-6" />
              Activity Breakdown
            </h3>

            {breakdown.length === 0 ? (
              <div className="activity-breakdown-empty">
                <Monitor className="activity-breakdown-empty-icon" />
                <p className="activity-breakdown-empty-text">No activity recorded for this date range</p>
                <p className="activity-breakdown-empty-hint">Try selecting a different date range</p>
              </div>
            ) : (
              <div className="activity-breakdown-list">
                {breakdown.map((app, index) => {
                  const hours = Math.floor(app.total_duration_minutes / 60);
                  const minutes = Math.round(app.total_duration_minutes % 60);
                  
                  return (
                    <div key={index} className="activity-breakdown-item">
                      <div className="activity-breakdown-item-header">
                        <div className="activity-breakdown-item-info">
                          <div className="activity-breakdown-item-icon">
                            <Monitor className="w-5 h-5" />
                          </div>
                          <p className="activity-breakdown-item-name">{app.app_name}</p>
                        </div>
                        <div className="activity-breakdown-item-stats">
                          <p className="activity-breakdown-item-duration">
                            {hours > 0 ? `${hours}h ` : ''}{minutes}m
                          </p>
                          <p className="activity-breakdown-item-percentage">
                            {app.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <div className="activity-breakdown-progress">
                        <div
                          className="activity-breakdown-progress-bar"
                          style={{ width: `${app.percentage}%` }}
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
    </div>
  );
}