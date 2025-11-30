import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkIn, checkOut, getTodayStatus, clearError } from '../../store/slices/attendanceSlice';
import Layout from '../../components/Layout';
import './MarkAttendance.css';

const MarkAttendance = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { todayStatus, loading, error } = useSelector((state) => state.attendance);

  useEffect(() => {
    dispatch(getTodayStatus());
  }, [dispatch]);

  const handleCheckIn = async () => {
    dispatch(clearError());
    const result = await dispatch(checkIn());
    if (checkIn.fulfilled.match(result)) {
      dispatch(getTodayStatus());
    }
  };

  const handleCheckOut = async () => {
    dispatch(clearError());
    const result = await dispatch(checkOut());
    if (checkOut.fulfilled.match(result)) {
      dispatch(getTodayStatus());
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not recorded';
    return new Date(timeString).toLocaleString();
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

  return (
    <Layout role="employee">
      <div className="mark-attendance">
        <h1>Mark Attendance</h1>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <div className="attendance-card">
          <div className="card-header">
            <h2>Today's Attendance</h2>
            <p className="current-date">{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>

          <div className="status-section">
            <div className="status-badge-large" style={{ backgroundColor: getStatusColor(todayStatus?.status) }}>
              {todayStatus?.status === 'not_checked_in' 
                ? 'Not Checked In' 
                : (todayStatus?.status || 'Not Checked In').toUpperCase()}
            </div>
          </div>

          <div className="time-section">
            <div className="time-item">
              <div className="time-label">Check In Time</div>
              <div className="time-value">
                {todayStatus?.checkInTime 
                  ? formatTime(todayStatus.checkInTime) 
                  : 'Not checked in yet'}
              </div>
            </div>
            <div className="time-item">
              <div className="time-label">Check Out Time</div>
              <div className="time-value">
                {todayStatus?.checkOutTime 
                  ? formatTime(todayStatus.checkOutTime) 
                  : 'Not checked out yet'}
              </div>
            </div>
            {todayStatus?.totalHours && (
              <div className="time-item">
                <div className="time-label">Total Hours</div>
                <div className="time-value hours">{todayStatus.totalHours} hrs</div>
              </div>
            )}
          </div>

          <div className="action-section">
            {!todayStatus?.checkedIn ? (
              <button 
                onClick={handleCheckIn} 
                className="btn-checkin-large" 
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Check In'}
              </button>
            ) : !todayStatus?.checkedOut ? (
              <button 
                onClick={handleCheckOut} 
                className="btn-checkout-large" 
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Check Out'}
              </button>
            ) : (
              <div className="completed-message">
                <p>✓ Attendance completed for today</p>
                <p className="completed-time">
                  Worked: {todayStatus.totalHours} hours
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="info-section">
          <h3>Attendance Guidelines</h3>
          <ul>
            <li>Check in before 9:30 AM to be marked as present</li>
            <li>Check in after 9:30 AM will be marked as late</li>
            <li>Work less than 4 hours will be marked as half-day</li>
            <li>Remember to check out at the end of your work day</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default MarkAttendance;

