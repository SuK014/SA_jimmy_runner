package handlers

import (
	"context"
	"fmt"
	"log"

	"github.com/SuK014/SA_jimmy_runner/shared/messaging"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/notification"
	"google.golang.org/grpc"
)

type gRPCHandler struct {
	pb.UnimplementedNotificationServiceServer
	rabbitMQ *messaging.RabbitMQ
}

func NewGRPCHandler(s *grpc.Server, rabbitMQ *messaging.RabbitMQ) {
	pb.RegisterNotificationServiceServer(s, &gRPCHandler{
		rabbitMQ: rabbitMQ,
	})
}

func (h *gRPCHandler) SendEmail(ctx context.Context, req *pb.SendEmailRequest) (*pb.SendEmailResponse, error) {
	log.Printf("📧 [gRPC] Received SendEmail request for: %s | Subject: %s", req.GetTo(), req.GetSubject())

	emailEvent := messaging.EmailEvent{
		To:      req.GetTo(),
		Subject: req.GetSubject(),
		Body:    req.GetBody(),
	}

	// Publish to RabbitMQ queue for async processing
	if err := h.rabbitMQ.PublishMessage(ctx, "notification.exchange", "notification.email", emailEvent); err != nil {
		log.Printf("❌ Failed to publish email event: %v", err)
		return &pb.SendEmailResponse{Success: false}, fmt.Errorf("failed to publish email event: %v", err)
	}

	log.Printf("✅ Email event published to queue for: %s", req.GetTo())
	return &pb.SendEmailResponse{Success: true}, nil
}
