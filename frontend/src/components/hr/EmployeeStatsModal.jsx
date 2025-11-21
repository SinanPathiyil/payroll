import { useState, useEffect } from 'react';
import { X, TrendingUp, Clock, CheckCircle, Monitor, DollarSign, TrendingDown } from 'lucide-react';
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

          {/* ✅ NEW: SALARY INFORMATION SECTION */}
          {stats?.salary_info && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Salary Calculation</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Base Salary:</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ${stats.salary_info.base_salary.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg Productivity:</span>
                    <span className="text-lg font-semibold text-purple-600">
                      {stats.salary_info.avg_productivity}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Productivity Tier:</span>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      stats.salary_info.multiplier === 1.0 ? 'bg-green-100 text-green-700' :
                      stats.salary_info.multiplier >= 0.95 ? 'bg-blue-100 text-blue-700' :
                      stats.salary_info.multiplier >= 0.90 ? 'bg-yellow-100 text-yellow-700' :
                      stats.salary_info.multiplier >= 0.85 ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {stats.salary_info.tier}
                    </span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Multiplier:</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {(stats.salary_info.multiplier * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  {stats.salary_info.deduction > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        Deduction:
                      </span>
                      <span className="text-lg font-semibold text-red-600">
                        -${stats.salary_info.deduction.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t-2 border-green-300">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Actual Salary:</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${stats.salary_info.actual_salary.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Productivity Tier Legend */}
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-xs text-gray-500 mb-2">Productivity Tiers:</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded">90-100% = 100%</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">80-89% = 95%</span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">70-79% = 90%</span>
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">60-69% = 85%</span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded">&lt;60% = 80%</span>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Table */}
          <AttendanceTable records={stats?.attendance?.records || []} />
        </div>
      </div>
      {showActivityBreakdown && (
        <EmployeeActivityBreakdown
          employeeId={employee.id || employee._id}
          employeeName={employee.full_name}
          onClose={() => setShowActivityBreakdown(false)}
        />
      )}     
    </div>
  );
}