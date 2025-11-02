@echo off
echo ========================================
echo Starting All Services for SA_jimmy_runner
echo ========================================
echo.
echo This will open 4 separate windows:
echo 1. User Service (port 50051)
echo 2. Plan Service (port 50052)
echo 3. Notification Service (RabbitMQ)
echo 4. API Gateway (port 8080)
echo.
echo Press any key to continue...
pause > nul

start "User Service" cmd /k "cd /d d:\cp\chula\SA\project\SA_jimmy_runner\services\user-service\cmd && go run main.go"
timeout /t 3 > nul

start "Plan Service" cmd /k "cd /d d:\cp\chula\SA\project\SA_jimmy_runner\services\plan-service\cmd && go run main.go"
timeout /t 3 > nul

start "Notification Service" cmd /k "cd /d d:\cp\chula\SA\project\SA_jimmy_runner\services\noti-service\cmd && go run main.go"
timeout /t 2 > nul

start "API Gateway" cmd /k "cd /d d:\cp\chula\SA\project\SA_jimmy_runner\services\api-gateway\cmd && go run main.go"

echo.
echo ========================================
echo All services are starting...
echo ========================================
echo.
echo Check each window for status:
echo - User Service: http://localhost:50051
echo - Plan Service: http://localhost:50052
echo - API Gateway: http://localhost:8080
echo.
echo Press any key to exit this window...
pause > nul
