@echo off
setlocal enabledelayedexpansion

:: HRSM 2.0 - Automated Setup Script for Windows
:: This script helps automate the setup process for new developers

echo 🏥 HRSM 2.0 - Automated Setup Script for Windows
echo =============================================
echo.

:: Check if Node.js is installed
echo Checking prerequisites...
where node >nul 2>nul
if !errorlevel! neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v16 or higher.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js is installed: !NODE_VERSION!
)

:: Check if npm is installed
where npm >nul 2>nul
if !errorlevel! neq 0 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm is installed: !NPM_VERSION!
)

:: Check if MySQL is available (optional)
where mysql >nul 2>nul
if !errorlevel! neq 0 (
    echo ⚠️  MySQL not found in PATH. Make sure MySQL is installed and running.
) else (
    echo ✅ MySQL is installed
)

echo.
echo 🔧 Starting setup process...
echo.

:: Install frontend dependencies
echo ℹ️  Installing frontend dependencies...
call npm install
if !errorlevel! neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
) else (
    echo ✅ Frontend dependencies installed successfully
)

echo.

:: Install backend dependencies
echo ℹ️  Installing backend dependencies...
cd backend
call npm install
if !errorlevel! neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
) else (
    echo ✅ Backend dependencies installed successfully
)

cd ..

echo.

:: Check if .env file exists
if not exist "backend\.env" (
    echo ⚠️  .env file not found. Creating from template...
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo ✅ Created .env file from template
        echo.
        echo ⚠️  IMPORTANT: Please edit backend\.env with your database credentials!
        echo ℹ️  Required settings:
        echo   - DB_USER=your_mysql_username
        echo   - DB_PASSWORD=your_mysql_password
        echo   - JWT_SECRET=your-64-character-secret-key
        echo   - DEFAULT_ADMIN_PASSWORD=your_secure_password
        echo   - DEFAULT_DOCTOR_PASSWORD=your_secure_password
        echo   - DEFAULT_PATIENT_PASSWORD=your_secure_password
        echo.
    ) else (
        echo ❌ .env.example file not found!
        pause
        exit /b 1
    )
) else (
    echo ✅ .env file already exists
)

echo.
echo ✅ Setup completed successfully! 🎉
echo.
echo ℹ️  Next steps:
echo 1. Configure your database settings in backend\.env
echo 2. Create MySQL database: CREATE DATABASE hrsm_db;
echo 3. Run database setup: node backend\scripts\setupDatabase.js
echo 4. Start backend: start-backend.bat
echo 5. Start frontend: npm start (in new terminal)
echo.
echo ℹ️  For detailed instructions, see QUICK_START_GUIDE.md
echo.
echo ✅ Happy coding! 🚀
echo.
pause
