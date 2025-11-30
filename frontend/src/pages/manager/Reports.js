import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllAttendance } from '../../store/slices/attendanceSlice';
import Layout from '../../components/Layout';
import axios from 'axios';
import './Reports.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Reports = () => {
  const dispatch = useDispatch();
  const { allAttendance, loading } = useSelector((state) => state.attendance);
  const [filters, setFilters] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
  });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Fetch unique employees for dropdown
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/attendance/all`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000 },
        });
        const uniqueEmployees = Array.from(
          new Set(
            response.data.attendance.map((a) => ({
              id: a.employeeId,
              name: `${a.employeeId} - ${a.name}`,
            }))
          )
        );
        setEmployees(uniqueEmployees);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      dispatch(getAllAttendance(filters));
    }
  }, [dispatch, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.employeeId) params.append('employeeId', filters.employeeId);

      const response = await axios.get(`${API_URL}/attendance/export`, {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export CSV. Please try again.');
    }
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
      <div className="reports-page">
        <h1>Attendance Reports</h1>

        {/* Filters */}
        <div className="reports-filters">
          <h2>Generate Report</h2>
          <div className="filters-grid">
            <div className="filter-item">
              <label>Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                required
              />
            </div>
            <div className="filter-item">
              <label>End Date *</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                required
              />
            </div>
            <div className="filter-item">
              <label>Employee (Optional)</label>
              <select
                name="employeeId"
                value={filters.employeeId}
                onChange={handleFilterChange}
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <button
                onClick={handleExport}
                className="btn-export"
                disabled={!filters.startDate || !filters.endDate || loading}
              >
                Export to CSV
              </button>
            </div>
          </div>
        </div>

        {/* Report Table */}
        {filters.startDate && filters.endDate && (
          <div className="reports-table-card">
            <h2>
              Attendance Report ({allAttendance.length} records)
              {filters.employeeId && ` - Employee: ${filters.employeeId}`}
            </h2>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : allAttendance.length > 0 ? (
              <div className="table-container">
                <table className="reports-table">
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
              <div className="no-data">No attendance records found for the selected date range</div>
            )}
          </div>
        )}

        {(!filters.startDate || !filters.endDate) && (
          <div className="info-message">
            <p>Please select a date range to view and export attendance reports.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;

