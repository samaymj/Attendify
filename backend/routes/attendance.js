const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper function to calculate hours
const calculateHours = (checkInTime, checkOutTime) => {
  if (!checkInTime || !checkOutTime) return null;
  const diff = new Date(checkOutTime) - new Date(checkInTime);
  return (diff / (1000 * 60 * 60)).toFixed(2);
};

// Helper function to determine status
const determineStatus = (checkInTime, checkOutTime) => {
  if (!checkInTime) return 'absent';
  const checkIn = new Date(checkInTime);
  const hours = checkIn.getHours();
  const minutes = checkIn.getMinutes();
  
  // Consider late if check-in is after 9:30 AM
  if (hours > 9 || (hours === 9 && minutes > 30)) {
    if (!checkOutTime) return 'late';
    const totalHours = parseFloat(calculateHours(checkInTime, checkOutTime));
    if (totalHours < 4) return 'half-day';
    return 'late';
  }
  
  if (!checkOutTime) return 'present';
  const totalHours = parseFloat(calculateHours(checkInTime, checkOutTime));
  if (totalHours < 4) return 'half-day';
  return 'present';
};

// Employee: Check In
router.post('/checkin', authenticateToken, requireRole(['employee']), async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Check if already checked in today
    const existing = await pool.query(
      'SELECT id, "checkInTime" FROM attendance WHERE "userId" = $1 AND date = $2',
      [userId, today]
    );

    if (existing.rows.length > 0 && existing.rows[0].checkInTime) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    // Insert or update attendance
    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE attendance SET "checkInTime" = $1, status = $2 WHERE id = $3',
        [now, determineStatus(now, null), existing.rows[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO attendance ("userId", date, "checkInTime", status) VALUES ($1, $2, $3, $4)',
        [userId, today, now, determineStatus(now, null)]
      );
    }

    res.json({ message: 'Checked in successfully', checkInTime: now });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Server error during check-in' });
  }
});

// Employee: Check Out
router.post('/checkout', authenticateToken, requireRole(['employee']), async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Get today's attendance
    const result = await pool.query(
      'SELECT id, "checkInTime" FROM attendance WHERE "userId" = $1 AND date = $2',
      [userId, today]
    );

    if (result.rows.length === 0 || !result.rows[0].checkInTime) {
      return res.status(400).json({ error: 'Please check in first' });
    }

    if (result.rows[0].checkOutTime) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    const checkInTime = result.rows[0].checkInTime;
    const totalHours = calculateHours(checkInTime, now);
    const status = determineStatus(checkInTime, now);

    await pool.query(
      'UPDATE attendance SET "checkOutTime" = $1, "totalHours" = $2, status = $3 WHERE id = $4',
      [now, totalHours, status, result.rows[0].id]
    );

    res.json({ 
      message: 'Checked out successfully', 
      checkOutTime: now,
      totalHours: parseFloat(totalHours)
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Server error during check-out' });
  }
});

// Employee: My Attendance History
router.get('/my-history', authenticateToken, requireRole(['employee']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    let query = `SELECT 
      id,
      "userId",
      date,
      "checkInTime",
      "checkOutTime",
      status,
      "totalHours",
      "createdAt"
    FROM attendance WHERE "userId" = $1`;
    const params = [userId];

    if (month && year) {
      query += ' AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3';
      params.push(month, year);
    }

    query += ' ORDER BY date DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json({ attendance: result.rows });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Employee: My Monthly Summary
router.get('/my-summary', authenticateToken, requireRole(['employee']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const result = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'present') as present,
        COUNT(*) FILTER (WHERE status = 'absent') as absent,
        COUNT(*) FILTER (WHERE status = 'late') as late,
        COUNT(*) FILTER (WHERE status = 'half-day') as halfDay,
        COALESCE(SUM("totalHours"), 0) as "totalHours"
      FROM attendance 
      WHERE "userId" = $1 
        AND EXTRACT(MONTH FROM date) = $2 
        AND EXTRACT(YEAR FROM date) = $3`,
      [userId, currentMonth, currentYear]
    );

    res.json({ summary: result.rows[0] });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Employee: Today's Status
router.get('/today', authenticateToken, requireRole(['employee']), async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      'SELECT * FROM attendance WHERE "userId" = $1 AND date = $2',
      [userId, today]
    );

    if (result.rows.length === 0) {
      return res.json({ 
        checkedIn: false, 
        checkedOut: false,
        status: 'not_checked_in'
      });
    }

    const attendance = result.rows[0];
    res.json({
      checkedIn: !!attendance.checkInTime,
      checkedOut: !!attendance.checkOutTime,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      status: attendance.status,
      totalHours: attendance.totalHours
    });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Manager: All Employees Attendance
router.get('/all', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    const { employeeId, date, status, startDate, endDate } = req.query;

    const managerId = req.user.id;
    let query = `
      SELECT 
        a.id,
        a."userId",
        a.date,
        a."checkInTime",
        a."checkOutTime",
        a.status,
        a."totalHours",
        a."createdAt",
        u.name,
        u.email,
        u."employeeId",
        u.department
      FROM attendance a
      JOIN users u ON a."userId" = u.id
      WHERE u."managerId" = $1
    `;
    const params = [managerId];
    let paramCount = 1;

    if (employeeId) {
      paramCount++;
      query += ` AND u."employeeId" = $${paramCount}`;
      params.push(employeeId);
    }

    if (date) {
      paramCount++;
      query += ` AND a.date = $${paramCount}`;
      params.push(date);
    }

    if (startDate && endDate) {
      paramCount++;
      query += ` AND a.date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
      query += ` AND a.date <= $${paramCount}`;
      params.push(endDate);
    }

    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY a.date DESC, u.name LIMIT 500';

    const result = await pool.query(query, params);
    res.json({ attendance: result.rows });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Manager: Specific Employee Attendance
router.get('/employee/:id', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    const managerId = req.user.id;
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Verify employee belongs to this manager
    const employeeCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND "managerId" = $2',
      [id, managerId]
    );
    
    if (employeeCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Employee not found or not under your management' });
    }

    let query = `
      SELECT 
        a.id,
        a."userId",
        a.date,
        a."checkInTime",
        a."checkOutTime",
        a.status,
        a."totalHours",
        a."createdAt",
        u.name,
        u.email,
        u."employeeId",
        u.department
      FROM attendance a
      JOIN users u ON a."userId" = u.id
      WHERE u.id = $1 AND u."managerId" = $2
    `;
    const params = [id, managerId];
    let paramCount = 2;

    if (startDate && endDate) {
      paramCount++;
      query += ` AND a.date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
      query += ` AND a.date <= $${paramCount}`;
      params.push(endDate);
    }

    query += ' ORDER BY a.date DESC';

    const result = await pool.query(query, params);
    res.json({ attendance: result.rows });
  } catch (error) {
    console.error('Get employee attendance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Manager: Team Summary
router.get('/summary', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    const managerId = req.user.id;
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const result = await pool.query(
      `SELECT 
        COUNT(DISTINCT a."userId") as "totalEmployees",
        COUNT(*) FILTER (WHERE a.status = 'present') as "totalPresent",
        COUNT(*) FILTER (WHERE a.status = 'absent') as "totalAbsent",
        COUNT(*) FILTER (WHERE a.status = 'late') as "totalLate",
        COUNT(*) FILTER (WHERE a.status = 'half-day') as "totalHalfDay",
        COALESCE(SUM(a."totalHours"), 0) as "totalHours"
      FROM attendance a
      JOIN users u ON a."userId" = u.id
      WHERE EXTRACT(MONTH FROM a.date) = $1 
        AND EXTRACT(YEAR FROM a.date) = $2
        AND u."managerId" = $3`,
      [currentMonth, currentYear, managerId]
    );

    res.json({ summary: result.rows[0] });
  } catch (error) {
    console.error('Get team summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Manager: Export CSV
router.get('/export', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    const managerId = req.user.id;
    const { startDate, endDate, employeeId } = req.query;

    let query = `
      SELECT 
        u."employeeId",
        u.name,
        u.email,
        u.department,
        a.date,
        a."checkInTime",
        a."checkOutTime",
        a.status,
        a."totalHours"
      FROM attendance a
      JOIN users u ON a."userId" = u.id
      WHERE u."managerId" = $1
    `;
    const params = [managerId];
    let paramCount = 1;

    if (startDate && endDate) {
      paramCount++;
      query += ` AND a.date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
      query += ` AND a.date <= $${paramCount}`;
      params.push(endDate);
    }

    if (employeeId) {
      paramCount++;
      query += ` AND u."employeeId" = $${paramCount}`;
      params.push(employeeId);
    }

    query += ' ORDER BY a.date DESC, u.name';

    const result = await pool.query(query, params);

    // Convert to CSV
    const csvHeader = 'Employee ID,Name,Email,Department,Date,Check In,Check Out,Status,Total Hours\n';
    const csvRows = result.rows.map(row => {
      return [
        row.employeeId || '',
        row.name || '',
        row.email || '',
        row.department || '',
        row.date || '',
        row.checkInTime ? new Date(row.checkInTime).toLocaleString() : '',
        row.checkOutTime ? new Date(row.checkOutTime).toLocaleString() : '',
        row.status || '',
        row.totalHours || ''
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Server error during export' });
  }
});

// Manager: Today's Status (Who's present)
router.get('/today-status', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    const managerId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u."employeeId",
        u.department,
        a."checkInTime",
        a."checkOutTime",
        a.status
      FROM users u
      LEFT JOIN attendance a ON u.id = a."userId" AND a.date = $1
      WHERE u.role = 'employee' AND u."managerId" = $2
      ORDER BY u.name`,
      [today, managerId]
    );

    res.json({ employees: result.rows });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

