const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate employee ID
const generateEmployeeId = async () => {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM users WHERE role = $1',
    ['employee']
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `EMP${String(count).padStart(3, '0')}`;
};

// Generate manager ID
const generateManagerId = async () => {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM users WHERE role = $1',
    ['manager']
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `MGR${String(count).padStart(3, '0')}`;
};

// Get all managers (for employee registration)
router.get('/managers', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, "employeeId", department FROM users WHERE role = $1 ORDER BY name',
      ['manager']
    );
    res.json({ managers: result.rows });
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['employee', 'manager']).withMessage('Role must be employee or manager'),
    body('department').optional().trim(),
    body('managerId').optional().isInt().withMessage('Manager ID must be a valid number'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, role, department, managerId } = req.body;

      // Validate manager assignment for employees
      if (role === 'employee' && !managerId) {
        return res.status(400).json({ error: 'Manager is required for employee registration' });
      }

      if (role === 'manager' && managerId) {
        return res.status(400).json({ error: 'Managers cannot be assigned to another manager' });
      }

      // Check if user exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // If employee, verify manager exists
      if (role === 'employee') {
        const managerCheck = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [managerId, 'manager']);
        if (managerCheck.rows.length === 0) {
          return res.status(400).json({ error: 'Invalid manager selected' });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate ID based on role
      let employeeId;
      if (role === 'employee') {
        employeeId = await generateEmployeeId();
      } else {
        employeeId = await generateManagerId();
      }

      // Insert user
      const result = await pool.query(
        'INSERT INTO users (name, email, password, role, "employeeId", department, "managerId") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, "employeeId", department, "managerId"',
        [name, email, hashedPassword, role, employeeId, department || null, role === 'employee' ? managerId : null]
      );

      const user = result.rows[0];

      // Generate token
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not set in environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          department: user.department,
          managerId: user.managerId,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Server error during registration' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const result = await pool.query(
        'SELECT id, name, email, password, role, "employeeId", department, "managerId" FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not set in environment variables');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          department: user.department,
          managerId: user.managerId,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ 
        error: 'Server error during login',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, "employeeId", department, "managerId", "createdAt" FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

