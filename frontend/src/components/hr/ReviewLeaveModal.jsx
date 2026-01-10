import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import '../../styles/ba-modal.css';

export default function ReviewLeaveModal({ request, actionType, onClose, onSuccess }) {
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (actionType === 'reject' && !notes.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setError('');

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');

      if (actionType === 'approve') {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/hr/leave/requests/${request.id}/approve`,
          { hr_notes: notes },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/hr/leave/requests/${request.id}/reject`,
          { hr_notes: notes },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to process request:', error);
      setError(error.response?.data?.detail || 'Failed to process request');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            {actionType === 'approve' ? (
              <CheckCircle className="w-6 h-6" style={{ color: '#10b981' }} />
            ) : (
              <XCircle className="w-6 h-6" style={{ color: '#ef4444' }} />
            )}
            <h2 className="ba-modal-title">
              {actionType === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </h2>
          </div>
          <button onClick={onClose} className="ba-modal-close-btn">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="ba-modal-body">
          {error && (
            <div className="ba-alert ba-alert-error">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div style={{
            padding: '1rem',
            backgroundColor: actionType === 'approve' ? '#d1fae5' : '#fee2e2',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              <strong>{request.user_name}</strong> • {request.leave_type_name}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
              {formatDate(request.start_date)} → {formatDate(request.end_date)}
              ({request.total_days} days)
            </p>
          </div>

          <div className="ba-form-group">
            <label className="ba-form-label">
              Notes {actionType === 'reject' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="ba-form-textarea"
              rows="4"
              placeholder={
                actionType === 'approve'
                  ? 'Optional notes for the employee...'
                  : 'Please provide a reason for rejection (required)...'
              }
              required={actionType === 'reject'}
            />
          </div>
        </div>

        <div className="ba-modal-footer">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={processing || (actionType === 'reject' && !notes.trim())}
            style={{
              backgroundColor: actionType === 'approve' ? '#10b981' : '#ef4444'
            }}
          >
            {processing ? (
              <>
                <div className="spinner spinner-sm"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                {actionType === 'approve' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{actionType === 'approve' ? 'Approve' : 'Reject'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}