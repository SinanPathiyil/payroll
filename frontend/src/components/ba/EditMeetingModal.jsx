import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  Edit,
} from "lucide-react";
import { updateMeeting, getBAProjects } from "../../services/api";

export default function EditMeetingModal({ show, meeting, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [formData, setFormData] = useState({
    scheduled_at: "",
    duration_minutes: 60,
    meeting_link: "",
    location: "",
    attendees: [],
    agenda: [],
  });

  const [locationType, setLocationType] = useState("online");
  const [errors, setErrors] = useState({});

  const meetingTypes = [
    { value: "requirement_discussion", label: "Requirements Discussion" },
    { value: "milestone_review", label: "Milestone Review" },
    { value: "final_review", label: "Final Review" },
    { value: "general", label: "General Meeting" },
  ];

  useEffect(() => {
    if (show && meeting) {
      loadProjects();
      // Pre-fill form with meeting data
      const meetingDate = new Date(meeting.scheduled_at);
      const formattedDate = meetingDate.toISOString().slice(0, 16);
      
      setFormData({
        scheduled_at: formattedDate,
        duration_minutes: meeting.duration_minutes,
        meeting_link: meeting.meeting_link || "",
        location: meeting.location || "",
        attendees: meeting.attendees && meeting.attendees.length > 0 
          ? meeting.attendees 
          : [{ name: "", email: "", role: "" }],
        agenda: meeting.agenda && meeting.agenda.length > 0 
          ? meeting.agenda 
          : [{ item: "" }],
      });

      setLocationType(meeting.meeting_link ? "online" : "in-person");
    }
  }, [show, meeting]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await getBAProjects({ status: "active" });
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleLocationTypeChange = (type) => {
    setLocationType(type);
    if (type === "online") {
      setFormData((prev) => ({ ...prev, location: "Online Meeting" }));
    } else {
      setFormData((prev) => ({ ...prev, meeting_link: "", location: "" }));
    }
  };

  const addAttendee = () => {
    setFormData((prev) => ({
      ...prev,
      attendees: [...prev.attendees, { name: "", email: "", role: "" }],
    }));
  };

  const removeAttendee = (index) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== index),
    }));
  };

  const updateAttendee = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.map((att, i) =>
        i === index ? { ...att, [field]: value } : att
      ),
    }));
  };

  const addAgendaItem = () => {
    setFormData((prev) => ({
      ...prev,
      agenda: [...prev.agenda, { item: "" }],
    }));
  };

  const removeAgendaItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index),
    }));
  };

  const updateAgendaItem = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      agenda: prev.agenda.map((item, i) =>
        i === index ? { item: value } : item
      ),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.scheduled_at) {
      newErrors.scheduled_at = "Please select date and time";
    } else {
      const meetingDate = new Date(formData.scheduled_at);
      if (meetingDate < new Date()) {
        newErrors.scheduled_at = "Meeting date must be in the future";
      }
    }

    if (locationType === "online" && !formData.meeting_link) {
      newErrors.meeting_link = "Please provide a meeting link";
    }

    if (locationType === "in-person" && !formData.location) {
      newErrors.location = "Please provide a location";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const validAttendees = formData.attendees.filter(
        (att) => att.name && att.email && att.role
      );
      const validAgenda = formData.agenda.filter((item) => item.item.trim());

      const updateData = {
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
        duration_minutes: parseInt(formData.duration_minutes),
        meeting_link: locationType === "online" ? formData.meeting_link : null,
        location: locationType === "in-person" ? formData.location : "Online Meeting",
        attendees: validAttendees,
        agenda: validAgenda,
      };

      await updateMeeting(meeting.id, updateData);

      onSuccess?.();
      onClose();
      setErrors({});
    } catch (error) {
      console.error("Failed to update meeting:", error);
      setErrors({
        submit:
          error.response?.data?.detail ||
          "Failed to update meeting. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!show || !meeting) return null;

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div
        className="ba-modal-container ba-modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Edit className="w-5 h-5" />
            <h2 className="ba-modal-title">Edit Meeting</h2>
          </div>
          <button className="ba-modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ba-modal-body">
            {errors.submit && (
              <div className="ba-alert ba-alert-error">
                <AlertCircle className="w-5 h-5" />
                <span>{errors.submit}</span>
              </div>
            )}

            <div className="ba-form-section">
              {/* Meeting Info Display */}
              <div className="ba-alert ba-alert-warning">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <strong>Project:</strong> {meeting.project_name} | <strong>Client:</strong> {meeting.client_name}
                </div>
              </div>

              {/* Date & Time + Duration */}
              <div className="ba-form-grid">
                <div className="ba-form-group">
                  <label className="ba-form-label">
                    <Calendar className="w-4 h-4" />
                    Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className={`ba-form-input ${errors.scheduled_at ? "error" : ""}`}
                    value={formData.scheduled_at}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduled_at: e.target.value,
                      }))
                    }
                    min={getMinDateTime()}
                    disabled={loading}
                  />
                  {errors.scheduled_at && (
                    <span className="ba-form-error">{errors.scheduled_at}</span>
                  )}
                </div>

                <div className="ba-form-group">
                  <label className="ba-form-label">
                    <Clock className="w-4 h-4" />
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="ba-form-input"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration_minutes: e.target.value,
                      }))
                    }
                    min="15"
                    step="15"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Location Type */}
              <div className="ba-form-group">
                <label className="ba-form-label">Location Type</label>
                <div className="btn-group">
                  <button
                    type="button"
                    className={`btn ${locationType === "online" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => handleLocationTypeChange("online")}
                    disabled={loading}
                  >
                    <Video className="w-4 h-4" />
                    <span>Online</span>
                  </button>
                  <button
                    type="button"
                    className={`btn ${locationType === "in-person" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => handleLocationTypeChange("in-person")}
                    disabled={loading}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>In-Person</span>
                  </button>
                </div>
              </div>

              {/* Meeting Link or Location */}
              {locationType === "online" ? (
                <div className="ba-form-group">
                  <label className="ba-form-label">
                    <Video className="w-4 h-4" />
                    Meeting Link <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    className={`ba-form-input ${errors.meeting_link ? "error" : ""}`}
                    placeholder="https://zoom.us/j/123456789"
                    value={formData.meeting_link}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        meeting_link: e.target.value,
                      }))
                    }
                    disabled={loading}
                  />
                  {errors.meeting_link && (
                    <span className="ba-form-error">{errors.meeting_link}</span>
                  )}
                </div>
              ) : (
                <div className="ba-form-group">
                  <label className="ba-form-label">
                    <MapPin className="w-4 h-4" />
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`ba-form-input ${errors.location ? "error" : ""}`}
                    placeholder="Office address or meeting room"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    disabled={loading}
                  />
                  {errors.location && (
                    <span className="ba-form-error">{errors.location}</span>
                  )}
                </div>
              )}
            </div>

            {/* Attendees Section */}
            <div className="ba-form-section">
              <div className="ba-form-section-header">
                <h3 className="ba-form-section-title">
                  <Users className="w-5 h-5" />
                  Attendees
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addAttendee}
                  disabled={loading}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Attendee</span>
                </button>
              </div>

              {formData.attendees.map((attendee, index) => (
                <div key={index} className="ba-contact-item">
                  <div className="ba-contact-item-header">
                    <h4 className="ba-contact-item-title">Attendee {index + 1}</h4>
                    {formData.attendees.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeAttendee(index)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="ba-form-grid ba-form-grid-3">
                    <div className="ba-form-group">
                      <label className="ba-form-label">Name</label>
                      <input
                        type="text"
                        className="ba-form-input"
                        placeholder="Attendee name"
                        value={attendee.name}
                        onChange={(e) =>
                          updateAttendee(index, "name", e.target.value)
                        }
                        disabled={loading}
                      />
                    </div>
                    <div className="ba-form-group">
                      <label className="ba-form-label">Email</label>
                      <input
                        type="email"
                        className="ba-form-input"
                        placeholder="email@example.com"
                        value={attendee.email}
                        onChange={(e) =>
                          updateAttendee(index, "email", e.target.value)
                        }
                        disabled={loading}
                      />
                    </div>
                    <div className="ba-form-group">
                      <label className="ba-form-label">Role</label>
                      <input
                        type="text"
                        className="ba-form-input"
                        placeholder="e.g., Project Manager"
                        value={attendee.role}
                        onChange={(e) =>
                          updateAttendee(index, "role", e.target.value)
                        }
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Agenda Section */}
            <div className="ba-form-section">
              <div className="ba-form-section-header">
                <h3 className="ba-form-section-title">
                  <FileText className="w-5 h-5" />
                  Agenda (Optional)
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addAgendaItem}
                  disabled={loading}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Agenda Item</span>
                </button>
              </div>

              {formData.agenda.map((item, index) => (
                <div key={index} className="ba-contact-item">
                  <div className="ba-contact-item-header">
                    <h4 className="ba-contact-item-title">
                      Agenda Item {index + 1}
                    </h4>
                    {formData.agenda.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeAgendaItem(index)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="ba-form-group">
                    <input
                      type="text"
                      className="ba-form-input"
                      placeholder={`Describe agenda item ${index + 1}`}
                      value={item.item}
                      onChange={(e) => updateAgendaItem(index, e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ba-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner spinner-sm"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  <span>Update Meeting</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}