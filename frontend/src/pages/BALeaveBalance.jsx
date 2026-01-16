import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import Layout from "../components/common/Layout";
import ApplyLeaveModal from "../components/employee/ApplyLeaveModal";
import axios from "axios";

export default function BALeaveBalance() {
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());
  const [error, setError] = useState("");

  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/ba/leave/balance?year=${currentYear}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBalances(response.data.balances || []);
      setSummary({
        total_allocated: response.data.total_allocated,
        total_used: response.data.total_used,
        total_available: response.data.total_available,
      });
    } catch (error) {
      console.error("Failed to load balances:", error);
      setError("Failed to load leave balances. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (used, allocated) => {
    if (allocated === 0) return 0;
    return (used / allocated) * 100;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "#ef4444"; // Red
    if (percentage >= 50) return "#f59e0b"; // Orange
    return "#10b981"; // Green
  };

  if (loading) {
    return (
      <Layout>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: "2rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: "700",
                margin: "0 0 0.5rem 0",
              }}
            >
              My Leave Balance
            </h1>
            <p style={{ color: "#6b7280", margin: 0 }}>Year: {currentYear}</p>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={loadBalances}
              className="btn btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowApplyModal(true)}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>
        </div>

        {error && (
          <div
            className="ba-alert ba-alert-error"
            style={{ marginBottom: "2rem" }}
          >
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "#dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Calendar className="w-6 h-6" style={{ color: "#3b82f6" }} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#6b7280",
                      margin: 0,
                    }}
                  >
                    Total Allocated
                  </p>
                  <p
                    style={{
                      fontSize: "2rem",
                      fontWeight: "700",
                      margin: 0,
                      color: "#3b82f6",
                    }}
                  >
                    {summary.total_allocated}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
                Total days allocated for {currentYear}
              </p>
            </div>

            <div
              style={{
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "#fee2e2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Clock className="w-6 h-6" style={{ color: "#ef4444" }} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#6b7280",
                      margin: 0,
                    }}
                  >
                    Total Used
                  </p>
                  <p
                    style={{
                      fontSize: "2rem",
                      fontWeight: "700",
                      margin: 0,
                      color: "#ef4444",
                    }}
                  >
                    {summary.total_used}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
                Days already taken
              </p>
            </div>

            <div
              style={{
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "#d1fae5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrendingUp
                    className="w-6 h-6"
                    style={{ color: "#10b981" }}
                  />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#6b7280",
                      margin: 0,
                    }}
                  >
                    Available
                  </p>
                  <p
                    style={{
                      fontSize: "2rem",
                      fontWeight: "700",
                      margin: 0,
                      color: "#10b981",
                    }}
                  >
                    {summary.total_available}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
                Days you can still apply for
              </p>
            </div>
          </div>
        )}

        {/* Leave Type Breakdown */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1.5rem",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0 }}>
              Leave Balance by Type
            </h2>
          </div>

          {balances.length === 0 ? (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              <Calendar
                className="w-16 h-16"
                style={{ margin: "0 auto 1rem", opacity: 0.5 }}
              />
              <p style={{ fontSize: "1.125rem", margin: 0 }}>
                No leave balances found
              </p>
              <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
                Contact HR if you believe this is an error
              </p>
            </div>
          ) : (
            <div style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "grid",
                  gap: "1.5rem",
                }}
              >
                {balances.map((balance) => {
                  const usagePercentage = getProgressPercentage(
                    balance.used,
                    balance.allocated
                  );
                  const progressColor = getProgressColor(usagePercentage);

                  return (
                    <div
                      key={balance.id}
                      style={{
                        padding: "1.5rem",
                        border: "2px solid #e5e7eb",
                        borderRadius: "12px",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "1rem",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: "1.125rem",
                              fontWeight: "600",
                              margin: "0 0 0.25rem 0",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <span
                              style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                backgroundColor: progressColor,
                              }}
                            />
                            {balance.leave_type_name}
                          </h3>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "#6b7280",
                              margin: 0,
                            }}
                          >
                            {balance.leave_type_code}
                          </p>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <p
                            style={{
                              fontSize: "2rem",
                              fontWeight: "700",
                              margin: 0,
                              color: progressColor,
                            }}
                          >
                            {balance.available}
                          </p>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "#6b7280",
                              margin: 0,
                            }}
                          >
                            days available
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          backgroundColor: "#e5e7eb",
                          borderRadius: "4px",
                          overflow: "hidden",
                          marginBottom: "1rem",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(usagePercentage, 100)}%`,
                            height: "100%",
                            backgroundColor: progressColor,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>

                      {/* Stats Grid */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)",
                          gap: "1rem",
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
                            Allocated
                          </p>
                          <p
                            style={{
                              fontSize: "1.25rem",
                              fontWeight: "600",
                              margin: 0,
                            }}
                          >
                            {balance.allocated}
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
                            Used
                          </p>
                          <p
                            style={{
                              fontSize: "1.25rem",
                              fontWeight: "600",
                              margin: 0,
                            }}
                          >
                            {balance.used}
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
                            Pending
                          </p>
                          <p
                            style={{
                              fontSize: "1.25rem",
                              fontWeight: "600",
                              margin: 0,
                            }}
                          >
                            {balance.pending}
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
                            Carried Forward
                          </p>
                          <p
                            style={{
                              fontSize: "1.25rem",
                              fontWeight: "600",
                              margin: 0,
                            }}
                          >
                            {balance.carried_forward}
                          </p>
                        </div>
                      </div>

                      {balance.carry_forward_expires_on && (
                        <div
                          style={{
                            marginTop: "1rem",
                            padding: "0.75rem",
                            backgroundColor: "#fef3c7",
                            border: "1px solid #fbbf24",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                            color: "#92400e",
                          }}
                        >
                          ⚠️ Carried forward balance expires on:{" "}
                          {new Date(
                            balance.carry_forward_expires_on
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <ApplyLeaveModal
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false);
            loadBalances();
          }}
          userRole="business_analyst"
        />
      )}
    </Layout>
  );
}
