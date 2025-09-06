# Simple Doctor Dashboard Test Script
Write-Host "🩺 Doctor Dashboard Test Suite" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"

# Test 1: Check if backend is running
Write-Host "🔍 Testing backend server..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users/doctors" -Method GET -Headers @{"x-auth-token"="test"} -ErrorAction SilentlyContinue
    Write-Host "✅ Backend server is running" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backend server issue: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Test doctor login
Write-Host "🔍 Testing doctor login..." -ForegroundColor Yellow
try {
    $loginData = @{
        login = "marcusstewart"
        password = "password"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($response.user -and $response.token) {
        Write-Host "✅ Login successful" -ForegroundColor Green
        Write-Host "   User: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor White
        Write-Host "   Role: $($response.user.role)" -ForegroundColor White
        
        # Test 3: Test doctors API with valid token
        Write-Host "🔍 Testing doctors API..." -ForegroundColor Yellow
        try {
            $doctorsResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/doctors" -Method GET -Headers @{"x-auth-token"=$response.token; "Content-Type"="application/json"}
            
            if ($doctorsResponse.users) {
                Write-Host "✅ Doctors API working - Found $($doctorsResponse.users.Count) doctors" -ForegroundColor Green
                foreach ($doctor in $doctorsResponse.users) {
                    Write-Host "   - Dr. $($doctor.firstName) $($doctor.lastName)" -ForegroundColor White
                }
            }
            else {
                Write-Host "❌ Doctors API returned no data" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "❌ Doctors API failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "❌ Login response invalid" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Try using credentials: marcusstewart / password" -ForegroundColor Yellow
}

# Test 4: Check frontend
Write-Host "🔍 Testing frontend..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend is running" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Frontend not accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔍 Next Steps:" -ForegroundColor Cyan
Write-Host "1. If all tests passed, open http://localhost:3000" -ForegroundColor White
Write-Host "2. Login with: marcusstewart / password" -ForegroundColor White
Write-Host "3. Go to doctor dashboard and check appointments" -ForegroundColor White
Write-Host "4. Verify header shows correct name and doctor list loads" -ForegroundColor White
