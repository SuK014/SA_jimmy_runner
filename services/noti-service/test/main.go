package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"time"

	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/notification"
	"github.com/joho/godotenv"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	// Load .env file
	envPath := filepath.Join("../../../shared/env", ".env")
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("⚠️  No .env file found at %s, using system environment variables", envPath)
	} else {
		log.Printf("✅ Loaded .env from %s", envPath)
	}

	// Get notification service URL
	notiServiceURL := os.Getenv("NOTI_SERVICE_URL")
	if notiServiceURL == "" {
		notiServiceURL = "localhost:50053"
	}

	log.Printf("🔌 Connecting to Notification Service at %s...", notiServiceURL)

	// Connect to gRPC service
	conn, err := grpc.NewClient(
		notiServiceURL,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		log.Fatalf("❌ Failed to connect: %v", err)
	}
	defer conn.Close()

	client := pb.NewNotificationServiceClient(conn)
	log.Println("✅ Connected to Notification Service")

	// Test sending email
	log.Println("\n� Testing email sending...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req := &pb.SendEmailRequest{
		To:      "methasith33@gmail.com", // Change to your test email
		Subject: "Test Email from SA Jimmy Runner! 🎉",
		Body:    "Hi there!\n\nThis is a test email to verify that the notification service is working correctly.\n\nIf you receive this, everything is working! 🚀\n\nBest regards,\nThe SA Jimmy Runner Team",
	}

	log.Printf("📤 Sending email to: %s", req.To)
	log.Printf("   Subject: %s", req.Subject)

	resp, err := client.SendEmail(ctx, req)
	if err != nil {
		log.Fatalf("❌ Failed to send email: %v", err)
	}

	if resp.GetSuccess() {
		log.Println("✅ Email sent successfully!")
		log.Println("\n📬 Check your inbox (and spam folder) for the test email")
	} else {
		log.Println("❌ Email service returned failure")
	}
}
