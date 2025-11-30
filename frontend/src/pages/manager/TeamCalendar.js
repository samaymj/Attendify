import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllAttendance } from '../../store/slices/attendanceSlice';
import Layout from '../../components/Layout';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import './TeamCalendar.css';

const TeamCalendar = () => {
  const dispatch = useDispatch();
  const { allAttendance, loading } = useSelector((state) => state.attendance);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState('');

  useEffect(() => {
    const filters = {
      startDate: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`,
      endDate: format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd'),
    };
    if (selectedEmployee) {
      filters.employeeId = selectedEmployee;
    }
    dispatch(getAllAttendance(filters));
  }, [dispatch, selectedMonth, selectedYear, selectedEmployee]);

  // Get unique employees for filter
  const employees = Array.from(
    new Set(allAttendance.map((a) => `${a.employeeId} - ${a.name}`))
  ).sort();

  const getStatusColor = (status) => {
    const colors = {
      present: '#27ae60',
      absent: '#e74c3c',
      late: '#f39c12',
      'half-day': '#e67e22',
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusForDate = (date, employeeId) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = allAttendance.find((a) => {
      const recordDate = typeof a.date === 'string' 
        ? a.date.split('T')[0] 
        : format(new Date(a.date), 'yyyy-MM-dd');
      return recordDate === dateStr && 
        (!employeeId || a.employeeId === employeeId);
    });
    return record ? record.status : null;
  };

  const getRecordsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allAttendance.filter((a) => {
      const recordDate = typeof a.date === 'string' 
        ? a.date.split('T')[0] 
        : format(new Date(a.date), 'yyyy-MM-dd');
      return recordDate === dateStr;
    });
  };

  const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
  const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  // Group attendance by employee for the selected month
  const attendanceByEmployee = {};
  allAttendance.forEach((record) => {
    const empKey = `${record.employeeId} - ${record.name}`;
    if (!attendanceByEmployee[empKey]) {
      attendanceByEmployee[empKey] = [];
    }
    attendanceByEmployee[empKey].push(record);
  });

  return (
    <Layout role="manager">
      <div className="team-calendar">
        <div className="page-header">
          <h1>Team Calendar View</h1>
          <div className="calendar-controls">
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
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp} value={emp.split(' - ')[0]}>
                  {emp}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Calendar Grid */}
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
              const records = getRecordsForDate(day);
              const isToday = isSameDay(day, new Date());
              const statuses = records.map((r) => r.status);
              const presentCount = statuses.filter((s) => s === 'present').length;
              const absentCount = statuses.filter((s) => s === 'absent').length;
              const lateCount = statuses.filter((s) => s === 'late').length;
              const halfDayCount = statuses.filter((s) => s === 'half-day').length;

              return (
                <div
                  key={day.toISOString()}
                  className={`calendar-day ${isToday ? 'today' : ''}`}
                  title={`${format(day, 'MMM dd')}: ${records.length} records`}
                >
                  <div className="day-number">{format(day, 'd')}</div>
                  {records.length > 0 && (
                    <div className="day-stats">
                      {presentCount > 0 && (
                        <div className="stat-dot" style={{ backgroundColor: '#27ae60' }} title={`${presentCount} Present`}>
                          {presentCount}
                        </div>
                      )}
                      {lateCount > 0 && (
                        <div className="stat-dot" style={{ backgroundColor: '#f39c12' }} title={`${lateCount} Late`}>
                          {lateCount}
                        </div>
                      )}
                      {halfDayCount > 0 && (
                        <div className="stat-dot" style={{ backgroundColor: '#e67e22' }} title={`${halfDayCount} Half Day`}>
                          {halfDayCount}
                        </div>
                      )}
                      {absentCount > 0 && (
                        <div className="stat-dot" style={{ backgroundColor: '#e74c3c' }} title={`${absentCount} Absent`}>
                          {absentCount}
                        </div>
                      )}
                    </div>
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

        {/* Employee Attendance Summary */}
        {!selectedEmployee && (
          <div className="employee-summary">
            <h2>Employee Attendance Summary</h2>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : Object.keys(attendanceByEmployee).length > 0 ? (
              <div className="summary-table-container">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Late</th>
                      <th>Half Day</th>
                      <th>Total Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(attendanceByEmployee).map(([empKey, records]) => {
                      const present = records.filter((r) => r.status === 'present').length;
                      const absent = records.filter((r) => r.status === 'absent').length;
                      const late = records.filter((r) => r.status === 'late').length;
                      const halfDay = records.filter((r) => r.status === 'half-day').length;
                      return (
                        <tr key={empKey}>
                          <td>{empKey}</td>
                          <td className="stat-present">{present}</td>
                          <td className="stat-absent">{absent}</td>
                          <td className="stat-late">{late}</td>
                          <td className="stat-halfday">{halfDay}</td>
                          <td>{records.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">No attendance data for this month</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeamCalendar;

