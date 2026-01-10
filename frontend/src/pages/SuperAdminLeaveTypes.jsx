import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Tag, AlertCircle, Save, X } from "lucide-react";
import Layout from "../components/common/Layout";
import AddLeaveTypeModal from "../components/sa/AddLeaveTypeModal";
import axios from "axios";

export default function AdminLeaveTypes() {
  const [loading, setLoading] = useState(true);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [predefinedTypes, setPredefinedTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    max_days_per_year: 10,
    requires_document: false,
    can_carry_forward: false,
    carry_forward_limit: 0,
    allow_half_day: true,
    color: "#3b82f6",
    is_paid: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLeaveTypes();
    loadPredefinedTypes();
  }, []);

  const loadLeaveTypes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/leave/leave-types`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaveTypes(response.data.leave_types || []);
    } catch (error) {
      console.error("Failed to load leave types:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPredefinedTypes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/leave/leave-types/predefined`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPredefinedTypes(response.data.leave_types || []);
    } catch (error) {
      console.error("Failed to load predefined types:", error);
    }
  };

  const handlePredefinedSelect = (type) => {
    setFormData({
      ...formData,
      name: type.name,
      code: type.code,
      color: type.color,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      if (editingType) {
        // Update existing
        await axios.put(
          `${import.meta.env.VITE_API_URL}/admin/leave/leave-types/${editingType.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new
        await axios.post(
          `${import.meta.env.VITE_API_URL}/admin/leave/leave-types`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setShowModal(false);
      setEditingType(null);
      resetForm();
      loadLeaveTypes();
    } catch (error) {
      console.error("Failed to save leave type:", error);
      setError(error.response?.data?.detail || "Failed to save leave type");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      code: type.code,
      description: type.description || "",
      max_days_per_year: type.max_days_per_year,
      requires_document: type.requires_document,
      can_carry_forward: type.can_carry_forward,
      carry_forward_limit: type.carry_forward_limit,
      allow_half_day: type.allow_half_day,
      color: type.color,
      is_paid: type.is_paid,
    });
    setShowModal(true);
  };

  const handleDelete = async (typeId) => {
    if (!confirm("Are you sure you want to deactivate this leave type?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/admin/leave/leave-types/${typeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadLeaveTypes();
    } catch (error) {
      console.error("Failed to delete leave type:", error);
      alert(error.response?.data?.detail || "Failed to delete leave type");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      max_days_per_year: 10,
      requires_document: false,
      can_carry_forward: false,
      carry_forward_limit: 0,
      allow_half_day: true,
      color: "#3b82f6",
      is_paid: true,
    });
    setError("");
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Leave Types...</p>
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
            <h1 className="ba-dashboard-title">Leave Type Management</h1>
            <p className="ba-dashboard-subtitle">
              Configure available leave types for your organization
            </p>
          </div>
          <div className="ba-dashboard-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingType(null);
                resetForm();
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Leave Type</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div
          className="ba-stats-grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Leave Types</p>
                <p className="ba-stat-value">{leaveTypes.length}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <Tag className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Active Types</p>
                <p className="ba-stat-value">
                  {leaveTypes.filter((t) => t.is_active).length}
                </p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <Tag className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Leave Types List */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Tag className="w-5 h-5" />
              <span>Configured Leave Types</span>
            </div>
          </div>
          <div className="ba-card-body">
            {leaveTypes.length === 0 ? (
              <div className="ba-empty-state">
                <Tag className="ba-empty-icon" />
                <p>No leave types configured</p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginTop: "0.5rem",
                  }}
                >
                  Add your first leave type to get started
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {leaveTypes.map((type) => (
                  <div
                    key={type.id}
                    style={{
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "1.5rem",
                      backgroundColor: type.is_active ? "white" : "#f9fafb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            marginBottom: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "8px",
                              backgroundColor: type.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: "600",
                              fontSize: "0.875rem",
                            }}
                          >
                            {type.code.substring(0, 2)}
                          </div>
                          <div>
                            <h3
                              style={{
                                fontSize: "1.125rem",
                                fontWeight: "600",
                                margin: "0 0 0.25rem 0",
                              }}
                            >
                              {type.name}
                            </h3>
                            <p
                              style={{
                                fontSize: "0.875rem",
                                color: "#6b7280",
                                margin: 0,
                              }}
                            >
                              Code: {type.code}
                            </p>
                          </div>
                        </div>

                        {type.description && (
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "#6b7280",
                              marginBottom: "1rem",
                            }}
                          >
                            {type.description}
                          </p>
                        )}

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(150px, 1fr))",
                            gap: "1rem",
                            marginTop: "1rem",
                          }}
                        >
                          <div>
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "#6b7280",
                                margin: "0 0 0.25rem 0",
                              }}
                            >
                              Max Days/Year
                            </p>
                            <p
                              style={{
                                fontSize: "1.125rem",
                                fontWeight: "600",
                                margin: 0,
                              }}
                            >
                              {type.max_days_per_year}
                            </p>
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "#6b7280",
                                margin: "0 0 0.25rem 0",
                              }}
                            >
                              Type
                            </p>
                            <p
                              style={{
                                fontSize: "1.125rem",
                                fontWeight: "600",
                                margin: 0,
                              }}
                            >
                              {type.is_paid ? "Paid" : "Unpaid"}
                            </p>
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "#6b7280",
                                margin: "0 0 0.25rem 0",
                              }}
                            >
                              Carry Forward
                            </p>
                            <p
                              style={{
                                fontSize: "1.125rem",
                                fontWeight: "600",
                                margin: 0,
                              }}
                            >
                              {type.can_carry_forward
                                ? `Yes (${type.carry_forward_limit})`
                                : "No"}
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginTop: "1rem",
                            flexWrap: "wrap",
                          }}
                        >
                          {type.allow_half_day && (
                            <span className="ba-stat-badge success">
                              Half Day Allowed
                            </span>
                          )}
                          {type.requires_document && (
                            <span className="ba-stat-badge warning">
                              Document Required
                            </span>
                          )}
                          {!type.is_active && (
                            <span
                              className="ba-stat-badge"
                              style={{
                                backgroundColor: "#f3f4f6",
                                color: "#4b5563",
                              }}
                            >
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => handleEdit(type)}
                          className="btn btn-secondary"
                          style={{ padding: "0.5rem" }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(type.id)}
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <AddLeaveTypeModal
          editingType={editingType}
          onClose={() => {
            setShowModal(false);
            setEditingType(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingType(null);
            loadLeaveTypes();
          }}
        />
      )}
    </Layout>
  );
}
