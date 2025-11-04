@echo off
echo ====================================
echo Starting User Service on port 50051
echo ====================================
cd /d "d:\cp\chula\SA\project\SA_jimmy_runner\services\user-service\cmd"
go run main.go
pause
