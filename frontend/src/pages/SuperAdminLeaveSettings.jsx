import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { Settings, Save, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import '../styles/ba-dashboard.css';

export default function SuperAdminLeaveSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [settings, setSettings] = useState({
    enable_leave_system: true,
    enable_half_day_leave: true,
    enable_carry_forward: true,
    enable_document_attachment: true,
    enable_leave_calendar: true,
    enable_leave_notifications: true,
    enable_backdated_requests: false,
    enable_leave_encashment: false,
    workflow_type: 'tl_then_hr',
    auto_approve_wfh: false,
    require_tl_approval: true,
    require_hr_approval: true,
    max_advance_days: 90,
    min_notice_days: 1,
    require_document_after_days: 3,
    max_consecutive_days: null,
    block_weekend_sandwich: false,
    leave_year_start_month: 1,
    leave_year_start_day: 1,
    carry_forward_deadline_days: 90,
    max_carry_forward_percentage: 50,
    deduct_weekends: false,
    deduct_holidays: false,
    notify_on_request: true,
    notify_on_approval: true,
    notify_on_rejection: true,
    notify_approvers: true,
    reminder_pending_leaves_days: 7,
    allow_admin_override: true,
    allow_manual_balance_adjustment: true,
    allow_negative_balance: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/super-admin/leave/settings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/super-admin/leave/settings`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Settings...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ba-dashboard">
        {/* Header */}
        <div className="ba-dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/super-admin/leave')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="ba-dashboard-title">Leave System Settings</h1>
              <p className="ba-dashboard-subtitle">
                Configure all aspects of the leave management system
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner spinner-sm"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`ba-alert ba-alert-${message.type === 'success' ? 'warning' : 'error'}`} style={{ marginBottom: '1.5rem' }}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Feature Toggles */}
        <div className="ba-card">
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Feature Controls</h3>
          </div>
          <div className="ba-card-body">
            <div className="ba-form-grid">
              <ToggleSwitch
                label="Enable Leave System"
                checked={settings.enable_leave_system}
                onChange={(val) => handleChange('enable_leave_system', val)}
                description="Master switch for entire leave system"
              />
              <ToggleSwitch
                label="Enable Half-Day Leave"
                checked={settings.enable_half_day_leave}
                onChange={(val) => handleChange('enable_half_day_leave', val)}
                description="Allow employees to apply for half-day leaves"
              />
              <ToggleSwitch
                label="Enable Carry Forward"
                checked={settings.enable_carry_forward}
                onChange={(val) => handleChange('enable_carry_forward', val)}
                description="Allow unused leaves to carry forward"
              />
              <ToggleSwitch
                label="Enable Document Attachment"
                checked={settings.enable_document_attachment}
                onChange={(val) => handleChange('enable_document_attachment', val)}
                description="Allow uploading documents with leave requests"
              />
              <ToggleSwitch
                label="Enable Leave Calendar"
                checked={settings.enable_leave_calendar}
                onChange={(val) => handleChange('enable_leave_calendar', val)}
                description="Show team leave calendar view"
              />
              <ToggleSwitch
                label="Enable Notifications"
                checked={settings.enable_leave_notifications}
                onChange={(val) => handleChange('enable_leave_notifications', val)}
                description="Send email/system notifications"
              />
              <ToggleSwitch
                label="Allow Backdated Requests"
                checked={settings.enable_backdated_requests}
                onChange={(val) => handleChange('enable_backdated_requests', val)}
                description="Allow applying for past dates"
              />
              <ToggleSwitch
                label="Enable Leave Encashment"
                checked={settings.enable_leave_encashment}
                onChange={(val) => handleChange('enable_leave_encashment', val)}
                description="Allow converting leaves to cash"
              />
            </div>
          </div>
        </div>

        {/* Approval Workflow */}
        <div className="ba-card">
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Approval Workflow</h3>
          </div>
          <div className="ba-card-body">
            <div className="ba-form-grid">
              <div className="ba-form-group">
                <label className="ba-form-label">Workflow Type</label>
                <select
                  value={settings.workflow_type}
                  onChange={(e) => handleChange('workflow_type', e.target.value)}
                  className="ba-form-input"
                >
                  <option value="none">None (Auto-Approve)</option>
                  <option value="tl_only">Team Lead Only</option>
                  <option value="hr_only">HR Only</option>
                  <option value="tl_then_hr">Team Lead → HR</option>
                  <option value="hr_then_tl">HR → Team Lead</option>
                </select>
              </div>
              <ToggleSwitch
                label="Auto-Approve WFH"
                checked={settings.auto_approve_wfh}
                onChange={(val) => handleChange('auto_approve_wfh', val)}
                description="Automatically approve Work From Home requests"
              />
            </div>
          </div>
        </div>

        {/* Request Constraints */}
        <div className="ba-card">
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Request Constraints</h3>
          </div>
          <div className="ba-card-body">
            <div className="ba-form-grid">
              <div className="ba-form-group">
                <label className="ba-form-label">Max Advance Days</label>
                <input
                  type="number"
                  value={settings.max_advance_days}
                  onChange={(e) => handleChange('max_advance_days', parseInt(e.target.value))}
                  className="ba-form-input"
                  min="1"
                />
                <p className="ba-form-hint">How many days in advance can employees apply</p>
              </div>
              <div className="ba-form-group">
                <label className="ba-form-label">Minimum Notice Days</label>
                <input
                  type="number"
                  value={settings.min_notice_days}
                  onChange={(e) => handleChange('min_notice_days', parseInt(e.target.value))}
                  className="ba-form-input"
                  min="0"
                />
                <p className="ba-form-hint">Minimum notice period required</p>
              </div>
              <div className="ba-form-group">
                <label className="ba-form-label">Require Document After (Days)</label>
                <input
                  type="number"
                  value={settings.require_document_after_days}
                  onChange={(e) => handleChange('require_document_after_days', parseInt(e.target.value))}
                  className="ba-form-input"
                  min="1"
                />
                <p className="ba-form-hint">Require medical certificate after X days</p>
              </div>
              <div className="ba-form-group">
                <label className="ba-form-label">Max Consecutive Days (Optional)</label>
                <input
                  type="number"
                  value={settings.max_consecutive_days || ''}
                  onChange={(e) => handleChange('max_consecutive_days', e.target.value ? parseInt(e.target.value) : null)}
                  className="ba-form-input"
                  placeholder="No limit"
                />
                <p className="ba-form-hint">Limit maximum consecutive leave days</p>
              </div>
            </div>
            <div className="ba-form-grid" style={{ marginTop: '1rem' }}>
              <ToggleSwitch
                label="Block Weekend Sandwich"
                checked={settings.block_weekend_sandwich}
                onChange={(val) => handleChange('block_weekend_sandwich', val)}
                description="Prevent leave sandwich around weekends"
              />
            </div>
          </div>
        </div>

        {/* Leave Year Settings */}
        <div className="ba-card">
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Leave Year Configuration</h3>
          </div>
          <div className="ba-card-body">
            <div className="ba-form-grid">
              <div className="ba-form-group">
                <label className="ba-form-label">Leave Year Start Month</label>
                <select
                  value={settings.leave_year_start_month}
                  onChange={(e) => handleChange('leave_year_start_month', parseInt(e.target.value))}
                  className="ba-form-input"
                >
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
              <div className="ba-form-group">
                <label className="ba-form-label">Leave Year Start Day</label>
                <input
                  type="number"
                  value={settings.leave_year_start_day}
                  onChange={(e) => handleChange('leave_year_start_day', parseInt(e.target.value))}
                  className="ba-form-input"
                  min="1"
                  max="31"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Carry Forward Rules */}
        <div className="ba-card">
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Carry Forward Rules</h3>
          </div>
          <div className="ba-card-body">
            <div className="ba-form-grid">
              <div className="ba-form-group">
                <label className="ba-form-label">Carry Forward Deadline (Days)</label>
                <input
                  type="number"
                  value={settings.carry_forward_deadline_days}
                  onChange={(e) => handleChange('carry_forward_deadline_days', parseInt(e.target.value))}
                  className="ba-form-input"
                  min="1"
                />
                <p className="ba-form-hint">Use carried leaves within X days of new year</p>
              </div>
              <div className="ba-form-group">
                <label className="ba-form-label">Max Carry Forward (%)</label>
                <input
                  type="number"
                  value={settings.max_carry_forward_percentage}
                  onChange={(e) => handleChange('max_carry_forward_percentage', parseInt(e.target.value))}
                  className="ba-form-input"
                  min="0"
                  max="100"
                />
                <p className="ba-form-hint">Maximum percentage that can be carried forward</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Calculation */}
        <div className="ba-card">
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Leave Calculation</h3>
          </div>
          <div className="ba-card-body">
            <div className="ba-form-grid">
              <ToggleSwitch
                label="Deduct Weekends"
                checked={settings.deduct_weekends}
                onChange={(val) => handleChange('deduct_weekends', val)}
                description="Include weekends in leave calculation"
              />
              <ToggleSwitch
                label="Deduct Holidays"
                checked={settings.deduct_holidays}
                onChange={(val) => handleChange('deduct_holidays', val)}
                description="Include public holidays in leave calculation"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="ba-card">
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Notification Settings</h3>
          </div>
          <div className="ba-card-body">
            <div className="ba-form-grid">
              <ToggleSwitch
                label="Notify on Request"
                checked={settings.notify_on_request}
                onChange={(val) => handleChange('notify_on_request', val)}
                description="Notify approvers when leave is requested"
              />
              <ToggleSwitch
                label="Notify on Approval"
                checked={settings.notify_on_approval}
                onChange={(val) => handleChange('notify_on_approval', val)}
                description="Notify employee when leave is approved"
              />
              <ToggleSwitch
                label="Notify on Rejection"
                checked={settings.notify_on_rejection}
                onChange={(val) => handleChange('notify_on_rejection', val)}
                description="Notify employee when leave is rejected"
              />
              <ToggleSwitch
                label="Notify Approvers"
                checked={settings.notify_approvers}
                onChange={(val) => handleChange('notify_approvers', val)}
                description="Send notifications to pending approvers"
              />
            </div>
            <div className="ba-form-grid" style={{ marginTop: '1rem' }}>
              <div className="ba-form-group">
                <label className="ba-form-label">Reminder After (Days)</label>
                <input
                  type="number"
                  value={settings.reminder_pending_leaves_days}
                  onChange={(e) => handleChange('reminder_pending_leaves_days', parseInt(e.target.value))}
                  className="ba-form-input"
                  min="1"
                />
                <p className="ba-form-hint">Remind approvers after X days of pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="ba-card">
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Admin Controls</h3>
          </div>
          <div className="ba-card-body">
            <div className="ba-form-grid">
              <ToggleSwitch
                label="Allow Admin Override"
                checked={settings.allow_admin_override}
                onChange={(val) => handleChange('allow_admin_override', val)}
                description="Allow HR to force approve/reject"
              />
              <ToggleSwitch
                label="Allow Manual Balance Adjustment"
                checked={settings.allow_manual_balance_adjustment}
                onChange={(val) => handleChange('allow_manual_balance_adjustment', val)}
                description="Allow manual adjustment of leave balances"
              />
              <ToggleSwitch
                label="Allow Negative Balance"
                checked={settings.allow_negative_balance}
                onChange={(val) => handleChange('allow_negative_balance', val)}
                description="Allow employees to go into negative balance"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/super-admin/leave')}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner spinner-sm"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}

// Toggle Switch Component
function ToggleSwitch({ label, checked, onChange, description }) {
  return (
    <div className="ba-form-group">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <label className="ba-form-label" style={{ marginBottom: '0.25rem' }}>{label}</label>
          {description && <p className="ba-form-hint" style={{ margin: 0 }}>{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          style={{
            position: 'relative',
            width: '48px',
            height: '24px',
            backgroundColor: checked ? '#10b981' : '#d1d5db',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
            flexShrink: 0
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: checked ? '26px' : '2px',
              width: '20px',
              height: '20px',
              backgroundColor: 'white',
              borderRadius: '50%',
              transition: 'left 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          />
        </button>
      </div>
    </div>
  );
}