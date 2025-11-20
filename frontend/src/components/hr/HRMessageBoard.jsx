import { useState } from 'react';
import { markAsRead } from '../../services/api';
import { Mail, MailOpen, CheckCircle, Send } from 'lucide-react';
import { formatDateTime } from '../../utils/helpers';
import SendMessageModal from './SendMessageModal';

export default function HRMessageBoard({ messages, onMessageRead, onTaskMessageClick }) {
  const [showSendModal, setShowSendModal] = useState(false);
  
  // Helper function to check if message is task-related
  const isTaskMessage = (message) => {
    return message.task_id || message.content.toLowerCase().includes('task completed');
  };

  const handleMessageClick = async (message) => {
    console.log('📧 HR Message clicked:', message);
    console.log('📋 Task ID:', message.task_id);
    
    // Mark as read if unread
    if (!message.is_read) {
      try {
        await markAsRead(message.id);
        onMessageRead();
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }

    // If message has a task_id, trigger scroll to task
    if (message.task_id && onTaskMessageClick) {
      console.log('🎯 Triggering scroll to task:', message.task_id);
      onTaskMessageClick(message.task_id);
    } else {
      console.log('⚠️ No task_id found or no callback');
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <button
            onClick={() => setShowSendModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
          >
            <Send className="w-4 h-4" />
            Send Message
          </button>
        </div>
        <div className="p-6">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`border rounded-lg p-4 cursor-pointer transition hover:shadow-md ${
                    message.is_read 
                      ? 'border-gray-200 bg-white' 
                      : 'border-blue-200 bg-blue-50'
                  } ${isTaskMessage(message) ? 'hover:border-green-300' : ''}`}
                  onClick={() => handleMessageClick(message)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isTaskMessage(message) && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {message.is_read ? (
                        <MailOpen className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Mail className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {message.from_name || 'Employee'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(message.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{message.content}</p>
                  {isTaskMessage(message) && (
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      💡 Click to view task
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Send Message Modal */}
      {showSendModal && (
        <SendMessageModal
          position="right"  /* Change to "center" for center positioning */
          onClose={() => setShowSendModal(false)}
          onSuccess={() => {
            setShowSendModal(false);
            onMessageRead(); // Refresh messages
          }}
        />
      )}
    </>
  );
}