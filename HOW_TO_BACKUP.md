# 📦 How to Use the Backup Script

## Quick Start

### **Method 1: Right-click (Easiest)**
1. Find `backup.ps1` file in your project folder
2. Right-click on it
3. Select "Run with PowerShell"
4. Follow the prompts

### **Method 2: PowerShell Command**
```powershell
cd C:\Users\dolfo\hrsm2.0
.\backup.ps1
```

### **Method 3: If Script Execution is Blocked**

If you see an error like "cannot be loaded because running scripts is disabled":

```powershell
# Run this ONCE to allow scripts (in PowerShell as Administrator):
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Then run the backup script:
cd C:\Users\dolfo\hrsm2.0
.\backup.ps1
```

---

## 📋 What the Script Does

The script will:

1. **✅ Check for uncommitted changes**
   - Prompts you to commit if there are changes
   - Pushes to GitHub

2. **✅ Create Git tag** (version snapshot)
   - Tag format: `v1.0-backup-YYYYMMDD`
   - Pushed to GitHub
   - Can restore this exact version anytime

3. **✅ Create ZIP archive**
   - Saved to your Desktop
   - Excludes: node_modules, .git, .env (for security)
   - Filename: `hrsm2.0-backup-YYYYMMDD-HHMMSS.zip`

4. **✅ Export database**
   - Saved to your Desktop
   - Filename: `hrsm2-database-YYYYMMDD-HHMMSS.sql`
   - Full database dump

---

## 📁 Where to Find Backups

After running the script, check your **Desktop**:

```
C:\Users\dolfo\Desktop\
├── hrsm2.0-backup-20251006-143025.zip      (Code files)
└── hrsm2-database-20251006-143025.sql      (Database)
```

**GitHub tag:**
- Visit: https://github.com/JDaveExe/hrsm2.0/tags
- Find: `v1.0-backup-20251006`

---

## 🔄 How to Restore from Backup

### Restore Code:
```powershell
# Extract ZIP to a folder
Expand-Archive -Path hrsm2.0-backup-YYYYMMDD-HHMMSS.zip -DestinationPath restored-hrsm2.0

# Install dependencies
cd restored-hrsm2.0
npm install
cd backend
npm install
```

### Restore Database:
```bash
# Import database
mysql -u root hrsm2 < hrsm2-database-YYYYMMDD-HHMMSS.sql
```

### Restore from GitHub Tag:
```bash
# Clone specific version
git clone --branch v1.0-backup-20251006 https://github.com/JDaveExe/hrsm2.0.git
```

---

## 💾 Backup Best Practices

1. **Create backup BEFORE major changes:**
   - Before deployment
   - Before updating dependencies
   - Before major code refactoring

2. **Keep multiple backups:**
   - Don't delete old backups immediately
   - Keep at least 3-5 recent backups

3. **Store in multiple locations:**
   - ✅ Desktop (created by script)
   - ✅ External hard drive
   - ✅ Cloud storage (Google Drive, OneDrive)
   - ✅ GitHub (automatically via tags)

4. **Before capstone presentation:**
   - Create backup the night before
   - Verify backup files are complete
   - Have backup on USB drive (just in case)

---

## 🐛 Troubleshooting

### "Script cannot be loaded"
```powershell
# Solution: Allow script execution
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### "mysqldump not found"
```
The script will skip database backup but continue with code backup.
Manual solution: Export database from MySQL Workbench or phpMyAdmin.
```

### "Uncommitted changes detected"
```
The script will ask if you want to commit first.
- Choose "Y" to commit and continue
- Or commit manually first, then run script again
```

### "Git push failed"
```
Check your internet connection
Verify GitHub credentials
Try: git push origin main
```

---

## 📞 Need Help?

If the script doesn't work:
1. Check error messages in red
2. Take a screenshot
3. Manual backup option below

### Manual Backup (Alternative):
```powershell
# 1. Commit code
git add -A
git commit -m "Pre-deployment backup"
git push origin main

# 2. Create ZIP manually
Compress-Archive -Path * -DestinationPath "C:\Users\dolfo\Desktop\backup.zip"

# 3. Export database from MySQL Workbench
Server → Data Export → Select hrsm2 → Export
```

---

## ✅ Verification

After backup, verify:
- [ ] Two files on Desktop (ZIP + SQL)
- [ ] Git tag visible on GitHub
- [ ] ZIP file opens correctly
- [ ] SQL file has content (not empty)

---

**You're now ready to deploy with peace of mind!** 🚀

See `DEPLOYMENT_GUIDE.md` for next steps.
