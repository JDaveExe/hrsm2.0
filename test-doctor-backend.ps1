# Doctor Dashboard Testing Script for PowerShell
# Tests the backend API endpoints and functionality

Write-Host "🩺 Doctor Dashboard Backend Test Suite" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"
$frontendUrl = "http://localhost:3000"

# Test data
$testDoctor = @{
    login = "marcusstewart"
    password = "password"  # You may need to update this
}

function Test-ServerConnection {
    Write-Host "🔍 Testing server connection..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET -ErrorAction SilentlyContinue
        Write-Host "✅ Backend server is running" -ForegroundColor Green
        return $true
    }
    catch {
        try {
            # Try a simple endpoint that should exist
            $response = Invoke-RestMethod -Uri "$baseUrl/api/users/doctors" -Method GET -Headers @{"x-auth-token"="test"} -ErrorAction SilentlyContinue
            Write-Host "✅ Backend server is running" -ForegroundColor Green
            return $true
        }
        catch {
            Write-Host "❌ Backend server is not running or not accessible" -ForegroundColor Red
            Write-Host "   Please start the backend with: cd backend; npm start" -ForegroundColor Yellow
            return $false
        }
    }
}

function Test-DoctorLogin {
    Write-Host "🔍 Testing doctor login..." -ForegroundColor Yellow
    
    try {
        $body = $testDoctor | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json"
        
        if ($response.user -and $response.token) {
            Write-Host "✅ Doctor login successful" -ForegroundColor Green
            Write-Host "   User: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor White
            Write-Host "   Role: $($response.user.role)" -ForegroundColor White
            Write-Host "   Token: $($response.token.Substring(0, 20))..." -ForegroundColor White
            return @{
                success = $true
                token = $response.token
                user = $response.user
            }
        }
        else {
            Write-Host "❌ Login response missing user or token" -ForegroundColor Red
            return @{ success = $false }
        }
    }
    catch {
        Write-Host "❌ Doctor login failed: $($_.Exception.Message)" -ForegroundColor Red
        return @{ success = $false }
    }
}

function Test-DoctorListAPI {
    param($token)
    
    Write-Host "🔍 Testing doctors list API..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "x-auth-token" = $token
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/users/doctors" -Method GET -Headers $headers
        
        if ($response.users -and $response.users.Count -gt 0) {
            Write-Host "✅ Doctor list API working - Found $($response.users.Count) doctors" -ForegroundColor Green
            
            for ($i = 0; $i -lt $response.users.Count; $i++) {
                $doctor = $response.users[$i]
                Write-Host "   $($i + 1). Dr. $($doctor.firstName) $($doctor.lastName) ($($doctor.username))" -ForegroundColor White
            }
            
            return @{
                success = $true
                doctors = $response.users
            }
        }
        else {
            Write-Host "❌ Doctor list API returned no doctors" -ForegroundColor Red
            return @{ success = $false }
        }
    }
    catch {
        Write-Host "❌ Doctor list API failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
        return @{ success = $false }
    }
}

function Test-UserDataStructure {
    param($user)
    
    Write-Host "🔍 Validating user data structure..." -ForegroundColor Yellow
    
    $requiredFields = @("id", "firstName", "lastName", "role", "username")
    $missingFields = @()
    
    foreach ($field in $requiredFields) {
        if (-not $user.$field) {
            $missingFields += $field
        }
    }
    
    if ($missingFields.Count -eq 0) {
        Write-Host "✅ User data structure is valid" -ForegroundColor Green
        Write-Host "   User ID: $($user.id)" -ForegroundColor White
        Write-Host "   Full Name: $($user.firstName) $($user.lastName)" -ForegroundColor White
        Write-Host "   Username: $($user.username)" -ForegroundColor White
        Write-Host "   Role: $($user.role)" -ForegroundColor White
        Write-Host "   Email: $(if($user.email) { $user.email } else { 'Not set' })" -ForegroundColor White
        return @{ success = $true }
    }
    else {
        Write-Host "❌ Missing required fields: $($missingFields -join ', ')" -ForegroundColor Red
        return @{
            success = $false
            missingFields = $missingFields
        }
    }
}

function Test-FrontendRunning {
    Write-Host "🔍 Testing frontend server..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $frontendUrl -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend server is running" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "❌ Frontend server returned status: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Frontend server is not running or not accessible" -ForegroundColor Red
        Write-Host "   Please start the frontend with: npm start" -ForegroundColor Yellow
        return $false
    }
}

# Main test execution
function Run-AllTests {
    $results = @{
        serverConnection = $false
        frontendRunning = $false
        login = $false
        doctorList = $false
        userStructure = $false
    }
    
    Write-Host ""
    Write-Host "📋 Test 1: Server Connection" -ForegroundColor Magenta
    $results.serverConnection = Test-ServerConnection
    
    if (-not $results.serverConnection) {
        Write-Host "❌ Cannot proceed - backend server not running" -ForegroundColor Red
        return $results
    }
    
    Write-Host ""
    Write-Host "📋 Test 2: Frontend Server" -ForegroundColor Magenta
    $results.frontendRunning = Test-FrontendRunning
    
    Write-Host ""
    Write-Host "📋 Test 3: Doctor Authentication" -ForegroundColor Magenta
    $loginResult = Test-DoctorLogin
    $results.login = $loginResult.success
    
    if (-not $loginResult.success) {
        Write-Host "❌ Cannot proceed with API tests - login failed" -ForegroundColor Red
        Write-Host "   Try updating the password in the script or create the test user" -ForegroundColor Yellow
        return $results
    }
    
    Write-Host ""
    Write-Host "📋 Test 4: Doctor List API" -ForegroundColor Magenta
    $doctorListResult = Test-DoctorListAPI -token $loginResult.token
    $results.doctorList = $doctorListResult.success
    
    Write-Host ""
    Write-Host "📋 Test 5: User Data Structure" -ForegroundColor Magenta
    $userStructureResult = Test-UserDataStructure -user $loginResult.user
    $results.userStructure = $userStructureResult.success
    
    # Summary
    Write-Host ""
    Write-Host "=" * 50 -ForegroundColor Cyan
    Write-Host "📊 TEST RESULTS SUMMARY" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Cyan
    
    foreach ($test in $results.Keys) {
        $status = if ($results[$test]) { "✅ PASSED" } else { "❌ FAILED" }
        $color = if ($results[$test]) { "Green" } else { "Red" }
        Write-Host "$($test.ToUpper()): $status" -ForegroundColor $color
    }
    
    $passedCount = ($results.Values | Where-Object { $_ }).Count
    $totalCount = $results.Count
    
    Write-Host ""
    $color = if ($passedCount -eq $totalCount) { "Green" } else { "Yellow" }
    Write-Host "📈 Overall Score: $passedCount/$totalCount tests passed" -ForegroundColor $color
    
    if ($passedCount -eq $totalCount) {
        Write-Host "🎉 All tests passed! Doctor dashboard is ready for testing." -ForegroundColor Green
        Write-Host ""
        Write-Host "🔍 Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Open browser to $frontendUrl" -ForegroundColor White
        Write-Host "2. Login with Marcus Stewart credentials" -ForegroundColor White
        Write-Host "3. Navigate to doctor dashboard" -ForegroundColor White
        Write-Host "4. Run browser tests with test-doctor-frontend.js" -ForegroundColor White
    }
    else {
        Write-Host "⚠️  Some tests failed. Please check the issues above." -ForegroundColor Yellow
    }
    
    return $results
}

# Instructions
Write-Host ""
Write-Host "🔧 Usage:" -ForegroundColor Green
Write-Host "   Run-AllTests" -ForegroundColor White
Write-Host ""

# Auto-run if not being imported
if ($MyInvocation.InvocationName -ne '.') {
    Run-AllTests
}
