const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Employee Dashboard
router.get('/employee', authenticateToken, requireRole(['employee']), async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Today's status
    const todayResult = await pool.query(
      `SELECT 
        id,
        "userId",
        date,
        "checkInTime",
        "checkOutTime",
        status,
        "totalHours",
        "createdAt"
      FROM attendance WHERE "userId" = $1 AND date = $2`,
      [userId, today]
    );

    // Monthly summary
    const monthlyResult = await pool.query(
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

    // Recent attendance (last 7 days)
    const recentResult = await pool.query(
      `SELECT 
        id,
        "userId",
        date,
        "checkInTime",
        "checkOutTime",
        status,
        "totalHours",
        "createdAt"
      FROM attendance 
      WHERE "userId" = $1 
        AND date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY date DESC`,
      [userId]
    );

    const todayAttendance = todayResult.rows[0] || null;

    res.json({
      today: {
        checkedIn: !!todayAttendance?.checkInTime,
        checkedOut: !!todayAttendance?.checkOutTime,
        checkInTime: todayAttendance?.checkInTime,
        checkOutTime: todayAttendance?.checkOutTime,
        status: todayAttendance?.status || 'not_checked_in'
      },
      monthly: monthlyResult.rows[0],
      recent: recentResult.rows
    });
  } catch (error) {
    console.error('Employee dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Manager Dashboard
router.get('/manager', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    const managerId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Total employees under this manager
    const totalEmployeesResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1 AND "managerId" = $2',
      ['employee', managerId]
    );
    const totalEmployees = parseInt(totalEmployeesResult.rows[0].count);

    // Today's attendance
    const todayResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE a.status IN ('present', 'late', 'half-day')) as present,
        COUNT(*) FILTER (WHERE a.status = 'absent' OR a.status IS NULL) as absent
      FROM users u
      LEFT JOIN attendance a ON u.id = a."userId" AND a.date = $1
      WHERE u.role = 'employee' AND u."managerId" = $2`,
      [today, managerId]
    );

    // Late arrivals today
    const lateResult = await pool.query(
      `SELECT COUNT(*) as count 
      FROM attendance a
      JOIN users u ON a."userId" = u.id
      WHERE a.date = $1 AND a.status = 'late' AND u."managerId" = $2`,
      [today, managerId]
    );
    const lateToday = parseInt(lateResult.rows[0].count);

    // Weekly attendance trend (last 7 days)
    const weeklyResult = await pool.query(
      `SELECT 
        a.date,
        COUNT(*) FILTER (WHERE a.status IN ('present', 'late', 'half-day')) as present,
        COUNT(*) FILTER (WHERE a.status = 'absent') as absent
      FROM attendance a
      JOIN users u ON a."userId" = u.id
      WHERE a.date >= CURRENT_DATE - INTERVAL '7 days'
        AND a.date <= CURRENT_DATE
        AND u."managerId" = $1
      GROUP BY a.date
      ORDER BY a.date ASC`,
      [managerId]
    );

    // Department-wise attendance (this month)
    const deptResult = await pool.query(
      `SELECT 
        u.department,
        COUNT(DISTINCT a."userId") as employees,
        COUNT(*) FILTER (WHERE a.status IN ('present', 'late', 'half-day')) as present,
        COUNT(*) FILTER (WHERE a.status = 'absent') as absent
      FROM users u
      LEFT JOIN attendance a ON u.id = a."userId" 
        AND EXTRACT(MONTH FROM a.date) = $1 
        AND EXTRACT(YEAR FROM a.date) = $2
      WHERE u.role = 'employee' AND u."managerId" = $3
      GROUP BY u.department
      ORDER BY u.department`,
      [currentMonth, currentYear, managerId]
    );

    // Absent employees today
    const absentResult = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u."employeeId",
        u.department
      FROM users u
      LEFT JOIN attendance a ON u.id = a."userId" AND a.date = $1
      WHERE u.role = 'employee' AND u."managerId" = $2
        AND (a.status = 'absent' OR a.status IS NULL)
      ORDER BY u.name`,
      [today, managerId]
    );

    res.json({
      totalEmployees,
      today: {
        present: parseInt(todayResult.rows[0].present),
        absent: parseInt(todayResult.rows[0].absent),
        late: lateToday
      },
      weeklyTrend: weeklyResult.rows,
      departmentWise: deptResult.rows,
      absentToday: absentResult.rows
    });
  } catch (error) {
    console.error('Manager dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

