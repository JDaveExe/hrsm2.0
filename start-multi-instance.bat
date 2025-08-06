@echo off
echo Starting HRSM 2.0 Multiple Instance Testing
echo.
echo This will start ONE backend and TWO frontend instances
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
echo  Step 2: Starting Frontend - Admin/Doctor (Port 3000)
echo ========================================
start "HRSM Frontend Main" cmd /k "cd /d %~dp0 && npm start"
echo Main frontend starting... waiting 5 seconds
timeout /t 5 >nul

echo.
echo ========================================
echo  Step 3: Starting Frontend - Patient Testing (Port 3001)
echo ========================================
start "HRSM Frontend Patient" cmd /k "cd /d %~dp0 && set PORT=3001 && npm start"

echo.
echo ========================================
echo  HRSM 2.0 Multi-Instance Setup Complete!
echo ========================================
echo.
echo 🔧 ARCHITECTURE:
echo    ├── Backend (Port 5000) - ONE shared server
echo    ├── Frontend 1 (Port 3000) - Admin/Doctor testing
echo    └── Frontend 2 (Port 3001) - Patient testing
echo.
echo � LOGIN CREDENTIALS:
echo.
echo 🔹 Port 3000 (Admin/Doctor):
echo    - Admin: admin / admin123
echo    - Doctor: doctor / doctor123
echo.
echo 🔹 Port 3001 (Patient):
echo    - Patient: patient / patient123
echo.
echo ⚠️  IMPORTANT: Both frontends connect to the SAME backend!
echo � If login fails, ensure backend is running (check first window)
echo.
echo Press any key to exit this window...
pause >nul
