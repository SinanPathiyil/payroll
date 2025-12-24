import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/common/Layout";
import {
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  TrendingUp,
  Clock,
  Plus,
  ArrowUpRight,
  Activity,
  CheckCircle,
  AlertCircle,
  Phone,
  BarChart3,
} from "lucide-react";

import { getBADashboardSummary } from "../services/api";

export default function BADashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getBADashboardSummary();
      console.log("📊 BA Dashboard Data:", response.data);
      setDashboardData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (!dashboardData) {
    return (
      <Layout>
        <div className="layout-loading">
          <p className="layout-loading-text">No data available</p>
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
            <h1 className="ba-dashboard-title">Business Analyst Dashboard</h1>
            <p className="ba-dashboard-subtitle">
              Welcome back, <strong>{user?.full_name}</strong>
            </p>
          </div>
          <div className="ba-dashboard-actions">
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/ba/meetings")}
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Meeting</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/ba/clients")}
            >
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="ba-stats-grid">
          {/* Clients Card */}
          <div className="ba-stat-card" onClick={() => navigate("/ba/clients")}>
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Clients</p>
                <p className="ba-stat-value">{dashboardData.clients.total}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge success">
                    {dashboardData.clients.active} active
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Users className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>View all clients</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Projects Card */}
          <div
            className="ba-stat-card"
            onClick={() => navigate("/ba/projects")}
          >
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Projects</p>
                <p className="ba-stat-value">{dashboardData.projects.total}</p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge success">
                    {dashboardData.projects.active} active
                  </span>
                  <span className="ba-stat-badge warning">
                    {dashboardData.projects.pending_approval} pending
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-purple">
                <Briefcase className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>Manage projects</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Revenue Card */}
          <div
            className="ba-stat-card"
            onClick={() => navigate("/ba/payments")}
          >
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Revenue</p>
                <p className="ba-stat-value">
                  {formatCurrency(dashboardData.financials.total_revenue)}
                </p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge success">
                    {formatCurrency(dashboardData.financials.this_month_revenue)} this month
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>
                {formatCurrency(dashboardData.financials.pending_payments)} pending
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Meetings Card */}
          <div
            className="ba-stat-card"
            onClick={() => navigate("/ba/meetings")}
          >
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Upcoming Meetings</p>
                <p className="ba-stat-value">
                  {dashboardData.meetings.upcoming}
                </p>
                <p className="ba-stat-hint">
                  <span className="ba-stat-badge info">
                    {dashboardData.recent_activity.todays_meetings.length} today
                  </span>
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
            <div className="ba-stat-footer">
              <span>View calendar</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="ba-content-grid">
          {/* Recent Activity */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Activity className="w-5 h-5" />
                <span>Recent Projects</span>
              </div>
            </div>
            <div className="ba-card-body">
              {!dashboardData.recent_activity.projects || 
               dashboardData.recent_activity.projects.length === 0 ? (
                <div className="ba-empty-state">
                  <Clock className="ba-empty-icon" />
                  <p>No recent projects</p>
                </div>
              ) : (
                <div className="ba-activity-list">
                  {dashboardData.recent_activity.projects.map((project) => (
                    <div key={project.id} className="ba-activity-item">
                      <div className="ba-activity-indicator" />
                      <div className="ba-activity-content">
                        <p className="ba-activity-message">
                          <strong>{project.project_name}</strong> - {project.client_name}
                        </p>
                        <p className="ba-activity-time">
                          Status: {project.status} | Progress: {project.progress_percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Today's Meetings */}
          <div className="ba-card">
            <div className="ba-card-header">
              <div className="ba-card-title">
                <Calendar className="w-5 h-5" />
                <span>Today's Meetings</span>
              </div>
            </div>
            <div className="ba-card-body">
              {!dashboardData.recent_activity.todays_meetings || 
               dashboardData.recent_activity.todays_meetings.length === 0 ? (
                <div className="ba-empty-state">
                  <Calendar className="ba-empty-icon" />
                  <p>No meetings scheduled today</p>
                </div>
              ) : (
                <div className="ba-activity-list">
                  {dashboardData.recent_activity.todays_meetings.map((meeting) => (
                    <div key={meeting.id} className="ba-activity-item">
                      <div className="ba-activity-indicator" />
                      <div className="ba-activity-content">
                        <p className="ba-activity-message">
                          <strong>{meeting.project_name}</strong> - {meeting.client_name}
                        </p>
                        <p className="ba-activity-time">
                          {meeting.meeting_type} | {new Date(meeting.scheduled_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <TrendingUp className="w-5 h-5" />
              <span>Quick Actions</span>
            </div>
          </div>
          <div className="ba-card-body">
            <div className="ba-quick-actions">
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate("/ba/clients")}
              >
                <Users className="w-5 h-5" />
                <span>Add New Client</span>
              </button>
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate("/ba/projects")}
              >
                <Briefcase className="w-5 h-5" />
                <span>Create Project</span>
              </button>
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate("/ba/payments")}
              >
                <DollarSign className="w-5 h-5" />
                <span>Record Payment</span>
              </button>
              <button
                className="ba-quick-action-btn"
                onClick={() => navigate("/ba/meetings")}
              >
                <Calendar className="w-5 h-5" />
                <span>Schedule Meeting</span>
              </button>
            </div>
          </div>
        </div>

        {/* Milestones & Financial Overview */}
        <div className="ba-card ba-performance-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <BarChart3 className="w-5 h-5" />
              <span>Milestones & Financials</span>
            </div>
          </div>
          <div className="ba-card-body">
            <div className="ba-performance-grid">
              <div className="ba-performance-item">
                <div className="ba-performance-label">Collection Rate</div>
                <div className="ba-performance-value">
                  {dashboardData.financials.collection_rate.toFixed(1)}%
                </div>
                <div className="ba-performance-bar">
                  <div
                    className="ba-performance-fill"
                    style={{ width: `${dashboardData.financials.collection_rate}%` }}
                  ></div>
                </div>
              </div>
              <div className="ba-performance-item">
                <div className="ba-performance-label">Milestones Awaiting Payment</div>
                <div className="ba-performance-value">
                  {dashboardData.milestones.awaiting_payment}
                </div>
              </div>
              <div className="ba-performance-item">
                <div className="ba-performance-label">Milestones In Progress</div>
                <div className="ba-performance-value">
                  {dashboardData.milestones.in_progress}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}