# 🚂 Railway Deployment Guide - HRSM 2.0 (Fresh Start)

## Architecture Overview

Your system requires **TWO separate Railway services**:
1. **Backend Service** (Node.js + Express API)
2. **Frontend Service** (React Static Site)
3. **MySQL Database** (Railway Plugin)

---

## 🎯 Quick Start Checklist

- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] Backend service deployed
- [ ] MySQL database provisioned
- [ ] Frontend service deployed
- [ ] Environment variables configured

---

## Part 1: Backend Deployment

### Step 1: Create New Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `hrsm2.0` repository
5. **IMPORTANT**: Select **"Add variables manually"** (don't auto-deploy yet)

### Step 2: Add MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database" → "Add MySQL"**
3. Railway will automatically provision a MySQL database
4. **Copy the connection variables** (Railway provides these automatically):
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLDATABASE`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `DATABASE_URL` (full connection string)

### Step 3: Configure Backend Service

1. Click on your main service (the one connected to GitHub)
2. Go to **"Settings"**
3. Under **"Root Directory"**, set it to: `backend`
4. Under **"Start Command"**, set it to: `node server.js`
5. Under **"Build Command"**, set it to: `npm install`

### Step 4: Add Backend Environment Variables

Go to **"Variables"** tab and add these:

```bash
# Database (Auto-populated from MySQL service)
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLPORT=${{MySQL.MYSQLPORT}}
MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}
MYSQLUSER=${{MySQL.MYSQLUSER}}
MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
DATABASE_URL=${{MySQL.DATABASE_URL}}

# Server Configuration
NODE_ENV=production
PORT=5000

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-min-64-chars-change-this-in-production-abcdef123456
SESSION_SECRET=your-super-secret-session-key-min-64-chars-change-this-in-production-xyz789

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=15
ENABLE_HELMET=true

# CORS - Update after frontend is deployed
CORS_ORIGIN=https://your-frontend-url.railway.app
FRONTEND_URL=https://your-frontend-url.railway.app

# Features
ENABLE_FALLBACK_ACCOUNTS=false
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_SMS_NOTIFICATIONS=false
```

### Step 5: Deploy Backend

1. Click **"Deploy"** or push to GitHub
2. Monitor logs for errors
3. Once deployed, copy the backend URL (e.g., `https://your-backend.up.railway.app`)

---

## Part 2: Frontend Deployment

### Step 1: Create Frontend Service

1. In the same Railway project, click **"+ New"**
2. Select **"GitHub Repo"** → Choose `hrsm2.0` again
3. Railway will create a second service

### Step 2: Configure Frontend Service

1. Go to **"Settings"**
2. Set **"Root Directory"** to: `/` (root)
3. Set **"Build Command"** to: `npm install && npm run build`
4. Set **"Start Command"** to: `npx serve -s build -l $PORT`

### Step 3: Add Frontend Environment Variables

Go to **"Variables"** tab:

```bash
# API URL - Use your backend service URL
REACT_APP_API_URL=https://your-backend.up.railway.app

# Build Configuration
NODE_ENV=production
GENERATE_SOURCEMAP=false
CI=false
```

### Step 4: Install Serve (Required)

Add `serve` to your root package.json dependencies:

```bash
# Run locally first:
npm install --save serve
```

Or I can add it for you!

### Step 5: Deploy Frontend

1. Push changes to GitHub
2. Railway will automatically rebuild and deploy
3. Copy the frontend URL (e.g., `https://your-frontend.up.railway.app`)

### Step 6: Update Backend CORS

1. Go back to **Backend service → Variables**
2. Update these variables:
   ```
   CORS_ORIGIN=https://your-frontend.up.railway.app
   FRONTEND_URL=https://your-frontend.up.railway.app
   ```
3. Backend will automatically redeploy

---

## Part 3: Database Initialization

### Initialize Database Tables

1. Open your backend URL: `https://your-backend.up.railway.app`
2. Call the initialization endpoint:
   ```
   POST https://your-backend.up.railway.app/api/init/init-database
   ```

   Or use this curl command:
   ```bash
   curl -X POST https://your-backend.up.railway.app/api/init/init-database
   ```

3. Check the response - it should create all tables

### Create Default Admin Account

After initialization, you can create admin accounts via your admin routes or by running the seed script.

---

## 🔧 Troubleshooting Common Issues

### Backend Crashes on Start

**Error**: `Cannot find module`
- **Fix**: Make sure Root Directory is set to `backend`
- **Fix**: Check that `node_modules` exists in backend folder

**Error**: `ECONNREFUSED` or database connection fails
- **Fix**: Verify MySQL service is running
- **Fix**: Check environment variables are properly linked
- **Fix**: Use Railway's built-in variable references: `${{MySQL.MYSQLHOST}}`

**Error**: `JWT_SECRET is undefined`
- **Fix**: Add JWT_SECRET to environment variables

### Frontend Build Fails

**Error**: `npm ERR! missing script: build`
- **Fix**: Ensure Root Directory is `/` (root), not `backend`

**Error**: `Module not found: Can't resolve` during build
- **Fix**: Run `npm install` locally to update package-lock.json
- **Fix**: Check that all dependencies are in `package.json`, not just `devDependencies`

**Error**: Frontend deployed but shows blank page
- **Fix**: Check browser console for CORS errors
- **Fix**: Verify `REACT_APP_API_URL` is set correctly
- **Fix**: Update backend `CORS_ORIGIN` to match frontend URL

### API Calls Not Working

**Error**: CORS errors in browser console
- **Fix**: Update backend `CORS_ORIGIN` environment variable
- **Fix**: Ensure frontend URL includes https:// prefix

**Error**: 404 on API calls
- **Fix**: Verify `REACT_APP_API_URL` includes the full backend URL
- **Fix**: Check that backend service is running (visit backend URL)

---

## 📊 Expected URLs

After deployment, you'll have:

- **Backend API**: `https://hrsm2-backend-production.up.railway.app`
- **Frontend**: `https://hrsm2-production.up.railway.app`
- **MySQL**: Internal Railway network (not publicly accessible)

---

## 💰 Cost Estimate

Railway's pricing (as of 2025):
- **Free Tier**: $5 credit/month (hobby tier)
- **Pro Plan**: $20/month (includes $5 credit)
- **Usage**: ~$0.01/hour per service

**Estimated Monthly Cost**:
- Backend Service: ~$5-7
- Frontend Service: ~$3-5
- MySQL Database: ~$5-10
- **Total**: $13-22/month (can use free tier for testing)

---

## 🎯 Post-Deployment Tasks

- [ ] Test login functionality
- [ ] Test patient registration
- [ ] Test appointment creation
- [ ] Verify database persistence
- [ ] Set up custom domain (optional)
- [ ] Enable Railway metrics and logging
- [ ] Set up automated backups
- [ ] Configure health check monitors

---

## 🔒 Security Checklist

- [ ] Change JWT_SECRET from default
- [ ] Change SESSION_SECRET from default
- [ ] Disable ENABLE_FALLBACK_ACCOUNTS in production
- [ ] Review CORS_ORIGIN settings
- [ ] Enable HTTPS only (Railway does this automatically)
- [ ] Review rate limiting settings
- [ ] Set up database backup schedule

---

## Need Help?

**Railway Logs**: Go to service → "Deployments" → Click latest deployment → View logs
**Database Access**: Use Railway's MySQL client or connect via local MySQL Workbench

