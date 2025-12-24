import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
} from "lucide-react";

import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
} from "../services/api";

export default function BAClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);

      // Real API call
      const response = await getClients();
      setClients(response.data);

      setLoading(false);
    } catch (error) {
      console.error("Failed to load clients:", error);
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.primary_contact.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || client.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
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
          <p className="layout-loading-text">Loading Clients...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ba-clients">
        {/* Header */}
        <div className="ba-page-header">
          <div>
            <h1 className="ba-page-title">Client Management</h1>
            <p className="ba-page-subtitle">
              Manage your clients and their information
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </button>
        </div>

        {/* Stats Summary */}
        <div className="ba-clients-stats">
          <div className="ba-clients-stat-item">
            <Users className="w-5 h-5" />
            <div>
              <p className="ba-clients-stat-value">{clients.length}</p>
              <p className="ba-clients-stat-label">Total Clients</p>
            </div>
          </div>
          <div className="ba-clients-stat-item">
            <Building className="w-5 h-5" />
            <div>
              <p className="ba-clients-stat-value">
                {clients.filter((c) => c.status === "active").length}
              </p>
              <p className="ba-clients-stat-label">Active Clients</p>
            </div>
          </div>
          <div className="ba-clients-stat-item">
            <Briefcase className="w-5 h-5" />
            <div>
              <p className="ba-clients-stat-value">
                {clients.reduce((sum, c) => sum + c.projects_count, 0)}
              </p>
              <p className="ba-clients-stat-label">Total Projects</p>
            </div>
          </div>
          <div className="ba-clients-stat-item">
            <DollarSign className="w-5 h-5" />
            <div>
              <p className="ba-clients-stat-value">
                {formatCurrency(
                  clients.reduce((sum, c) => sum + c.total_revenue, 0)
                )}
              </p>
              <p className="ba-clients-stat-label">Total Revenue</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ba-clients-filters">
          <div className="ba-search-box">
            <Search className="ba-search-icon" />
            <input
              type="text"
              placeholder="Search clients by name or contact..."
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
              <option value="all">All Clients</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <div className="ba-empty-state">
            <Users className="ba-empty-icon" />
            <p className="ba-empty-text">No clients found</p>
            <p className="ba-empty-hint">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Add your first client to get started"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <button
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Add First Client</span>
              </button>
            )}
          </div>
        ) : (
          <div className="ba-clients-grid">
            {filteredClients.map((client) => (
              <div key={client.id} className="ba-client-card">
                {/* Card Header */}
                <div className="ba-client-card-header">
                  <div className="ba-client-logo">
                    <Building className="w-6 h-6" />
                  </div>
                  <div className="ba-client-status">
                    <span
                      className={`status-chip ${client.status === "active" ? "success" : "inactive"}`}
                    >
                      {client.status}
                    </span>
                  </div>
                  <div className="ba-client-actions">
                    <button
                      className="ba-client-action-btn"
                      onClick={() =>
                        setShowActionMenu(
                          showActionMenu === client.id ? null : client.id
                        )
                      }
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {showActionMenu === client.id && (
                      <div className="ba-client-action-menu">
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setShowActionMenu(null);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => {
                            // Edit logic
                            setShowActionMenu(null);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          className="danger"
                          onClick={() => {
                            // Delete logic
                            setShowActionMenu(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="ba-client-card-body">
                  <h3 className="ba-client-name">{client.company_name}</h3>
                  <p className="ba-client-industry">{client.industry}</p>

                  {/* Primary Contact */}
                  <div className="ba-client-contact">
                    <div className="ba-client-contact-item">
                      <Users className="w-4 h-4" />
                      <div>
                        <p className="ba-client-contact-name">
                          {client.primary_contact.name}
                        </p>
                        <p className="ba-client-contact-role">
                          {client.primary_contact.designation}
                        </p>
                      </div>
                    </div>
                    <div className="ba-client-contact-links">
                      <a
                        href={`mailto:${client.primary_contact.email}`}
                        className="ba-client-contact-link"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                      <a
                        href={`tel:${client.primary_contact.phone}`}
                        className="ba-client-contact-link"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="ba-client-info-item">
                    <MapPin className="w-4 h-4" />
                    <span>{client.address}</span>
                  </div>

                  {/* Stats */}
                  <div className="ba-client-stats">
                    <div className="ba-client-stat">
                      <Briefcase className="w-4 h-4" />
                      <span>{client.projects_count} Projects</span>
                    </div>
                    <div className="ba-client-stat">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatCurrency(client.total_revenue)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="ba-client-card-footer">
                  <div className="ba-client-footer-info">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Since {formatDate(client.contract_start)}</span>
                  </div>
                  <button
                    className="ba-client-view-btn"
                    onClick={() => setSelectedClient(client)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
