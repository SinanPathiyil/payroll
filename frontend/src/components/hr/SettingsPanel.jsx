import { useState } from 'react';
import { updateSettings } from '../../services/api';
import { Settings, Save } from 'lucide-react';

export default function SettingsPanel({ onSuccess }) {
  const [formData, setFormData] = useState({
    office_hours: {
      start: '09:00',
      end: '18:00'
    },
    required_hours: 8.0
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await updateSettings(formData);
      setMessage('Settings updated successfully!');
      if (onSuccess) onSuccess();
    } catch (error) {
      setMessage('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold">Global Settings</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <div className={`px-4 py-3 rounded ${
            message.includes('success') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Office Start Time
            </label>
            <input
              type="time"
              value={formData.office_hours.start}
              onChange={(e) => setFormData({
                ...formData,
                office_hours: { ...formData.office_hours, start: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Office End Time
            </label>
            <input
              type="time"
              value={formData.office_hours.end}
              onChange={(e) => setFormData({
                ...formData,
                office_hours: { ...formData.office_hours, end: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Required Hours per day
            <input
type="number"
step="0.5"
min="1"
max="12"
value={formData.required_hours}
onChange={(e) => setFormData({ ...formData, required_hours: parseFloat(e.target.value) })}
className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
/>    <button
      type="submit"
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
    >
      <Save className="w-4 h-4" />
      {loading ? 'Saving...' : 'Save Settings'}
    </button>
  </form>
</div>
);
}