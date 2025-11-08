@echo off
echo ====================================
echo Starting User Service on port 50051
echo ====================================
cd /d "%~dp0..\services\user-service\cmd"
go run main.go
pause
