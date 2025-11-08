@echo off
echo ====================================
echo Starting API Gateway on port 8080
echo ====================================
cd /d "%~dp0..\services\api-gateway\cmd"
go run main.go
pause
