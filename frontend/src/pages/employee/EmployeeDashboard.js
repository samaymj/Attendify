import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getEmployeeDashboard, checkIn, checkOut, getTodayStatus } from '../../store/slices/attendanceSlice';
import Layout from '../../components/Layout';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { dashboard, todayStatus, loading } = useSelector((state) => state.attendance);

  useEffect(() => {
    dispatch(getEmployeeDashboard());
    dispatch(getTodayStatus());
  }, [dispatch]);

  const handleCheckIn = async () => {
    await dispatch(checkIn());
    dispatch(getTodayStatus());
    dispatch(getEmployeeDashboard());
  };

  const handleCheckOut = async () => {
    await dispatch(checkOut());
    dispatch(getTodayStatus());
    dispatch(getEmployeeDashboard());
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString();
  };

  const getStatusColor = (status) => {
    const colors = {
      present: '#27ae60',
      absent: '#e74c3c',
      late: '#f39c12',
      'half-day': '#e67e22',
      not_checked_in: '#95a5a6',
    };
    return colors[status] || '#95a5a6';
  };

  if (loading && !dashboard) {
    return (
      <Layout role="employee">
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout role="employee">
      <div className="employee-dashboard">
        <h1>Welcome, {user?.name}!</h1>

        {/* Today's Status Card */}
        <div className="dashboard-card today-status">
          <h2>Today's Status</h2>
          <div className="status-info">
            <div className="status-badge" style={{ backgroundColor: getStatusColor(todayStatus?.status || dashboard?.today?.status) }}>
              {todayStatus?.status === 'not_checked_in' || dashboard?.today?.status === 'not_checked_in'
                ? 'Not Checked In'
                : (todayStatus?.status || dashboard?.today?.status || 'Not Checked In').toUpperCase()}
            </div>
            <div className="time-info">
              <p><strong>Check In:</strong> {formatTime(todayStatus?.checkInTime || dashboard?.today?.checkInTime)}</p>
              <p><strong>Check Out:</strong> {formatTime(todayStatus?.checkOutTime || dashboard?.today?.checkOutTime)}</p>
              {todayStatus?.totalHours && (
                <p><strong>Total Hours:</strong> {todayStatus.totalHours} hrs</p>
              )}
            </div>
          </div>
          <div className="action-buttons">
            {!todayStatus?.checkedIn && !dashboard?.today?.checkedIn ? (
              <button onClick={handleCheckIn} className="btn-checkin" disabled={loading}>
                Check In
              </button>
            ) : !todayStatus?.checkedOut && !dashboard?.today?.checkedOut ? (
              <button onClick={handleCheckOut} className="btn-checkout" disabled={loading}>
                Check Out
              </button>
            ) : (
              <p className="completed">Attendance completed for today</p>
            )}
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="dashboard-card">
          <h2>This Month's Summary</h2>
          {dashboard?.monthly && (
            <div className="summary-grid">
              <div className="summary-item present">
                <div className="summary-value">{dashboard.monthly.present || 0}</div>
                <div className="summary-label">Present</div>
              </div>
              <div className="summary-item absent">
                <div className="summary-value">{dashboard.monthly.absent || 0}</div>
                <div className="summary-label">Absent</div>
              </div>
              <div className="summary-item late">
                <div className="summary-value">{dashboard.monthly.late || 0}</div>
                <div className="summary-label">Late</div>
              </div>
              <div className="summary-item hours">
                <div className="summary-value">{parseFloat(dashboard.monthly.totalHours || 0).toFixed(1)}</div>
                <div className="summary-label">Total Hours</div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        <div className="dashboard-card">
          <h2>Recent Attendance (Last 7 Days)</h2>
          {dashboard?.recent && dashboard.recent.length > 0 ? (
            <div className="recent-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recent.map((record) => (
                    <tr key={record.id}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>
                        <span className="status-tag" style={{ backgroundColor: getStatusColor(record.status) }}>
                          {record.status}
                        </span>
                      </td>
                      <td>{formatTime(record.checkInTime)}</td>
                      <td>{formatTime(record.checkOutTime)}</td>
                      <td>{record.totalHours || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No recent attendance records</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <Link to="/employee/attendance" className="action-btn">
            Mark Attendance
          </Link>
          <Link to="/employee/history" className="action-btn">
            View Full History
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDashboard;

