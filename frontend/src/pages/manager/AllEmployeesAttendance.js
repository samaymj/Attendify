import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllAttendance } from '../../store/slices/attendanceSlice';
import Layout from '../../components/Layout';
import './AllEmployeesAttendance.css';

const AllEmployeesAttendance = () => {
  const dispatch = useDispatch();
  const { allAttendance, loading } = useSelector((state) => state.attendance);
  const [filters, setFilters] = useState({
    employeeId: '',
    date: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    dispatch(getAllAttendance(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const clearFilters = () => {
    setFilters({
      employeeId: '',
      date: '',
      status: '',
      startDate: '',
      endDate: '',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      present: '#27ae60',
      absent: '#e74c3c',
      late: '#f39c12',
      'half-day': '#e67e22',
    };
    return colors[status] || '#95a5a6';
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleString();
  };

  return (
    <Layout role="manager">
      <div className="all-attendance">
        <h1>All Employees Attendance</h1>

        {/* Filters */}
        <div className="filters-card">
          <h2>Filters</h2>
          <div className="filters-grid">
            <div className="filter-item">
              <label>Employee ID</label>
              <input
                type="text"
                name="employeeId"
                value={filters.employeeId}
                onChange={handleFilterChange}
                placeholder="e.g., EMP001"
              />
            </div>
            <div className="filter-item">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <label>Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
              </select>
            </div>
            <div className="filter-item">
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <label>End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <button onClick={clearFilters} className="btn-clear">
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="attendance-table-card">
          <h2>Attendance Records ({allAttendance.length})</h2>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : allAttendance.length > 0 ? (
            <div className="table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {allAttendance.map((record) => (
                    <tr key={record.id}>
                      <td>{record.employeeId}</td>
                      <td>{record.name}</td>
                      <td>{record.email}</td>
                      <td>{record.department || 'Unassigned'}</td>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">No attendance records found</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AllEmployeesAttendance;

