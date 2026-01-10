import { useState } from 'react';
import { Download, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import '../../styles/ba-modal.css';

export default function ImportHolidaysModal({ onClose, onSuccess }) {
  const [importData, setImportData] = useState({
    country: 'US',
    year: new Date().getFullYear(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Country list for import
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'IN', name: 'India' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'BR', name: 'Brazil' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'MX', name: 'Mexico' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' },
  ];

  const handleImport = async () => {
    setError('');

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/leave/holidays/import`,
        importData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`✅ Successfully imported ${response.data.imported_count} holidays for ${importData.year}`);
      onSuccess();
    } catch (error) {
      console.error('Failed to import holidays:', error);
      setError(error.response?.data?.detail || 'Failed to import holidays');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ba-modal-overlay" onClick={onClose}>
      <div className="ba-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="ba-modal-header">
          <div className="ba-modal-header-content">
            <Download className="w-6 h-6" />
            <h2 className="ba-modal-title">Import Public Holidays</h2>
          </div>
          <button onClick={onClose} className="ba-modal-close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="ba-modal-body">
          {error && (
            <div className="ba-alert ba-alert-error">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="ba-form-group">
            <label className="ba-form-label">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              value={importData.country}
              onChange={(e) => setImportData({ ...importData, country: e.target.value })}
              className="ba-form-input"
            >
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Select the country to import holidays from
            </p>
          </div>

          <div className="ba-form-group">
            <label className="ba-form-label">
              Year <span className="text-red-500">*</span>
            </label>
            <select
              value={importData.year}
              onChange={(e) => setImportData({ ...importData, year: parseInt(e.target.value) })}
              className="ba-form-input"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Select the year to import holidays for
            </p>
          </div>

          {/* Info Box */}
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#eff6ff', 
            borderRadius: '8px', 
            border: '1px solid #bfdbfe',
            fontSize: '0.875rem',
            color: '#1e40af',
            marginTop: '1rem'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
              ℹ️ What happens when you import?
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              <li>Official public holidays from <strong>{countries.find(c => c.code === importData.country)?.name || 'the selected country'}</strong> will be imported</li>
              <li>Holidays that already exist will be skipped automatically</li>
              <li>You can edit or delete imported holidays later</li>
            </ul>
          </div>
        </div>

        <div className="ba-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="spinner spinner-sm"></div>
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Import Holidays</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}