@echo off
echo =============================================
echo Starting Notification Service on port (50053)
echo =============================================
cd /d "d:\cp\chula\SA\project\SA_jimmy_runner\services\noti-service\cmd"
go run main.go
pause
