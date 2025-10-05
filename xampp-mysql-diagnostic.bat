@echo off
echo =====================================
echo XAMPP MySQL Diagnostic Script
echo =====================================
echo.

echo [1] Checking MySQL port 3306...
netstat -an | findstr "3306"
if %errorlevel% equ 0 (
    echo WARNING: Port 3306 is in use!
) else (
    echo OK: Port 3306 is available
)
echo.

echo [2] Checking for running MySQL processes...
tasklist | findstr /i "mysql"
echo.

echo [3] Checking XAMPP MySQL service status...
sc query mysql 2>nul
if %errorlevel% equ 0 (
    echo MySQL Windows service found
) else (
    echo No MySQL Windows service found (normal for XAMPP)
)
echo.

echo [4] Checking XAMPP directory...
if exist "C:\xampp\mysql\bin\mysqld.exe" (
    echo OK: XAMPP MySQL executable found
) else (
    echo ERROR: XAMPP MySQL executable not found!
)
echo.

echo [5] Checking MySQL data directory...
if exist "C:\xampp\mysql\data" (
    echo OK: MySQL data directory exists
    dir "C:\xampp\mysql\data" | findstr /i "ib"
) else (
    echo ERROR: MySQL data directory not found!
)
echo.

echo [6] Checking MySQL error log...
if exist "C:\xampp\mysql\data\mysql_error.log" (
    echo Last 10 lines of MySQL error log:
    echo ================================
    powershell "Get-Content 'C:\xampp\mysql\data\mysql_error.log' -Tail 10"
) else (
    echo No MySQL error log found
)
echo.

echo [7] Checking for corrupted MySQL data files...
if exist "C:\xampp\mysql\data\ibdata1" (
    echo OK: InnoDB system tablespace exists
) else (
    echo WARNING: InnoDB system tablespace missing
)
echo.

echo [8] Common MySQL crash causes:
echo - Port 3306 conflict (checked above)
echo - Corrupted InnoDB files
echo - Insufficient disk space
echo - Antivirus interference
echo - Previous unclean shutdown
echo.

echo [9] Recommended fixes:
echo 1. Stop any running MySQL processes
echo 2. Run XAMPP as Administrator
echo 3. Check MySQL error logs
echo 4. If corrupted, restore from backup or reset data
echo.

echo Diagnostic complete. Press any key to exit...
pause >nul
