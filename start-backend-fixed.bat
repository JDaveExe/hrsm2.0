@echo off
echo ===============================
echo Healthcare Management System
echo ===============================
echo.
echo Starting backend server...

cd backend
echo PORT=5000 > .env.temp
echo JWT_SECRET=my_secret_key_for_healthcare_app_2025_07 >> .env.temp
echo NODE_ENV=development >> .env.temp
echo DB_NAME=hrsm_db >> .env.temp
echo DB_USER=root >> .env.temp
echo DB_PASSWORD= >> .env.temp
echo DB_HOST=localhost >> .env.temp
echo DB_DIALECT=mysql >> .env.temp

if not exist .env (
  echo Creating .env file...
  copy .env.temp .env
  del .env.temp
) else (
  del .env.temp
)

echo Starting server on port 5000...
npm start

pause
