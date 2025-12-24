import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/common/Layout";
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Download,
  Eye,
  CreditCard,
  Building,
  FileText,
  ArrowUpRight,
} from "lucide-react";

import { getPayments, recordPayment, getBAProjects } from "../services/api";

export default function BAPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Real API calls
      const [paymentsRes, projectsRes] = await Promise.all([
        getPayments(),
        getBAProjects(),
      ]);

      setPayments(paymentsRes.data);
      setProjects(projectsRes.data);

      setLoading(false);
    } catch (error) {
      console.error("Failed to load data:", error);
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || payment.status === filterStatus;

    let matchesPeriod = true;
    if (filterPeriod !== "all" && payment.payment_date) {
      const paymentDate = new Date(payment.payment_date);
      const now = new Date();

      switch (filterPeriod) {
        case "this_month":
          matchesPeriod =
            paymentDate.getMonth() === now.getMonth() &&
            paymentDate.getFullYear() === now.getFullYear();
          break;
        case "last_month":
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          matchesPeriod =
            paymentDate.getMonth() === lastMonth.getMonth() &&
            paymentDate.getFullYear() === lastMonth.getFullYear();
          break;
        case "this_year":
          matchesPeriod = paymentDate.getFullYear() === now.getFullYear();
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const stats = {
    total_received: payments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0),
    pending: payments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0),
    this_month: payments
      .filter((p) => {
        if (p.status === "completed" && p.payment_date) {
          const paymentDate = new Date(p.payment_date);
          const now = new Date();
          return (
            paymentDate.getMonth() === now.getMonth() &&
            paymentDate.getFullYear() === now.getFullYear()
          );
        }
        return false;
      })
      .reduce((sum, p) => sum + p.amount, 0),
    total_transactions: payments.length,
    completed_count: payments.filter((p) => p.status === "completed").length,
    pending_count: payments.filter((p) => p.status === "pending").length,
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5" />;
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "failed":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Payments...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ba-payments">
        {/* Header */}
        <div className="ba-page-header">
          <div>
            <h1 className="ba-page-title">Payment Management</h1>
            <p className="ba-page-subtitle">
              Track and record milestone payments from clients
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="ba-payments-stats">
          <div className="ba-payment-stat-card stat-card-success">
            <div className="ba-payment-stat-icon">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="ba-payment-stat-info">
              <p className="ba-payment-stat-label">Total Received</p>
              <p className="ba-payment-stat-value">
                {formatCurrency(stats.total_received)}
              </p>
              <p className="ba-payment-stat-hint">
                {stats.completed_count} transactions
              </p>
            </div>
          </div>

          <div className="ba-payment-stat-card stat-card-warning">
            <div className="ba-payment-stat-icon">
              <Clock className="w-6 h-6" />
            </div>
            <div className="ba-payment-stat-info">
              <p className="ba-payment-stat-label">Pending Payments</p>
              <p className="ba-payment-stat-value">
                {formatCurrency(stats.pending)}
              </p>
              <p className="ba-payment-stat-hint">
                {stats.pending_count} awaiting
              </p>
            </div>
          </div>

          <div className="ba-payment-stat-card stat-card-info">
            <div className="ba-payment-stat-icon">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="ba-payment-stat-info">
              <p className="ba-payment-stat-label">This Month</p>
              <p className="ba-payment-stat-value">
                {formatCurrency(stats.this_month)}
              </p>
              <p className="ba-payment-stat-hint">Current month revenue</p>
            </div>
          </div>

          <div className="ba-payment-stat-card stat-card-primary">
            <div className="ba-payment-stat-icon">
              <FileText className="w-6 h-6" />
            </div>
            <div className="ba-payment-stat-info">
              <p className="ba-payment-stat-label">Total Transactions</p>
              <p className="ba-payment-stat-value">
                {stats.total_transactions}
              </p>
              <p className="ba-payment-stat-hint">All time records</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ba-payments-filters">
          <div className="ba-search-box">
            <Search className="ba-search-icon" />
            <input
              type="text"
              placeholder="Search by project, client, or transaction ID..."
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
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="ba-filter-group">
            <Calendar className="w-4 h-4" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="ba-filter-select"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
            </select>
          </div>
          <button className="btn btn-secondary">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <div className="ba-empty-state">
            <DollarSign className="ba-empty-icon" />
            <p className="ba-empty-text">No payments found</p>
            <p className="ba-empty-hint">
              {searchTerm || filterStatus !== "all" || filterPeriod !== "all"
                ? "Try adjusting your search or filters"
                : "Record your first payment to get started"}
            </p>
            {!searchTerm &&
              filterStatus === "all" &&
              filterPeriod === "all" && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span>Record First Payment</span>
                </button>
              )}
          </div>
        ) : (
          <div className="ba-payments-table-wrapper">
            <table className="ba-payments-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Project / Milestone</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Transaction ID</th>
                  <th>Payment Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <div className="ba-payment-status-cell">
                        <span
                          className={`status-chip ${payment.status === "completed" ? "success" : payment.status === "pending" ? "warning" : "danger"}`}
                        >
                          {getStatusIcon(payment.status)}
                          <span>{payment.status}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="ba-payment-project-cell">
                        <p className="ba-payment-project-name">
                          {payment.project_name}
                        </p>
                        <p className="ba-payment-milestone-name">
                          {payment.milestone_name}
                        </p>
                      </div>
                    </td>
                    <td>
                      <div className="ba-payment-client-cell">
                        <Building className="w-4 h-4" />
                        <span>{payment.client_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="ba-payment-amount">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td>
                      <div className="ba-payment-method-cell">
                        <CreditCard className="w-4 h-4" />
                        <span>{payment.payment_method}</span>
                      </div>
                    </td>
                    <td>
                      <code className="ba-payment-transaction-id">
                        {payment.transaction_id}
                      </code>
                    </td>
                    <td>
                      <div className="ba-payment-date-cell">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(payment.payment_date)}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="ba-payment-view-btn"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment Details Modal */}
        {selectedPayment && (
          <div
            className="modal-backdrop"
            onClick={() => setSelectedPayment(null)}
          >
            <div
              className="modal-container modal-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-header-content">
                  <DollarSign className="modal-header-icon" />
                  <h2 className="modal-title">Payment Details</h2>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setSelectedPayment(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="ba-payment-details">
                  {/* Status Banner */}
                  <div
                    className={`ba-payment-details-banner banner-${selectedPayment.status}`}
                  >
                    {getStatusIcon(selectedPayment.status)}
                    <span>
                      Payment{" "}
                      {selectedPayment.status === "completed"
                        ? "Completed"
                        : selectedPayment.status === "pending"
                          ? "Pending"
                          : "Failed"}
                    </span>
                  </div>

                  {/* Amount Section */}
                  <div className="ba-payment-details-amount">
                    <p className="ba-payment-details-label">Payment Amount</p>
                    <p className="ba-payment-details-value">
                      {formatCurrency(selectedPayment.amount)}
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="ba-payment-details-grid">
                    <div className="ba-payment-detail-item">
                      <p className="ba-payment-detail-label">Project</p>
                      <p className="ba-payment-detail-value">
                        {selectedPayment.project_name}
                      </p>
                    </div>
                    <div className="ba-payment-detail-item">
                      <p className="ba-payment-detail-label">Milestone</p>
                      <p className="ba-payment-detail-value">
                        {selectedPayment.milestone_name}
                      </p>
                    </div>
                    <div className="ba-payment-detail-item">
                      <p className="ba-payment-detail-label">Client</p>
                      <p className="ba-payment-detail-value">
                        {selectedPayment.client_name}
                      </p>
                    </div>
                    <div className="ba-payment-detail-item">
                      <p className="ba-payment-detail-label">Invoice Number</p>
                      <p className="ba-payment-detail-value">
                        {selectedPayment.invoice_number}
                      </p>
                    </div>
                    <div className="ba-payment-detail-item">
                      <p className="ba-payment-detail-label">Payment Method</p>
                      <p className="ba-payment-detail-value">
                        {selectedPayment.payment_method}
                      </p>
                    </div>
                    <div className="ba-payment-detail-item">
                      <p className="ba-payment-detail-label">Transaction ID</p>
                      <p className="ba-payment-detail-value">
                        <code>{selectedPayment.transaction_id}</code>
                      </p>
                    </div>
                    <div className="ba-payment-detail-item">
                      <p className="ba-payment-detail-label">Payment Date</p>
                      <p className="ba-payment-detail-value">
                        {formatDate(selectedPayment.payment_date)}
                      </p>
                    </div>
                    <div className="ba-payment-detail-item">
                      <p className="ba-payment-detail-label">Recorded By</p>
                      <p className="ba-payment-detail-value">
                        {selectedPayment.recorded_by}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedPayment.notes && (
                    <div className="ba-payment-details-notes">
                      <p className="ba-payment-details-notes-label">Notes</p>
                      <p className="ba-payment-details-notes-value">
                        {selectedPayment.notes}
                      </p>
                    </div>
                  )}

                  {/* Footer Info */}
                  <div className="ba-payment-details-footer">
                    <p>
                      Recorded on {formatDateTime(selectedPayment.recorded_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
