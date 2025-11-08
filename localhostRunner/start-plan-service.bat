@echo off
echo ====================================
echo Starting Plan Service on port 50052
echo ====================================
cd /d "%~dp0..\services\plan-service\cmd"
go run main.go
pause
