import { markAsRead } from '../../services/api';
import { Mail, MailOpen, ListTodo } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

export default function MessageBoard({ messages, onMessageRead, onTaskMessageClick }) {
  const isTaskMessage = (message) => {
    return message.task_id || 
           message.content.toLowerCase().includes('task assigned') ||
           message.content.toLowerCase().includes('regarding task');
  };

  const handleMessageClick = async (message) => {
    if (!message.is_read) {
      try {
        await markAsRead(message.id);
        onMessageRead();
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }

    if (message.task_id && onTaskMessageClick) {
      onTaskMessageClick(message.task_id);
    }
  };

  return (
    <div className="message-board">
      <div className="message-board-header">
        <h2 className="message-board-title">Messages</h2>
      </div>
      <div className="message-board-body">
        {messages.length === 0 ? (
          <div className="message-empty">
            <Mail className="message-empty-icon" />
            <p className="message-empty-text">No messages</p>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-item ${
                  isTaskMessage(message) ? 'message-task' : ''
                } ${message.is_read ? 'message-read' : 'message-unread'}`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="message-header">
                  <div className="message-meta">
                    {isTaskMessage(message) && (
                      <ListTodo className="w-4 h-4 message-icon-task" />
                    )}
                    {message.is_read ? (
                      <MailOpen className="w-4 h-4 message-icon-read" />
                    ) : (
                      <Mail className="w-4 h-4 message-icon-unread" />
                    )}
                    <span className="message-from">
                      {message.from_name || 'HR'}
                    </span>
                  </div>
                  <span className="message-time">
                    {formatDateTime(message.created_at)}
                  </span>
                </div>
                <p className="message-content">{message.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}