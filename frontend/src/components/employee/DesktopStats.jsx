import { useState, useEffect } from 'react';
import { Activity, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { isElectron, electronAPI } from '../../utils/electron';

export default function DesktopStats() {
  const [stats, setStats] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isElectron()) return;

    fetchStats();

    electronAPI.onProductivityUpdate((data) => {
      fetchStats();
    });

    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    const data = await electronAPI.getStats();
    setStats(data);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    await electronAPI.syncNow();
    await fetchStats();
    setSyncing(false);
  };

  if (!isElectron() || !stats) return null;

  return (
    <div className="desktop-stats-card">
      <h3 className="desktop-stats-title">Desktop Agent Stats</h3>
      
      <div className="desktop-stats-grid">
        <div className="desktop-stats-item">
          <div className="desktop-stats-item-header">
            <TrendingUp className="w-5 h-5" />
            <span>Productivity</span>
          </div>
          <p className="desktop-stats-value">{stats.current_score}</p>
        </div>

        <div className="desktop-stats-item">
          <div className="desktop-stats-item-header">
            <Activity className="w-5 h-5" />
            <span>Sessions</span>
          </div>
          <p className="desktop-stats-value">{stats.sessions_sent}</p>
        </div>

        <div className="desktop-stats-item">
          <div className="desktop-stats-item-header">
            <Clock className="w-5 h-5" />
            <span>Total Time</span>
          </div>
          <p className="desktop-stats-value">
            {(stats.total_time / 3600).toFixed(1)}h
          </p>
        </div>
      </div>

      <div className="desktop-stats-activity">
        <p className="desktop-stats-activity-label">Current Activity:</p>
        <p className="desktop-stats-activity-app">
          {stats.current_activity?.application || 'None'}
        </p>
        <p className="desktop-stats-activity-window">
          {stats.current_activity?.window_title || ''}
        </p>
      </div>

      <div className="desktop-stats-footer">
        <span className="desktop-stats-sync-time">
          Last sync: {stats.last_sync ? new Date(stats.last_sync).toLocaleTimeString() : 'Never'}
        </span>
        <button
          onClick={handleSyncNow}
          disabled={syncing}
          className="desktop-stats-sync-btn"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    </div>
  );
}