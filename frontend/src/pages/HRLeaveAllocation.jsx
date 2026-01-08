import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import {
  ArrowLeft,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Filter,
  Search,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  X,
  Users,
  Calendar,
  Download
} from 'lucide-react';
import axios from 'axios';
import '../styles/ba-dashboard.css';
import '../styles/ba-modal.css';

export default function HRLeaveAllocation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [showBulkAllocateModal, setShowBulkAllocateModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    adjustment: 0,
    reason: ''
  });
  const [bulkYear, setBulkYear] = useState(new Date().getFullYear());
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Filters
  const [filters, setFilters] = useState({
    searchText: '',
    leaveType: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [employees, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Load all employees
      const employeesRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/hr/employees`,
        { headers }
      );

      // Load leave types
      const leaveTypesRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/employee/leave/types`,
        { headers }
      );

      setLeaveTypes(leaveTypesRes.data || []);

      // For each employee, load their leave balance
      const employeesWithBalances = await Promise.all(
        (employeesRes.data || []).map(async (emp) => {
          try {
            const balanceRes = await axios.get(
              `${import.meta.env.VITE_API_URL}/hr/leave/employee/${emp.id}/balance`,
              { headers }
            );
            return { ...emp, balances: balanceRes.data || [] };
          } catch (error) {
            return { ...emp, balances: [] };
          }
        })
      );

      setEmployees(employeesWithBalances);
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage({ type: 'error', text: 'Failed to load allocation data' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...employees];

    // Search by employee name or email
    if (filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.full_name.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower)
      );
    }

    setFilteredEmployees(filtered);
  };

  const toggleRowExpansion = (employeeId) => {
    if (expandedRows.includes(employeeId)) {
      setExpandedRows(expandedRows.filter(id => id !== employeeId));
    } else {
      setExpandedRows([...expandedRows, employeeId]);
    }
  };

  const handleBulkAllocate = async () => {
    if (!bulkYear) {
      setMessage({ type: 'error', text: 'Please select a year' });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/hr/leave/allocate-balances?year=${bulkYear}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ 
        type: 'success', 
        text: `Leave balances allocated successfully for ${bulkYear}` 
      });
      setShowBulkAllocateModal(false);
      loadData();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to allocate:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to allocate balances' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualAdjustment = async () => {
    // Note: This endpoint doesn't exist in the backend yet
    // You'll need to add it to your backend: POST /hr/leave/adjust-balance
    // Expected payload: { user_id, leave_type_code, adjustment, reason }
    
    if (!adjustmentData.reason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason for adjustment' });
      return;
    }

    if (adjustmentData.adjustment === 0) {
      setMessage({ type: 'error', text: 'Adjustment cannot be zero' });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // TODO: Add this endpoint to your backend
      await axios.post(
        `${import.meta.env.VITE_API_URL}/hr/leave/adjust-balance`,
        {
          user_id: selectedEmployee.id,
          leave_type_code: selectedLeaveType.leave_type_code,
          adjustment: parseFloat(adjustmentData.adjustment),
          reason: adjustmentData.reason.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage({ 
        type: 'success', 
        text: 'Leave balance adjusted successfully' 
      });
      setShowAdjustModal(false);
      setSelectedEmployee(null);
      setSelectedLeaveType(null);
      setAdjustmentData({ adjustment: 0, reason: '' });
      loadData();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Failed to adjust:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to adjust balance. API endpoint may not be implemented yet.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalBalance = (employee) => {
    return employee.balances.reduce((sum, b) => sum + b.available, 0);
  };

  const hasLowBalance = (balance) => {
    return balance.available < balance.allocated * 0.2; // Less than 20%
  };

  const hasNegativeBalance = (balance) => {
    return balance.available < 0;
  };

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading Allocation Data...</p>
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
              onClick={() => navigate('/hr/leave')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="ba-dashboard-title">Leave Allocation</h1>
              <p className="ba-dashboard-subtitle">
                Manage employee leave balances and allocations
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowBulkAllocateModal(true)}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Bulk Allocate</span>
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`ba-alert ba-alert-${message.type === 'success' ? 'warning' : 'error'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Filters */}
        <div className="ba-card" style={{ marginBottom: '1.5rem' }}>
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter className="w-5 h-5" />
              Filters
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setFilters({ searchText: '', leaveType: '' })}
            >
              Clear All
            </button>
          </div>
          <div className="ba-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {/* Search */}
              <div className="ba-form-group" style={{ marginBottom: 0 }}>
                <label className="ba-form-label">Search Employee</label>
                <div style={{ position: 'relative' }}>
                  <Search className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                  <input
                    type="text"
                    value={filters.searchText}
                    onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                    className="ba-form-input"
                    placeholder="Search by name or email..."
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Allocation Table */}
        <div className="ba-card">
          <div className="ba-card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
              Employee Leave Balances
            </h3>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {filteredEmployees.length} Employee{filteredEmployees.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="ba-card-body" style={{ padding: 0 }}>
            {filteredEmployees.length === 0 ? (
              <div className="ba-empty-state">
                <Users className="ba-empty-icon" />
                <p>No employees found</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700' }}>Employee</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>Total Balance</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>Leave Types</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => {
                      const isExpanded = expandedRows.includes(employee.id);
                      const totalBalance = getTotalBalance(employee);

                      return (
                        <>
                          {/* Main Row */}
                          <tr
                            key={employee.id}
                            style={{ borderBottom: '1px solid #e5e7eb' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <td style={{ padding: '1rem' }}>
                              <div>
                                <p style={{ fontWeight: '600', margin: 0 }}>{employee.full_name}</p>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                                  {employee.email}
                                </p>
                              </div>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <span style={{ 
                                fontSize: '1.25rem', 
                                fontWeight: '700',
                                color: totalBalance < 5 ? '#ef4444' : '#10b981'
                              }}>
                                {totalBalance} days
                              </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <span className="ba-stat-badge info">
                                {employee.balances.length} Type{employee.balances.length !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => toggleRowExpansion(employee.id)}
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Row - Leave Type Details */}
                          {isExpanded && (
                            <tr>
                              <td colSpan="4" style={{ padding: 0, backgroundColor: '#f9fafb' }}>
                                <div style={{ padding: '1.5rem' }}>
                                  {employee.balances.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                      <AlertCircle className="w-8 h-8" style={{ margin: '0 auto 0.5rem' }} />
                                      <p>No leave balances allocated yet</p>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                      {employee.balances.map((balance, index) => (
                                        <div
                                          key={index}
                                          style={{
                                            padding: '1.25rem',
                                            background: `linear-gradient(135deg, ${balance.color}10, ${balance.color}20)`,
                                            border: `2px solid ${balance.color}40`,
                                            borderRadius: '12px',
                                            display: 'grid',
                                            gridTemplateColumns: 'auto 1fr auto',
                                            gap: '1.5rem',
                                            alignItems: 'center'
                                          }}
                                        >
                                          {/* Leave Type Name */}
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                              width: '16px',
                                              height: '16px',
                                              borderRadius: '50%',
                                              backgroundColor: balance.color,
                                              boxShadow: `0 0 0 3px ${balance.color}30`
                                            }} />
                                            <div>
                                              <p style={{ fontWeight: '700', fontSize: '1rem', margin: 0 }}>
                                                {balance.leave_type_name}
                                              </p>
                                            </div>
                                          </div>

                                          {/* Balance Stats */}
                                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem' }}>
                                            <div>
                                              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Allocated
                                              </p>
                                              <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                                                {balance.allocated}
                                              </p>
                                            </div>
                                            <div>
                                              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Used
                                              </p>
                                              <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                                                {balance.used}
                                              </p>
                                            </div>
                                            <div>
                                              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Pending
                                              </p>
                                              <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                                                {balance.pending}
                                              </p>
                                            </div>
                                            <div>
                                              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Available
                                              </p>
                                              <p style={{ 
                                                fontSize: '1.25rem', 
                                                fontWeight: '700', 
                                                margin: 0,
                                                color: hasNegativeBalance(balance) ? '#ef4444' : 
                                                       hasLowBalance(balance) ? '#f59e0b' : 
                                                       balance.color
                                              }}>
                                                {balance.available}
                                                {hasNegativeBalance(balance) && ' ⚠️'}
                                                {hasLowBalance(balance) && !hasNegativeBalance(balance) && ' ⚠️'}
                                              </p>
                                            </div>
                                          </div>

                                          {/* Adjust Button */}
                                          <div>
                                            <button
                                              className="btn btn-primary btn-sm"
                                              onClick={() => {
                                                setSelectedEmployee(employee);
                                                setSelectedLeaveType(balance);
                                                setShowAdjustModal(true);
                                              }}
                                            >
                                              <TrendingUp className="w-4 h-4" />
                                              <span>Adjust</span>
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Allocate Modal */}
        {showBulkAllocateModal && (
          <div className="ba-modal-overlay" onClick={() => setShowBulkAllocateModal(false)}>
            <div className="ba-modal-container ba-modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="ba-modal-header">
                <div className="ba-modal-header-content">
                  <TrendingUp className="w-6 h-6" style={{ color: '#10b981' }} />
                  <h2 className="ba-modal-title">Bulk Allocate Leaves</h2>
                </div>
                <button onClick={() => setShowBulkAllocateModal(false)} className="ba-modal-close-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="ba-modal-body">
                <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                  This will allocate leave balances to all active employees based on the configured leave policies for the selected year.
                </p>
                <div className="ba-form-group">
                  <label className="ba-form-label">
                    Select Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={bulkYear}
                    onChange={(e) => setBulkYear(parseInt(e.target.value))}
                    className="ba-form-input"
                    min="2020"
                    max="2050"
                  />
                </div>
                <div className="ba-alert ba-alert-warning">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <strong>Note:</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                      This will only create balances that don't already exist. Existing balances will not be overwritten.
                    </p>
                  </div>
                </div>
              </div>
              <div className="ba-modal-footer">
                <button onClick={() => setShowBulkAllocateModal(false)} className="btn btn-secondary" disabled={submitting}>
                  Cancel
                </button>
                <button onClick={handleBulkAllocate} className="btn btn-success" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="spinner spinner-sm"></div>
                      <span>Allocating...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      <span>Allocate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Adjustment Modal */}
        {showAdjustModal && selectedEmployee && selectedLeaveType && (
          <div className="ba-modal-overlay" onClick={() => setShowAdjustModal(false)}>
            <div className="ba-modal-container ba-modal-small" onClick={(e) => e.stopPropagation()}>
              <div className="ba-modal-header">
                <div className="ba-modal-header-content">
                  <TrendingUp className="w-6 h-6" style={{ color: '#3b82f6' }} />
                  <h2 className="ba-modal-title">Adjust Leave Balance</h2>
                </div>
                <button onClick={() => setShowAdjustModal(false)} className="ba-modal-close-btn">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="ba-modal-body">
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Employee:</strong> {selectedEmployee.full_name}</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Leave Type:</strong> {selectedLeaveType.leave_type_name}</p>
                  <p style={{ margin: '0' }}><strong>Current Available:</strong> {selectedLeaveType.available} days</p>
                </div>

                <div className="ba-form-group">
                  <label className="ba-form-label">
                    Adjustment Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={adjustmentData.adjustment}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, adjustment: e.target.value })}
                    className="ba-form-input"
                    placeholder="Enter positive number to add, negative to subtract"
                  />
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    Use positive numbers to add (e.g., 5) or negative to subtract (e.g., -3)
                  </p>
                </div>

                <div className="ba-form-group">
                  <label className="ba-form-label">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={adjustmentData.reason}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                    className="ba-form-textarea"
                    rows="3"
                    placeholder="Provide a reason for this adjustment..."
                    required
                  />
                </div>

                {adjustmentData.adjustment !== 0 && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: parseFloat(adjustmentData.adjustment) > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `2px solid ${parseFloat(adjustmentData.adjustment) > 0 ? '#10b981' : '#ef4444'}30`,
                    borderRadius: '8px'
                  }}>
                    <p style={{ margin: 0, fontWeight: '600' }}>
                      New Available Balance: {selectedLeaveType.available + parseFloat(adjustmentData.adjustment || 0)} days
                    </p>
                  </div>
                )}

                <div className="ba-alert ba-alert-warning" style={{ marginTop: '1rem' }}>
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <strong>Note:</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                      This feature requires a backend API endpoint that may not be implemented yet. 
                      Contact your developer to add: POST /hr/leave/adjust-balance
                    </p>
                  </div>
                </div>
              </div>
              <div className="ba-modal-footer">
                <button onClick={() => setShowAdjustModal(false)} className="btn btn-secondary" disabled={submitting}>
                  Cancel
                </button>
                <button 
                  onClick={handleManualAdjustment} 
                  className="btn btn-primary" 
                  disabled={submitting || !adjustmentData.reason.trim() || adjustmentData.adjustment === 0}
                >
                  {submitting ? (
                    <>
                      <div className="spinner spinner-sm"></div>
                      <span>Adjusting...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      <span>Apply Adjustment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}