// cmd/main.go
package main

import (
	"log"
	"net"

	"github.com/SuK014/SA_jimmy_runner/shared/messaging"
	"github.com/joho/godotenv"

	repo "github.com/SuK014/SA_jimmy_runner/services/notification-service/internal/repositories"
	sv "github.com/SuK014/SA_jimmy_runner/services/notification-service/internal/services"
	ds "github.com/SuK014/SA_jimmy_runner/services/notification-service/internal/store/datasource"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"
	"google.golang.org/grpc"
)

func main() {
	_ = godotenv.Load()

	lis, err := net.Listen("tcp", ":50052")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterNotificationServiceServer(s, nil)

	prismadb := ds.ConnectPrisma()
	defer prismadb.PrismaDB.Prisma.Disconnect()

	notificationRepo := repo.NewNotificationRepository(prismadb)
	notificationSvc := sv.NewNotificationService(notificationRepo)

	// 🪶 RabbitMQ connection
	rabbitConn, err := messaging.NewConnectionManager()
	if err != nil {
		log.Fatalf("RabbitMQ connect failed: %v", err)
	}
	defer rabbitConn.Close()

	// 🪶 Start consumer
	consumer := messaging.NewQueueConsumer(rabbitConn, "email_notifications")
	go consumer.Start(func(body []byte) {
		log.Printf("📩 Received message: %s", string(body))
		notificationSvc.HandleMessage(body)
	})

	log.Println("🚀 Notification service running on :50052")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
