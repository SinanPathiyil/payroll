import { useState } from "react";
import { markAsRead } from "../../services/api";
import { Mail, MailOpen, CheckCircle, Send } from "lucide-react";
import { formatDateTime } from "../../utils/helpers";
import SendMessageModal from "./SendMessageModal";

export default function HRMessageBoard({
  messages,
  onMessageRead,
  onTaskMessageClick,
}) {
  const [showSendModal, setShowSendModal] = useState(false);

  const isTaskCompletedMessage = (message) => {
    return (
      message.task_id &&
      message.content.toLowerCase().includes("task completed")
    );
  };

  const filteredMessages = messages.filter((message) => {
    if (message.direction === "sent") return true;
    if (message.direction === "received") {
      return isTaskCompletedMessage(message);
    }
    return false;
  });

  const handleMessageClick = async (message) => {
    if (message.direction === "received" && isTaskCompletedMessage(message)) {
      if (!message.is_read) {
        try {
          await markAsRead(message.id);
          onMessageRead();
        } catch (error) {
          console.error("Failed to mark message as read:", error);
        }
      }

      if (message.task_id && onTaskMessageClick) {
        onTaskMessageClick(message.task_id);
      }
    }
  };

  return (
    <>
      <div className="message-board">
        <div className="message-board-header">
          <h2 className="message-board-title">Notifications</h2>
          <button
            onClick={() => setShowSendModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
        <div className="message-board-body">
          {filteredMessages.length === 0 ? (
            <div className="message-empty">
              <Mail className="message-empty-icon" />
              <p className="message-empty-text">No notifications</p>
            </div>
          ) : (
            <div className="message-list">
              {filteredMessages.map((message) => {
                const isSent = message.direction === "sent";
                const isReceived = message.direction === "received";

                return (
                  <div
                    key={message.id}
                    className={`message-item ${
                      isSent
                        ? "message-sent"
                        : message.is_read
                          ? "message-read"
                          : "message-unread"
                    }`}
                    onClick={() => handleMessageClick(message)}
                  >
                    {isReceived && (
                      <>
                        <div className="message-header">
                          <div className="message-meta">
                            <CheckCircle className="w-4 h-4 message-icon-success" />
                            {message.is_read ? (
                              <MailOpen className="w-4 h-4 message-icon-read" />
                            ) : (
                              <Mail className="w-4 h-4 message-icon-unread" />
                            )}
                            <span className="message-from">
                              {message.from_name || "Employee"}
                            </span>
                          </div>
                          <span className="message-time">
                            {formatDateTime(message.created_at)}
                          </span>
                        </div>
                        <p className="message-content">{message.content}</p>
                      </>
                    )}

                    {isSent && (
                      <>
                        <div className="message-header message-header-sent">
                          <span className="message-time">
                            {formatDateTime(message.created_at)}
                          </span>
                          <div className="message-meta">
                            <Send className="w-4 h-4 message-icon-sent" />
                            <span className="message-to">
                              To: {message.to_name || "Employee"}
                            </span>
                          </div>
                        </div>
                        <p className="message-content message-content-sent">
                          {message.content}
                        </p>
                        <div className="message-footer-sent">
                          <span className="message-status">✓ Sent by you</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showSendModal && (
        <SendMessageModal
          onClose={() => setShowSendModal(false)}
          onSuccess={() => {
            setShowSendModal(false);
            onMessageRead();
          }}
        />
      )}
    </>
  );
}
