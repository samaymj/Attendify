const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'attendance_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  if (err.code === '3D000') {
    console.error('\n❌ Database does not exist!');
    console.error('Please run: npm run setup-db');
    console.error('Or create the database manually in PostgreSQL\n');
  }
  process.exit(-1);
});

// Initialize database schema
const initDatabase = async () => {
  try {
    // Test connection first
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Create Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('employee', 'manager')),
        "employeeId" VARCHAR(50) UNIQUE NOT NULL,
        department VARCHAR(255),
        "managerId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK ((role = 'employee' AND "managerId" IS NOT NULL) OR (role = 'manager' AND "managerId" IS NULL))
      )
    `);

    // Create Attendance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        "checkInTime" TIMESTAMP,
        "checkOutTime" TIMESTAMP,
        status VARCHAR(50) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half-day')),
        "totalHours" DECIMAL(5,2),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", date)
      )
    `);

    // Add managerId column if it doesn't exist (for existing databases)
    // This must be done before creating indexes
    try {
      // Check if column exists
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='managerId'
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('Adding managerId column to users table...');
        await pool.query('ALTER TABLE users ADD COLUMN "managerId" INTEGER REFERENCES users(id) ON DELETE SET NULL');
        console.log('✅ managerId column added successfully');
      }
    } catch (error) {
      if (error.code !== '42701') { // 42701 = duplicate column (already exists)
        console.error('Error adding managerId column:', error.message);
      }
    }

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance("userId", date);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);
    
    // Create managerId index if column exists
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_users_manager ON users("managerId")');
    } catch (error) {
      // Index might fail if column doesn't exist, but we already added it above
    }
    
    // Add constraint to ensure employees have managers and managers don't have managers
    try {
      // Drop constraint if it exists
      await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_manager_check');
      // Add new constraint
      await pool.query(`
        ALTER TABLE users 
        ADD CONSTRAINT users_role_manager_check 
        CHECK ((role = 'employee' AND "managerId" IS NOT NULL) OR (role = 'manager' AND "managerId" IS NULL))
      `);
    } catch (error) {
      // Constraint might already exist or there might be existing data that violates it
      console.warn('Note: Could not add role/manager constraint. You may need to update existing data manually.');
    }

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    if (error.code === '3D000') {
      console.error('\n❌ Database does not exist!');
      console.error('Please run: npm run setup-db');
      console.error('Or create the database manually:\n');
      console.error(`  CREATE DATABASE ${process.env.DB_NAME || 'attendance_system'};\n`);
    } else if (error.code === '28P01') {
      console.error('\n❌ Authentication failed!');
      console.error('Please check your database credentials in .env file\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Cannot connect to PostgreSQL server!');
      console.error('Please ensure PostgreSQL is running\n');
    }
    throw error;
  }
};

module.exports = { pool, initDatabase };

