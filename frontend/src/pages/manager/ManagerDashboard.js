import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getManagerDashboard } from '../../store/slices/attendanceSlice';
import Layout from '../../components/Layout';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { dashboard, loading } = useSelector((state) => state.attendance);

  useEffect(() => {
    dispatch(getManagerDashboard());
  }, [dispatch]);

  if (loading && !dashboard) {
    return (
      <Layout role="manager">
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  const weeklyData = dashboard?.weeklyTrend?.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    present: parseInt(item.present) || 0,
    absent: parseInt(item.absent) || 0,
  })) || [];

  const deptData = dashboard?.departmentWise?.map((item) => ({
    department: item.department || 'Unassigned',
    present: parseInt(item.present) || 0,
    absent: parseInt(item.absent) || 0,
  })) || [];

  return (
    <Layout role="manager">
      <div className="manager-dashboard">
        <h1>Manager Dashboard</h1>
        <p className="welcome-text">Welcome, {user?.name}!</p>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total-employees">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{dashboard?.totalEmployees || 0}</div>
              <div className="stat-label">Total Employees</div>
            </div>
          </div>
          <div className="stat-card today-present">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{dashboard?.today?.present || 0}</div>
              <div className="stat-label">Present Today</div>
            </div>
          </div>
          <div className="stat-card today-absent">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-value">{dashboard?.today?.absent || 0}</div>
              <div className="stat-label">Absent Today</div>
            </div>
          </div>
          <div className="stat-card today-late">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <div className="stat-value">{dashboard?.today?.late || 0}</div>
              <div className="stat-label">Late Arrivals</div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          {/* Weekly Trend Chart */}
          <div className="dashboard-card chart-card">
            <h2>Weekly Attendance Trend</h2>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="present" stroke="#27ae60" strokeWidth={2} name="Present" />
                  <Line type="monotone" dataKey="absent" stroke="#e74c3c" strokeWidth={2} name="Absent" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No data available for the last 7 days</div>
            )}
          </div>

          {/* Department-wise Chart */}
          <div className="dashboard-card chart-card">
            <h2>Department-wise Attendance (This Month)</h2>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#27ae60" name="Present" />
                  <Bar dataKey="absent" fill="#e74c3c" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No department data available</div>
            )}
          </div>
        </div>

        {/* Absent Employees Today */}
        <div className="dashboard-card">
          <h2>Absent Employees Today</h2>
          {dashboard?.absentToday && dashboard.absentToday.length > 0 ? (
            <div className="absent-list">
              <table className="absent-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.absentToday.map((employee) => (
                    <tr key={employee.id}>
                      <td>{employee.employeeId}</td>
                      <td>{employee.name}</td>
                      <td>{employee.email}</td>
                      <td>{employee.department || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data">All employees are present today! 🎉</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ManagerDashboard;

