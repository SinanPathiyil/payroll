import { useState, useEffect } from "react";
import Layout from "../components/common/Layout";
import MessageBoard from "../components/employee/MessageBoard";
import { getMyMessages } from "../services/api";
import { MessageSquare, Mail, MailOpen } from "lucide-react";

export default function EmployeeMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, read

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await getMyMessages();
      setMessages(response.data || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === "all") return true;
    if (filter === "unread") return !msg.is_read;
    if (filter === "read") return msg.is_read;
    return true;
  });

  const stats = {
    total: messages.length,
    unread: messages.filter((m) => !m.is_read).length,
    read: messages.filter((m) => m.is_read).length,
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Messages...</p>
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
            <h1 className="ba-dashboard-title">Messages</h1>
            <p className="ba-dashboard-subtitle">Your inbox and notifications</p>
          </div>
        </div>

        {/* Stats */}
        <div className="ba-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Total Messages</p>
                <p className="ba-stat-value">{stats.total}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-blue">
                <MessageSquare className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Unread</p>
                <p className="ba-stat-value">{stats.unread}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-orange">
                <Mail className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="ba-stat-card">
            <div className="ba-stat-content">
              <div className="ba-stat-info">
                <p className="ba-stat-label">Read</p>
                <p className="ba-stat-value">{stats.read}</p>
              </div>
              <div className="ba-stat-icon ba-stat-icon-green">
                <MailOpen className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter('all')}
              >
                All ({stats.total})
              </button>
              <button
                className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter('unread')}
              >
                Unread ({stats.unread})
              </button>
              <button
                className={`btn ${filter === 'read' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter('read')}
              >
                Read ({stats.read})
              </button>
            </div>
          </div>
          <div className="ba-card-body" style={{ padding: 0 }}>
            <MessageBoard messages={filteredMessages} onMessageRead={loadMessages} />
          </div>
        </div>
      </div>
    </Layout>
  );
}