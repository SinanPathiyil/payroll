// frontend/src/components/employee/DesktopStats.jsx

import React, { useState, useEffect } from 'react';
import { Activity, Clock, TrendingUp } from 'lucide-react';
import { isElectron, electronAPI } from '../../utils/electron';

export default function DesktopStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!isElectron()) return;

    // Fetch stats initially
    fetchStats();

    // Listen for productivity updates
    electronAPI.onProductivityUpdate((data) => {
      console.log('Productivity update:', data);
      fetchStats();
    });

    // Update every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    const data = await electronAPI.getStats();
    setStats(data);
  };

  const handleSyncNow = async () => {
    await electronAPI.syncNow();
    fetchStats();
  };

  if (!isElectron() || !stats) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
      <h3 className="text-xl font-bold mb-4">Desktop Agent Stats</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">Productivity</span>
          </div>
          <p className="text-3xl font-bold">{stats.current_score}</p>
        </div>

        <div className="bg-white/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-5 h-5" />
            <span className="text-sm">Sessions</span>
          </div>
          <p className="text-3xl font-bold">{stats.sessions_sent}</p>
        </div>

        <div className="bg-white/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm">Total Time</span>
          </div>
          <p className="text-3xl font-bold">
            {(stats.total_time / 3600).toFixed(1)}h
          </p>
        </div>
      </div>

      <div className="bg-white/20 rounded-lg p-4 mb-4">
        <p className="text-sm mb-1">Current Activity:</p>
        <p className="font-semibold truncate">
          {stats.current_activity?.application || 'None'}
        </p>
        <p className="text-xs opacity-80 truncate">
          {stats.current_activity?.window_title || ''}
        </p>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span>
          Last sync: {stats.last_sync ? new Date(stats.last_sync).toLocaleTimeString() : 'Never'}
        </span>
        <button
          onClick={handleSyncNow}
          className="bg-white/30 hover:bg-white/40 px-4 py-2 rounded-lg"
        >
          Sync Now
        </button>
      </div>
    </div>
  );
}