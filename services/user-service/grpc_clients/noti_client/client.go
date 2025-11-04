package noti_client

import (
	"context"
	"fmt"
	"log"
	"time"

	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/notification"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type NotiClient struct {
	client pb.NotificationServiceClient
	conn   *grpc.ClientConn
}

func NewNotiClient(serviceURL string) (*NotiClient, error) {
	conn, err := grpc.NewClient(
		serviceURL,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to notification service: %v", err)
	}

	client := pb.NewNotificationServiceClient(conn)
	log.Printf("✅ Connected to Notification Service at %s", serviceURL)

	return &NotiClient{
		client: client,
		conn:   conn,
	}, nil
}

func (c *NotiClient) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

func (c *NotiClient) SendEmail(to, subject, body string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req := &pb.SendEmailRequest{
		To:      to,
		Subject: subject,
		Body:    body,
	}

	resp, err := c.client.SendEmail(ctx, req)
	if err != nil {
		return fmt.Errorf("failed to send email via gRPC: %v", err)
	}

	if !resp.GetSuccess() {
		return fmt.Errorf("email service returned failure")
	}

	return nil
}
