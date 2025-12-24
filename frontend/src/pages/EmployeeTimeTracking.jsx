import { useState, useEffect } from "react";
import Layout from "../components/common/Layout";
import TimeTracker from "../components/employee/TimeTracker";
import { getEmployeeStatus, getActivityHistory } from "../services/api";
import { Clock, Mouse, Keyboard, Timer, Coffee } from "lucide-react";

export default function EmployeeTimeTracking() {
  const [status, setStatus] = useState({
    is_clocked_in: false,
    today_total_hours: 0,
    current_active_hours: 0,
    login_time: null,
  });
  const [activityStats, setActivityStats] = useState({
    mouseEvents: 0,
    keyboardEvents: 0,
    activeTime: 0,
    idleTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statusRes, activityRes] = await Promise.all([
        getEmployeeStatus(),
        getActivityHistory(),
      ]);

      setStatus(statusRes.data || statusRes);

      const activityData = activityRes.data || activityRes || {};
      const summary = activityData.summary || {};
      setActivityStats({
        mouseEvents: summary.total_mouse_movements || 0,
        keyboardEvents: summary.total_key_presses || 0,
        activeTime: summary.total_active_time_seconds || 0,
        idleTime: summary.total_idle_time_seconds || 0,
      });
    } catch (error) {
      console.error("Failed to load time tracking data:", error);
    } finally {
      setLoading(false);
    }
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
          <p className="layout-loading-text">Loading...</p>
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
            <h1 className="ba-dashboard-title">Time Tracking</h1>
            <p className="ba-dashboard-subtitle">Monitor your work hours and activity</p>
          </div>
        </div>

        {/* Time Tracker Card */}
        <TimeTracker
          status={status}
          onStatusChange={loadData}
          activityStats={activityStats}
        />

        {/* Activity Stats */}
        <div className="ba-card ba-performance-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Clock className="w-5 h-5" />
              <span>Today's Activity Overview</span>
            </div>
          </div>
          <div className="ba-card-body">
            <div className="ba-performance-grid">
              <div className="ba-performance-item">
                <div className="ba-performance-label">
                  <Mouse className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Mouse Events
                </div>
                <div className="ba-performance-value">
                  {activityStats.mouseEvents.toLocaleString()}
                </div>
              </div>
              <div className="ba-performance-item">
                <div className="ba-performance-label">
                  <Keyboard className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Keyboard Events
                </div>
                <div className="ba-performance-value">
                  {activityStats.keyboardEvents.toLocaleString()}
                </div>
              </div>
              <div className="ba-performance-item">
                <div className="ba-performance-label">
                  <Timer className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Active Time
                </div>
                <div className="ba-performance-value">
                  {formatTime(activityStats.activeTime)}
                </div>
              </div>
              <div className="ba-performance-item">
                <div className="ba-performance-label">
                  <Coffee className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Idle Time
                </div>
                <div className="ba-performance-value">
                  {formatTime(activityStats.idleTime)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}