import { formatDateTime, formatHours } from '../../utils/helpers';
import { Calendar, Clock, LogIn, LogOut } from 'lucide-react';

export default function AttendanceTable({ records }) {
  return (
    <div className="attendance-table-container">
      <div className="attendance-table-header">
        <Calendar className="w-5 h-5" />
        <h3 className="attendance-table-title">Attendance Records</h3>
      </div>
      <div className="attendance-table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Login Time</th>
              <th>Logout Time</th>
              <th>Total Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="5" className="attendance-table-empty">
                  <Clock className="attendance-empty-icon" />
                  <p>No attendance records found</p>
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr key={index}>
                  <td className="attendance-table-date">
                    {record.date}
                  </td>
                  <td className="attendance-table-time">
                    <LogIn className="w-3.5 h-3.5 inline mr-1.5 opacity-50" />
                    {formatDateTime(record.login_time)}
                  </td>
                  <td className="attendance-table-time">
                    {record.logout_time ? (
                      <>
                        <LogOut className="w-3.5 h-3.5 inline mr-1.5 opacity-50" />
                        {formatDateTime(record.logout_time)}
                      </>
                    ) : (
                      <span className="attendance-table-dash">-</span>
                    )}
                  </td>
                  <td className="attendance-table-hours">
                    {formatHours(record.total_hours)} hrs
                  </td>
                  <td>
                    <span className={`status-chip ${
                      record.status === 'completed' ? 'success' : 'warning'
                    }`}>
                      {record.status}
                    </span>
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