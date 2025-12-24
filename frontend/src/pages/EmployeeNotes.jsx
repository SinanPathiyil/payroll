import Layout from "../components/common/Layout";
import StickyNotes from "../components/employee/StickyNotes";
import { StickyNote } from "lucide-react";

export default function EmployeeNotes() {
  return (
    <Layout>
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div>
            <h1 className="ba-dashboard-title">My Notes</h1>
            <p className="ba-dashboard-subtitle">Quick notes and reminders</p>
          </div>
        </div>

        {/* Notes Section */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <StickyNote className="w-5 h-5" />
              <span>Sticky Notes</span>
            </div>
          </div>
          <div className="ba-card-body">
            <StickyNotes />
          </div>
        </div>
      </div>
    </Layout>
  );
}