import { useState, useEffect } from 'react';
import { Monitor, Clock, X, Calendar, TrendingDown } from 'lucide-react';
import { getEmployeeAppBreakdown } from '../../services/api';

export default function EmployeeActivityBreakdown({ employeeId, employeeName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Default to today
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

  // Quick date range buttons
  const setDateRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1); // Include today
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading activity data...</p>
        </div>
      </div>
    );
  }

  const breakdown = data?.breakdown || [];
  const totalDurationMinutes = breakdown.reduce((sum, item) => sum + item.total_duration_minutes, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* ✅ STICKY HEADER - Always visible */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg sticky top-0 z-10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">{employeeName}</h2>
              <p className="text-blue-100 mt-1">Per-Application Activity Breakdown</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ✅ SCROLLABLE CONTENT */}
        <div className="overflow-y-auto p-6">
          {/* Date Range Selector */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Select Date Range
            </label>
            
            {/* Quick Selection Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setDateRange(1)}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-500 transition"
              >
                Today
              </button>
              <button
                onClick={() => setDateRange(7)}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-500 transition"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateRange(30)}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-500 transition"
              >
                Last 30 Days
              </button>
            </div>

            {/* Custom Date Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={today}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white rounded-full p-4 shadow-md">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Activity Time</p>
                  <p className="text-4xl font-bold text-gray-800">
                    {Math.floor(totalDurationMinutes / 60)}h {Math.round(totalDurationMinutes % 60)}m
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 font-medium">Total Applications</p>
                <p className="text-3xl font-bold text-gray-800">{data?.total_apps || 0}</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Applications Breakdown */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-blue-600" />
              Activity Breakdown
            </h3>

            {breakdown.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No activity recorded for this date range</p>
                <p className="text-gray-400 text-sm mt-2">Try selecting a different date range</p>
              </div>
            ) : (
              <div className="space-y-3">
                {breakdown.map((app, index) => {
                  const hours = Math.floor(app.total_duration_minutes / 60);
                  const minutes = Math.round(app.total_duration_minutes % 60);
                  
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg p-2.5 flex-shrink-0">
                            <Monitor className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-base truncate">
                              {app.app_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-xl font-bold text-gray-800">
                            {hours > 0 ? `${hours}h ` : ''}{minutes}m
                          </p>
                          <p className="text-sm font-semibold text-blue-600">
                            {app.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
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