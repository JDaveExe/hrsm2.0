# Test patient creation with PowerShell
$patient = @{
    firstName = "Test"
    lastName = "Patient"
    dateOfBirth = "1990-01-01"
    gender = "Male"
    contactNumber = "09123456789"
    email = "test.patient@example.com"
    address = "Test Address"
    houseNo = "123"
    street = "Test Street"
    barangay = "Test Barangay"
    city = "Test City"
    region = "Test Region"
}

$body = $patient | ConvertTo-Json
$headers = @{"Content-Type" = "application/json"}

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
