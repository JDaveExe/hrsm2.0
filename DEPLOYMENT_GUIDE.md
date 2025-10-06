# 🚀 HRSM 2.0 - Complete Deployment Guide

## Healthcare Resource Sharing Management System
### Capstone Project Deployment Guide

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Options Comparison](#deployment-options-comparison)
3. [Option A: Railway.app (Recommended)](#option-a-railwayapp-recommended)
4. [Option B: Render.com](#option-b-rendercom)
5. [Option C: Vercel + Railway](#option-c-vercel--railway)
6. [Post-Deployment Setup](#post-deployment-setup)
7. [Domain Name Setup](#domain-name-setup)
8. [Security Checklist](#security-checklist)
9. [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Deployment Checklist

### 1. Code Preparation

- [x] Remove hardcoded credentials (✅ Already done!)
- [x] Test patients removed from database (✅ Already done!)
- [x] Instance indicator removed (✅ Already done!)
- [ ] Environment variables configured in `.env`
- [ ] Database credentials secured
- [ ] JWT secret configured
- [ ] All features tested locally

### 2. Database Preparation

**Run these commands in your local database:**

```bash
# Ensure you have active accounts
# Keep your existing admin/doctor/management accounts

# Optional: Clean up any test data
cd backend
node delete-test-patients.js
node clear-old-appointments.js
```

### 3. Environment Configuration

Create `backend/.env` file (copy from `.env.example`):

```env
# Critical Settings for Deployment
NODE_ENV=production
ENABLE_FALLBACK_ACCOUNTS=false

# Database (will be updated with hosted database)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hrsm2

# Security
JWT_SECRET=your_super_secret_random_string_32_chars_minimum
JWT_EXPIRES_IN=24h
```

### 4. Test Locally

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd ..
npm start

# Verify:
# ✓ Can login with existing accounts
# ✓ All features work
# ✓ No console errors
```

---

## 🎯 Deployment Options Comparison

| Feature | Railway.app | Render.com | Vercel + Railway |
|---------|------------|------------|------------------|
| **Cost** | FREE tier | FREE tier | FREE tier |
| **Ease of Setup** | ⭐⭐⭐⭐⭐ Easy | ⭐⭐⭐⭐ Easy | ⭐⭐⭐ Moderate |
| **Database Included** | ✅ Yes (MySQL) | ✅ Yes (PostgreSQL) | ⚠️ Separate |
| **Custom Domain** | ✅ Free | ✅ Free | ✅ Free |
| **Auto Deploy** | ✅ GitHub sync | ✅ GitHub sync | ✅ GitHub sync |
| **SSL Certificate** | ✅ Automatic | ✅ Automatic | ✅ Automatic |
| **Best For** | Full-stack app | Backend-heavy | Frontend-focused |
| **Recommended** | ⭐ **YES** | ⭐ Alternative | Good for React |

**Recommendation:** Use **Railway.app** for easiest deployment with everything included.

---

## 🚂 Option A: Railway.app (Recommended)

### Why Railway?
- ✅ Easiest setup for beginners
- ✅ MySQL database included
- ✅ Full-stack app support (frontend + backend)
- ✅ $5/month free credit
- ✅ Automatic HTTPS
- ✅ GitHub integration

### Step-by-Step Deployment

#### **Phase 1: Account Setup (5 minutes)**

1. **Go to Railway.app**
   - Visit: https://railway.app/
   - Click "Start a New Project"
   - Sign up with GitHub (recommended)

2. **Connect Your Repository**
   - Click "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub
   - Select `JDaveExe/hrsm2.0` repository

#### **Phase 2: Database Setup (10 minutes)**

1. **Add MySQL Database**
   ```
   In Railway Dashboard:
   - Click "+ New"
   - Select "Database"
   - Choose "MySQL"
   - Wait for database to provision (~2 minutes)
   ```

2. **Get Database Credentials**
   ```
   Click on MySQL service → Variables tab
   
   You'll see:
   MYSQL_HOST=monorail.proxy.rlwy.net
   MYSQL_USER=root
   MYSQL_PASSWORD=<generated-password>
   MYSQL_DATABASE=railway
   MYSQL_PORT=12345
   ```

3. **Import Your Database**
   
   **Option A: Export from local MySQL**
   ```bash
   # Export your local database
   mysqldump -u root hrsm2 > hrsm2_export.sql
   ```

   **Option B: Use Railway MySQL CLI**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Link to your project
   railway link
   
   # Connect to database
   railway connect mysql
   
   # Import your data
   source hrsm2_export.sql
   ```

#### **Phase 3: Backend Deployment (15 minutes)**

1. **Create Backend Service**
   ```
   In Railway Dashboard:
   - Click "+ New"
   - Select "GitHub Repo"
   - Choose your repository
   - Click "Add variables"
   ```

2. **Configure Environment Variables**
   ```env
   # In Railway Backend Service → Variables
   
   NODE_ENV=production
   PORT=5000
   
   # Database (copy from MySQL service)
   DB_HOST=${MYSQL_HOST}
   DB_USER=${MYSQL_USER}
   DB_PASSWORD=${MYSQL_PASSWORD}
   DB_NAME=${MYSQL_DATABASE}
   DB_PORT=${MYSQL_PORT}
   
   # Security
   JWT_SECRET=generate_a_32_character_random_string_here
   JWT_EXPIRES_IN=24h
   
   # Disable fallback accounts (use database accounts)
   ENABLE_FALLBACK_ACCOUNTS=false
   
   # Frontend URL (will update after frontend deploy)
   FRONTEND_URL=https://your-frontend-url.railway.app
   ```

3. **Configure Build Settings**
   ```
   Settings tab:
   - Root Directory: /backend
   - Build Command: npm install
   - Start Command: npm start
   ```

4. **Deploy Backend**
   ```
   - Click "Deploy"
   - Wait for build to complete (~3-5 minutes)
   - Check logs for "Server running on port 5000"
   - Copy backend URL: https://your-backend.railway.app
   ```

#### **Phase 4: Frontend Deployment (10 minutes)**

1. **Create Frontend Service**
   ```
   In Railway Dashboard:
   - Click "+ New"
   - Select "GitHub Repo" (same repo)
   - Click "Add variables"
   ```

2. **Configure Environment Variables**
   ```env
   # In Railway Frontend Service → Variables
   
   NODE_ENV=production
   
   # Backend API URL (from backend service)
   REACT_APP_API_URL=https://your-backend.railway.app/api
   ```

3. **Configure Build Settings**
   ```
   Settings tab:
   - Root Directory: /
   - Build Command: npm install && npm run build
   - Start Command: npx serve -s build -p $PORT
   ```

4. **Update Backend CORS**
   ```
   Go back to Backend service → Variables:
   - Update FRONTEND_URL with your frontend URL
   - Redeploy backend
   ```

5. **Deploy Frontend**
   ```
   - Click "Deploy"
   - Wait for build (~5-10 minutes)
   - Frontend will be live at: https://your-app.railway.app
   ```

#### **Phase 5: Testing & Verification (10 minutes)**

1. **Test Backend API**
   ```
   Visit: https://your-backend.railway.app/api/health
   Should return: {"status": "ok"}
   ```

2. **Test Frontend**
   ```
   Visit: https://your-app.railway.app
   
   Verify:
   ✓ Homepage loads correctly
   ✓ Can navigate to login page
   ✓ Login form appears
   ```

3. **Test Login**
   ```
   Login with your existing accounts:
   - Admin account
   - Doctor account
   - Management account
   
   Verify:
   ✓ Login successful
   ✓ Dashboard loads
   ✓ Can access features
   ```

4. **Test Patient Registration**
   ```
   ✓ Create new patient account
   ✓ Login as patient
   ✓ Access patient dashboard
   ```

---

## 🎨 Option B: Render.com

### Step-by-Step Guide

#### **1. Account Setup**

1. Go to https://render.com/
2. Sign up with GitHub
3. Authorize Render

#### **2. Database Setup**

```
In Render Dashboard:
- Click "New +"
- Select "PostgreSQL"
- Name: hrsm2-database
- Plan: Free
- Click "Create Database"
```

**Note:** Render uses PostgreSQL (not MySQL). You'll need to:
- Update your Sequelize dialect to 'postgres'
- Or use a different platform (Railway supports MySQL)

#### **3. Backend Service**

```
- Click "New +"
- Select "Web Service"
- Connect your GitHub repo
- Name: hrsm2-backend
- Root Directory: backend
- Build Command: npm install
- Start Command: npm start
- Plan: Free
```

Add environment variables (same as Railway guide above).

#### **4. Frontend Service**

```
- Click "New +"
- Select "Static Site"
- Connect your GitHub repo
- Name: hrsm2-frontend
- Build Command: npm install && npm run build
- Publish Directory: build
- Plan: Free
```

---

## 🌐 Option C: Vercel + Railway

### Best for: Optimized frontend performance

**Frontend on Vercel** (fastest React hosting)
**Backend + Database on Railway**

#### **1. Deploy Backend on Railway**
- Follow Railway guide above (Backend + Database only)

#### **2. Deploy Frontend on Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd your-project-folder
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? hrsm2-frontend
# - Directory? ./
# - Build command? npm run build
# - Output directory? build
```

**Set Environment Variables in Vercel:**
```
Dashboard → Settings → Environment Variables:
REACT_APP_API_URL=https://your-railway-backend.railway.app/api
```

---

## 🔧 Post-Deployment Setup

### 1. Update CORS Settings

In your backend `.env`:
```env
FRONTEND_URL=https://your-actual-frontend-url.railway.app
```

### 2. Test All Features

- [ ] User login (all roles)
- [ ] Patient registration
- [ ] Patient check-in
- [ ] Doctor queue
- [ ] Vital signs recording
- [ ] Prescription management
- [ ] Inventory management
- [ ] Audit trail viewing
- [ ] Reports generation
- [ ] Weather widget (if API key configured)

### 3. Security Hardening

```env
# Ensure these are set correctly:
NODE_ENV=production
ENABLE_FALLBACK_ACCOUNTS=false
JWT_SECRET=<strong-random-string>
```

### 4. Monitor Logs

**Railway:**
```
Dashboard → Your Service → Logs tab
Check for any errors or warnings
```

---

## 🌍 Domain Name Setup (Optional)

### Free Domain Options:

#### **Option 1: Use Platform Subdomain (Easiest)**
- Railway: `your-app.railway.app` ✅ FREE
- Render: `your-app.onrender.com` ✅ FREE
- Vercel: `your-app.vercel.app` ✅ FREE

#### **Option 2: Free Domain (Freenom)**

1. **Get Free Domain:**
   - Visit: https://www.freenom.com/
   - Search for available domains (.tk, .ml, .ga, .cf, .gq)
   - Register for free (up to 12 months)

2. **Connect to Railway:**
   ```
   Railway Dashboard → Service → Settings → Domains:
   - Click "Add Domain"
   - Enter your domain: yourdomain.tk
   - Copy DNS records provided
   ```

3. **Configure DNS (Freenom):**
   ```
   Freenom Dashboard → Manage Domain → DNS:
   Add CNAME record:
   - Name: @ (or www)
   - Target: <your-railway-url>
   ```

4. **Wait for Propagation (5-30 minutes)**

#### **Option 3: School Domain (Best for Capstone)**

If your school provides domains:
```
Contact your school IT department:
- Request subdomain: hrsm.youruniversity.edu.ph
- Provide them Railway DNS records
- Usually free for students
```

---

## 🔒 Security Checklist

### Before Going Live:

- [ ] `NODE_ENV=production` set
- [ ] `ENABLE_FALLBACK_ACCOUNTS=false` set
- [ ] JWT_SECRET is strong and unique
- [ ] Database password is secure
- [ ] HTTPS/SSL enabled (automatic on Railway/Render/Vercel)
- [ ] CORS configured to only allow your frontend domain
- [ ] All test data removed from database
- [ ] Default account passwords changed
- [ ] Audit trail enabled and working

### Regular Maintenance:

- [ ] Check logs weekly for errors
- [ ] Monitor database usage
- [ ] Update dependencies monthly
- [ ] Backup database regularly
- [ ] Review audit logs for suspicious activity

---

## 🐛 Troubleshooting

### Common Issues:

#### **1. Database Connection Failed**
```
Error: connect ECONNREFUSED

Solution:
- Verify database credentials in environment variables
- Check if database service is running
- Ensure DB_HOST, DB_PORT are correct
```

#### **2. Frontend Can't Connect to Backend**
```
Error: Network Error / CORS Error

Solution:
- Verify REACT_APP_API_URL is set correctly
- Check backend FRONTEND_URL environment variable
- Ensure both services are deployed and running
```

#### **3. Login Not Working**
```
Error: Invalid credentials

Solution:
- Verify ENABLE_FALLBACK_ACCOUNTS=false
- Check if accounts exist in database
- Try logging in with existing accounts
- Check backend logs for authentication errors
```

#### **4. Build Failed**
```
Error: npm ERR! code ELIFECYCLE

Solution:
- Check build logs for specific error
- Verify package.json scripts are correct
- Ensure all dependencies are in package.json
- Try building locally first: npm run build
```

#### **5. Environment Variables Not Working**
```
Solution:
- Redeploy after adding variables
- Check variable names match exactly
- No spaces in variable values
- Restart services after changing variables
```

---

## 📊 Estimated Timeline

| Phase | Time | Tasks |
|-------|------|-------|
| **Preparation** | 30 mins | Testing, cleanup, env setup |
| **Database Setup** | 15 mins | Create DB, import data |
| **Backend Deploy** | 20 mins | Configure, deploy, test |
| **Frontend Deploy** | 20 mins | Configure, deploy, test |
| **Testing** | 30 mins | Full system testing |
| **Documentation** | 20 mins | Record credentials, URLs |
| **Total** | **~2 hours** | First-time deployment |

**Subsequent deployments:** ~5-10 minutes (just push to GitHub)

---

## 🎓 For Your Capstone Presentation

### What to Show:

1. **Live Demo URL** - Share the Railway/Render URL
2. **Security Features:**
   - No hardcoded credentials
   - Environment-based configuration
   - Role-based access control
   - Audit trail logging
   - HTTPS encryption

3. **Deployment Process:**
   - GitHub integration
   - Automated deployments
   - Environment management
   - Database hosting

4. **System Features:**
   - Patient registration and login
   - Doctor queue management
   - Vital signs tracking
   - Prescription management
   - Inventory management
   - Audit trail
   - Reports generation

### Documentation to Submit:

- [ ] Deployment URL
- [ ] Admin account credentials (for instructors)
- [ ] Architecture diagram
- [ ] Security measures implemented
- [ ] Database schema
- [ ] User manual
- [ ] This deployment guide

---

## 📞 Support Resources

- **Railway Docs:** https://docs.railway.app/
- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **MySQL on Railway:** https://docs.railway.app/databases/mysql
- **Your Repository Issues:** https://github.com/JDaveExe/hrsm2.0/issues

---

## ✅ Final Checklist

### Pre-Deployment:
- [ ] All code committed to GitHub
- [ ] Database cleaned of test data
- [ ] Environment variables documented
- [ ] Local testing completed
- [ ] Security checklist reviewed

### Deployment:
- [ ] Platform account created
- [ ] Database provisioned
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Environment variables configured

### Post-Deployment:
- [ ] All features tested live
- [ ] Admin access verified
- [ ] Patient registration tested
- [ ] URLs documented
- [ ] Credentials secured
- [ ] Ready for demonstration

---

## 🎉 Congratulations!

Your HRSM 2.0 system is now deployed and ready for your capstone presentation!

**Next Steps:**
1. Test thoroughly
2. Prepare demo script
3. Document admin credentials for instructors
4. Create user guide
5. Prepare presentation slides

Good luck with your capstone! 🚀

---

**Need Help?** Check troubleshooting section or create an issue on GitHub.
