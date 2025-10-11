# Railway Deployment Checklist

Use this checklist to ensure successful deployment. Check off items as you complete them.

---

## Pre-Deployment

- [ ] Railway account created
- [ ] GitHub repository up to date
- [ ] Node.js 18+ installed locally
- [ ] Railway CLI installed: `npm install -g @railway/cli`
- [ ] Reviewed `DEPLOYMENT_QUICK_START.md`

---

## Backend Deployment

### 1. Create Project
- [ ] Logged into Railway dashboard
- [ ] Created new project
- [ ] Selected "Deploy from GitHub repo"
- [ ] Connected to `hrsm2.0` repository
- [ ] Named service "backend" (or similar)

### 2. Configure Backend Service
- [ ] Set Root Directory to: `backend`
- [ ] Set Build Command to: `npm install`
- [ ] Set Start Command to: `node server.js`
- [ ] Saved settings

### 3. Add MySQL Database
- [ ] Clicked "+ New" in project
- [ ] Selected "Database" → "MySQL"
- [ ] Waited for provisioning to complete
- [ ] Verified MySQL service is running

### 4. Configure Environment Variables
- [ ] Opened backend service → Variables tab
- [ ] Added database variables (use Railway references):
  - [ ] `MYSQLHOST=${{MySQL.MYSQLHOST}}`
  - [ ] `MYSQLPORT=${{MySQL.MYSQLPORT}}`
  - [ ] `MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}`
  - [ ] `MYSQLUSER=${{MySQL.MYSQLUSER}}`
  - [ ] `MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}`
  - [ ] `DATABASE_URL=${{MySQL.DATABASE_URL}}`

- [ ] Added server variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=5000`

- [ ] Added JWT secrets (GENERATE NEW ONES!):
  - [ ] `JWT_SECRET=your-64-char-random-string`
  - [ ] `SESSION_SECRET=another-64-char-random-string`

- [ ] Added security variables:
  - [ ] `BCRYPT_ROUNDS=12`
  - [ ] `MAX_LOGIN_ATTEMPTS=5`
  - [ ] `ENABLE_HELMET=true`
  - [ ] `ENABLE_FALLBACK_ACCOUNTS=false`

- [ ] Added CORS (will update later):
  - [ ] `CORS_ORIGIN=http://localhost:3000` (temporary)
  - [ ] `FRONTEND_URL=http://localhost:3000` (temporary)

### 5. Deploy Backend
- [ ] Clicked "Deploy" or pushed to GitHub
- [ ] Monitored deployment logs
- [ ] Verified deployment succeeded
- [ ] Copied backend URL: `____________________________`

### 6. Test Backend
- [ ] Visited backend URL in browser
- [ ] Saw "Healthcare API is running..."
- [ ] Tested health endpoint: `https://your-backend.up.railway.app/api/health`
- [ ] Got successful response

### 7. Initialize Database
- [ ] Opened terminal locally
- [ ] Ran: `railway login`
- [ ] Ran: `railway link` (selected correct project)
- [ ] Ran: `railway run npm run init-db`
- [ ] Saw success message
- [ ] Verified tables created (check MySQL in Railway dashboard)

---

## Frontend Deployment

### 1. Create Frontend Service
- [ ] Clicked "+ New" in same Railway project
- [ ] Selected "GitHub Repo"
- [ ] Selected `hrsm2.0` repository again
- [ ] Named service "frontend" (or similar)

### 2. Configure Frontend Service
- [ ] Set Root Directory to: `/` (root folder)
- [ ] Set Build Command to: `npm install && npm run build`
- [ ] Set Start Command to: `npx serve -s build -p $PORT`
- [ ] Saved settings

### 3. Configure Frontend Environment Variables
- [ ] Opened frontend service → Variables tab
- [ ] Added: `REACT_APP_API_URL=https://your-backend-url.up.railway.app`
- [ ] Added: `NODE_ENV=production`
- [ ] Added: `GENERATE_SOURCEMAP=false`
- [ ] Added: `CI=false`

### 4. Deploy Frontend
- [ ] Triggered deployment (push to GitHub or manual redeploy)
- [ ] Monitored build logs
- [ ] Verified build succeeded
- [ ] Verified deployment succeeded
- [ ] Copied frontend URL: `____________________________`

### 5. Test Frontend
- [ ] Visited frontend URL in browser
- [ ] Saw login page load correctly
- [ ] Checked browser console (F12) for errors

---

## Connect Backend & Frontend

### 1. Update Backend CORS
- [ ] Opened backend service → Variables
- [ ] Updated: `CORS_ORIGIN=https://your-frontend-url.up.railway.app`
- [ ] Updated: `FRONTEND_URL=https://your-frontend-url.up.railway.app`
- [ ] Saved changes
- [ ] Waited for backend to redeploy

### 2. Verify Connection
- [ ] Opened frontend URL
- [ ] Opened browser DevTools (F12) → Network tab
- [ ] Attempted login with: `admin` / `admin123`
- [ ] Checked Network tab for successful API calls
- [ ] Verified no CORS errors in Console

---

## Post-Deployment Setup

### 1. Security
- [ ] Logged in as admin
- [ ] Changed admin password immediately
- [ ] Created additional user accounts
- [ ] Disabled any test accounts

### 2. Testing
- [ ] Tested patient registration
- [ ] Tested appointment creation
- [ ] Tested vital signs recording
- [ ] Tested medication inventory
- [ ] Tested vaccination records
- [ ] Verified data persists (refresh page)

### 3. Monitoring
- [ ] Set up Railway metrics monitoring
- [ ] Bookmarked backend logs URL
- [ ] Bookmarked frontend logs URL
- [ ] Tested error reporting

---

## Optional Enhancements

### Custom Domain
- [ ] Purchased domain name
- [ ] Added custom domain to Railway frontend service
- [ ] Updated DNS records
- [ ] Updated backend CORS_ORIGIN with custom domain
- [ ] Verified SSL certificate working

### Backup Strategy
- [ ] Set up Railway database backups
- [ ] Tested backup restoration process
- [ ] Documented backup schedule

### Monitoring & Alerts
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configured email alerts for downtime
- [ ] Set up error tracking (e.g., Sentry)

---

## Troubleshooting Used

If you encountered issues, document what fixed them:

**Issue 1**: _______________________________
**Solution**: _______________________________

**Issue 2**: _______________________________
**Solution**: _______________________________

**Issue 3**: _______________________________
**Solution**: _______________________________

---

## URLs & Credentials

Document your deployment details (store securely!):

**Backend URL**: _______________________________
**Frontend URL**: _______________________________
**Custom Domain**: _______________________________

**Railway Project**: _______________________________
**MySQL Database**: _______________________________

**Admin Username**: admin
**Admin Password**: [Changed from default ✓]

---

## Completion

- [ ] All checklist items completed
- [ ] System fully functional
- [ ] Team members can access
- [ ] Documentation updated
- [ ] Backup strategy in place

---

## Resources Used

- [ ] `DEPLOYMENT_QUICK_START.md`
- [ ] `RAILWAY_DEPLOYMENT_GUIDE.md`
- [ ] `RAILWAY_MYSQL_FIX.md`
- [ ] `DEPLOYMENT_SUMMARY.md`
- [ ] Railway documentation
- [ ] Railway Discord community

---

**Deployment Date**: _______________________________
**Completed By**: _______________________________
**Time Taken**: _______________________________

🎉 **Congratulations! Your HRSM 2.0 system is now live!** 🎉
