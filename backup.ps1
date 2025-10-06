# ============================================================================
# HRSM 2.0 - Complete Backup Script
# ============================================================================
# This script creates a comprehensive backup of your project including:
# - Git tag/version on GitHub
# - ZIP archive of code
# - Database export
# ============================================================================

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  HRSM 2.0 - Complete Backup Script" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Get timestamp for file naming
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dateShort = Get-Date -Format "yyyyMMdd"

# Configuration
$projectPath = "C:\Users\dolfo\hrsm2.0"
$backupLocation = "C:\Users\dolfo\Desktop"
$databaseName = "hrsm2"
$databaseUser = "root"
$databasePassword = ""  # Update if you have a password

# File names
$zipFileName = "hrsm2.0-backup-$timestamp.zip"
$dbFileName = "hrsm2-database-$timestamp.sql"
$zipPath = Join-Path $backupLocation $zipFileName
$dbPath = Join-Path $backupLocation $dbFileName

# ============================================================================
# Step 1: Create Git Tag
# ============================================================================
Write-Host "Step 1: Creating Git version tag..." -ForegroundColor Yellow

try {
    Set-Location $projectPath
    
    # Get current git status
    $gitStatus = git status --porcelain
    
    if ($gitStatus) {
        Write-Host "⚠️  Warning: You have uncommitted changes" -ForegroundColor Yellow
        Write-Host ""
        $commitChoice = Read-Host "Do you want to commit changes first? (Y/N)"
        
        if ($commitChoice -eq "Y" -or $commitChoice -eq "y") {
            Write-Host "Adding all files..." -ForegroundColor Gray
            git add -A
            
            $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
            if ([string]::IsNullOrWhiteSpace($commitMessage)) {
                $commitMessage = "Pre-deployment backup - $dateShort"
            }
            
            Write-Host "Committing changes..." -ForegroundColor Gray
            git commit -m $commitMessage
            
            Write-Host "Pushing to GitHub..." -ForegroundColor Gray
            git push origin main
        }
    }
    
    # Create and push tag
    $tagName = "v1.0-backup-$dateShort"
    $tagMessage = "Backup created on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Deployment ready"
    
    Write-Host "Creating tag: $tagName" -ForegroundColor Gray
    git tag -a $tagName -m $tagMessage
    
    Write-Host "Pushing tag to GitHub..." -ForegroundColor Gray
    git push origin $tagName
    
    Write-Host "✅ Git tag created and pushed: $tagName" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "❌ Git tagging failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Continuing with file backups..." -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# Step 2: Create ZIP Archive
# ============================================================================
Write-Host "Step 2: Creating ZIP archive..." -ForegroundColor Yellow

try {
    # Ensure backup location exists
    if (-not (Test-Path $backupLocation)) {
        New-Item -Path $backupLocation -ItemType Directory -Force | Out-Null
    }
    
    # Temporary exclude list (items not to backup)
    $excludeItems = @(
        "node_modules",
        ".git",
        "backend\node_modules",
        "backend\uploads",
        "backend\backups",
        ".env"
    )
    
    Write-Host "Compressing files (this may take a minute)..." -ForegroundColor Gray
    
    # Get all items except excluded ones
    $itemsToCompress = Get-ChildItem -Path $projectPath -Force | 
        Where-Object { $excludeItems -notcontains $_.Name }
    
    # Create the archive
    Compress-Archive -Path $itemsToCompress.FullName -DestinationPath $zipPath -Force
    
    $zipSize = (Get-Item $zipPath).Length / 1MB
    Write-Host "✅ ZIP archive created: $zipFileName" -ForegroundColor Green
    Write-Host "   Location: $zipPath" -ForegroundColor Gray
    Write-Host "   Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "❌ ZIP creation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# ============================================================================
# Step 3: Export Database
# ============================================================================
Write-Host "Step 3: Exporting database..." -ForegroundColor Yellow

try {
    # Check if mysqldump is available
    $mysqldumpPath = Get-Command mysqldump -ErrorAction SilentlyContinue
    
    if (-not $mysqldumpPath) {
        Write-Host "⚠️  mysqldump not found in PATH" -ForegroundColor Yellow
        Write-Host "   Searching common MySQL installation paths..." -ForegroundColor Gray
        
        # Common MySQL installation paths
        $commonPaths = @(
            "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
            "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysqldump.exe",
            "C:\xampp\mysql\bin\mysqldump.exe",
            "C:\wamp64\bin\mysql\mysql8.0.27\bin\mysqldump.exe"
        )
        
        foreach ($path in $commonPaths) {
            if (Test-Path $path) {
                $mysqldumpPath = Get-Command $path
                Write-Host "   Found: $path" -ForegroundColor Gray
                break
            }
        }
    }
    
    if ($mysqldumpPath) {
        Write-Host "Dumping database: $databaseName" -ForegroundColor Gray
        
        # Build mysqldump command
        $mysqldumpCmd = $mysqldumpPath.Source
        $arguments = @(
            "-u", $databaseUser,
            "--no-tablespaces",
            $databaseName
        )
        
        if (-not [string]::IsNullOrWhiteSpace($databasePassword)) {
            $arguments = @("-p$databasePassword") + $arguments
        }
        
        # Execute mysqldump
        & $mysqldumpCmd $arguments | Out-File -FilePath $dbPath -Encoding UTF8
        
        if (Test-Path $dbPath) {
            $dbSize = (Get-Item $dbPath).Length / 1KB
            Write-Host "✅ Database exported: $dbFileName" -ForegroundColor Green
            Write-Host "   Location: $dbPath" -ForegroundColor Gray
            Write-Host "   Size: $([math]::Round($dbSize, 2)) KB" -ForegroundColor Gray
        } else {
            throw "Database export file was not created"
        }
    }
    else {
        Write-Host "⚠️  mysqldump not found - skipping database backup" -ForegroundColor Yellow
        Write-Host "   You can manually export from MySQL Workbench or phpMyAdmin" -ForegroundColor Gray
    }
    Write-Host ""
}
catch {
    Write-Host "❌ Database export failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   You can manually export the database later" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# Summary
# ============================================================================
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  Backup Summary" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Backup Location: $backupLocation" -ForegroundColor White
Write-Host ""

if (Test-Path $zipPath) {
    Write-Host "✅ Code Archive: $zipFileName" -ForegroundColor Green
} else {
    Write-Host "❌ Code Archive: Failed" -ForegroundColor Red
}

if (Test-Path $dbPath) {
    Write-Host "✅ Database Export: $dbFileName" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database Export: Skipped or Failed" -ForegroundColor Yellow
}

Write-Host "✅ Git Tag: v1.0-backup-$dateShort (on GitHub)" -ForegroundColor Green
Write-Host ""

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  What to do next:" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Check your Desktop for backup files" -ForegroundColor White
Write-Host "2. Optionally copy backup files to:" -ForegroundColor White
Write-Host "   - External hard drive" -ForegroundColor Gray
Write-Host "   - Cloud storage (Google Drive, OneDrive, etc.)" -ForegroundColor Gray
Write-Host "   - USB flash drive" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Your code is also safely tagged on GitHub:" -ForegroundColor White
Write-Host "   https://github.com/JDaveExe/hrsm2.0/releases/tag/v1.0-backup-$dateShort" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Ready to proceed with deployment!" -ForegroundColor Green
Write-Host "   See DEPLOYMENT_GUIDE.md for next steps" -ForegroundColor Gray
Write-Host ""

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  Backup completed successfully! 🎉" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

