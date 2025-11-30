const { Client } = require('pg');
require('dotenv').config();

const setupDatabase = async () => {
  // Connect to PostgreSQL server (not to a specific database)
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');

    const dbName = process.env.DB_NAME || 'attendance_system';

    // Check if database exists
    const checkDb = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDb.rows.length === 0) {
      // Create database
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully`);
    } else {
      console.log(`✅ Database "${dbName}" already exists`);
    }

    await client.end();
    console.log('\n✅ Database setup complete!');
    console.log('You can now start the server with: npm start\n');
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('\nPlease check:');
    console.error('1. PostgreSQL is running');
    console.error('2. Database credentials in .env file are correct');
    console.error('3. User has permission to create databases');
    process.exit(1);
  }
};

setupDatabase();

