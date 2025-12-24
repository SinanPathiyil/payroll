import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Layout from "../components/common/Layout";
import {
  Briefcase,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
  Target,
  Activity,
  Calendar,
  Plus,
  ArrowUpRight,
  Eye,
} from "lucide-react";

import { getTLDashboardSummary } from "../services/api";

export default function TLDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    projects: { total: 0, active: 0, pending_approval: 0, completed: 0 },
    tasks: { total: 0, in_progress: 0, completed: 0, overdue: 0 },
    team: { total_members: 0, active_today: 0 },
    milestones: { upcoming: 0, in_progress: 0, completed_this_month: 0 },
    pending_requirements: [],
    active_projects: [],
    team_members: [],
    recent_activities: [],
    alerts: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Real API call
      const response = await getTLDashboardSummary();
      setDashboardData(response.data);

      setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  return (
    <Layout>
      <div className="tl-dashboard">
        {/* Header */}
        <div className="tl-dashboard-header">
          <div>
            <h1 className="tl-dashboard-title">Team Lead Dashboard</h1>
            <p className="tl-dashboard-subtitle">
              Welcome back, <strong>{user?.full_name}</strong>
            </p>
          </div>
          <div className="tl-dashboard-actions">
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/tl/team")}
            >
              <Users className="w-4 h-4" />
              <span>Manage Team</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/tl/projects")}
            >
              <Briefcase className="w-4 h-4" />
              <span>View Projects</span>
            </button>
          </div>
        </div>

        {/* Alerts Section */}
        {dashboardData.alerts.length > 0 && (
          <div className="tl-alerts">
            {dashboardData.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`tl-alert tl-alert-${alert.type}`}
                onClick={() => navigate(alert.action)}
              >
                <AlertCircle className="tl-alert-icon" />
                <span className="tl-alert-message">{alert.message}</span>
                <ArrowUpRight className="tl-alert-arrow" />
              </div>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="tl-stats-grid">
          {/* Projects Card */}
          <div
            className="tl-stat-card"
            onClick={() => navigate("/tl/projects")}
          >
            <div className="tl-stat-content">
              <div className="tl-stat-info">
                <p className="tl-stat-label">Active Projects</p>
                <p className="tl-stat-value">{dashboardData.projects.active}</p>
                <p className="tl-stat-hint">
                  <span className="tl-stat-badge warning">
                    {dashboardData.projects.pending_approval} pending approval
                  </span>
                </p>
              </div>
              <div className="tl-stat-icon tl-stat-icon-blue">
                <Briefcase className="w-8 h-8" />
              </div>
            </div>
            <div className="tl-stat-footer">
              <span>View all projects</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Tasks Card */}
          <div className="tl-stat-card" onClick={() => navigate("/tl/tasks")}>
            <div className="tl-stat-content">
              <div className="tl-stat-info">
                <p className="tl-stat-label">Team Tasks</p>
                <p className="tl-stat-value">{dashboardData.tasks.total}</p>
                <p className="tl-stat-hint">
                  <span className="tl-stat-badge success">
                    {dashboardData.tasks.in_progress} in progress
                  </span>
                  {dashboardData.tasks.overdue > 0 && (
                    <span className="tl-stat-badge danger">
                      {dashboardData.tasks.overdue} overdue
                    </span>
                  )}
                </p>
              </div>
              <div className="tl-stat-icon tl-stat-icon-purple">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            <div className="tl-stat-footer">
              <span>Manage tasks</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Team Card */}
          <div className="tl-stat-card" onClick={() => navigate("/tl/team")}>
            <div className="tl-stat-content">
              <div className="tl-stat-info">
                <p className="tl-stat-label">Team Members</p>
                <p className="tl-stat-value">
                  {dashboardData.team.total_members}
                </p>
                <p className="tl-stat-hint">
                  <span className="tl-stat-badge success">
                    {dashboardData.team.active_today} active today
                  </span>
                </p>
              </div>
              <div className="tl-stat-icon tl-stat-icon-green">
                <Users className="w-8 h-8" />
              </div>
            </div>
            <div className="tl-stat-footer">
              <span>View team</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Milestones Card */}
          <div className="tl-stat-card">
            <div className="tl-stat-content">
              <div className="tl-stat-info">
                <p className="tl-stat-label">Milestones</p>
                <p className="tl-stat-value">
                  {dashboardData.milestones.upcoming}
                </p>
                <p className="tl-stat-hint">
                  <span className="tl-stat-badge info">
                    {dashboardData.milestones.in_progress} in progress
                  </span>
                </p>
              </div>
              <div className="tl-stat-icon tl-stat-icon-orange">
                <Target className="w-8 h-8" />
              </div>
            </div>
            <div className="tl-stat-footer">
              <span>Upcoming milestones</span>
            </div>
          </div>
        </div>

        {/* Pending Requirements Alert */}
        {dashboardData.pending_requirements.length > 0 && (
          <div className="tl-pending-requirements">
            <div className="tl-pending-header">
              <div className="tl-pending-title">
                <FileText className="w-5 h-5" />
                <span>
                  Pending Requirements Approval (
                  {dashboardData.pending_requirements.length})
                </span>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate("/tl/requirements")}
              >
                Review All
              </button>
            </div>
            <div className="tl-pending-list">
              {dashboardData.pending_requirements.map((req) => (
                <div key={req.id} className="tl-pending-item">
                  <div className="tl-pending-item-icon">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="tl-pending-item-content">
                    <p className="tl-pending-item-title">{req.document_name}</p>
                    <p className="tl-pending-item-meta">
                      <strong>{req.project_name}</strong> • {req.client_name}
                    </p>
                    <p className="tl-pending-item-time">
                      Uploaded {formatDateTime(req.uploaded_at)} by{" "}
                      {req.uploaded_by}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/tl/requirements?doc=${req.id}`)}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Review</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="tl-content-grid">
          {/* Active Projects */}
          <div className="tl-card">
            <div className="tl-card-header">
              <div className="tl-card-title">
                <Briefcase className="w-5 h-5" />
                <span>Active Projects</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate("/tl/projects")}
              >
                View All
              </button>
            </div>
            <div className="tl-card-body">
              {dashboardData.active_projects.length === 0 ? (
                <div className="tl-empty-state">
                  <Briefcase className="tl-empty-icon" />
                  <p>No active projects</p>
                </div>
              ) : (
                <div className="tl-projects-list">
                  {dashboardData.active_projects.map((project) => (
                    <div
                      key={project.id}
                      className="tl-project-item"
                      onClick={() => navigate(`/tl/projects/${project.id}`)}
                    >
                      <div className="tl-project-item-header">
                        <div>
                          <h4 className="tl-project-item-name">
                            {project.project_name}
                          </h4>
                          <p className="tl-project-item-client">
                            {project.client_name}
                          </p>
                        </div>
                        <span className="status-chip info">
                          {project.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="tl-project-item-body">
                        <div className="tl-project-progress">
                          <div className="tl-project-progress-header">
                            <span className="tl-project-progress-label">
                              Progress
                            </span>
                            <span className="tl-project-progress-value">
                              {project.progress}%
                            </span>
                          </div>
                          <div className="tl-project-progress-bar">
                            <div
                              className="tl-project-progress-fill"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="tl-project-item-meta">
                          <div className="tl-project-meta-item">
                            <Target className="w-4 h-4" />
                            <span>{project.current_milestone}</span>
                          </div>
                          <div className="tl-project-meta-item">
                            <Users className="w-4 h-4" />
                            <span>{project.team_size} members</span>
                          </div>
                          <div className="tl-project-meta-item">
                            <Calendar className="w-4 h-4" />
                            <span>Due {formatDate(project.due_date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Team Members */}
          <div className="tl-card">
            <div className="tl-card-header">
              <div className="tl-card-title">
                <Users className="w-5 h-5" />
                <span>Team Overview</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate("/tl/team")}
              >
                View All
              </button>
            </div>
            <div className="tl-card-body">
              <div className="tl-team-list">
                {dashboardData.team_members.map((member) => (
                  <div key={member.id} className="tl-team-item">
                    <div className="tl-team-item-avatar">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="tl-team-item-info">
                      <p className="tl-team-item-name">{member.name}</p>
                      <p className="tl-team-item-role">{member.role}</p>
                    </div>
                    <div className="tl-team-item-stats">
                      <span
                        className={`status-chip ${member.status === "active" ? "success" : "inactive"}`}
                      >
                        {member.status}
                      </span>
                      <p className="tl-team-item-tasks">
                        {member.tasks_assigned} active •{" "}
                        {member.tasks_completed} done
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="tl-card">
          <div className="tl-card-header">
            <div className="tl-card-title">
              <Activity className="w-5 h-5" />
              <span>Recent Activities</span>
            </div>
          </div>
          <div className="tl-card-body">
            {dashboardData.recent_activities.length === 0 ? (
              <div className="tl-empty-state">
                <Clock className="tl-empty-icon" />
                <p>No recent activities</p>
              </div>
            ) : (
              <div className="tl-activity-list">
                {dashboardData.recent_activities.map((activity) => (
                  <div key={activity.id} className="tl-activity-item">
                    <div className="tl-activity-indicator" />
                    <div className="tl-activity-content">
                      <p className="tl-activity-message">{activity.message}</p>
                      <p className="tl-activity-time">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
