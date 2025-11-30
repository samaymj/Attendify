import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './store/slices/authSlice';

// Employee Pages
import EmployeeLogin from './pages/employee/EmployeeLogin';
import EmployeeRegister from './pages/employee/EmployeeRegister';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MarkAttendance from './pages/employee/MarkAttendance';
import AttendanceHistory from './pages/employee/AttendanceHistory';
import EmployeeProfile from './pages/employee/EmployeeProfile';

// Manager Pages
import ManagerLogin from './pages/manager/ManagerLogin';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import AllEmployeesAttendance from './pages/manager/AllEmployeesAttendance';
import TeamCalendar from './pages/manager/TeamCalendar';
import Reports from './pages/manager/Reports';

// Components
import PrivateRoute from './components/PrivateRoute';

function App() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(getCurrentUser());
    }
  }, [token, user, dispatch]);

  return (
    <div className="App">
      <Routes>
        {/* Employee Routes */}
        <Route
          path="/employee/login"
          element={!user ? <EmployeeLogin /> : <Navigate to="/employee/dashboard" />}
        />
        <Route
          path="/employee/register"
          element={!user ? <EmployeeRegister /> : <Navigate to="/employee/dashboard" />}
        />
        <Route
          path="/employee/dashboard"
          element={
            <PrivateRoute>
              <EmployeeDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/employee/attendance"
          element={
            <PrivateRoute>
              <MarkAttendance />
            </PrivateRoute>
          }
        />
        <Route
          path="/employee/history"
          element={
            <PrivateRoute>
              <AttendanceHistory />
            </PrivateRoute>
          }
        />
        <Route
          path="/employee/profile"
          element={
            <PrivateRoute>
              <EmployeeProfile />
            </PrivateRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/manager/login"
          element={!user ? <ManagerLogin /> : <Navigate to="/manager/dashboard" />}
        />
        <Route
          path="/manager/dashboard"
          element={
            <PrivateRoute requiredRole="manager">
              <ManagerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/attendance"
          element={
            <PrivateRoute requiredRole="manager">
              <AllEmployeesAttendance />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/calendar"
          element={
            <PrivateRoute requiredRole="manager">
              <TeamCalendar />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/reports"
          element={
            <PrivateRoute requiredRole="manager">
              <Reports />
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/employee/login" />} />
      </Routes>
    </div>
  );
}

export default App;

