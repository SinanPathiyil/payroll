import { Download, FileText, X } from "lucide-react";
import "../../styles/ba-modal.css";

export default function ExportModal({ isOpen, onClose, payments, onExport }) {
  if (!isOpen) return null;

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

  const exportToCSV = () => {
    const headers = [
      "Status",
      "Project",
      "Milestone",
      "Client",
      "Amount",
      "Payment Method",
      "Transaction ID",
      "Payment Date",
    ];
    const csvContent = [
      headers.join(","),
      ...payments.map((p) =>
        [
          p.status,
          `"${p.project_name}"`,
          `"${p.milestone_name}"`,
          `"${p.client_name}"`,
          p.amount,
          p.payment_method,
          p.transaction_id || "",
          formatDate(p.payment_date),
        ].join(",")
      ),
    ].join("\n");

    downloadFile(csvContent, "payments.csv", "text/csv");
    onClose();
  };

  const exportToExcel = () => {
    const headers = [
      "Status",
      "Project",
      "Milestone",
      "Client",
      "Amount",
      "Payment Method",
      "Transaction ID",
      "Payment Date",
    ];
    const csvContent = [
      headers.join("\t"),
      ...payments.map((p) =>
        [
          p.status,
          p.project_name,
          p.milestone_name,
          p.client_name,
          p.amount,
          p.payment_method,
          p.transaction_id || "",
          formatDate(p.payment_date),
        ].join("\t")
      ),
    ].join("\n");

    downloadFile(csvContent, "payments.xlsx", "application/vnd.ms-excel");
    onClose();
  };

  const exportToPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          .meta { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #4CAF50; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .footer { margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Payment Report</h1>
        <div class="meta">
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Records:</strong> ${payments.length}</p>
          <p><strong>Total Amount:</strong> ${formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Project</th>
              <th>Milestone</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Transaction ID</th>
              <th>Payment Date</th>
            </tr>
          </thead>
          <tbody>
            ${payments
              .map(
                (p) => `
              <tr>
                <td>${p.status}</td>
                <td>${p.project_name}</td>
                <td>${p.milestone_name}</td>
                <td>${p.client_name}</td>
                <td>${formatCurrency(p.amount)}</td>
                <td>${p.payment_method}</td>
                <td>${p.transaction_id || "N/A"}</td>
                <td>${formatDate(p.payment_date)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>This is an automatically generated report.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    onClose();
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div
        className="ba-modal-container ba-modal-small"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Download className="w-5 h-5" />
            <h2 className="ba-modal-title">Export Payments</h2>
          </div>
          <button className="ba-modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="ba-modal-body">
          <p
            style={{
              marginBottom: "1.5rem",
              color: "#64748b",
              fontSize: "0.95rem",
              lineHeight: "1.5",
            }}
          >
            Select the format to export{" "}
            <strong style={{ color: "#1e293b", fontWeight: 600 }}>
              {payments.length}
            </strong>{" "}
            payment record(s):
          </p>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <button
              className="ba-export-btn"
              onClick={exportToCSV}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem",
                background: "white",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "left",
                width: "100%",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.background = "#eff6ff";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.background = "white";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <FileText
                style={{ flexShrink: 0, color: "#3b82f6" }}
                className="w-5 h-5"
              />
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "0.25rem",
                  }}
                >
                  CSV
                </p>
                <p
                  style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}
                >
                  Comma-separated values
                </p>
              </div>
            </button>

            <button
              className="ba-export-btn"
              onClick={exportToExcel}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem",
                background: "white",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "left",
                width: "100%",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.background = "#eff6ff";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.background = "white";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <FileText
                style={{ flexShrink: 0, color: "#3b82f6" }}
                className="w-5 h-5"
              />
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Excel
                </p>
                <p
                  style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}
                >
                  Microsoft Excel format
                </p>
              </div>
            </button>

            <button
              className="ba-export-btn"
              onClick={exportToPDF}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem",
                background: "white",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "left",
                width: "100%",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.background = "#eff6ff";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.background = "white";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <FileText
                style={{ flexShrink: 0, color: "#3b82f6" }}
                className="w-5 h-5"
              />
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "0.25rem",
                  }}
                >
                  PDF
                </p>
                <p
                  style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}
                >
                  Printable document
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
