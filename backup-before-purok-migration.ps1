# Database Backup Script - Before Purok Migration
# Date: October 11, 2025

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = "hrsm2_backup_before_purok_$timestamp.sql"

Write-Host "Creating database backup..." -ForegroundColor Cyan
Write-Host "Backup file: $backupFile" -ForegroundColor Yellow

# Run mysqldump
# Note: Update password if needed
mysqldump -u root -p hrsm2 > $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup created successfully: $backupFile" -ForegroundColor Green
    $fileSize = (Get-Item $backupFile).Length / 1MB
    Write-Host "Backup size: $fileSize MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "IMPORTANT: Keep this backup safe!" -ForegroundColor Yellow
    Write-Host "To restore if needed, use MySQL command line" -ForegroundColor Yellow
} else {
    Write-Host "Backup failed!" -ForegroundColor Red
    Write-Host "Please create backup manually before proceeding" -ForegroundColor Red
    exit 1
}
