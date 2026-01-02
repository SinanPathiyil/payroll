import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";
import "../../styles/ba-modal.css";

export default function MeetingDetailsModal({
  meeting,
  onClose,
  getMeetingTypeLabel,
  getMeetingTypeColor,
  formatDateTime,
  getStatusIcon,
}) {
  if (!meeting) return null;

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div
        className="ba-modal-container ba-modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Calendar className="w-6 h-6" />
            <h2 className="ba-modal-title">Meeting Details</h2>
          </div>
          <button className="ba-modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="ba-modal-body">
          <div className="ba-meeting-details">
            {/* Status Banner */}
            <div
              className={`ba-meeting-details-banner banner-${meeting.status}`}
            >
              {getStatusIcon(meeting.status)}
              <span>{meeting.status.toUpperCase()}</span>
            </div>

            {/* Title & Type */}
            <div className="ba-meeting-details-header">
              <h3 className="ba-meeting-details-title">
                {getMeetingTypeLabel(meeting.meeting_type)} -{" "}
                {meeting.project_name}
              </h3>
              <span
                className={`ba-meeting-type-badge badge-${getMeetingTypeColor(meeting.meeting_type)}`}
              >
                {getMeetingTypeLabel(meeting.meeting_type)}
              </span>
            </div>

            {/* Details Grid */}
            <div className="ba-meeting-details-grid">
              <div className="ba-meeting-detail-item">
                <p className="ba-meeting-detail-label">Project</p>
                <p className="ba-meeting-detail-value">
                  {meeting.project_name}
                </p>
              </div>
              <div className="ba-meeting-detail-item">
                <p className="ba-meeting-detail-label">Client</p>
                <p className="ba-meeting-detail-value">{meeting.client_name}</p>
              </div>
              <div className="ba-meeting-detail-item">
                <p className="ba-meeting-detail-label">Date & Time</p>
                <p className="ba-meeting-detail-value">
                  {formatDateTime(meeting.scheduled_at)}
                </p>
              </div>
              <div className="ba-meeting-detail-item">
                <p className="ba-meeting-detail-label">Duration</p>
                <p className="ba-meeting-detail-value">
                  {meeting.duration_minutes} minutes
                </p>
              </div>
              <div className="ba-meeting-detail-item">
                <p className="ba-meeting-detail-label">Location</p>
                <p className="ba-meeting-detail-value">{meeting.location}</p>
              </div>
              {meeting.milestone_name && (
                <div className="ba-meeting-detail-item">
                  <p className="ba-meeting-detail-label">Milestone</p>
                  <p className="ba-meeting-detail-value">
                    {meeting.milestone_name}
                  </p>
                </div>
              )}
            </div>

            {/* Meeting Link */}
            {meeting.meeting_link && (
              <div className="ba-meeting-details-link">
                <p className="ba-meeting-details-link-label">Meeting Link</p>
                <a
                  href={meeting.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ba-meeting-details-link-url"
                >
                  {meeting.meeting_link}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* Attendees - NEW STYLE */}
            {meeting.attendees && meeting.attendees.length > 0 && (
              <div className="ba-meeting-details-section">
                <h4 className="ba-meeting-details-section-title">
                  <Users className="w-4 h-4" />
                  Attendees ({meeting.attendees.length})
                </h4>

                {meeting.attendees.map((attendee, index) => (
                  <div key={index} className="ba-contact-item">
                    <div className="ba-contact-item-header">
                      <h4 className="ba-contact-item-title">
                        {attendee.name}
                        <span className="ba-badge ba-badge-primary">
                          {attendee.role}
                        </span>
                      </h4>
                    </div>

                    <div className="ba-form-grid">
                      <div className="ba-form-group">
                        <label className="ba-form-label">Email</label>
                        <p
                          style={{
                            fontSize: "0.95rem",
                            color: "rgba(11, 11, 13, 0.8)",
                          }}
                        >
                          {attendee.email}
                        </p>
                      </div>

                      <div className="ba-form-group">
                        <label className="ba-form-label">Attendance</label>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {attendee.attended ? (
                            <>
                              <CheckCircle
                                className="w-4 h-4"
                                style={{ color: "rgba(0, 200, 83, 0.9)" }}
                              />
                              <span
                                style={{
                                  color: "rgba(0, 200, 83, 0.9)",
                                  fontWeight: 600,
                                }}
                              >
                                Attended
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle
                                className="w-4 h-4"
                                style={{ color: "rgba(220, 38, 38, 0.9)" }}
                              />
                              <span
                                style={{
                                  color: "rgba(220, 38, 38, 0.9)",
                                  fontWeight: 600,
                                }}
                              >
                                Not Attended
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Agenda - NEW STYLE */}
            {meeting.agenda && meeting.agenda.length > 0 && (
              <div className="ba-meeting-details-section">
                <h4 className="ba-meeting-details-section-title">
                  <FileText className="w-4 h-4" />
                  Agenda
                </h4>

                {meeting.agenda.map((item, index) => (
                  <div key={index} className="ba-contact-item">
                    <div className="ba-contact-item-header">
                      <h4 className="ba-contact-item-title">
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "24px",
                            height: "24px",
                            background: "rgba(11, 11, 13, 0.1)",
                            borderRadius: "50%",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            marginRight: "8px",
                          }}
                        >
                          {index + 1}
                        </span>
                        Agenda Item {index + 1}
                      </h4>
                    </div>

                    <div className="ba-form-group">
                      <p
                        style={{
                          fontSize: "0.95rem",
                          color: "rgba(11, 11, 13, 0.8)",
                          lineHeight: 1.6,
                        }}
                      >
                        {item.item}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes - Only show if exists */}
            {meeting.notes && (
              <div className="ba-meeting-details-section">
                <h4 className="ba-meeting-details-section-title">Notes</h4>
                <p className="ba-meeting-details-notes">{meeting.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="ba-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
