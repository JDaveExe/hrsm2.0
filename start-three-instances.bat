@echo off
echo Starting HRSM 2.0 Three Instance Testing
echo.
echo This will start ONE backend and THREE frontend instances
echo.
echo Press any key to continue...
pause >nul

echo.
echo ========================================
echo  Step 1: Starting Backend Server (Port 5000)
echo ========================================
start "HRSM Backend" cmd /k "cd /d %~dp0backend && npm start"
echo Backend starting... waiting 8 seconds for it to initialize
timeout /t 8 >nul

echo.
echo ========================================
echo  Step 2: Starting Frontend - Manual Login (Port 3000)
echo ========================================
start "HRSM Frontend Main" cmd /k "cd /d %~dp0 && npm start"
echo Main frontend starting... waiting 5 seconds
timeout /t 5 >nul

echo.
echo ========================================
echo  Step 3: Starting Frontend - Doctor Auto-Login (Port 3001)
echo ========================================
start "HRSM Frontend Doctor" cmd /k "cd /d %~dp0 && set PORT=3001 && npm start"
echo Doctor frontend starting... waiting 5 seconds
timeout /t 5 >nul

echo.
echo ========================================
echo  Step 4: Starting Frontend - Patient Auto-Login (Port 3002)
echo ========================================
start "HRSM Frontend Patient" cmd /k "cd /d %~dp0 && set PORT=3002 && npm start"

echo.
echo ========================================
echo  HRSM 2.0 Three-Instance Setup Complete!
echo ========================================
echo.
echo 🔧 ARCHITECTURE:
echo    ├── Backend (Port 5000) - ONE shared server
echo    ├── Frontend 1 (Port 3000) - Manual login (all roles)
echo    ├── Frontend 2 (Port 3001) - Auto-login as Doctor
echo    └── Frontend 3 (Port 3002) - Auto-login as Patient
echo.
echo 🔑 LOGIN BEHAVIOR:
echo.
echo 🔹 Port 3000 (Manual Login):
echo    - Admin: admin / admin123
echo    - Doctor: doctor / doctor123
echo    - Patient: patient / patient123
echo.
echo 🔹 Port 3001 (Auto-Login):
echo    - Automatically logs in as Doctor
echo    - Shows "DOCTOR MODE" indicator in header
echo.
echo 🔹 Port 3002 (Auto-Login):
echo    - Automatically logs in as Patient
echo    - Shows "PATIENT MODE" indicator in header
echo.
echo ⚠️  IMPORTANT: All frontends connect to the SAME backend!
echo 🚀 If login fails, ensure backend is running (check first window)
echo.
echo Press any key to exit this window...
pause >nul
