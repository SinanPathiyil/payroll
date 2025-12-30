import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/common/Layout";
import EditClientModal from "../components/ba/EditClientModal";
import DeleteClientModal from "../components/ba/DeleteClientModal";
import {
  ArrowLeft,
  Building,
  MapPin,
  Globe,
  Calendar,
  DollarSign,
  Briefcase,
  Users,
  Mail,
  Phone,
  Edit,
  Trash2,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
} from "lucide-react";
import { getClient } from "../services/api";
import "../styles/ba-client-details.css";

export default function BAClientDetails() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadClientDetails();
  }, [clientId]);

  const loadClientDetails = async () => {
    try {
      setLoading(true);
      const response = await getClient(clientId);
      console.log("📊 Client Details:", response.data);
      setClient(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load client details:", error);
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Client Details...</p>
        </div>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout>
        <div className="layout-loading">
          <p className="layout-loading-text">Client not found</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/ba/clients")}
          >
            Back to Clients
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ba-client-details">
        {/* Header */}
        <div className="ba-client-details-header">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/ba/clients")}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Clients</span>
          </button>
          <div className="ba-client-details-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="w-4 h-4" />
              <span>Edit Client</span>
            </button>
            <button
              className="btn btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Client</span>
            </button>
          </div>
        </div>

        {/* Client Header Card */}
        <div className="ba-client-header-card">
          <div className="ba-client-header-left">
            <div className="ba-client-logo-large">
              <Building className="w-12 h-12" />
            </div>
            <div className="ba-client-header-info">
              <h1 className="ba-client-details-title">{client.company_name}</h1>
              <div className="ba-client-header-meta">
                {client.industry && (
                  <span className="ba-client-industry-tag">
                    {client.industry}
                  </span>
                )}
                <span
                  className={`status-chip ${client.status === "active" ? "success" : "inactive"}`}
                >
                  {client.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="ba-client-stats-grid">
          <div className="ba-client-stat-box">
            <div className="ba-client-stat-icon ba-stat-icon-blue">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="ba-client-stat-label">Total Projects</p>
              <p className="ba-client-stat-value">{client.total_projects}</p>
              <p className="ba-client-stat-sub">
                {client.active_projects} active
              </p>
            </div>
          </div>

          <div className="ba-client-stat-box">
            <div className="ba-client-stat-icon ba-stat-icon-green">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="ba-client-stat-label">Total Revenue</p>
              <p className="ba-client-stat-value">
                {formatCurrency(client.total_revenue)}
              </p>
              <p className="ba-client-stat-sub">
                {formatCurrency(client.pending_payments)} pending
              </p>
            </div>
          </div>

          <div className="ba-client-stat-box">
            <div className="ba-client-stat-icon ba-stat-icon-purple">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="ba-client-stat-label">Contacts</p>
              <p className="ba-client-stat-value">
                {client.contacts?.length || 0}
              </p>
              <p className="ba-client-stat-sub">
                {client.contacts?.filter((c) => c.is_primary).length || 0}{" "}
                primary
              </p>
            </div>
          </div>

          <div className="ba-client-stat-box">
            <div className="ba-client-stat-icon ba-stat-icon-orange">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="ba-client-stat-label">Contract Period</p>
              <p className="ba-client-stat-value">
                {client.contract_start_date ? "Active" : "N/A"}
              </p>
              <p className="ba-client-stat-sub">
                {client.contract_end_date
                  ? `Until ${formatDate(client.contract_end_date)}`
                  : "No end date"}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="ba-client-content-grid">
          {/* Left Column */}
          <div className="ba-client-content-left">
            {/* Company Information */}
            <div className="ba-details-card">
              <div className="ba-details-card-header">
                <Building className="w-5 h-5" />
                <h3>Company Information</h3>
              </div>
              <div className="ba-details-card-body">
                <div className="ba-detail-row">
                  <span className="ba-detail-label">Company Name:</span>
                  <span className="ba-detail-value">{client.company_name}</span>
                </div>
                {client.industry && (
                  <div className="ba-detail-row">
                    <span className="ba-detail-label">Industry:</span>
                    <span className="ba-detail-value">{client.industry}</span>
                  </div>
                )}
                {client.website && (
                  <div className="ba-detail-row">
                    <span className="ba-detail-label">Website:</span>
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ba-detail-link"
                    >
                      <Globe className="w-4 h-4" />
                      {client.website}
                    </a>
                  </div>
                )}
                {(client.address ||
                  client.city ||
                  client.state ||
                  client.country) && (
                  <div className="ba-detail-row">
                    <span className="ba-detail-label">Address:</span>
                    <span className="ba-detail-value">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {[
                        client.address,
                        client.city,
                        client.state,
                        client.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {client.payment_terms && (
                  <div className="ba-detail-row">
                    <span className="ba-detail-label">Payment Terms:</span>
                    <span className="ba-detail-value">
                      {client.payment_terms}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contract Information */}
            <div className="ba-details-card">
              <div className="ba-details-card-header">
                <FileText className="w-5 h-5" />
                <h3>Contract Information</h3>
              </div>
              <div className="ba-details-card-body">
                <div className="ba-detail-row">
                  <span className="ba-detail-label">Contract Start:</span>
                  <span className="ba-detail-value">
                    {formatDate(client.contract_start_date)}
                  </span>
                </div>
                <div className="ba-detail-row">
                  <span className="ba-detail-label">Contract End:</span>
                  <span className="ba-detail-value">
                    {formatDate(client.contract_end_date)}
                  </span>
                </div>
                <div className="ba-detail-row">
                  <span className="ba-detail-label">Created:</span>
                  <span className="ba-detail-value">
                    {formatDate(client.created_at)}
                  </span>
                </div>
                {client.last_contact_date && (
                  <div className="ba-detail-row">
                    <span className="ba-detail-label">Last Contact:</span>
                    <span className="ba-detail-value">
                      {formatDate(client.last_contact_date)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {client.notes && (
              <div className="ba-details-card">
                <div className="ba-details-card-header">
                  <FileText className="w-5 h-5" />
                  <h3>Notes</h3>
                </div>
                <div className="ba-details-card-body">
                  <p className="ba-notes-text">{client.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="ba-client-content-right">
            {/* Contacts */}
            <div className="ba-details-card">
              <div className="ba-details-card-header">
                <Users className="w-5 h-5" />
                <h3>Contacts</h3>
              </div>
              <div className="ba-details-card-body">
                {client.contacts && client.contacts.length > 0 ? (
                  <div className="ba-contacts-list">
                    {client.contacts.map((contact, index) => (
                      <div key={index} className="ba-contact-box">
                        <div className="ba-contact-box-header">
                          <h4 className="ba-contact-box-name">
                            {contact.name}
                          </h4>
                          {contact.is_primary && (
                            <span className="ba-badge ba-badge-primary">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="ba-contact-box-designation">
                          {contact.designation}
                        </p>
                        <div className="ba-contact-box-links">
                          <a
                            href={`mailto:${contact.email}`}
                            className="ba-contact-box-link"
                          >
                            <Mail className="w-4 h-4" />
                            <span>{contact.email}</span>
                          </a>
                          <a
                            href={`tel:${contact.phone}`}
                            className="ba-contact-box-link"
                          >
                            <Phone className="w-4 h-4" />
                            <span>{contact.phone}</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="ba-empty-text">No contacts available</p>
                )}
              </div>
            </div>

            {/* Recent Projects */}
            {client.recent_projects && client.recent_projects.length > 0 && (
              <div className="ba-details-card">
                <div className="ba-details-card-header">
                  <Briefcase className="w-5 h-5" />
                  <h3>Recent Projects</h3>
                </div>
                <div className="ba-details-card-body">
                  <div className="ba-projects-list">
                    {client.recent_projects.map((project) => (
                      <div key={project.id} className="ba-project-item">
                        <div className="ba-project-item-header">
                          <h4 className="ba-project-item-name">
                            {project.project_name}
                          </h4>
                          <span className={`status-chip ${project.status}`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="ba-project-progress">
                          <div className="ba-progress-bar">
                            <div
                              className="ba-progress-fill"
                              style={{
                                width: `${project.progress_percentage}%`,
                              }}
                            ></div>
                          </div>
                          <span className="ba-progress-text">
                            {project.progress_percentage}%
                          </span>
                        </div>
                        <p className="ba-project-date">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(project.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Communication Logs */}
            {client.communication_logs &&
              client.communication_logs.length > 0 && (
                <div className="ba-details-card">
                  <div className="ba-details-card-header">
                    <Activity className="w-5 h-5" />
                    <h3>Recent Communications</h3>
                  </div>
                  <div className="ba-details-card-body">
                    <div className="ba-comms-list">
                      {client.communication_logs.map((log) => (
                        <div key={log.id} className="ba-comm-item">
                          <div className="ba-comm-type">
                            {log.communication_type}
                          </div>
                          <div className="ba-comm-content">
                            <h4 className="ba-comm-subject">{log.subject}</h4>
                            {log.notes && (
                              <p className="ba-comm-notes">{log.notes}</p>
                            )}
                            <p className="ba-comm-meta">
                              By {log.created_by} • {formatDate(log.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            {/* Payment History */}
            {client.payment_history && client.payment_history.length > 0 && (
              <div className="ba-details-card">
                <div className="ba-details-card-header">
                  <DollarSign className="w-5 h-5" />
                  <h3>Payment History</h3>
                </div>
                <div className="ba-details-card-body">
                  <div className="ba-payments-list">
                    {client.payment_history.map((payment) => (
                      <div key={payment.id} className="ba-payment-item">
                        <div className="ba-payment-amount">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="ba-payment-details">
                          <p className="ba-payment-project">
                            {payment.project_name}
                          </p>
                          <p className="ba-payment-milestone">
                            {payment.milestone_name}
                          </p>
                          <p className="ba-payment-date">
                            {formatDate(payment.payment_date)}
                            {payment.payment_method &&
                              ` • ${payment.payment_method}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Client Modal */}
        <EditClientModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            loadClientDetails();
          }}
          client={client}
        />

        {/* Delete Client Modal */}
        <DeleteClientModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => {
            navigate("/ba/clients");
          }}
          client={client}
        />
      </div>
    </Layout>
  );
}
