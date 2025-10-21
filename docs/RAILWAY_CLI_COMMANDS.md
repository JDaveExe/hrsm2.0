# Railway CLI Commands Reference

Quick reference for Railway deployment commands you'll use.

---

## Initial Setup

### Install Railway CLI
```powershell
npm install -g @railway/cli
```

### Login to Railway
```powershell
railway login
```
Opens browser to authenticate.

### Link Project
```powershell
railway link
```
Select your project from the list.

---

## Database Initialization

### Initialize Database Tables
```powershell
railway run npm run init-db
```
Creates all MySQL tables and default admin account.

### Run Other Backend Scripts
```powershell
# Seed admin accounts
railway run npm run seed:accounts

# Clear appointments (if needed)
railway run npm run clear-appointments
```

---

## Viewing Logs

### Backend Logs
```powershell
railway logs
```

### Follow Logs (Real-time)
```powershell
railway logs --follow
```

### Specific Service Logs
```powershell
# If you have multiple services
railway logs --service backend
railway logs --service frontend
```

---

## Environment Variables

### List All Variables
```powershell
railway variables
```

### Set a Variable
```powershell
railway variables set KEY=value
```

### Example: Update CORS
```powershell
railway variables set CORS_ORIGIN=https://your-frontend.up.railway.app
```

---

## Database Access

### Connect to MySQL
```powershell
railway connect MySQL
```
Opens MySQL client connected to your Railway database.

### Common MySQL Commands (after connecting)
```sql
-- List all tables
SHOW TABLES;

-- Count users
SELECT COUNT(*) FROM users;

-- View admin accounts
SELECT id, username, role FROM users WHERE role='admin';

-- Check table structure
DESCRIBE patients;

-- View recent appointments
SELECT * FROM appointments ORDER BY id DESC LIMIT 10;
```

---

## Deployment Management

### Trigger Redeploy
```powershell
railway up
```
Redeploys current service.

### View Deployment Status
```powershell
railway status
```

### Open Railway Dashboard
```powershell
railway open
```
Opens project in browser.

---

## Service Management

### List Services
```powershell
railway service
```

### Switch Service
```powershell
# If working with multiple services
railway service backend
railway service frontend
```

---

## Troubleshooting Commands

### Check Database Connection
```powershell
# Test connection
railway run node -e "const {sequelize} = require('./config/database'); sequelize.authenticate().then(() => console.log('Connected!')).catch(err => console.error(err));"
```

### View Environment in Railway
```powershell
railway run env
```
Shows all environment variables available in Railway.

### Run Backend Locally with Railway Database
```powershell
# Sets up environment to use Railway MySQL
railway run npm start
```

---

## Project Management

### Create New Project
```powershell
railway init
```

### Link to Existing Project
```powershell
railway link [project-id]
```

### Unlink from Project
```powershell
railway unlink
```

---

## Common Workflows

### First-Time Deployment Workflow
```powershell
# 1. Install CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Link to project (after creating in dashboard)
railway link

# 4. Initialize database
railway run npm run init-db

# 5. Check logs
railway logs --follow

# 6. Verify it works
railway open
```

### Update Deployment Workflow
```powershell
# 1. Make changes locally
# 2. Commit to git
git add .
git commit -m "your changes"
git push origin main

# 3. Railway auto-deploys
# 4. Check logs
railway logs --follow

# 5. If issues, check variables
railway variables
```

### Database Reset Workflow (Careful!)
```powershell
# 1. Connect to MySQL
railway connect MySQL

# 2. Drop all tables (IN MYSQL PROMPT)
DROP DATABASE railway;
CREATE DATABASE railway;
exit

# 3. Re-initialize
railway run npm run init-db

# 4. Verify
railway logs
```

---

## Debugging Commands

### Test API Endpoint
```powershell
# Get backend URL first
railway status

# Test health endpoint
curl https://your-backend.up.railway.app/api/health

# Test with PowerShell
Invoke-WebRequest -Uri "https://your-backend.up.railway.app/api/health"
```

### Check Build Output
```powershell
# View last deployment
railway logs --deployment [deployment-id]
```

### Environment Variable Check
```powershell
# See what backend sees
railway run printenv | grep MYSQL
```

---

## Advanced Commands

### Run Arbitrary Commands
```powershell
# Any command in Railway environment
railway run [command]

# Examples:
railway run node --version
railway run npm list
railway run ls -la
railway run cat .env
```

### Shell Access (if needed)
```powershell
railway shell
```
Opens interactive shell in Railway environment.

---

## PowerShell-Specific Tips

### Save Output to File
```powershell
railway logs > logs.txt
```

### Grep Alternative
```powershell
railway logs | Select-String "error"
```

### Multiple Commands
```powershell
railway link; railway run npm run init-db; railway logs
```

---

## Quick Reference Table

| Task | Command |
|------|---------|
| Login | `railway login` |
| Link project | `railway link` |
| Init database | `railway run npm run init-db` |
| View logs | `railway logs` |
| Follow logs | `railway logs --follow` |
| Connect to MySQL | `railway connect MySQL` |
| Set variable | `railway variables set KEY=value` |
| List variables | `railway variables` |
| Redeploy | `railway up` |
| Open dashboard | `railway open` |
| Check status | `railway status` |

---

## Environment Variable References

When setting variables in Railway dashboard, use these patterns:

### Link MySQL Variables
```
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLPORT=${{MySQL.MYSQLPORT}}
MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}
MYSQLUSER=${{MySQL.MYSQLUSER}}
MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
```

### Link to Another Service
```
BACKEND_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}
```

---

## Common Issues & Commands to Fix

### "Cannot connect to database"
```powershell
# Check variables are set
railway variables

# Test connection
railway run npm run init-db
```

### "Tables don't exist"
```powershell
# Initialize database
railway run npm run init-db

# Or connect and check
railway connect MySQL
SHOW TABLES;
```

### "CORS error"
```powershell
# Update CORS variable
railway variables set CORS_ORIGIN=https://your-frontend-url.up.railway.app

# Check it was set
railway variables | Select-String "CORS"
```

### "Build failed"
```powershell
# Check logs
railway logs

# Verify package.json exists
railway run cat package.json
```

---

## Pro Tips

1. **Use `--follow` for real-time logs**
   ```powershell
   railway logs --follow
   ```

2. **Set multiple variables at once**
   ```powershell
   railway variables set VAR1=value1 VAR2=value2
   ```

3. **Use PowerShell aliases**
   ```powershell
   Set-Alias -Name rl -Value railway
   rl logs
   ```

4. **Quick database check**
   ```powershell
   railway run npm run init-db && railway logs
   ```

5. **Export logs for debugging**
   ```powershell
   railway logs > deployment-logs-$(Get-Date -Format 'yyyy-MM-dd').txt
   ```

---

## Help Commands

```powershell
# General help
railway --help

# Command-specific help
railway logs --help
railway variables --help
railway run --help
```

---

## Next Steps

1. **Install CLI**: `npm install -g @railway/cli`
2. **Read**: `DEPLOYMENT_QUICK_START.md`
3. **Deploy**: Follow the quick start guide
4. **Use this file**: Keep as reference during deployment

Good luck! 🚀
