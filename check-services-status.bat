@echo off
echo ========================================
echo Service Status Check
echo ========================================
echo.

echo Checking if services are running on their ports...
echo.

netstat -ano | findstr ":8080.*LISTENING" > nul
if %errorlevel% == 0 (
    echo [✓] API Gateway running on port 8080
) else (
    echo [✗] API Gateway NOT running on port 8080
)

netstat -ano | findstr ":50051.*LISTENING" > nul
if %errorlevel% == 0 (
    echo [✓] User Service running on port 50051
) else (
    echo [✗] User Service NOT running on port 50051
)

netstat -ano | findstr ":50052.*LISTENING" > nul
if %errorlevel% == 0 (
    echo [✓] Plan Service running on port 50052
) else (
    echo [✗] Plan Service NOT running on port 50052
)

netstat -ano | findstr ":50053.*LISTENING" > nul
if %errorlevel% == 0 (
    echo [✓] Plan Service running on port 50053
) else (
    echo [✗] Plan Service NOT running on port 50053
)

echo.
echo ========================================
echo Testing API Gateway Health...
echo ========================================
echo.

powershell -Command "try { $response = Invoke-RestMethod -Uri http://localhost:8080/users/register -Method POST -ContentType 'application/json' -Body '{\"email\":\"health-check@test.com\",\"display_name\":\"Health Check\",\"password\":\"test123\"}' -ErrorAction Stop; Write-Host '[✓] API Gateway is responding correctly' -ForegroundColor Green } catch { Write-Host '[✗] API Gateway health check failed' -ForegroundColor Red }"

echo.
echo ========================================
pause
