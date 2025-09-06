# 🚀 HRSM 2.0 - Quick Start Guide

A step-by-step guide for your friends to clone and set up the Healthcare Resource Sharing Management system.

## 📋 Prerequisites Check

Before cloning, make sure you have:
- ✅ **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- ✅ **MySQL** (v8.0 or higher) - [Download here](https://dev.mysql.com/downloads/)
- ✅ **Git** - [Download here](https://git-scm.com/)
- ✅ **Code Editor** (VS Code recommended) - [Download here](https://code.visualstudio.com/)

## 🔗 Step 1: Clone the Repository

### Option A: Using Git Command Line
```bash
# Clone the repository
git clone https://github.com/JDaveExe/hrsm2.0.git

# Navigate to the project directory
cd hrsm2.0

# Check that everything was cloned correctly
ls -la  # On Linux/Mac
dir     # On Windows
```

### Option B: Using GitHub Desktop
1. Open GitHub Desktop
2. Click "Clone a repository from the Internet"
3. Enter: `https://github.com/JDaveExe/hrsm2.0.git`
4. Choose your local path
5. Click "Clone"

### Option C: Download ZIP (Not Recommended)
1. Go to https://github.com/JDaveExe/hrsm2.0
2. Click the green "Code" button
3. Select "Download ZIP"
4. Extract the ZIP file
5. Open terminal in the extracted folder

## 💾 Step 2: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### If you get errors:
```bash
# Clear npm cache and try again
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# For backend
cd backend
rm -rf node_modules package-lock.json
npm install
cd ..
```

## 🗄️ Step 3: Database Setup

### Create MySQL Database
```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create the database
CREATE DATABASE hrsm_db;

-- Create a user for the application (optional but recommended)
CREATE USER 'hrsm_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON hrsm_db.* TO 'hrsm_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### Alternative: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Execute: `CREATE DATABASE hrsm_db;`

## ⚙️ Step 4: Environment Configuration

### Copy Environment File
```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# On Windows, use:
copy backend\.env.example backend\.env
```

### Edit the Environment File
Open `backend/.env` in your code editor and configure:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root                    # or 'hrsm_user' if you created one
DB_PASSWORD=your_mysql_password
DB_NAME=hrsm_db
DB_PORT=3306

# Security Settings
JWT_SECRET=your-super-secure-secret-key-minimum-64-characters-long-random-string
NODE_ENV=development

# Default User Passwords (CHANGE THESE!)
DEFAULT_ADMIN_PASSWORD=MySecureAdminPass123!
DEFAULT_DOCTOR_PASSWORD=MySecureDoctorPass123!
DEFAULT_PATIENT_PASSWORD=MySecurePatientPass123!

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000

# Optional: Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🚀 Step 5: Initialize the Database

```bash
# Run database setup script
node backend/scripts/setupDatabase.js

# Add sample data (optional)
node backend/add_sample_data.js
```

## ▶️ Step 6: Start the Application

### Option A: Manual Start (Recommended for first time)
```bash
# Terminal 1: Start the backend
cd backend
npm start

# Terminal 2: Start the frontend (open new terminal)
npm start
```

### Option B: Using Batch Files (Windows)
```bash
# Start backend
start-backend.bat

# Start frontend (in new terminal)
npm start
```

### Option C: Multi-instance Testing
```bash
# Start multiple frontend instances for testing
start-multi-instance.bat
```

## 🌐 Step 7: Access the Application

Once both servers are running:

- **Main Application**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 🔐 Step 8: Login and Test

### Default Login Credentials
Use the passwords you set in your `.env` file:

- **Admin Account**:
  - Username: `admin`
  - Password: `[YOUR_DEFAULT_ADMIN_PASSWORD]`
  - Access: Full system administration

- **Doctor Account**:
  - Username: `doctor`  
  - Password: `[YOUR_DEFAULT_DOCTOR_PASSWORD]`
  - Access: Patient care and medical records

- **Patient Account**:
  - Username: `patient`
  - Password: `[YOUR_DEFAULT_PATIENT_PASSWORD]`
  - Access: Personal health records

## 🧪 Step 9: Verify Everything Works

### Quick Tests
```bash
# Test API connectivity
node test-api-connection.js

# Test complete workflow
node test-complete-workflow.js

# Test basic functionality
node test-basic.js
```

### Manual Verification
1. ✅ Login as admin - should see dashboard with statistics
2. ✅ Login as doctor - should see appointment calendar
3. ✅ Login as patient - should see personal dashboard
4. ✅ Check that data loads without errors
5. ✅ Try creating a test appointment

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### "Cannot connect to database"
```bash
# Check MySQL is running
# Windows: Check services
# Mac: brew services list | grep mysql
# Linux: sudo systemctl status mysql

# Verify credentials in .env file
# Test connection manually:
mysql -u root -p -h localhost
```

#### "Port already in use"
```bash
# Check what's using the ports
netstat -ano | findstr :3000  # Windows
netstat -an | grep :3000      # Mac/Linux

# Kill processes if needed
taskkill /PID [PID_NUMBER] /F  # Windows
kill -9 [PID_NUMBER]           # Mac/Linux
```

#### "Module not found" errors
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Do the same for backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### "JWT_SECRET not set" error
- Make sure your `.env` file exists in the `backend` folder
- Ensure `JWT_SECRET` is set to a long random string (64+ characters)

#### "Access denied for user" MySQL error
- Check your MySQL username and password in `.env`
- Make sure the user has permissions on the database
- Try connecting manually with: `mysql -u your_user -p`

## 📞 Getting Help

If you run into issues:

1. **Check the logs** in the terminal where you started the backend
2. **Look at the browser console** for frontend errors (F12)
3. **Verify all prerequisites** are installed and running
4. **Double-check your .env configuration**
5. **Try the troubleshooting steps** above
6. **Create an issue** on GitHub with error details

## 🎉 Success!

If everything is working, you should see:
- ✅ Backend running on http://localhost:5000
- ✅ Frontend running on http://localhost:3000
- ✅ Database connected and populated
- ✅ Login working for all user types
- ✅ Dashboard displaying real data

Welcome to HRSM 2.0! 🏥✨

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the [API documentation](http://localhost:5000/api-docs) (when running)
- Check out the testing scripts in the root directory
- Review security guidelines in `SECURITY_GUIDE.md`
- Start contributing with the guidelines in the README

---

**Need help?** Create an issue on GitHub or contact the development team!
