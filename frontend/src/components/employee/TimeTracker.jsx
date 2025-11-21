import { useState, useEffect } from "react";
import { employeeLogin, employeeLogout } from "../../services/api";
import { Clock, LogIn, LogOut, Activity } from "lucide-react";
import { formatTime, formatHours } from "../../utils/helpers";

export default function TimeTracker({ status, onStatusChange, activityStats }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Live display values (starts FROM agent data, then increments)
  const [liveStats, setLiveStats] = useState({
    mouseEvents: 0,
    keyboardEvents: 0,
    activeTime: 0,
    idleTime: 0,
    startTime: null,
  });

  // Initialize live stats FROM agent data when clock in
  useEffect(() => {
    if (activityStats && status.is_clocked_in) {
      console.log("🔄 Syncing with agent data:", activityStats);

      // Update live stats with agent data (replaces current values)
      setLiveStats({
        mouseEvents: activityStats.mouseEvents || 0,
        keyboardEvents: activityStats.keyboardEvents || 0,
        activeTime: activityStats.activeTime || 0,
        idleTime: activityStats.idleTime || 0,
        startTime: Date.now(), // Reset timer for active time calculation
      });

      console.log("✅ Live stats synced to:", {
        mouse: activityStats.mouseEvents,
        keyboard: activityStats.keyboardEvents,
        active: activityStats.activeTime,
      });
    }
  }, [activityStats]); // Updates every time agent sends data (every 30s)

  // Live tracking listeners (only for visual feedback)
  useEffect(() => {
    if (!status.is_clocked_in) {
      // Reset on clock out
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
      setLiveStats((prev) => ({
        ...prev,
        mouseEvents: prev.mouseEvents + 1, // Increment from current value
      }));
    };

    const handleKeyPress = () => {
      setLiveStats((prev) => ({
        ...prev,
        keyboardEvents: prev.keyboardEvents + 1, // Increment from current value
      }));
    };

    // Track only in Electron window (browser tab)
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyPress);

    console.log("🔴 Live tracking started");

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyPress);
      console.log("⚪ Live tracking stopped");
    };
  }, [status.is_clocked_in]);

  // Live active time counter (increments every second)
  useEffect(() => {
    if (!status.is_clocked_in || !liveStats.startTime) {
      return;
    }

    const timer = setInterval(() => {
      setLiveStats((prev) => ({
        ...prev,
        activeTime: prev.activeTime + 1, // Add 1 second
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [status.is_clocked_in, liveStats.startTime]);

  const handleClockIn = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await employeeLogin();

      // Notify Electron
      if (window.electron?.onClockIn) {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        console.log("🔵 Calling Electron onClockIn");
        await window.electron.onClockIn(token, user?.email);
        console.log("✅ Electron agent started");
      }

      // This will fetch agent data and initialize live stats
      onStatusChange();
    } catch (err) {
      console.error("❌ Clock in error:", err);
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
        console.log("🔵 Calling Electron onClockOut");
        await window.electron.onClockOut();
        console.log("✅ Electron agent stopped");
      }

      onStatusChange();
    } catch (err) {
      console.error("❌ Clock out error:", err);
      setError(err.response?.data?.detail || "Failed to clock out");
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const isClockedIn = status.is_clocked_in === true;
  const currentActiveHours = status.current_active_hours || 0;
  const loginTime = status.login_time;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Time Tracker
          {window.electron?.isElectron && isClockedIn && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded animate-pulse">
              🔴 LIVE
            </span>
          )}
        </h2>
      </div>
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Clock In/Out Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Status</p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isClockedIn ? "bg-green-500 animate-pulse" : "bg-gray-300"
                  }`}
                ></div>
                <span className="text-lg font-semibold">
                  {isClockedIn ? "Clocked In" : "Clocked Out"}
                </span>
              </div>
            </div>
            {isClockedIn && loginTime && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Since</p>
                <p className="text-lg font-semibold">{formatTime(loginTime)}</p>
              </div>
            )}
          </div>

          {/* Hours Display */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">
                    Hours Today (Active Time)
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {currentActiveHours.toFixed(2)} hrs
                  </p>
                  {isClockedIn && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Updates every 30 seconds
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Live Activity Stats */}
          {isClockedIn && liveStats.startTime && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold">Activity Tracking</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    LIVE
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Mouse Events</p>
                  <p className="text-lg font-semibold text-purple-700">
                    {liveStats.mouseEvents.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Keyboard Events</p>
                  <p className="text-lg font-semibold text-purple-700">
                    {liveStats.keyboardEvents.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Active Time</p>
                  <p className="text-lg font-semibold text-green-600">
                    {Math.floor(liveStats.activeTime / 60)} min{" "}
                    {liveStats.activeTime % 60} sec
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Idle Time</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {Math.floor(liveStats.idleTime / 60)} min
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-purple-200 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span>
                    🖥️ Agent syncs every 30s • Visual updates instantly
                  </span>
                  <span className="text-green-600 font-medium">● Live</span>
                </div>
              </div>
            </div>
          )}

          {/* Clock In/Out Button */}
          <div>
            {isClockedIn ? (
              <button
                onClick={handleClockOut}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                <LogOut className="w-5 h-5" />
                {loading ? "Clocking Out..." : "Clock Out"}
              </button>
            ) : (
              <button
                onClick={handleClockIn}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                <LogIn className="w-5 h-5" />
                {loading ? "Clocking In..." : "Clock In"}
              </button>
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 text-center">
            {isClockedIn ? (
              <>
                <p>
                  🟢 Live visual feedback • Desktop agent tracks all
                  applications
                </p>
                <p className="mt-1 text-purple-600 font-medium">
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
