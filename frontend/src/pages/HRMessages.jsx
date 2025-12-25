import { useState, useEffect } from "react";
import Layout from "../components/common/Layout";
import HRMessageBoard from "../components/hr/HRMessageBoard";
import SendMessageModal from "../components/hr/SendMessageModal";
import { getMyMessages } from "../services/api";
import { MessageSquare, Mail, MailOpen, Send } from "lucide-react";

export default function HRMessages() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [showSendModal, setShowSendModal] = useState(false); // ← MOVED HERE

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
            <p className="ba-dashboard-subtitle">
              View and manage employee messages
            </p>
          </div>
          <button
            onClick={() => setShowSendModal(true)}
            className="btn btn-primary"
          >
            <Send className="w-4 h-4" />
            <span>Send Message</span>
          </button>
        </div>

        {/* Stats */}
        <div
          className="ba-stats-grid"
          style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
        >
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

        {/* Messages Board */}
        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <MessageSquare className="w-5 h-5" />
              <span>All Messages</span>
            </div>
          </div>
          <div className="ba-card-body" style={{ padding: 0 }}>
            <HRMessageBoard messages={messages} onMessageRead={loadMessages} />
          </div>
        </div>
      </div>

      {/* Modal at Page Level */}
      {showSendModal && (
        <SendMessageModal
          onClose={() => setShowSendModal(false)}
          onSuccess={() => {
            setShowSendModal(false);
            loadMessages();
          }}
        />
      )}
    </Layout>
  );
}