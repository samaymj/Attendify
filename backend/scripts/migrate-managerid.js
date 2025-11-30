const { Pool } = require('pg');
require('dotenv').config();

const migrateDatabase = async () => {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'attendance_system',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await pool.connect();
    console.log('✅ Connected to database');

    // Check if managerId column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='managerId'
    `);

    if (checkColumn.rows.length === 0) {
      console.log('Adding managerId column...');
      
      // Add managerId column
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN "managerId" INTEGER REFERENCES users(id) ON DELETE SET NULL
      `);

      // Add index for performance
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_manager ON users("managerId")
      `);

      // Add check constraint
      await pool.query(`
        ALTER TABLE users 
        ADD CONSTRAINT check_manager_assignment 
        CHECK ((role = 'employee' AND "managerId" IS NOT NULL) OR (role = 'manager' AND "managerId" IS NULL))
      `);

      console.log('✅ managerId column added successfully');
    } else {
      console.log('✅ managerId column already exists');
    }

    // Check if constraint exists
    const checkConstraint = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name='users' AND constraint_name='check_manager_assignment'
    `);

    if (checkConstraint.rows.length === 0) {
      console.log('Adding check constraint...');
      try {
        await pool.query(`
          ALTER TABLE users 
          ADD CONSTRAINT check_manager_assignment 
          CHECK ((role = 'employee' AND "managerId" IS NOT NULL) OR (role = 'manager' AND "managerId" IS NULL))
        `);
        console.log('✅ Check constraint added');
      } catch (error) {
        if (error.code !== '23514') { // Constraint violation means data doesn't match, we'll handle that
          throw error;
        }
        console.log('⚠️  Warning: Some existing data may not match the constraint');
        console.log('   You may need to assign managers to existing employees');
      }
    }

    await pool.end();
    console.log('\n✅ Migration completed successfully!');
    console.log('You can now restart your server.\n');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    if (error.code === '23514') {
      console.error('\n⚠️  Some existing employees may not have managers assigned.');
      console.error('   Please assign managers to existing employees or update the constraint.');
    }
    await pool.end();
    process.exit(1);
  }
};

migrateDatabase();

