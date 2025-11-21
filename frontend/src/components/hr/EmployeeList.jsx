import { UserPlus } from 'lucide-react';
import { formatHours } from '../../utils/helpers';

export default function EmployeeList({ employees, onViewStats, onAddEmployee }) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <h2 className="dashboard-card-title">Employees</h2>
        <button
          onClick={onAddEmployee}
          className="btn btn-primary"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>
      <div className="dashboard-table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Hours Today</th>
              <th>Week Hours</th>
              <th>Productivity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="7" className="dashboard-table-empty">
                  No employees found. Add your first employee!
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="employee-name">{employee.full_name}</div>
                  </td>
                  <td className="employee-email">{employee.email}</td>
                  <td>
                    <span className={`status-chip ${
                      employee.today_status === 'active' ? 'active' : 'inactive'
                    }`}>
                      {employee.today_status === 'active' ? 'Active' : 'Offline'}
                    </span>
                  </td>
                  <td className="employee-hours">
                    {formatHours(employee.today_hours)} hrs
                  </td>
                  <td className="employee-hours">
                    {formatHours(employee.week_hours)} hrs
                  </td>
                  <td>
                    <span className={`employee-productivity ${
                      employee.productivity_score >= 70 ? 'employee-productivity-high' :
                      employee.productivity_score >= 50 ? 'employee-productivity-medium' :
                      'employee-productivity-low'
                    }`}>
                      {employee.productivity_score?.toFixed(0) || 0}%
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => onViewStats(employee)}
                      className="btn-link"
                    >
                      View Stats
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}