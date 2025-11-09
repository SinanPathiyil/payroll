// Temporary test - remove after debugging

import { useState, useEffect } from 'react';
import { X, TrendingUp, Clock, CheckCircle, Monitor } from 'lucide-react';
import { getEmployeeStats } from '../../services/api';
import AttendanceTable from './AttendanceTable';
import { formatHours } from '../../utils/helpers';
import EmployeeActivityBreakdown from './EmployeeActivityBreakdown';

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
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="spinner mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold">{employee.full_name}</h2>
            <p className="text-gray-500">{employee.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Hours (7 days)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatHours(stats?.attendance?.total_hours)} hrs
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Task Completion</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.tasks_summary?.completed || 0}/{stats?.tasks_summary?.total || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg Productivity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.activity_summary?.avg_productivity_score?.toFixed(0) || 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Summary with Breakdown Button */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Activity Summary (Last 7 Days)</h3>
              <button
                onClick={() => setShowActivityBreakdown(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Monitor className="w-4 h-4" />
                View Per-App Breakdown
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Active Time</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatHours(stats?.activity_summary?.total_active_time)} hrs
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Idle Time</p>
                <p className="text-lg font-semibold text-orange-600">
                  {formatHours(stats?.activity_summary?.total_idle_time)} hrs
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mouse Events</p>
                <p className="text-lg font-semibold text-blue-600">
                  {stats?.activity_summary?.total_mouse_events?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Keyboard Events</p>
                <p className="text-lg font-semibold text-blue-600">
                  {stats?.activity_summary?.total_keyboard_events?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <AttendanceTable records={stats?.attendance?.records || []} />
        </div>
      </div>


      {/* Activity Breakdown Modal - TEST */}
      {showActivityBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md">
            <h2 className="text-2xl font-bold mb-4">Test Modal</h2>
            <p>Employee ID: {employee._id || employee.id}</p>
            <p>Employee Name: {employee.full_name}</p>
            <button
              onClick={() => setShowActivityBreakdown(false)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}