# 🚀 Clone & Setup HRSM 2.0 - Quick Reference

## 📥 Clone the Repository

```bash
# Method 1: HTTPS (Recommended for most users)
git clone https://github.com/JDaveExe/hrsm2.0.git
cd hrsm2.0

# Method 2: SSH (If you have SSH keys set up)
git clone git@github.com:JDaveExe/hrsm2.0.git
cd hrsm2.0

# Method 3: GitHub CLI (If you have gh installed)
gh repo clone JDaveExe/hrsm2.0
cd hrsm2.0
```

## ⚡ Quick Setup (Choose your method)

### 🪟 Windows Users
```bash
# Run the automated setup script
setup.bat

# OR manual setup:
npm install
cd backend && npm install && cd ..
copy backend\.env.example backend\.env
```

### 🐧 Linux/Mac Users
```bash
# Run the automated setup script
chmod +x setup.sh
./setup.sh

# OR manual setup:
npm install
cd backend && npm install && cd ..
cp backend/.env.example backend/.env
```

## 🗄️ Database Setup
```sql
# Create database in MySQL
mysql -u root -p
CREATE DATABASE hrsm_db;
EXIT;
```

## ⚙️ Configure Environment
Edit `backend/.env`:
```env
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hrsm_db
JWT_SECRET=your-super-secure-64-character-secret-key
DEFAULT_ADMIN_PASSWORD=YourSecurePassword123!
DEFAULT_DOCTOR_PASSWORD=YourSecurePassword123!
DEFAULT_PATIENT_PASSWORD=YourSecurePassword123!
```

## 🚀 Start the System
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
npm start
```

## 🌐 Access URLs
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 🔐 Login
- **Admin**: username=`admin`, password=`[YOUR_ADMIN_PASSWORD]`
- **Doctor**: username=`doctor`, password=`[YOUR_DOCTOR_PASSWORD]`
- **Patient**: username=`patient`, password=`[YOUR_PATIENT_PASSWORD]`

## 📚 Need Help?
- See [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) for detailed instructions
- See [README.md](README.md) for full documentation
- Create an issue on GitHub for support

---
**That's it! You're ready to explore HRSM 2.0! 🏥✨**
