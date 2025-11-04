package main

import (
	"log"
	"net"
	"os"

	"github.com/SuK014/SA_jimmy_runner/services/noti-service/internal/handlers"
	"github.com/SuK014/SA_jimmy_runner/shared/messaging"
	"github.com/joho/godotenv"
	"google.golang.org/grpc"
)

func main() {
	// Load .env file (optional, only for local development)
	// In Kubernetes/Docker, use environment variables from ConfigMap/Secrets
	if err := godotenv.Load("../../../shared/env/.env"); err != nil {
		log.Printf("⚠️  No .env file found (using system environment variables - normal in K8s/Docker)")
	} else {
		log.Printf("✅ Loaded .env for local development")
	}

	// Ensure RABBITMQ_URL is set
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		log.Fatal("❌ RABBITMQ_URL environment variable not set")
	}

	// Connect to RabbitMQ
	rabbitMQ, err := messaging.NewRabbitMQ(rabbitURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to RabbitMQ: %v", err)
	}
	defer rabbitMQ.Close()
	log.Println("✅ Connected to RabbitMQ")

	// Setup queue
	queueName, err := rabbitMQ.SetupQueue(
		"email_queue",
		"notification.exchange",
		"direct",
		"notification.email",
		true,
		nil,
	)
	if err != nil {
		log.Fatalf("❌ Failed to setup email queue: %v", err)
	}

	// Start email consumer in background
	go func() {
		log.Println("🚀 Starting Email Consumer...")
		emailConsumer := messaging.NewEmailConsumer(rabbitMQ, queueName, os.Getenv("GMAIL_USER"), os.Getenv("GMAIL_PASSWORD"))
		if err := emailConsumer.Start(); err != nil {
			log.Fatalf("❌ Failed to start email consumer: %v", err)
		}
		select {} // Block forever
	}()

	// Start gRPC server
	lis, err := net.Listen("tcp", ":50053")
	if err != nil {
		log.Fatalf("❌ Failed to listen on port 50053: %v", err)
	}

	s := grpc.NewServer()
	handlers.NewGRPCHandler(s, rabbitMQ)

	log.Println("🚀 Notification Service (gRPC) listening on :50053")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("❌ Failed to serve: %v", err)
	}
}
