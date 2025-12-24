import Layout from "../components/common/Layout";
import { BarChart3, Download, Calendar, TrendingUp } from "lucide-react";

export default function HRReports() {
  return (
    <Layout>
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div>
            <h1 className="ba-dashboard-title">Reports & Analytics</h1>
            <p className="ba-dashboard-subtitle">
              Generate and download reports
            </p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="ba-card">
          <div className="ba-card-body">
            <div className="ba-empty-state">
              <BarChart3 className="ba-empty-icon" />
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  marginTop: "1rem",
                }}
              >
                Reports Coming Soon
              </h2>
              <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
                Advanced reporting features will be available here
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}