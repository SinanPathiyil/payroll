import { useState, useEffect } from "react";
import { employeeLogin, employeeLogout } from "../../services/api";
import { Clock, LogIn, LogOut, Activity, MousePointer, Keyboard, Timer } from "lucide-react";
import { formatTime } from "../../utils/helpers";

export default function TimeTracker({ status, onStatusChange, activityStats }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [liveStats, setLiveStats] = useState({
    mouseEvents: 0,
    keyboardEvents: 0,
    activeTime: 0,
    idleTime: 0,
    startTime: null,
  });

  useEffect(() => {
    if (activityStats && status.is_clocked_in) {
      setLiveStats({
        mouseEvents: activityStats.mouseEvents || 0,
        keyboardEvents: activityStats.keyboardEvents || 0,
        activeTime: activityStats.activeTime || 0,
        idleTime: activityStats.idleTime || 0,
        startTime: Date.now(),
      });
    }
  }, [activityStats]);

  useEffect(() => {
    if (!status.is_clocked_in) {
      setLiveStats({
        mouseEvents: 0,
        keyboardEvents: 0,
        activeTime: 0,
        idleTime: 0,
        startTime: null,
      });
      return;
    }

    const handleMouseMove = () => {
      setLiveStats((prev) => ({ ...prev, mouseEvents: prev.mouseEvents + 1 }));
    };

    const handleKeyPress = () => {
      setLiveStats((prev) => ({ ...prev, keyboardEvents: prev.keyboardEvents + 1 }));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [status.is_clocked_in]);

  useEffect(() => {
    if (!status.is_clocked_in || !liveStats.startTime) return;

    const timer = setInterval(() => {
      setLiveStats((prev) => ({ ...prev, activeTime: prev.activeTime + 1 }));
    }, 1000);

    return () => clearInterval(timer);
  }, [status.is_clocked_in, liveStats.startTime]);

  const handleClockIn = async () => {
    setLoading(true);
    setError("");
    try {
      await employeeLogin();

      if (window.electron?.onClockIn) {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        await window.electron.onClockIn(token, user?.email);
      }

      onStatusChange();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to clock in");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    setError("");
    try {
      await employeeLogout();

      if (window.electron?.onClockOut) {
        await window.electron.onClockOut();
      }

      onStatusChange();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to clock out");
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="time-tracker-card">
        <div className="time-tracker-loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const isClockedIn = status.is_clocked_in === true;
  const currentActiveHours = status.current_active_hours || 0;
  const loginTime = status.login_time;

  return (
    <div className="time-tracker-card">
      <div className="time-tracker-header">
        <h2 className="time-tracker-title">
          Time Tracker
          {window.electron?.isElectron && isClockedIn && (
            <span className="time-tracker-live-badge">
              <span className="live-dot"></span>
              LIVE
            </span>
          )}
        </h2>
      </div>

      <div className="time-tracker-body">
        {error && (
          <div className="time-tracker-error">
            {error}
          </div>
        )}

        <div className="time-tracker-content">
          {/* Status Display */}
          <div className="time-tracker-status">
            <div>
              <p className="time-tracker-label">Current Status</p>
              <div className="time-tracker-status-info">
                <div className={`status-indicator ${isClockedIn ? 'status-active' : 'status-inactive'}`}></div>
                <span className="time-tracker-status-text">
                  {isClockedIn ? "Clocked In" : "Clocked Out"}
                </span>
              </div>
            </div>
            {isClockedIn && loginTime && (
              <div className="time-tracker-login-time">
                <p className="time-tracker-label">Since</p>
                <p className="time-tracker-time">{formatTime(loginTime)}</p>
              </div>
            )}
          </div>

          {/* Hours Display */}
          <div className="time-tracker-hours-card">
            <div className="time-tracker-hours-content">
              <div className="time-tracker-hours-icon">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <p className="stat-card-label">
                  {isClockedIn ? "Hours Today (Active Time)" : "TODAY'S ACTIVE HOURS"}
                </p>
                <p className="time-tracker-hours-value">
                  {currentActiveHours.toFixed(2)} hrs
                </p>
                {isClockedIn ? (
                  <p className="time-tracker-hours-hint time-tracker-hours-hint-active">
                    <span className="sync-dot"></span>
                    Updates every 30 seconds
                  </p>
                ) : (
                  <p className="time-tracker-hours-hint">

                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Live Activity Stats */}
          {isClockedIn && liveStats.startTime && (
            <div className="time-tracker-activity-card">
              <div className="time-tracker-activity-header">
                <div className="time-tracker-activity-title">
                  <Activity className="w-5 h-5" />
                  <h3>Activity Tracking</h3>
                </div>
                <span className="time-tracker-activity-badge">
                  <span className="live-dot"></span>
                  LIVE
                </span>
              </div>
              <div className="time-tracker-activity-grid">
                <div className="time-tracker-activity-item">
                  <div className="time-tracker-activity-icon">
                    <MousePointer className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="time-tracker-activity-label">Mouse Events</p>
                    <p className="time-tracker-activity-value">
                      {liveStats.mouseEvents.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="time-tracker-activity-item">
                  <div className="time-tracker-activity-icon">
                    <Keyboard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="time-tracker-activity-label">Keyboard Events</p>
                    <p className="time-tracker-activity-value">
                      {liveStats.keyboardEvents.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="time-tracker-activity-item">
                  <div className="time-tracker-activity-icon">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="time-tracker-activity-label">Active Time</p>
                    <p className="time-tracker-activity-value time-tracker-activity-value-success">
                      {Math.floor(liveStats.activeTime / 60)} min {liveStats.activeTime % 60} sec
                    </p>
                  </div>
                </div>
                <div className="time-tracker-activity-item">
                  <div className="time-tracker-activity-icon">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="time-tracker-activity-label">Idle Time</p>
                    <p className="time-tracker-activity-value time-tracker-activity-value-warning">
                      {Math.floor(liveStats.idleTime / 60)} min
                    </p>
                  </div>
                </div>
              </div>
              <div className="time-tracker-activity-footer">
                <span>🖥️ Agent syncs every 30s • Visual updates instantly</span>
                <span className="time-tracker-activity-status">● Live</span>
              </div>
            </div>
          )}

          {/* Clock In/Out Button */}
          <div>
            {isClockedIn ? (
              <button
                onClick={handleClockOut}
                disabled={loading}
                className="time-tracker-btn time-tracker-btn-clockout"
              >
                <LogOut className="w-5 h-5" />
                {loading ? "Clocking Out..." : "Clock Out"}
              </button>
            ) : (
              <button
                onClick={handleClockIn}
                disabled={loading}
                className="time-tracker-btn time-tracker-btn-clockin"
              >
                <LogIn className="w-5 h-5" />
                {loading ? "Clocking In..." : "Clock In"}
              </button>
            )}
          </div>

          {/* Info */}
          <div className="time-tracker-info">
            {isClockedIn ? (
              <>
                <p>🟢 Live visual feedback • Desktop agent tracks all applications</p>
                <p className="time-tracker-info-highlight">
                  ✨ Syncs with accurate agent data every 30 seconds
                </p>
              </>
            ) : (
              <p>Clock in to start live activity tracking</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}