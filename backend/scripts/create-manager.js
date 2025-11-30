const bcrypt = require('bcryptjs');
const { Client } = require('pg');
require('dotenv').config();

const createManager = async () => {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    console.log('\n=== Create Manager Account ===\n');

    const name = await question('Manager Name: ');
    const email = await question('Email: ');
    const password = await question('Password (min 6 characters): ');
    const department = await question('Department (optional, press Enter to skip): ');

    if (!name || !email || !password) {
      console.error('\n❌ Name, email, and password are required!');
      rl.close();
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('\n❌ Password must be at least 6 characters!');
      rl.close();
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Connect to database
    const client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'attendance_system',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    await client.connect();
    console.log('\n✅ Connected to database');

    // Check if email already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.error('\n❌ Email already exists!');
      await client.end();
      rl.close();
      process.exit(1);
    }

    // Generate manager ID
    const managerCount = await client.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'manager'"
    );
    const count = parseInt(managerCount.rows[0].count) + 1;
    const managerId = `MGR${String(count).padStart(3, '0')}`;

    // Insert manager
    const result = await client.query(
      `INSERT INTO users (name, email, password, role, "employeeId", department) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, role, "employeeId", department`,
      [name, email, hashedPassword, 'manager', managerId, department || null]
    );

    const manager = result.rows[0];

    console.log('\n✅ Manager account created successfully!');
    console.log('\nManager Details:');
    console.log(`  Name: ${manager.name}`);
    console.log(`  Email: ${manager.email}`);
    console.log(`  Manager ID: ${manager.employeeId}`);
    console.log(`  Department: ${manager.department || 'Not assigned'}`);
    console.log(`  Role: ${manager.role}`);
    console.log('\n✅ You can now login with this email and password\n');

    await client.end();
    rl.close();
  } catch (error) {
    console.error('\n❌ Error creating manager:', error.message);
    if (error.code === '23505') {
      console.error('   Email or Manager ID already exists!');
    } else if (error.code === '3D000') {
      console.error('   Database does not exist! Run: npm run setup-db');
    } else if (error.code === '28P01') {
      console.error('   Authentication failed! Check your .env file credentials.');
    }
    rl.close();
    process.exit(1);
  }
};

createManager();

