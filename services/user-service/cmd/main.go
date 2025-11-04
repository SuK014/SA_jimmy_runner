package main

import (
	"log"
	"net"
	"os"
	"path/filepath"

	"github.com/SuK014/SA_jimmy_runner/services/user-service/grpc_clients/noti_client"
	"github.com/SuK014/SA_jimmy_runner/services/user-service/internal/handlers"
	repo "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/repository"
	sv "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/service"
	ds "github.com/SuK014/SA_jimmy_runner/services/user-service/internal/store/datasource"
	pb "github.com/SuK014/SA_jimmy_runner/shared/proto/user"
	"github.com/joho/godotenv"
	"google.golang.org/grpc"
)

// Server implements the Greeter service
type userServer struct {
	pb.UnimplementedUserServiceServer
}

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	// Load .env file for local development (optional in Kubernetes)
	envPath := filepath.Join("../../../shared/env", ".env")
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("⚠️  No .env file found at %s, using system environment variables", envPath)
	} else {
		log.Printf("✅ Loaded .env from %s", envPath)
	}

	// Connect to Notification Service via gRPC
	var notiClient *noti_client.NotiClient
	notiServiceURL := os.Getenv("NOTI_SERVICE_URL")
	if notiServiceURL == "" {
		notiServiceURL = "localhost:50053" // default for local development
	}

	notiClient, err = noti_client.NewNotiClient(notiServiceURL)
	if err != nil {
		log.Printf("⚠️  Failed to connect to Notification Service: %v (email notifications disabled)", err)
		notiClient = nil
	} else {
		defer notiClient.Close()
	}

	s := grpc.NewServer()
	// pb.RegisterUserServiceServer(s, &userServer{})

	prismadb := ds.ConnectPrisma()
	defer prismadb.PrismaDB.Prisma.Disconnect()

	userRepo := repo.NewUsersRepository(prismadb)
	userTripRepo := repo.NewUserTripRepository(prismadb)

	userSv := sv.NewUsersService(userRepo, notiClient)
	userTripSv := sv.NewUserTripService(userTripRepo)

	handlers.NewGRPCHandler(s, userSv, userTripSv)

	log.Println("🚀 Server listening on :50051")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
