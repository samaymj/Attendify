import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMyHistory, getMySummary } from '../../store/slices/attendanceSlice';
import Layout from '../../components/Layout';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import './AttendanceHistory.css';

const AttendanceHistory = () => {
  const dispatch = useDispatch();
  const { history, summary, loading } = useSelector((state) => state.attendance);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'table'

  useEffect(() => {
    dispatch(getMyHistory({ month: selectedMonth, year: selectedYear }));
    dispatch(getMySummary({ month: selectedMonth, year: selectedYear }));
  }, [dispatch, selectedMonth, selectedYear]);

  const getStatusColor = (status) => {
    const colors = {
      present: '#27ae60',
      absent: '#e74c3c',
      late: '#f39c12',
      'half-day': '#e67e22',
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = history.find((h) => {
      const recordDate = typeof h.date === 'string' ? h.date.split('T')[0] : format(new Date(h.date), 'yyyy-MM-dd');
      return recordDate === dateStr;
    });
    return record ? record.status : null;
  };

  const getRecordForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return history.find((h) => {
      const recordDate = typeof h.date === 'string' ? h.date.split('T')[0] : format(new Date(h.date), 'yyyy-MM-dd');
      return recordDate === dateStr;
    });
  };

  const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
  const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week for the month
  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return format(new Date(timeString), 'HH:mm');
  };

  return (
    <Layout role="employee">
      <div className="attendance-history">
        <div className="page-header">
          <h1>My Attendance History</h1>
          <div className="view-toggle">
            <button
              className={viewMode === 'calendar' ? 'active' : ''}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
          </div>
        </div>

        {/* Month/Year Selector */}
        <div className="month-selector">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {format(new Date(selectedYear, month - 1), 'MMMM')}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Monthly Summary */}
        {summary && (
          <div className="monthly-summary">
            <div className="summary-card present">
              <div className="summary-value">{summary.present || 0}</div>
              <div className="summary-label">Present</div>
            </div>
            <div className="summary-card absent">
              <div className="summary-value">{summary.absent || 0}</div>
              <div className="summary-label">Absent</div>
            </div>
            <div className="summary-card late">
              <div className="summary-value">{summary.late || 0}</div>
              <div className="summary-label">Late</div>
            </div>
            <div className="summary-card halfday">
              <div className="summary-value">{summary.halfday || 0}</div>
              <div className="summary-label">Half Day</div>
            </div>
            <div className="summary-card hours">
              <div className="summary-value">{parseFloat(summary.totalHours || 0).toFixed(1)}</div>
              <div className="summary-label">Total Hours</div>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="calendar-view">
            <div className="calendar-header">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="calendar-day-header">
                  {day}
                </div>
              ))}
            </div>
            <div className="calendar-grid">
              {emptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="calendar-day empty"></div>
              ))}
              {daysInMonth.map((day) => {
                const status = getStatusForDate(day);
                const record = getRecordForDate(day);
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className={`calendar-day ${status ? `status-${status}` : ''} ${isToday ? 'today' : ''}`}
                    title={record ? `${format(day, 'MMM dd')}: ${status}` : format(day, 'MMM dd')}
                  >
                    <div className="day-number">{format(day, 'd')}</div>
                    {status && (
                      <div
                        className="status-indicator"
                        style={{ backgroundColor: getStatusColor(status) }}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#27ae60' }}></div>
                <span>Present</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#e74c3c' }}></div>
                <span>Absent</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#f39c12' }}></div>
                <span>Late</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#e67e22' }}></div>
                <span>Half Day</span>
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="table-view">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : history.length > 0 ? (
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => {
                    const date = typeof record.date === 'string' 
                      ? parseISO(record.date) 
                      : new Date(record.date);
                    return (
                      <tr key={record.id}>
                        <td>{format(date, 'MMM dd, yyyy')}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(record.status) }}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td>{formatTime(record.checkInTime)}</td>
                        <td>{formatTime(record.checkOutTime)}</td>
                        <td>{record.totalHours || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="no-data">No attendance records found for this month</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AttendanceHistory;

