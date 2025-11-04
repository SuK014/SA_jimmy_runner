@echo off
echo ====================================
echo Starting Plan Service on port 50052
echo ====================================
cd /d "d:\cp\chula\SA\project\SA_jimmy_runner\services\plan-service\cmd"
go run main.go
pause
