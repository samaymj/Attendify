import React from 'react';
import { useSelector } from 'react-redux';
import Layout from '../../components/Layout';
import './EmployeeProfile.css';

const EmployeeProfile = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Layout role="employee">
      <div className="employee-profile">
        <h1>My Profile</h1>
        {user && (
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2>{user.name}</h2>
              <p className="profile-role">{user.role}</p>
            </div>
            <div className="profile-details">
              <div className="detail-item">
                <div className="detail-label">Employee ID</div>
                <div className="detail-value">{user.employeeId}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Email</div>
                <div className="detail-value">{user.email}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Department</div>
                <div className="detail-value">{user.department || 'Not assigned'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Member Since</div>
                <div className="detail-value">
                  {user.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeProfile;

