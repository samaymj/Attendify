import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, clearError } from '../../store/slices/authSlice';
import axios from 'axios';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const EmployeeRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee', // Always employee for registration
    department: '',
    managerId: '',
  });
  const [managers, setManagers] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Fetch managers for employee registration
    const fetchManagers = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/managers`);
        setManagers(response.data.managers);
      } catch (error) {
        console.error('Error fetching managers:', error);
      }
    };
    fetchManagers();
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/employee/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    
    // Validate manager selection for employees
    if (formData.role === 'employee' && !formData.managerId) {
      return;
    }
    
    const result = await dispatch(register(formData));
    if (register.fulfilled.match(result)) {
      navigate('/employee/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Registration</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Manager *</label>
            <select
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              required
              disabled={loading || managers.length === 0}
            >
              <option value="">Select a Manager</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} ({manager.employeeId})
                </option>
              ))}
            </select>
            {managers.length === 0 && (
              <small style={{ color: '#e74c3c' }}>
                No managers available. Please create a manager account first.
              </small>
            )}
          </div>
          <div className="form-group">
            <label>Department (Optional)</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading || !formData.managerId}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/employee/login">Login here</Link>
          </p>
          <p>
            Manager? <Link to="/manager/login">Login as Manager</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegister;

