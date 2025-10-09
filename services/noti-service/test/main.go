package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/SuK014/SA_jimmy_runner/services/noti-service/internal/services"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file (optional, but helpful for local dev)
	envPath := filepath.Join("../../../shared/env", ".env") // relative to cmd/main.go
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("⚠️  No .env file found at %s, using system environment variables", envPath)
	} else {
		log.Printf("✅ Loaded .env from %s", envPath)
	}
	// Ensure RABBITMQ_URL is set
	rabbitURL := os.Getenv("RABBITMQ_URL")
	// rabbitURL := "amqps://frqwrbeu:2r8iEMSWuuGsR5aKbR2Jx3fUWygENs8D@gorilla.lmq.cloudamqp.com/frqwrbeu"
	if rabbitURL == "" {
		log.Fatal("❌ RABBITMQ_URL environment variable not set")
	}

	// log.Println("🚀 Starting Notification Service (Email Consumer)...")
	fmt.Println("checkpoint send mail")
	// Start the email consumer
	// services.StartEmailConsumers()
	services.SendEmail()
}
