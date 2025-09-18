@echo off
title Management Dashboard - HRSM 2.0
color 0A
cls

echo.
echo ================================================================
echo                 🏥 HRSM 2.0 Management Dashboard
echo ================================================================
echo.
echo 🔐 Login Credentials:
echo    Username: management@brgymaybunga.health
echo    Password: management123
echo.
echo 📊 Management Features:
echo    ✓ Inventory Management and Tracking
echo    ✓ Reports Generation and Analysis  
echo    ✓ Supply Chain Oversight
echo    ✓ Statistical Dashboards
echo    ✓ Forecast Management
echo.
echo ================================================================
echo.
echo ⚡ Starting Management Dashboard...
echo.

REM Start backend if not running
echo 🔧 Checking backend status...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do set pid=%%a
if not defined pid (
    echo 🚀 Starting backend server...
    start "Backend Server" cmd /k "cd /d backend && npm start"
    timeout /t 5
) else (
    echo ✅ Backend already running on port 5000
)

REM Start frontend
echo 🌐 Starting frontend server...
timeout /t 2
start "Frontend Server" cmd /k "npm start"

REM Open Management Dashboard
echo 🎯 Opening Management Dashboard in browser...
timeout /t 8
start "" "http://localhost:3000/management/dashboard"

echo.
echo ================================================================
echo     🎉 Management Dashboard Started Successfully!
echo ================================================================
echo.
echo 💡 Tips:
echo    • Use Ctrl+C in server windows to stop services
echo    • Backend API: http://localhost:5000
echo    • Frontend: http://localhost:3000
echo    • Management Dashboard: http://localhost:3000/management/dashboard
echo.
pause
