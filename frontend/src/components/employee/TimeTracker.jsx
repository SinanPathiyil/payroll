// frontend/src/components/employee/TimeTracker.jsx

import { useState } from 'react';
import { employeeLogin, employeeLogout } from '../../services/api';
import { Clock, LogIn, LogOut, Activity } from 'lucide-react';
import { formatTime, formatHours } from '../../utils/helpers';

export default function TimeTracker({ status, onStatusChange, activityStats }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClockIn = async () => {
    setLoading(true);
    setError('');
    try {
      await employeeLogin();
      
      // Notify Electron if running
      if (window.electron?.onClockIn) {
        window.electron.onClockIn();
      }
      
      onStatusChange(); // Refresh status
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClockOut = async () => {
    setLoading(true);
    setError('');
    try {
      await employeeLogout();
      
      // Notify Electron if running
      if (window.electron?.onClockOut) {
        window.electron.onClockOut();
      }
      
      onStatusChange(); // Refresh status
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };
  console.log('TimeTracker status:', status); // Debug log
  console.log('Is clocked in?', status?.is_clocked_in); // Debug log
  console.log('Status type:', typeof status); // Debug log

  // Handle loading/null state
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

  // Safely check if clocked in (handle both undefined and false)
  const isClockedIn = status.is_clocked_in === true;
  const currentHours = status.current_hours || 0;
  const loginTime = status.login_time;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Time Tracker</h2>
      </div>
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Debug Info - Remove in production */}
        <div className="bg-gray-100 border border-gray-300 rounded p-3 mb-4 text-xs">
          <p className="font-bold mb-1">🐛 Debug Info:</p>
          <p>status object: {JSON.stringify(status)}</p>
          <p>isClockedIn: {String(isClockedIn)}</p>
          <p>is_clocked_in value: {String(status.is_clocked_in)}</p>
          <p>is_clocked_in type: {typeof status.is_clocked_in}</p>
        </div>

        <div className="space-y-6">
          {/* Clock In/Out Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  isClockedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                }`}></div>
                <span className="text-lg font-semibold">
                  {isClockedIn ? 'Clocked In' : 'Clocked Out'}
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
                  <p className="text-sm text-gray-600">Hours Today</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatHours(currentHours)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Stats (when clocked in) */}
          {isClockedIn && activityStats && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">Activity Tracking (Live)</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Mouse Events</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {activityStats.mouseEvents?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Keyboard Events</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {activityStats.keyboardEvents?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Active Time</p>
                  <p className="text-lg font-semibold text-green-600">
                    {Math.floor((activityStats.activeTime || 0) / 60)} min
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Idle Time</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {Math.floor((activityStats.idleTime || 0) / 60)} min
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                <p>✅ Tracking your activity... Data will be sent every 5 minutes.</p>
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
                {loading ? 'Clocking Out...' : 'Clock Out'}
              </button>
            ) : (
              <button
                onClick={handleClockIn}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                <LogIn className="w-5 h-5" />
                {loading ? 'Clocking In...' : 'Clock In'}
              </button>
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 text-center">
            {isClockedIn ? (
              <p>🟢 Your activity is being tracked. Stay active to maintain productivity score.</p>
            ) : (
              <p>Clock in to start your work day and track your time.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}