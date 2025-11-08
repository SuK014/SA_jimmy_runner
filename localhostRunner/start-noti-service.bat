@echo off
echo =============================================
echo Starting Notification Service on port (50053)
echo =============================================
cd /d "%~dp0..\services\noti-service\cmd"
go run main.go
pause
