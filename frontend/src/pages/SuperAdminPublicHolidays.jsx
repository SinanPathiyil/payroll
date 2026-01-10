import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Download,
  AlertCircle,
  Save,
  X,
} from "lucide-react";
import Layout from "../components/common/Layout";
import AddHolidayModal from "../components/sa/AddHolidayModal";
import axios from "axios";

export default function AdminPublicHolidays() {
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    country: "",
    is_optional: false,
    description: "",
  });
  const [importData, setImportData] = useState({
    country: "US",
    year: new Date().getFullYear(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Country list for import
  const countries = [
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "IN", name: "India" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "JP", name: "Japan" },
    { code: "CN", name: "China" },
  ];

  useEffect(() => {
    loadHolidays();
  }, [selectedYear]);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/leave/holidays?year=${selectedYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHolidays(response.data.holidays || []);
    } catch (error) {
      console.error("Failed to load holidays:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      if (editingHoliday) {
        // Update existing
        await axios.put(
          `${import.meta.env.VITE_API_URL}/admin/leave/holidays/${editingHoliday.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new
        await axios.post(
          `${import.meta.env.VITE_API_URL}/admin/leave/holidays`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setShowModal(false);
      setEditingHoliday(null);
      resetForm();
      loadHolidays();
    } catch (error) {
      console.error("Failed to save holiday:", error);
      setError(error.response?.data?.detail || "Failed to save holiday");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async () => {
    setError("");

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/leave/holidays/import`,
        importData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Successfully imported ${response.data.imported_count} holidays`);
      setShowImportModal(false);
      loadHolidays();
    } catch (error) {
      console.error("Failed to import holidays:", error);
      setError(error.response?.data?.detail || "Failed to import holidays");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date,
      country: holiday.country || "",
      is_optional: holiday.is_optional,
      description: holiday.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (holidayId) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/admin/leave/holidays/${holidayId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadHolidays();
    } catch (error) {
      console.error("Failed to delete holiday:", error);
      alert(error.response?.data?.detail || "Failed to delete holiday");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      date: "",
      country: "",
      is_optional: false,
      description: "",
    });
    setError("");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const groupHolidaysByMonth = () => {
    const grouped = {};
    holidays.forEach((holiday) => {
      const month = new Date(holiday.date).toLocaleDateString("en-US", {
        month: "long",
      });
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(holiday);
    });
    return grouped;
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Holidays...</p>
        </div>
      </Layout>
    );
  }

  const groupedHolidays = groupHolidaysByMonth();

  return (
    <Layout>
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div>
            <h1 className="ba-dashboard-title">Public Holidays Management</h1>
            <p className="ba-dashboard-subtitle">
              Configure public holidays for leave calculations
            </p>
          </div>
          <div className="ba-dashboard-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowImportModal(true)}
            >
              <Download className="w-4 h-4" />
              <span>Import Holidays</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingHoliday(null);
                resetForm();
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Holiday</span>
            </button>
          </div>
        </div>

        {/* Stats & Year Selector */}
        <div
          className="ba-stats-grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Holidays</p>
                <p className="ba-stat-value">{holidays.length}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Optional Holidays</p>
                <p className="ba-stat-value">
                  {holidays.filter((h) => h.is_optional).length}
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-purple">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Imported</p>
                <p className="ba-stat-value">
                  {holidays.filter((h) => h.imported).length}
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <Download className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Year Selector */}
        <div className="ba-card">
          <div className="ba-card-body">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                Select Year:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="ba-form-input"
                style={{ maxWidth: "200px" }}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - 1 + i
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Holidays List */}
        {Object.keys(groupedHolidays).length === 0 ? (
          <div className="ba-card">
            <div className="ba-card-body">
              <div className="ba-empty-state">
                <Calendar className="ba-empty-icon" />
                <p>No holidays configured for {selectedYear}</p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginTop: "0.5rem",
                  }}
                >
                  Add holidays manually or import from a country calendar
                </p>
              </div>
            </div>
          </div>
        ) : (
          Object.entries(groupedHolidays).map(([month, monthHolidays]) => (
            <div key={month} className="ba-card">
              <div className="ba-card-header">
                <div className="ba-card-title">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {month} {selectedYear}
                  </span>
                </div>
                <span className="ba-stat-badge info">
                  {monthHolidays.length}{" "}
                  {monthHolidays.length === 1 ? "holiday" : "holidays"}
                </span>
              </div>
              <div className="ba-card-body">
                <div style={{ display: "grid", gap: "1rem" }}>
                  {monthHolidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "1rem",
                        backgroundColor: "#f9fafb",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "1rem",
                              fontWeight: "600",
                              margin: 0,
                            }}
                          >
                            {holiday.name}
                          </h3>
                          {holiday.is_optional && (
                            <span
                              className="ba-stat-badge warning"
                              style={{ fontSize: "0.75rem" }}
                            >
                              Optional
                            </span>
                          )}
                          {holiday.imported && (
                            <span
                              className="ba-stat-badge success"
                              style={{ fontSize: "0.75rem" }}
                            >
                              Imported
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            margin: "0 0 0.25rem 0",
                          }}
                        >
                          {formatDate(holiday.date)}
                        </p>
                        {holiday.description && (
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "#6b7280",
                              margin: 0,
                            }}
                          >
                            {holiday.description}
                          </p>
                        )}
                        {holiday.country && (
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#9ca3af",
                              margin: "0.25rem 0 0 0",
                            }}
                          >
                            Country: {holiday.country}
                          </p>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => handleEdit(holiday)}
                          className="btn btn-secondary"
                          style={{ padding: "0.5rem" }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(holiday.id)}
                          className="btn"
                          style={{
                            padding: "0.5rem",
                            backgroundColor: "#fee2e2",
                            color: "#991b1b",
                            border: "1px solid #fca5a5",
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Holiday Modal */}
      {showModal && (
        <AddHolidayModal
          editingHoliday={editingHoliday}
          onClose={() => {
            setShowModal(false);
            setEditingHoliday(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingHoliday(null);
            loadHolidays();
          }}
        />
      )}
    </Layout>
  );
}
