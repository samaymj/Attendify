# How to Create a Manager Account

There are two ways to create a manager account:

## Method 1: Using the Script (Easiest) ⭐

1. Make sure your `.env` file is configured correctly in the `backend` directory
2. Run the script:
   ```bash
   cd backend
   npm run create-manager
   ```
3. Follow the prompts:
   - Enter manager name
   - Enter email
   - Enter password (minimum 6 characters)
   - Enter department (optional)

The script will:
- ✅ Hash the password securely
- ✅ Generate a unique Manager ID (MGR001, MGR002, etc.)
- ✅ Create the account in the database
- ✅ Show you the created manager details

## Method 2: Manual SQL Creation

### Step 1: Hash the Password

You need to hash the password first. Run this in your terminal:

```bash
cd backend
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your_password_here', 10).then(hash => console.log('Hashed password:', hash));"
```

Copy the hashed password that is printed.

### Step 2: Connect to PostgreSQL

```bash
psql -U postgres -d attendance_system
```

(Enter your PostgreSQL password when prompted)

### Step 3: Insert Manager

```sql
INSERT INTO users (name, email, password, role, "employeeId", department)
VALUES (
  'John Manager',
  'manager@example.com',
  'paste_hashed_password_here',
  'manager',
  'MGR001',
  'Management'
);
```

### Step 4: Verify

```sql
SELECT id, name, email, role, "employeeId" FROM users WHERE role = 'manager';
```

### Step 5: Exit

```sql
\q
```

## Default Manager Credentials (For Testing)

If you want to quickly test, you can use the script with these values:
- **Name:** Admin Manager
- **Email:** manager@test.com
- **Password:** manager123
- **Department:** Management

## Troubleshooting

### "Database does not exist"
Run: `npm run setup-db` first

### "Email already exists"
The email is already registered. Use a different email or login with existing credentials.

### "Authentication failed"
Check your `.env` file - make sure `DB_USER` and `DB_PASSWORD` are correct.

### "Password must be at least 6 characters"
Use a longer password (minimum 6 characters).

## After Creating Manager

Once created, managers can:
1. Go to `/manager/login` in the frontend
2. Login with their email and password
3. Access all manager features (dashboard, reports, team calendar, etc.)

