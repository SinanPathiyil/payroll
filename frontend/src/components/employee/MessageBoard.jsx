import { markAsRead } from '../../services/api';
import { Mail, MailOpen } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';

export default function MessageBoard({ messages, onMessageRead }) {
  const handleMarkRead = async (messageId) => {
    try {
      await markAsRead(messageId);
      onMessageRead();
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Messages</h2>
      </div>
      <div className="p-6">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No messages</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`border rounded-lg p-4 cursor-pointer transition ${
                  message.is_read 
                    ? 'border-gray-200 bg-white' 
                    : 'border-blue-200 bg-blue-50'
                }`}
                onClick={() => !message.is_read && handleMarkRead(message.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {message.is_read ? (
                      <MailOpen className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Mail className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {message.from_name || 'HR'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(message.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{message.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}