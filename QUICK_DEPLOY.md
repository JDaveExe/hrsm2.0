# 🚀 Quick Deployment Reference Card

## HRSM 2.0 - Fast Track Deployment

---

## ⚡ 15-Minute Deployment (Railway.app)

### Prerequisites
- [x] Code pushed to GitHub
- [ ] Railway account (sign up: https://railway.app)
- [ ] Admin/Doctor/Management accounts in local database

### Step 1: Create Project (2 min)
```
1. Go to railway.app
2. Click "Start a New Project"
3. Login with GitHub
4. Select your repository
```

### Step 2: Add Database (3 min)
```
1. Click "+ New" → Database → MySQL
2. Wait for provisioning
3. Copy database credentials from Variables tab
```

### Step 3: Deploy Backend (5 min)
```
Settings:
- Root Directory: /backend
- Build Command: npm install
- Start Command: npm start

Environment Variables:
NODE_ENV=production
ENABLE_FALLBACK_ACCOUNTS=false
JWT_SECRET=<generate-32-char-random-string>
DB_HOST=${MYSQL_HOST}
DB_USER=${MYSQL_USER}
DB_PASSWORD=${MYSQL_PASSWORD}
DB_NAME=${MYSQL_DATABASE}
DB_PORT=${MYSQL_PORT}

Click Deploy → Wait → Copy backend URL
```

### Step 4: Import Database (3 min)
```bash
# Option A: Railway CLI
npm install -g @railway/cli
railway login
railway link
railway connect mysql
source hrsm2_export.sql

# Option B: Use MySQL Workbench
Connect using Railway database credentials
Import your local database
```

### Step 5: Deploy Frontend (5 min)
```
Create new service from same repo:

Settings:
- Root Directory: /
- Build Command: npm install && npm run build  
- Start Command: npx serve -s build -p $PORT

Environment Variables:
REACT_APP_API_URL=https://your-backend.railway.app/api

Click Deploy → Wait → Done!
```

---

## 🔑 Critical Environment Variables

### Backend (.env or Railway Variables)
```env
# MUST HAVE
NODE_ENV=production
ENABLE_FALLBACK_ACCOUNTS=false
JWT_SECRET=your_super_secret_random_32_chars

# Database (from Railway MySQL)
DB_HOST=${MYSQL_HOST}
DB_USER=${MYSQL_USER}
DB_PASSWORD=${MYSQL_PASSWORD}
DB_NAME=${MYSQL_DATABASE}
DB_PORT=${MYSQL_PORT}

# CORS
FRONTEND_URL=https://your-frontend.railway.app
```

### Frontend (.env or Railway Variables)
```env
REACT_APP_API_URL=https://your-backend.railway.app/api
```

---

## ✅ Testing Checklist (5 min)

```
After deployment, test:
[ ] Visit frontend URL - homepage loads
[ ] Login with admin account - works
[ ] Login with doctor account - works
[ ] Login with management account - works
[ ] Register new patient - works
[ ] Patient login - works
[ ] Check-in patient - works
[ ] View audit logs - shows activities
```

---

## 🐛 Quick Fixes

### Frontend shows blank page?
```
Check browser console for errors
Verify REACT_APP_API_URL in frontend variables
Rebuild frontend
```

### Can't login?
```
Check backend logs in Railway
Verify ENABLE_FALLBACK_ACCOUNTS=false
Ensure your accounts exist in database
Test backend API: https://your-backend.railway.app/api/health
```

### CORS error?
```
Update backend FRONTEND_URL variable
Redeploy backend
```

### Database connection failed?
```
Verify all DB_* variables are set
Check if MySQL service is running
Restart backend service
```

---

## 📝 After Deployment

### Save These URLs:
```
Frontend: https://your-app.railway.app
Backend: https://your-backend.railway.app
Database: (internal Railway connection)
```

### Save Credentials:
```
Admin: [your-admin-username] / [your-password]
Doctor: [your-doctor-username] / [your-password]
Management: [your-mgmt-username] / [your-password]

(Keep secure - share only with instructors)
```

---

## 🎓 For Capstone Demo

### Share with panel:
- Frontend URL
- Demo accounts (create test accounts)
- Features list
- Security features implemented

### Don't share publicly:
- Database credentials
- JWT secret
- Admin passwords
- API keys

---

## 📞 Quick Help

**Railway Docs:** https://docs.railway.app/
**Issues?** https://github.com/JDaveExe/hrsm2.0/issues

**Common Commands:**
```bash
# View Railway logs
railway logs

# Redeploy
git push origin main (auto-deploys)

# Check status
railway status
```

---

## 💰 Cost Estimate

**Railway Free Tier:**
- $5/month credit (FREE)
- ~500 hours/month
- Perfect for capstone demo
- No credit card required initially

**Total Cost: $0** (for capstone duration)

---

## ⏱️ Time Breakdown

```
Setup account:        2 minutes
Create database:      3 minutes
Deploy backend:       5 minutes
Import database:      3 minutes
Deploy frontend:      5 minutes
Testing:             5 minutes
------------------------
Total:              23 minutes
```

---

**Ready? Start at: https://railway.app 🚀**
