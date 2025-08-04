# Test patient creation with N/A email and notification handling
$patient = @{
    firstName = "John"
    lastName = "Doe"
    dateOfBirth = "1985-05-15"
    gender = "Male"
    contactNumber = "09123456789"
    email = "N/A"  # Using N/A
    address = "123 Test Street"
    houseNo = "123"
    street = "Test Street"
    barangay = "Test Barangay"
    city = "Test City"
    region = "Test Region"
}

$body = $patient | ConvertTo-Json
$headers = @{"Content-Type" = "application/json"}

Write-Host "Testing patient creation with email = 'N/A'..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/patients" -Method POST -Body $body -Headers $headers
    Write-Host "✅ Patient creation successful!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
    
    # Parse the response to get patient ID
    $patientData = $response.Content | ConvertFrom-Json
    $patientId = $patientData.id
    
    Write-Host "`nTesting notification to patient with N/A email..." -ForegroundColor Yellow
    
    # Test notification
    $notification = @{
        patientIds = @($patientId)
        contactMethod = "email"
        notificationType = "general_announcement"
        message = "Test notification for N/A email patient"
    }
    
    $notificationBody = $notification | ConvertTo-Json
    
    try {
        $notifResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/notifications/send" -Method POST -Body $notificationBody -Headers $headers
        Write-Host "✅ Notification request successful!" -ForegroundColor Green
        Write-Host "Notification Response: $($notifResponse.Content)" -ForegroundColor Green
    } catch {
        Write-Host "ℹ️  Notification handling (expected behavior for N/A email):" -ForegroundColor Blue
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            Write-Host "Response: $errorBody" -ForegroundColor Blue
        }
    }
    
} catch {
    Write-Host "❌ Patient creation failed!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Response Body: $errorBody" -ForegroundColor Red
    }
}
