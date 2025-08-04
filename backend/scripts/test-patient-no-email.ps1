# Test patient creation without email
$patient = @{
    firstName = "Test"
    lastName = "Patient"
    dateOfBirth = "1990-01-01"
    gender = "Male"
    contactNumber = "09123456789"
    email = ""  # Empty email
    address = "Test Address"
    houseNo = "123"
    street = "Test Street"
    barangay = "Test Barangay"
    city = "Test City"
    region = "Test Region"
}

$body = $patient | ConvertTo-Json
$headers = @{"Content-Type" = "application/json"}

Write-Host "Testing patient creation without email..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/patients" -Method POST -Body $body -Headers $headers
    Write-Host "✅ Patient creation successful!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Green
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

# Test 2: Patient with no email field at all
Write-Host "`nTesting patient creation with no email field..." -ForegroundColor Yellow

$patient2 = @{
    firstName = "Test2"
    lastName = "Patient2"
    dateOfBirth = "1991-01-01"
    gender = "Female"
    contactNumber = "09987654321"
    address = "Test Address 2"
}

$body2 = $patient2 | ConvertTo-Json

try {
    $response2 = Invoke-WebRequest -Uri "http://localhost:5000/api/patients" -Method POST -Body $body2 -Headers $headers
    Write-Host "✅ Patient creation successful!" -ForegroundColor Green
    Write-Host "Response: $($response2.Content)" -ForegroundColor Green
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
