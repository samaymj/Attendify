import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import './Layout.css';

const Layout = ({ children, role = 'employee' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate(`/${role}/login`);
  };

  const employeeNavItems = [
    { path: '/employee/dashboard', label: 'Dashboard' },
    { path: '/employee/attendance', label: 'Mark Attendance' },
    { path: '/employee/history', label: 'History' },
    { path: '/employee/profile', label: 'Profile' },
  ];

  const managerNavItems = [
    { path: '/manager/dashboard', label: 'Dashboard' },
    { path: '/manager/attendance', label: 'All Attendance' },
    { path: '/manager/calendar', label: 'Calendar' },
    { path: '/manager/reports', label: 'Reports' },
  ];

  const navItems = role === 'manager' ? managerNavItems : employeeNavItems;

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <h2>Attendance System</h2>
          </div>
          <div className="nav-links">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className="nav-link">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="nav-user">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">({user?.role})</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;

