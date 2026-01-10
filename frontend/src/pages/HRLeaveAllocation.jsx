import { useState, useEffect } from 'react';
import { Users, Plus, Search, AlertCircle, Save } from 'lucide-react';
import Layout from '../components/common/Layout';
import axios from 'axios';

export default function HRLeaveAllocation() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    year: new Date().getFullYear(),
    leave_type_code: '',
    days: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Load employees
      const empResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/hr/employees`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmployees(empResponse.data || []);

      // Load leave types
      const typesResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/leave/leave-types`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaveTypes(typesResponse.data.leave_types || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeBalance = async (employeeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/hr/leave/balances/${employeeId}?year=${formData.year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.balances || [];
    } catch (error) {
      console.error('Failed to load balance:', error);
      return [];
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/hr/leave/allocate-leaves`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowModal(false);
      setSelectedEmployee(null);
      alert('Leave allocated successfully!');
    } catch (error) {
      console.error('Failed to allocate:', error);
      setError(error.response?.data?.detail || 'Failed to allocate leaves');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="layout-loading">
          <div className="spinner spinner-lg"></div>
          <p className="layout-loading-text">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ba-dashboard">
        <div className="ba-dashboard-header">
          <div>
            <h1 className="ba-dashboard-title">Leave Allocation</h1>
            <p className="ba-dashboard-subtitle">
              Allocate additional leaves to employees
            </p>
          </div>
        </div>

        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Search className="w-5 h-5" />
              <span>Search Employees</span>
            </div>
          </div>
          <div className="ba-card-body">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ba-form-input"
            />
          </div>
        </div>

        <div className="ba-card">
          <div className="ba-card-header">
            <div className="ba-card-title">
              <Users className="w-5 h-5" />
              <span>Employees ({filteredEmployees.length})</span>
            </div>
          </div>
          <div className="ba-card-body">
            {filteredEmployees.length === 0 ? (
              <div className="ba-empty-state">
                <Users className="ba-empty-icon" />
                <p>No employees found</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                        {employee.full_name}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                        {employee.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setFormData({ ...formData, user_id: employee.id });
                        setShowModal(true);
                      }}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Allocate Leave</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && selectedEmployee && (
        <div className="ba-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ba-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="ba-modal-header">
              <div className="ba-modal-header-content">
                <Plus className="w-6 h-6" />
                <h2 className="ba-modal-title">Allocate Leave</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="ba-modal-close-btn">
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllocate}>
              <div className="ba-modal-body">
                {error && (
                  <div className="ba-alert ba-alert-error">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                )}

                <div style={{
                  padding: '1rem',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>
                    <strong>Employee:</strong> {selectedEmployee.full_name}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                    {selectedEmployee.email}
                  </p>
                </div>

                <div className="ba-form-group">
                  <label className="ba-form-label">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="ba-form-input"
                    required
                  >
                    {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="ba-form-group">
                  <label className="ba-form-label">
                    Leave Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.leave_type_code}
                    onChange={(e) => setFormData({ ...formData, leave_type_code: e.target.value })}
                    className="ba-form-input"
                    required
                  >
                    <option value="">-- Select Leave Type --</option>
                    {leaveTypes.map(type => (
                      <option key={type.code} value={type.code}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ba-form-group">
                  <label className="ba-form-label">
                    Days to Allocate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: parseFloat(e.target.value) })}
                    className="ba-form-input"
                    min="0"
                    step="0.5"
                    required
                  />
                </div>
              </div>

              <div className="ba-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="spinner spinner-sm"></div>
                      <span>Allocating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Allocate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}