import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import ScheduleMeetingModal from "../components/ba/ScheduleMeetingModal";
import MeetingDetailsModal from "../components/ba/MeetingDetailsModal";
import EditMeetingModal from "../components/ba/EditMeetingModal";
import DeleteMeetingModal from "../components/ba/DeleteMeetingModal";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Clock,
  Video,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  getMeetings,
  getMeeting,
  scheduleMeeting,
  updateMeeting,
  completeMeeting,
  cancelMeeting,
} from "../services/api";

export default function BAMeetings() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'calendar'
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [meetingToEdit, setMeetingToEdit] = useState(null);
  const [meetingToDelete, setMeetingToDelete] = useState(null);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);

      // Real API call
      const response = await getMeetings();
      setMeetings(response.data);

      setLoading(false);
    } catch (error) {
      console.error("Failed to load meetings:", error);
      setLoading(false);
    }
  };

  const loadMeetingDetails = async (meetingId) => {
    try {
      const response = await getMeeting(meetingId);
      setSelectedMeeting(response.data);
    } catch (error) {
      console.error("Failed to load meeting details:", error);
    }
  };

  const filteredMeetings = meetings.filter((meeting) => {
    const matchesSearch =
      (meeting.project_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (meeting.client_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getMeetingTypeLabel(meeting.meeting_type)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || meeting.status === filterStatus;
    const matchesType =
      filterType === "all" || meeting.meeting_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const upcomingMeetings = meetings
    .filter((m) => {
      const meetingDate = new Date(m.scheduled_at);
      return m.status === "scheduled" && meetingDate > new Date();
    })
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

  const stats = {
    total: meetings.length,
    upcoming: upcomingMeetings.length,
    today: meetings.filter((m) => {
      const meetingDate = new Date(m.scheduled_at);
      const today = new Date();
      return (
        m.status === "scheduled" &&
        meetingDate.getDate() === today.getDate() &&
        meetingDate.getMonth() === today.getMonth() &&
        meetingDate.getFullYear() === today.getFullYear()
      );
    }).length,
    completed: meetings.filter((m) => m.status === "completed").length,
    cancelled: meetings.filter((m) => m.status === "cancelled").length,
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

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
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

  const getMeetingTypeLabel = (type) => {
    const labels = {
      kickoff: "Kickoff",
      milestone_review: "Milestone Review",
      status_update: "Status Update",
      requirement_discussion: "Requirements",
      final_review: "Final Review",
    };
    return labels[type] || type;
  };

  const getMeetingTypeColor = (type) => {
    const colors = {
      kickoff: "info",
      milestone_review: "success",
      status_update: "warning",
      requirement_discussion: "info",
      final_review: "success",
    };
    return colors[type] || "info";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "scheduled":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const isUpcoming = (meeting) => {
    return (
      meeting.status === "scheduled" &&
      new Date(meeting.scheduled_at) > new Date()
    );
  };

  const isPast = (meeting) => {
    return new Date(meeting.scheduled_at) < new Date();
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Meetings...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ba-meetings">
        {/* Header */}
        <div className="ba-page-header">
          <div>
            <h1 className="ba-page-title">Meeting Scheduler</h1>
            <p className="ba-page-subtitle">
              Schedule and manage client meetings
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="ba-meetings-stats">
          <div className="ba-meeting-stat-card">
            <Calendar className="ba-meeting-stat-icon" />
            <div>
              <p className="ba-meeting-stat-value">{stats.total}</p>
              <p className="ba-meeting-stat-label">Total Meetings</p>
            </div>
          </div>
          <div className="ba-meeting-stat-card stat-warning">
            <Clock className="ba-meeting-stat-icon" />
            <div>
              <p className="ba-meeting-stat-value">{stats.upcoming}</p>
              <p className="ba-meeting-stat-label">Upcoming</p>
            </div>
          </div>
          <div className="ba-meeting-stat-card stat-info">
            <AlertCircle className="ba-meeting-stat-icon" />
            <div>
              <p className="ba-meeting-stat-value">{stats.today}</p>
              <p className="ba-meeting-stat-label">Today</p>
            </div>
          </div>
          <div className="ba-meeting-stat-card stat-success">
            <CheckCircle className="ba-meeting-stat-icon" />
            <div>
              <p className="ba-meeting-stat-value">{stats.completed}</p>
              <p className="ba-meeting-stat-label">Completed</p>
            </div>
          </div>
        </div>

        {/* Upcoming Meetings Alert */}
        {upcomingMeetings.length > 0 && (
          <div className="ba-meetings-upcoming-alert">
            <AlertCircle className="w-5 h-5" />
            <div className="ba-meetings-upcoming-content">
              <p className="ba-meetings-upcoming-title">Next Meeting</p>
              <p className="ba-meetings-upcoming-info">
                <strong>
                  {getMeetingTypeLabel(upcomingMeetings[0].meeting_type)} -{" "}
                  {upcomingMeetings[0].project_name}
                </strong>{" "}
                with {upcomingMeetings[0].client_name} at{" "}
                {formatDateTime(upcomingMeetings[0].scheduled_at)}
              </p>
            </div>
            {upcomingMeetings[0].meeting_link && (
              <a
                href={upcomingMeetings[0].meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="ba-meetings-upcoming-join"
              >
                <Video className="w-4 h-4" />
                <span>Join</span>
              </a>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="ba-meetings-filters">
          <div className="ba-search-box">
            <Search className="ba-search-icon" />
            <input
              type="text"
              placeholder="Search meetings by title, project, or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ba-search-input"
            />
          </div>
          <div className="ba-filter-group">
            <Filter className="w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="ba-filter-select"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="ba-filter-group">
            <FileText className="w-4 h-4" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="ba-filter-select"
            >
              <option value="all">All Types</option>
              <option value="kickoff">Kickoff</option>
              <option value="milestone_review">Milestone Review</option>
              <option value="status_update">Status Update</option>
              <option value="requirement_discussion">Requirements</option>
              <option value="final_review">Final Review</option>
            </select>
          </div>
        </div>

        {/* Meetings List */}
        {filteredMeetings.length === 0 ? (
          <div className="ba-empty-state">
            <Calendar className="ba-empty-icon" />
            <p className="ba-empty-text">No meetings found</p>
            <p className="ba-empty-hint">
              {searchTerm || filterStatus !== "all" || filterType !== "all"
                ? "Try adjusting your search or filters"
                : "Schedule your first meeting to get started"}
            </p>
            {!searchTerm && filterStatus === "all" && filterType === "all" && (
              <button
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Schedule First Meeting</span>
              </button>
            )}
          </div>
        ) : (
          <div className="ba-meetings-list">
            {filteredMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className={`ba-meeting-card ${meeting.status === "cancelled" ? "cancelled" : ""} ${isUpcoming(meeting) ? "upcoming" : ""}`}
              >
                {/* Card Header */}
                <div className="ba-meeting-card-header">
                  <div className="ba-meeting-header-left">
                    <div className="ba-meeting-icon">
                      {meeting.meeting_link ? (
                        <Video className="w-5 h-5" />
                      ) : (
                        <MapPin className="w-5 h-5" />
                      )}
                    </div>
                    <div className="ba-meeting-header-info">
                      <h3 className="ba-meeting-title">
                        {getMeetingTypeLabel(meeting.meeting_type)} -{" "}
                        {meeting.project_name}
                      </h3>
                      <div className="ba-meeting-meta">
                        <span className="ba-meeting-project">
                          {meeting.project_name}
                        </span>
                        <span className="ba-meeting-separator">•</span>
                        <span className="ba-meeting-client">
                          {meeting.client_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ba-meeting-header-right">
                    <span
                      className={`status-chip ${meeting.status === "completed" ? "success" : meeting.status === "cancelled" ? "danger" : "warning"}`}
                    >
                      {getStatusIcon(meeting.status)}
                      <span>{meeting.status}</span>
                    </span>
                    <span
                      className={`ba-meeting-type-badge badge-${getMeetingTypeColor(meeting.meeting_type)}`}
                    >
                      {getMeetingTypeLabel(meeting.meeting_type)}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="ba-meeting-card-body">
                  {/* Date & Time */}
                  <div className="ba-meeting-datetime">
                    <div className="ba-meeting-datetime-item">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(meeting.scheduled_at)}</span>
                    </div>
                    <div className="ba-meeting-datetime-item">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(meeting.scheduled_at)} (
                        {meeting.duration_minutes} mins)
                      </span>
                    </div>
                    <div className="ba-meeting-datetime-item">
                      {meeting.meeting_link ? (
                        <Video className="w-4 h-4" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                      <span>{meeting.location}</span>
                    </div>
                  </div>

                  {/* Notes - Only show if exists */}
                  {meeting.notes && (
                    <div className="ba-meeting-notes">
                      <p className="ba-meeting-notes-label">Notes:</p>
                      <p className="ba-meeting-notes-text">{meeting.notes}</p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="ba-meeting-card-footer">
                  <div className="ba-meeting-footer-info">
                    {/* Removed "Created by" - Only BA creates meetings */}
                  </div>
                  <div className="ba-meeting-footer-actions">
                    {meeting.meeting_link &&
                      meeting.status === "scheduled" &&
                      isUpcoming(meeting) && (
                        <a
                          href={meeting.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-success btn-sm"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join Meeting</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => loadMeetingDetails(meeting.id)}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Details</span>
                    </button>
                    {meeting.status === "scheduled" && isUpcoming(meeting) && (
                      <>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setMeetingToEdit(meeting);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setMeetingToDelete(meeting);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Schedule Meeting Modal */}
        <ScheduleMeetingModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadMeetings}
        />
        {/* Meeting Details Modal */}
        {selectedMeeting && (
          <MeetingDetailsModal
            meeting={selectedMeeting}
            onClose={() => setSelectedMeeting(null)}
            getMeetingTypeLabel={getMeetingTypeLabel}
            getMeetingTypeColor={getMeetingTypeColor}
            formatDateTime={formatDateTime}
            getStatusIcon={getStatusIcon}
          />
        )}
        {/* Edit Meeting Modal */}
        <EditMeetingModal
          show={showEditModal}
          meeting={meetingToEdit}
          onClose={() => {
            setShowEditModal(false);
            setMeetingToEdit(null);
          }}
          onSuccess={() => {
            loadMeetings();
            setShowEditModal(false);
            setMeetingToEdit(null);
          }}
        />

        {/* Delete Meeting Modal */}
        {meetingToDelete && (
          <DeleteMeetingModal
            meeting={meetingToDelete}
            onClose={() => {
              setShowDeleteModal(false);
              setMeetingToDelete(null);
            }}
            onSuccess={() => {
              loadMeetings();
              setShowDeleteModal(false);
              setMeetingToDelete(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}
