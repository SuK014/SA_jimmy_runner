@echo off
echo =============================================
echo Starting Notification Service (RabbitMQ Consumer)
echo =============================================
cd /d "d:\cp\chula\SA\project\SA_jimmy_runner\services\noti-service\cmd"
go run main.go
pause
