import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, token } = useSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to={requiredRole === 'manager' ? '/manager/login' : '/employee/login'} />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'manager' ? '/manager/dashboard' : '/employee/dashboard'} />;
  }

  return children;
};

export default PrivateRoute;

