import { useState, useEffect } from 'react';
import { Monitor, Mouse, Keyboard, Clock, Globe, TrendingUp, X } from 'lucide-react';
import axios from 'axios';

export default function EmployeeActivityBreakdown({ employeeId, employeeName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchActivities();
  }, [employeeId, selectedDate]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/employee/activity/breakdown/${employeeId}?date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
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

  if (!data) return null;

  const { employee, applications, total_time_minutes, total_mouse_movements, total_key_presses } = data;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">{employee.name}</h2>
              <p className="text-blue-100">{employee.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Date Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 rounded-full p-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Total Time</span>
              </div>
              <p className="text-4xl font-bold text-blue-600">
                {Math.floor(total_time_minutes / 60)}h {total_time_minutes % 60}m
              </p>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-100 rounded-full p-3">
                  <Mouse className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Mouse Events</span>
              </div>
              <p className="text-4xl font-bold text-green-600">
                {total_mouse_movements.toLocaleString()}
              </p>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 rounded-full p-3">
                  <Keyboard className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Keyboard Events</span>
              </div>
              <p className="text-4xl font-bold text-purple-600">
                {total_key_presses.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Applications Breakdown */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Activity by Application
            </h3>

            {applications.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No activity recorded for this date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app, index) => {
                  const timePercent = total_time_minutes > 0 
                    ? (app.time_minutes / total_time_minutes) * 100 
                    : 0;
                  
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow bg-white"
                    >
                      {/* App Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 rounded-lg p-3">
                            <Monitor className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-bold text-lg text-gray-800">{app.application}</p>
                            {app.url && (
                              <div className="flex items-center gap-1 mt-1">
                                <Globe className="w-4 h-4 text-blue-500" />
                                <p className="text-sm text-blue-600">{app.url}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-800">
                            {Math.floor(app.time_minutes / 60)}h {app.time_minutes % 60}m
                          </p>
                          <p className="text-sm text-gray-500 font-medium">
                            {timePercent.toFixed(1)}% of time
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${timePercent}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 bg-green-50 rounded-lg p-3">
                          <Mouse className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-600">Mouse</p>
                            <p className="text-lg font-bold text-gray-800">
                              {app.mouse_movements.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-purple-50 rounded-lg p-3">
                          <Keyboard className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-600">Keyboard</p>
                            <p className="text-lg font-bold text-gray-800">
                              {app.key_presses.toLocaleString()}
                            </p>
                          </div>
                        </div>
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